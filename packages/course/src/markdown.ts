import { CourseNextCoursesSchema, refineCourseRelations } from "./next-courses.js";
import { parseMarkdown } from "comark";
import { z } from "zod";
import {
  CourseDateSchema,
  CourseInputSchema,
  CourseVersionSchema,
  type CourseInput
} from "./schema.js";
import { getInvalidCoursePathReason } from "./validation.js";

export type CourseMarkdownIssueCode =
  | "frontmatter"
  | "mdc-parse"
  | "code-tree"
  | "file-path"
  | "course-input"
  | "checkpoint";

export interface CourseMarkdownIssue {
  code: CourseMarkdownIssueCode;
  message: string;
  path: Array<string | number>;
  details?: unknown;
}

export interface CourseMarkdownFile {
  path: string;
  language?: string;
  code: string;
}

export interface CourseMarkdownSnapshot {
  id: string;
  title: string;
  files: CourseMarkdownFile[];
}

export interface CourseMarkdownMetadata {
  title: string;
  description: string;
  version?: string;
  date?: string;
  category?: string;
  navigation?: boolean;
  inputs?: CourseInput[];
  courseId?: string;
  nextCourses?: string[];
  pageType?: "course" | "lesson";
  order?: number;
  optional?: boolean;
  estimatedMinutes?: number;
  checkpoints?: string[];
  metadata?: Record<string, unknown>;
}

export interface CourseMarkdownValidationResult {
  success: boolean;
  metadata?: CourseMarkdownMetadata;
  snapshots: CourseMarkdownSnapshot[];
  issues: CourseMarkdownIssue[];
}

export interface CourseMarkdownValidationOptions {
  filePath?: string;
  inheritedInputs?: readonly CourseInput[];
}

interface MarkdownNode {
  type?: string;
  tag?: string;
  props?: Record<string, unknown>;
  children?: MarkdownNode[];
  value?: string;
}

const CourseMarkdownFrontmatterSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().min(1),
    version: CourseVersionSchema.optional(),
    date: CourseDateSchema.optional(),
    category: z.string().optional(),
    navigation: z.boolean().optional(),
    inputs: z.array(CourseInputSchema).optional(),
    courseId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    nextCourses: CourseNextCoursesSchema.optional(),
    pageType: z.enum(["course", "lesson"]).optional(),
    order: z.number().int().nonnegative().optional(),
    optional: z.boolean().optional(),
    estimatedMinutes: z.number().int().positive().optional(),
    checkpoints: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)).optional(),
    metadata: z.record(z.string(), z.unknown()).optional()
  })
  .passthrough().superRefine(refineCourseRelations);

const CODE_TREE_TAG = "code-tree-intersection";
const CHECKPOINT_TAG = "course-checkpoint";
const HEADING_TAGS = new Set(["h2", "h3", "h4"]);
const COURSE_INPUT_PLACEHOLDER_PATTERN =
  /\{\{\s*\$doc\.input\.([A-Za-z][A-Za-z0-9_.-]*)\s*\}\}/g;

export async function validateCourseMarkdown(
  source: string,
  options: CourseMarkdownValidationOptions = {}
): Promise<CourseMarkdownValidationResult> {
  const normalizedSource = source.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
  const issues: CourseMarkdownIssue[] = [];

  if (!hasDelimitedFrontmatter(normalizedSource)) {
    issues.push({
      code: "frontmatter",
      message: "Course Markdown must start with a delimited frontmatter block.",
      path: ["frontmatter"]
    });
  }

  let parsed: Awaited<ReturnType<typeof parseMarkdown>>;

  try {
    parsed = await parseMarkdown(normalizedSource, { autoClose: false });
  } catch (error) {
    return {
      success: false,
      snapshots: [],
      issues: [
        ...issues,
        {
          code: "mdc-parse",
          message: error instanceof Error ? error.message : String(error),
          path: ["body"],
          details: error
        }
      ]
    };
  }

  const frontmatter = CourseMarkdownFrontmatterSchema.safeParse(parsed.frontmatter);

  if (!frontmatter.success) {
    issues.push(
      ...frontmatter.error.issues.map((issue) => ({
        code: "frontmatter" as const,
        message: issue.message,
        path: ["frontmatter", ...issue.path.map((part) => (typeof part === "symbol" ? part.toString() : part))],
        details: issue
      }))
    );
  } else {
    const localInputs = frontmatter.data.inputs;
    const effectiveInputs = localInputs ?? options.inheritedInputs ?? [];
    const variantInputs = validateCourseVariants(parsed.nodes, effectiveInputs, issues,
      frontmatter.data.pageType === "lesson" && !localInputs && !options.inheritedInputs);
    validateCourseInputPlaceholders(normalizedSource, effectiveInputs, issues, {
      allowUnknown:
        frontmatter.data.pageType === "lesson" && !localInputs && !options.inheritedInputs,
      requireConfiguredUsage: frontmatter.data.pageType !== "course" && Boolean(localInputs),
      referencedInputs: variantInputs
    });
    validateCourseCheckpoints(parsed.nodes, frontmatter.data.checkpoints, issues);
  }

  const snapshots = extractCourseMarkdownSnapshots(parsed.nodes, issues);

  return {
    success: issues.length === 0,
    metadata: frontmatter.success ? frontmatter.data : undefined,
    snapshots,
    issues
  };
}

