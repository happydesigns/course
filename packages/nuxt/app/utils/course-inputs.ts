import type { CourseInput } from "../types/course";

const COURSE_INPUT_PLACEHOLDER_PATTERN =
  /\{\{\s*\$doc\.input\.([A-Za-z][A-Za-z0-9_.-]*)\s*\}\}/g;

interface CourseTextLeaf {
  parent: unknown[];
  index: number;
  start: number;
  end: number;
}

export function createCourseInputValues(
  inputs: readonly CourseInput[],
  values: Readonly<Record<string, string>>
): Readonly<Record<string, string>> {
  return Object.fromEntries(
    inputs.map((input) => {
      const value = values[input.id];
      return [
        input.id,
        value !== undefined && value.trim().length > 0
          ? value
          : input.defaultValue ?? ""
      ];
    })
  );
}

/**
 * Resolves only explicit Course placeholders. The caller controls which part
 * of the Nuxt Content document is traversed, so frontmatter and structural
 * document fields are never rewritten accidentally.
 */
export function interpolateCourseInputPlaceholders<T>(
  value: T,
  values: Readonly<Record<string, string>>
): T {
  if (typeof value === "string") {
    return value.replace(
      COURSE_INPUT_PLACEHOLDER_PATTERN,
      (placeholder, inputId: string) =>
        Object.hasOwn(values, inputId) ? values[inputId] ?? "" : placeholder
    ) as T;
  }

  if (Array.isArray(value)) {
    if (isMinimarkCodeBlock(value)) {
      return interpolateMinimarkCodeBlock(value, values) as T;
    }

    return value.map((entry) => interpolateCourseInputPlaceholders(entry, values)) as T;
  }

  if (isPlainRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        interpolateCourseInputPlaceholders(entry, values)
      ])
    ) as T;
  }

  return value;
}

function interpolateMinimarkCodeBlock(
  value: unknown[],
  values: Readonly<Record<string, string>>
): unknown[] {
  const result = value.map((entry, index) =>
    index === 1
      ? interpolateCourseInputPlaceholders(entry, values)
      : cloneCourseValue(entry)
  );
  const leaves: CourseTextLeaf[] = [];
  collectMinimarkTextLeaves(result.slice(2), leaves);

  const source = leaves
    .map((leaf) => String(leaf.parent[leaf.index]))
    .join("");
  const matches = [...source.matchAll(new RegExp(COURSE_INPUT_PLACEHOLDER_PATTERN.source, "g"))]
    .map((match) => ({
      start: match.index,
      end: match.index + match[0].length,
      replacement: Object.hasOwn(values, match[1] ?? "")
        ? values[match[1] ?? ""] ?? ""
        : match[0]
    }));

  for (const leaf of leaves) {
    let cursor = leaf.start;
    let rendered = "";

    for (const match of matches) {
      if (match.end <= leaf.start || match.start >= leaf.end) {
        continue;
      }

      if (match.start >= leaf.start) {
        rendered += source.slice(cursor, Math.min(match.start, leaf.end));
        rendered += match.replacement;
      }

      cursor = Math.max(cursor, match.end);
    }

    if (cursor < leaf.end) {
      rendered += source.slice(cursor, leaf.end);
    }

    leaf.parent[leaf.index] = rendered;
  }

  return result;
}

function collectMinimarkTextLeaves(value: unknown, leaves: CourseTextLeaf[]): void {
  if (!Array.isArray(value)) {
    return;
  }

  const childStart = isMinimarkNode(value) ? 2 : 0;

  for (let index = childStart; index < value.length; index += 1) {
    const child = value[index];

    if (typeof child === "string") {
      const start = leaves.at(-1)?.end ?? 0;
      leaves.push({ parent: value, index, start, end: start + child.length });
    } else {
      collectMinimarkTextLeaves(child, leaves);
    }
  }
}

function cloneCourseValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(cloneCourseValue);
  }

  if (isPlainRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, cloneCourseValue(entry)])
    );
  }

  return value;
}

function isMinimarkCodeBlock(value: unknown[]): boolean {
  return value[0] === "pre" && isPlainRecord(value[1]) && typeof value[1].code === "string";
}

function isMinimarkNode(value: unknown[]): boolean {
  return typeof value[0] === "string" && isPlainRecord(value[1]);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
