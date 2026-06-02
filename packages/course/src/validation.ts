import path from "node:path";
import type { Course, CourseAction } from "./schema.js";
import { CourseSchema } from "./schema.js";

export type CourseValidationIssueCode =
  | "schema"
  | "duplicate-lesson-id"
  | "duplicate-step-id"
  | "invalid-file-path"
  | "unknown-file-reference";

export interface CourseValidationIssue {
  code: CourseValidationIssueCode;
  message: string;
  path: Array<string | number>;
  details?: unknown;
}

export interface CourseValidationResult {
  success: boolean;
  course?: Course;
  issues: CourseValidationIssue[];
}

export function validateCourse(input: unknown): CourseValidationResult {
  const parsed = CourseSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      issues: parsed.error.issues.map((issue) => ({
        code: "schema",
        message: issue.message,
        path: normalizeIssuePath(issue.path),
        details: issue
      }))
    };
  }

  const course = parsed.data;
  const issues: CourseValidationIssue[] = [];
  const knownFiles = new Set<string>();
  const lessonIds = new Map<string, Array<string | number>>();
  const stepIds = new Map<string, Array<string | number>>();

  course.fileSnapshots.forEach((snapshot, index) => {
    checkCoursePath(snapshot.path, ["fileSnapshots", index, "path"], issues);

    if (!getInvalidCoursePathReason(snapshot.path)) {
      knownFiles.add(snapshot.path);
    }
  });

  course.lessons.forEach((lesson, lessonIndex) => {
    const lessonPath = ["lessons", lessonIndex, "id"];
    const previousLesson = lessonIds.get(lesson.id);

    if (previousLesson) {
      issues.push({
        code: "duplicate-lesson-id",
        message: `Lesson id "${lesson.id}" must be unique.`,
        path: lessonPath,
        details: { firstSeenAt: previousLesson }
      });
    } else {
      lessonIds.set(lesson.id, lessonPath);
    }

    lesson.steps.forEach((step, stepIndex) => {
      const stepPath = ["lessons", lessonIndex, "steps", stepIndex, "id"];
      const previousStep = stepIds.get(step.id);

      if (previousStep) {
        issues.push({
          code: "duplicate-step-id",
          message: `Step id "${step.id}" must be unique within the course.`,
          path: stepPath,
          details: { firstSeenAt: previousStep }
        });
      } else {
        stepIds.set(step.id, stepPath);
      }

      step.visibleFiles?.forEach((file, fileIndex) => {
        checkKnownFileReference(
          file,
          ["lessons", lessonIndex, "steps", stepIndex, "visibleFiles", fileIndex],
          knownFiles,
          issues
        );
      });

      step.codeChanges?.forEach((change, changeIndex) => {
        checkKnownFileReference(
          change.file,
          ["lessons", lessonIndex, "steps", stepIndex, "codeChanges", changeIndex, "file"],
          knownFiles,
          issues
        );
      });

      step.actions.forEach((action, actionIndex) => {
        checkActionFileReferences(
          action,
          ["lessons", lessonIndex, "steps", stepIndex, "actions", actionIndex],
          knownFiles,
          issues
        );
      });
    });
  });

  return {
    success: issues.length === 0,
    course,
    issues
  };
}

export function formatValidationPath(issuePath: Array<string | number>): string {
  if (issuePath.length === 0) {
    return "<root>";
  }

  return issuePath
    .map((part) => (typeof part === "number" ? `[${part}]` : String(part)))
    .join(".")
    .replaceAll(".[", "[");
}

function normalizeIssuePath(issuePath: PropertyKey[]): Array<string | number> {
  return issuePath.map((part) => (typeof part === "symbol" ? part.description ?? part.toString() : part));
}

function checkActionFileReferences(
  action: CourseAction,
  actionPath: Array<string | number>,
  knownFiles: Set<string>,
  issues: CourseValidationIssue[]
): void {
  if (action.type !== "edit-file") {
    return;
  }

  checkKnownFileReference(action.file, [...actionPath, "file"], knownFiles, issues);
}

function checkKnownFileReference(
  filePath: string,
  issuePath: Array<string | number>,
  knownFiles: Set<string>,
  issues: CourseValidationIssue[]
): void {
  if (checkCoursePath(filePath, issuePath, issues)) {
    return;
  }

  if (knownFiles.size > 0 && !knownFiles.has(filePath)) {
    issues.push({
      code: "unknown-file-reference",
      message: `File "${filePath}" is not present in course.fileSnapshots.`,
      path: issuePath,
      details: { file: filePath }
    });
  }
}

function checkCoursePath(
  filePath: string,
  issuePath: Array<string | number>,
  issues: CourseValidationIssue[]
): boolean {
  const reason = getInvalidCoursePathReason(filePath);

  if (!reason) {
    return false;
  }

  issues.push({
    code: "invalid-file-path",
    message: `File path "${filePath}" is invalid: ${reason}.`,
    path: issuePath,
    details: { file: filePath, reason }
  });

  return true;
}

function getInvalidCoursePathReason(filePath: string): string | undefined {
  if (filePath.length === 0) {
    return "it must not be empty";
  }

  if (filePath.trim() !== filePath) {
    return "it must not contain leading or trailing whitespace";
  }

  if (filePath.includes("\\")) {
    return "use forward slashes instead of backslashes";
  }

  if (filePath.includes("\0")) {
    return "it must not contain null bytes";
  }

  if (path.posix.isAbsolute(filePath) || path.win32.isAbsolute(filePath)) {
    return "it must be relative";
  }

  const segments = filePath.split("/");

  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    return "it must be a normalized relative path without empty, . or .. segments";
  }

  if (path.posix.normalize(filePath) !== filePath) {
    return "it must already be normalized";
  }

  return undefined;
}