function validateCourseInputPlaceholders(
  source: string,
  inputs: readonly CourseInput[],
  issues: CourseMarkdownIssue[],
  options: { allowUnknown: boolean; requireConfiguredUsage: boolean; referencedInputs: Set<string> }
): void {
  const configuredIds = new Set<string>();

  inputs.forEach((input, index) => {
    if (configuredIds.has(input.id)) {
      issues.push({
        code: "course-input",
        message: `Course input id "${input.id}" must be unique.`,
        path: ["frontmatter", "inputs", index, "id"]
      });
    }

    configuredIds.add(input.id);
  });

  const referencedIds = new Set(
    [...options.referencedInputs, ...Array.from(source.matchAll(COURSE_INPUT_PLACEHOLDER_PATTERN), (match) => match[1] as string)]
  );

  for (const inputId of referencedIds) {
    if (!configuredIds.has(inputId) && !options.allowUnknown) {
      issues.push({
        code: "course-input",
        message: `Placeholder for unknown course input "${inputId}".`,
        path: ["body"]
      });
    }
  }

  inputs.forEach((input, index) => {
    if (options.requireConfiguredUsage && !referencedIds.has(input.id)) {
      issues.push({
        code: "course-input",
        message: `Course input "${input.id}" is not referenced by a {{ $doc.input.${input.id} }} binding.`,
        path: ["frontmatter", "inputs", index, "id"]
      });
    }
  });
}

function validateCourseVariants(
  body: unknown,
  inputs: readonly CourseInput[],
  issues: CourseMarkdownIssue[],
  allowUnknown: boolean
): Set<string> {
  const referenced = new Set<string>();
  const walk = (node: MarkdownNode, inVariant = false): void => {
    if (node.tag === "course-variant") {
      const parameter = stringProp(node.props?.parameter);
      const value = stringProp(node.props?.value);
      const input = inputs.find((entry) => entry.id === parameter);
      if (parameter) referenced.add(parameter);
      if (!parameter || !value || (!input && !allowUnknown)) {
        issues.push({ code: "course-input", path: ["body", "course-variant"], message: "course-variant requires a declared parameter and a non-empty value." });
      } else if (input?.options && !input.allowCustom && !input.options.some((item) => (typeof item === "string" ? item : item.value) === value)) {
        issues.push({ code: "course-input", path: ["body", "course-variant", parameter], message: `Unknown variant value "${value}" for input "${parameter}".` });
      }
      inVariant = true;
    } else if (inVariant && (node.tag === CODE_TREE_TAG || node.tag === CHECKPOINT_TAG || /^h[1-6]$/.test(node.tag ?? ""))) {
      issues.push({ code: "course-input", path: ["body", "course-variant", node.tag!], message: "Keep headings, checkpoints and synchronized code outside course-variant; variants change instructions, not the shared course structure." });
    }
    for (const child of node.children ?? []) walk(child, inVariant);
  };
  const root = asNode(body);
  if (root) walk(root);
  return referenced;
}

function validateCourseCheckpoints(
  body: unknown,
  declaredIds: readonly string[] | undefined,
  issues: CourseMarkdownIssue[]
): void {
  const declared = new Set<string>();

  (declaredIds ?? []).forEach((id, index) => {
    if (declared.has(id)) {
      issues.push({
        code: "checkpoint",
        message: `Checkpoint id "${id}" must be unique.`,
        path: ["frontmatter", "checkpoints", index]
      });
    }
    declared.add(id);
  });

  const rendered = new Set<string>();
  const root = asNode(body);

  const walk = (node: MarkdownNode): void => {
    if (isElement(node) && node.tag === CHECKPOINT_TAG) {
      const id = stringProp(node.props?.id);

      if (!id) {
        issues.push({
          code: "checkpoint",
          message: `${CHECKPOINT_TAG} requires a stable id prop.`,
          path: ["body", CHECKPOINT_TAG]
        });
      } else if (rendered.has(id)) {
        issues.push({
          code: "checkpoint",
          message: `Checkpoint component id "${id}" must be unique within the page.`,
          path: ["body", CHECKPOINT_TAG, id]
        });
      } else {
        rendered.add(id);
      }
    }

    for (const child of node.children ?? []) {
      walk(child);
    }
  };

  if (root) {
    walk(root);
  }

  if (declaredIds) {
    for (const id of declared) {
      if (!rendered.has(id)) {
        issues.push({
          code: "checkpoint",
          message: `Declared checkpoint "${id}" has no ${CHECKPOINT_TAG} component.`,
          path: ["frontmatter", "checkpoints", id]
        });
      }
    }

    for (const id of rendered) {
      if (!declared.has(id)) {
        issues.push({
          code: "checkpoint",
          message: `Checkpoint component "${id}" is not declared in frontmatter.`,
          path: ["body", CHECKPOINT_TAG, id]
        });
      }
    }
  }
}

