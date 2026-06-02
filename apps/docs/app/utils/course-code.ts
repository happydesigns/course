import type { InjectionKey } from "vue";

export interface CourseCodeFile {
  path: string;
  language?: string;
  code: string;
}

export interface CourseCodeSnapshot {
  id: string;
  title: string;
  files: CourseCodeFile[];
}

export interface CourseHeading {
  id: string;
  text: string;
  depth: number;
}

export interface CourseCodeState {
  registerSnapshot: () => string;
  activateSnapshot: (snapshotId: string) => void;
}

export const COURSE_CODE_STATE_KEY: InjectionKey<CourseCodeState> = Symbol("course-code-state");

interface MdcNode {
  type?: string;
  tag?: string;
  props?: Record<string, unknown>;
  children?: MdcNode[];
  value?: unknown;
}

type CourseAstNode = MdcNode | MinimarkNode | string;
type MinimarkNode = [string, Record<string, unknown>, ...CourseAstNode[]];

const CODE_TREE_TAG = "code-tree-intersection";
const HEADING_TAGS = new Set(["h2", "h3", "h4"]);

export function extractCourseCodeSnapshots(body: unknown): CourseCodeSnapshot[] {
  const root = asNode(body);
  const snapshots: CourseCodeSnapshot[] = [];
  let currentTitle = "Course files";
  let codeTreeIndex = 0;

  const walk = (node: CourseAstNode): void => {
    const tag = getNodeTag(node);

    if (tag && HEADING_TAGS.has(tag)) {
      currentTitle = flattenNodeText(node);
    }

    if (tag === CODE_TREE_TAG) {
      const files = collectCodeFiles(node);

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

    for (const child of getNodeChildren(node)) {
      walk(child);
    }
  };

  if (root) {
    walk(root);
  }

  return snapshots;
}

export function extractCourseHeadings(body: unknown): CourseHeading[] {
  const root = asNode(body);
  const headings: CourseHeading[] = [];

  const walk = (node: CourseAstNode): void => {
    const tag = getNodeTag(node);

    if (tag && HEADING_TAGS.has(tag)) {
      const id = stringProp(getNodeProps(node)?.id);

      if (id) {
        headings.push({
          id,
          text: flattenNodeText(node),
          depth: Number(tag.slice(1))
        });
      }
    }

    for (const child of getNodeChildren(node)) {
      walk(child);
    }
  };

  if (root) {
    walk(root);
  }

  return headings;
}

function collectCodeFiles(node: CourseAstNode): CourseCodeFile[] {
  const files: CourseCodeFile[] = [];

  const walk = (child: CourseAstNode): void => {
    if (getNodeTag(child) === "pre") {
      const file = codeFileFromPre(child);

      if (file) {
        files.push(file);
      }
    }

    for (const grandchild of getNodeChildren(child)) {
      walk(grandchild);
    }
  };

  walk(node);
  return files;
}

function codeFileFromPre(node: CourseAstNode): CourseCodeFile | undefined {
  const props = getNodeProps(node) ?? {};
  const filename = stringProp(props.filename);

  if (!filename) {
    return undefined;
  }

  const code = stringProp(props.code) ?? flattenNodeText(node);
  const language = stringProp(props.language);

  return {
    path: filename,
    code,
    ...(language ? { language } : {})
  };
}

function flattenNodeText(node: CourseAstNode): string {
  if (typeof node === "string") {
    return node;
  }

  if (isRecord(node) && typeof node.value === "string") {
    return node.value;
  }

  return getNodeChildren(node).map((child) => flattenNodeText(child)).join("").trim();
}

function getNodeTag(node: CourseAstNode): string | undefined {
  if (Array.isArray(node)) {
    return typeof node[0] === "string" ? node[0] : undefined;
  }

  if (isRecord(node) && node.type === "element") {
    return typeof node.tag === "string" ? node.tag : undefined;
  }

  return undefined;
}

function getNodeProps(node: CourseAstNode): Record<string, unknown> | undefined {
  if (Array.isArray(node)) {
    return isRecord(node[1]) ? node[1] : undefined;
  }

  if (isRecord(node)) {
    return isRecord(node.props) ? node.props : undefined;
  }

  return undefined;
}

function getNodeChildren(node: CourseAstNode): CourseAstNode[] {
  if (Array.isArray(node)) {
    return node.slice(isRecord(node[1]) ? 2 : 1) as CourseAstNode[];
  }

  if (isRecord(node)) {
    if (Array.isArray(node.children)) {
      return node.children as CourseAstNode[];
    }

    if (node.type === "minimark" && Array.isArray(node.value)) {
      return node.value as CourseAstNode[];
    }
  }

  return [];
}

function asNode(value: unknown): CourseAstNode | undefined {
  return isRecord(value) || Array.isArray(value) || typeof value === "string" ? (value as CourseAstNode) : undefined;
}

function stringProp(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
