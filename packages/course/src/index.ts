export {
  AssetRefSchema,
  CodeChangeSchema,
  CourseActionSchema,
  CourseSchema,
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
  CourseValidationIssue,
  CourseValidationIssueCode,
  CourseValidationResult
} from "./validation.js";
