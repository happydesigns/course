import { parseMarkdown } from "@nuxtjs/mdc/runtime";
import { z } from "zod";
import { getInvalidCoursePathReason } from "./validation.js";

export type CourseMarkdownIssueCode = "frontmatter" | "mdc-parse" | "code-tree" | "file-path";

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
  version: string;
  category?: string;
  navigation?: boolean;
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
}

interface MdcNode {
  type?: string;
  tag?: string;
  props?: Record<string, unknown>;
  children?: MdcNode[];
  value?: string;
}

const CourseMarkdownFrontmatterSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().min(1),
    version: z.string().min(1),
    category: z.string().optional(),
    navigation: z.boolean().optional(),
    metadata: z.record(z.string(), z.unknown()).optional()
  })
  .passthrough();

const CODE_TREE_TAG = "code-tree-intersection";
const HEADING_TAGS = new Set(["h2", "h3", "h4"]);

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
    parsed = await parseMarkdown(normalizedSource, undefined, {
      fileOptions: options.filePath ? { path: options.filePath } : undefined
    });
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

  const frontmatter = CourseMarkdownFrontmatterSchema.safeParse(parsed.data);

  if (!frontmatter.success) {
    issues.push(
      ...frontmatter.error.issues.map((issue) => ({
        code: "frontmatter" as const,
        message: issue.message,
        path: ["frontmatter", ...issue.path.map((part) => (typeof part === "symbol" ? part.toString() : part))],
        details: issue
      }))
    );
  }

  const snapshots = extractCourseMarkdownSnapshots(parsed.body, issues);

  if (snapshots.length === 0) {
    issues.push({
      code: "code-tree",
      message: `Course Markdown must include at least one ${CODE_TREE_TAG} block with fenced files.`,
      path: ["body"]
    });
  }

  return {
    success: issues.length === 0,
    metadata: frontmatter.success ? frontmatter.data : undefined,
    snapshots,
    issues
  };
}

export function extractCourseMarkdownSnapshots(
  body: unknown,
  issues: CourseMarkdownIssue[] = []
): CourseMarkdownSnapshot[] {
  const root = asNode(body);
  const snapshots: CourseMarkdownSnapshot[] = [];
  let currentTitle = "Course files";
  let codeTreeIndex = 0;

  const walk = (node: MdcNode): void => {
    if (isElement(node) && node.tag && HEADING_TAGS.has(node.tag)) {
      currentTitle = flattenNodeText(node);
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
  node: MdcNode,
  codeTreeIndex: number,
  issues: CourseMarkdownIssue[]
): CourseMarkdownFile[] {
  const files: CourseMarkdownFile[] = [];
  let preIndex = 0;

  const walk = (child: MdcNode): void => {
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
  node: MdcNode,
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

function flattenNodeText(node: MdcNode): string {
  if (typeof node.value === "string") {
    return node.value;
  }

  return (node.children ?? []).map((child) => flattenNodeText(child)).join("").trim();
}

function isElement(node: MdcNode): boolean {
  return node.type === "element";
}

function asNode(value: unknown): MdcNode | undefined {
  return isRecord(value) ? (value as MdcNode) : undefined;
}

function stringProp(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
