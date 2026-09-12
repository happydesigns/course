import type { CourseCodeFile, CourseCodeStep, CourseCodeToken, ResolvedCourseCodeFile } from "../types/course-code";
import { interpolateCourseInputPlaceholders, interpolateCourseTextSegments } from "./course-inputs";

export function resolveCourseCodeFile(
  file: CourseCodeFile,
  values: Readonly<Record<string, string>>
): ResolvedCourseCodeFile {
  const segments: string[] = [];
  function collect(tokens: CourseCodeToken[]): void {
    tokens.forEach((token) => typeof token === "string" ? segments.push(token) : collect(token.children));
  }
  collect(file.tokens);
  const resolved = interpolateCourseTextSegments(segments, values);
  let index = 0;
  function resolve(tokens: CourseCodeToken[]): CourseCodeToken[] {
    return tokens.map((token) => typeof token === "string"
      ? resolved[index++] ?? token
      : {
          ...token,
          props: interpolateCourseInputPlaceholders(token.props, values),
          children: resolve(token.children)
        });
  }
  return {
    ...file,
    sourcePath: file.path,
    path: interpolateCourseInputPlaceholders(file.path, values),
    code: interpolateCourseInputPlaceholders(file.code, values),
    props: interpolateCourseInputPlaceholders(file.props, values),
    tokens: resolve(file.tokens)
  };
}

/** Last write wins within the ordered lesson/step sequence. */
export function courseCodeSnapshot<T extends CourseCodeFile>(
  history: readonly CourseCodeStep<T>[],
  current: readonly CourseCodeStep<T>[],
  activeIndex: number | undefined
): T[] {
  const visible = activeIndex === undefined || !current.some((step) => step.index === activeIndex)
    ? [] : current.filter((step) => step.index <= activeIndex);
  const files = new Map<string, T>();
  for (const step of [...history, ...visible]) {
    for (const file of step.files) {
      files.set(file.path, file);
    }
  }
  return [...files.values()];
}

export function resolveCourseCodeSteps(
  steps: readonly CourseCodeStep[],
  values: Readonly<Record<string, string>>
): CourseCodeStep<ResolvedCourseCodeFile>[] {
  return steps.map((step) => ({
    ...step,
    files: step.files.map((file) => resolveCourseCodeFile(file, values))
  }));
}
