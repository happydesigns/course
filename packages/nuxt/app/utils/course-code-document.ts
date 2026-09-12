import type { CourseCodeFile, CourseCodeStep, CourseCodeToken } from "../types/course-code";

interface ContentElement {
  tag: string;
  props: Record<string, unknown>;
  children: unknown[];
}

/** The Comark document traversal (also accepts legacy MDC trees). Walk content children, never frontmatter or props. */
export function extractCourseCodeDocument<T>(body: T): { body: T; steps: CourseCodeStep[] } {
  const steps: CourseCodeStep[] = [];

  function visit(value: unknown): unknown {
    const element = readElement(value);
    if (element) {
      let props = element.props;
      if (element.tag === "code-tree-intersection") {
        const index = steps.length;
        steps.push({ index, files: collectFiles(element.children) });
        // Source order is explicit; async component mount order cannot change it.
        props = { ...props, "step-index": index };
      }
      const children = element.children.map(visit);
      return Array.isArray(value)
        ? [element.tag, props, ...children]
        : { ...(value as Record<string, unknown>), props, children };
    }
    if (Array.isArray(value)) return value.map(visit);
    if (isRecord(value)) {
      if (Array.isArray(value.value)) return { ...value, value: value.value.map(visit) };
      if (Array.isArray(value.children)) return { ...value, children: value.children.map(visit) };
    }
    return value;
  }

  return { body: visit(body) as T, steps };
}

function collectFiles(children: unknown[]): CourseCodeFile[] {
  return children.flatMap((child) => {
    const element = readElement(child);
    if (!element || element.tag === "code-tree-intersection") return [];
    if (element.tag !== "pre") return collectFiles(element.children);
    const path = stringProp(element.props.filename) ?? stringProp(element.props.label);
    if (!path) return [];
    const tokens = element.children.flatMap(readTokens);
    const code = typeof element.props.code === "string" ? element.props.code : tokenText(tokens);
    return [{
      path,
      code,
      language: stringProp(element.props.language),
      icon: stringProp(element.props.icon),
      props: element.props,
      tokens
    }];
  });
}

function readTokens(value: unknown): CourseCodeToken[] {
  if (typeof value === "string") return [value];
  const element = readElement(value);
  if (element) {
    return [{ tag: element.tag, props: element.props, children: element.children.flatMap(readTokens) }];
  }
  return isRecord(value) && value.type === "text" && typeof value.value === "string" ? [value.value] : [];
}

function tokenText(tokens: CourseCodeToken[]): string {
  return tokens.map((token) => typeof token === "string" ? token : tokenText(token.children)).join("");
}

function readElement(value: unknown): ContentElement | undefined {
  if (Array.isArray(value) && typeof value[0] === "string" && isRecord(value[1])) {
    return { tag: value[0], props: normalizeProps(value[1]), children: value.slice(2) };
  }
  if (isRecord(value) && typeof value.tag === "string") {
    return {
      tag: value.tag,
      props: normalizeProps(isRecord(value.props) ? value.props : isRecord(value.attributes) ? value.attributes : {}),
      children: Array.isArray(value.children) ? value.children : []
    };
  }
}

function normalizeProps(props: Record<string, unknown>): Record<string, unknown> {
  // HAST uses className. As a Vue fallthrough attribute it would overwrite
  // ProsePre's DOM class instead of merging with Nuxt UI's component styles.
  if (!("className" in props)) return props;
  const { className, ...rest } = props;
  return { ...rest, class: props.class ? [props.class, className] : className };
}

function stringProp(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
