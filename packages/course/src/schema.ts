import { z } from "zod";

const MetadataSchema = z.record(z.string(), z.unknown());

const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

export const CourseVersionSchema = z.string().regex(
  SEMVER_PATTERN,
  "Course version must use Semantic Versioning, for example 1.2.0."
);

export const CourseDateSchema = z.string().refine(
  (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
  },
  "Course date must be a valid calendar date in YYYY-MM-DD format."
);

export const CourseInputSchema = z
  .object({
    id: z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]*$/),
    label: z.string().min(1),
    description: z.string().optional(),
    placeholder: z.string().optional(),
    defaultValue: z.string().optional(),
    minLength: z.number().int().nonnegative().optional(),
    maxLength: z.number().int().positive().optional(),
    pattern: z.string().optional()
  })
  .strict();

export const AssetRefSchema = z
  .object({
    path: z.string().min(1),
    alt: z.string().optional(),
    caption: z.string().optional()
  })
  .strict();

export const FileSnapshotSchema = z
  .object({
    path: z.string().min(1),
    content: z.string(),
    language: z.string().optional()
  })
  .strict();

export const CodeChangeSchema = z
  .object({
    file: z.string().min(1),
    description: z.string().min(1),
    before: z.string().optional(),
    after: z.string().optional(),
    diff: z.string().optional()
  })
  .strict();

export const ValidationHintSchema = z
  .object({
    type: z.string().min(1),
    description: z.string().min(1),
    command: z.string().optional(),
    expected: z.string().optional()
  })
  .strict();

const EditFileActionSchema = z
  .object({
    type: z.literal("edit-file"),
    file: z.string().min(1),
    description: z.string().min(1),
    before: z.string().optional(),
    after: z.string().optional(),
    diff: z.string().optional()
  })
  .strict();

const RunCommandActionSchema = z
  .object({
    type: z.literal("run-command"),
    command: z.string().min(1),
    cwd: z.string().optional(),
    description: z.string().optional()
  })
  .strict();

const OpenUrlActionSchema = z
  .object({
    type: z.literal("open-url"),
    url: z.string().url(),
    description: z.string().optional()
  })
  .strict();

const UseToolActionSchema = z
  .object({
    type: z.literal("use-tool"),
    tool: z.string().min(1),
    description: z.string().min(1),
    inputs: MetadataSchema.optional()
  })
  .strict();

const ManualActionSchema = z
  .object({
    type: z.literal("manual"),
    description: z.string().min(1)
  })
  .strict();

export const CourseActionSchema = z.discriminatedUnion("type", [
  EditFileActionSchema,
  RunCommandActionSchema,
  OpenUrlActionSchema,
  UseToolActionSchema,
  ManualActionSchema
]);

export const StepSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    prose: z.string().min(1),
    actions: z.array(CourseActionSchema).default([]),
    codeChanges: z.array(CodeChangeSchema).optional(),
    visibleFiles: z.array(z.string().min(1)).optional(),
    validation: z.array(ValidationHintSchema).optional(),
    assets: z.array(AssetRefSchema).optional(),
    needsReview: z.boolean().optional()
  })
  .strict();

export const LessonSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().optional(),
    steps: z.array(StepSchema).min(1)
  })
  .strict();

export const CourseSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    version: CourseVersionSchema,
    date: CourseDateSchema.optional(),
    inputs: z.array(CourseInputSchema).optional(),
    lessons: z.array(LessonSchema).min(1),
    fileSnapshots: z.array(FileSnapshotSchema).default([]),
    metadata: MetadataSchema.optional()
  })
  .strict();

export type AssetRef = z.infer<typeof AssetRefSchema>;
export type FileSnapshot = z.infer<typeof FileSnapshotSchema>;
export type CodeChange = z.infer<typeof CodeChangeSchema>;
export type ValidationHint = z.infer<typeof ValidationHintSchema>;
export type CourseInput = z.infer<typeof CourseInputSchema>;
export type CourseAction = z.infer<typeof CourseActionSchema>;
export type Step = z.infer<typeof StepSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
export type Course = z.infer<typeof CourseSchema>;
