export {
  AssetRefSchema,
  CodeChangeSchema,
  CourseActionSchema,
  CourseDateSchema,
  CourseInputSchema,
  CourseSchema,
  CourseVersionSchema,
  FileSnapshotSchema,
  LessonSchema,
  StepSchema,
  ValidationHintSchema
} from "./schema.js";

export type {
  AssetRef,
  CodeChange,
  Course,
  CourseAction,
  CourseInput,
  FileSnapshot,
  Lesson,
  Step,
  ValidationHint
} from "./schema.js";

export {
  formatValidationPath,
  validateCourse
} from "./validation.js";

export type {
  CourseMarkdownFile,
  CourseMarkdownIssue,
  CourseMarkdownIssueCode,
  CourseMarkdownMetadata,
  CourseMarkdownSnapshot,
  CourseMarkdownValidationOptions,
  CourseMarkdownValidationResult
} from "./markdown.js";

export { extractCourseMarkdownSnapshots, validateCourseMarkdown } from "./markdown.js";

export type {
  CourseValidationIssue,
  CourseValidationIssueCode,
  CourseValidationResult
} from "./validation.js";