export function extractCourseMarkdownSnapshots(
  body: unknown,
  issues: CourseMarkdownIssue[] = []
): CourseMarkdownSnapshot[] {
  const root = asNode(body);
  const snapshots: CourseMarkdownSnapshot[] = [];
  let currentTitle = "Course files";
  let codeTreeIndex = 0;

  const walk = (node: MarkdownNode): void => {
    if (isElement(node) && node.tag && HEADING_TAGS.has(node.tag)) {
      currentTitle = flattenNodeText(node).trim();
    }

    if (isElement(node) && node.tag === CODE_TREE_TAG) {
      const files = collectCodeFiles(node, codeTreeIndex, issues);

      if (files.length > 0) {
        snapshots.push({
          id: `code-tree-${codeTreeIndex}`,
          title: currentTitle,
          files
        });
      }

      codeTreeIndex += 1;
      return;
    }

    for (const child of node.children ?? []) {
      walk(child);
    }
  };

  if (root) {
    walk(root);
  }

  return snapshots;
}

function collectCodeFiles(
  node: MarkdownNode,
  codeTreeIndex: number,
  issues: CourseMarkdownIssue[]
): CourseMarkdownFile[] {
  const files: CourseMarkdownFile[] = [];
  let preIndex = 0;

  const walk = (child: MarkdownNode): void => {
    if (isElement(child) && child.tag === "pre") {
      const file = codeFileFromPre(child, codeTreeIndex, preIndex, issues);
      preIndex += 1;

      if (file) {
        files.push(file);
      }
    }

    for (const grandchild of child.children ?? []) {
      walk(grandchild);
    }
  };

  walk(node);

  if (preIndex === 0) {
    issues.push({
      code: "code-tree",
      message: `${CODE_TREE_TAG} blocks must include at least one fenced code block.`,
      path: ["body", CODE_TREE_TAG, codeTreeIndex]
    });
  }

  return files;
}

function codeFileFromPre(
  node: MarkdownNode,
  codeTreeIndex: number,
  preIndex: number,
  issues: CourseMarkdownIssue[]
): CourseMarkdownFile | undefined {
  const props = node.props ?? {};
  const filename = stringProp(props.filename);
  const issuePath = ["body", CODE_TREE_TAG, codeTreeIndex, "files", preIndex, "path"];

  if (!filename) {
    issues.push({
      code: "code-tree",
      message: "Fenced code blocks inside code-tree-intersection require [path] filename metadata.",
      path: issuePath
    });
    return undefined;
  }

  const invalidReason = getInvalidCoursePathReason(filename);

  if (invalidReason) {
    issues.push({
      code: "file-path",
      message: `File path "${filename}" is invalid: ${invalidReason}.`,
      path: issuePath,
      details: { file: filename, reason: invalidReason }
    });
    return undefined;
  }

  const language = stringProp(props.language);

  return {
    path: filename,
    code: stringProp(props.code) ?? flattenNodeText(node),
    ...(language ? { language } : {})
  };
}

function hasDelimitedFrontmatter(source: string): boolean {
  return source.startsWith("---\n") && source.indexOf("\n---\n", 4) !== -1;
}

function flattenNodeText(node: MarkdownNode): string {
  if (typeof node.value === "string") {
    return node.value;
  }

  return (node.children ?? []).map((child) => flattenNodeText(child)).join("");
}

function isElement(node: MarkdownNode): boolean {
  return node.type === "element";
}

function asNode(value: unknown): MarkdownNode | undefined {
  if (typeof value === "string") return { type: "text", value };
  if (Array.isArray(value)) {
    const element = typeof value[0] === "string" && isRecord(value[1]);
    return {
      type: element ? "element" : "root",
      ...(element ? { tag: value[0], props: value[1] } : {}),
      children: (element ? value.slice(2) : value).map(asNode).filter((node): node is MarkdownNode => Boolean(node))
    };
  }
  return isRecord(value) ? (value as MarkdownNode) : undefined;
}

function stringProp(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
