import { z } from "zod";

const identifier = z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]*$/);
const option = z.union([
  z.string().trim().min(1),
  z.object({ value: z.string().trim().min(1), label: z.string().min(1) }).strict()
]);

/** Serializable authoring contract: Markdown and JSON use the same definition. */
export const CourseInputSchema = z.object({
  id: identifier,
  label: z.string().min(1),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  defaultValue: z.string().optional(),
  sharedId: identifier.optional(),
  options: z.array(option).min(1).optional(),
  allowCustom: z.boolean().optional(),
  minLength: z.number().int().nonnegative().optional(),
  maxLength: z.number().int().positive().optional(),
  pattern: z.string().refine(isValidPattern, "Invalid regular expression.").optional()
}).strict().superRefine((input, ctx) => {
  const values = courseInputOptions(input).map((item) => item.value);
  if (new Set(values).size !== values.length) {
    ctx.addIssue({ code: "custom", path: ["options"], message: "Option values must be unique." });
  }
  if (input.allowCustom !== undefined && !input.options) {
    ctx.addIssue({ code: "custom", path: ["allowCustom"], message: "allowCustom requires options." });
  }
  if (input.minLength !== undefined && input.maxLength !== undefined && input.minLength > input.maxLength) {
    ctx.addIssue({ code: "custom", path: ["maxLength"], message: "maxLength must be at least minLength." });
  }
  if (input.options && !input.allowCustom && input.defaultValue !== undefined && !values.includes(input.defaultValue)) {
    ctx.addIssue({ code: "custom", path: ["defaultValue"], message: "Default value must be one of the options." });
  }
  // Text defaults may deliberately be placeholders (for example ###).
  if (input.pattern === undefined || isValidPattern(input.pattern)) {
    const schema = createCourseInputValueSchema(input);
    values.forEach((value, index) => {
      if (!schema.safeParse(value).success) {
        ctx.addIssue({ code: "custom", path: ["options", index], message: "Option does not satisfy the input constraints." });
      }
    });
  }
});

function isValidPattern(pattern: string): boolean {
  try {
    new RegExp(`^(?:${pattern})$`);
    return true;
  } catch {
    return false;
  }
}

type InputDefinition = {
  options?: Array<string | { value: string; label: string }>;
  allowCustom?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
};

export function courseInputOptions(input: InputDefinition): Array<{ value: string; label: string }> {
  return (input.options ?? []).map((item) => typeof item === "string" ? { value: item, label: item } : item);
}

/** Value validation is shared by renderers and consumers, without UI dependencies. */
export function createCourseInputValueSchema(input: InputDefinition) {
  let text = z.string();
  if (input.minLength !== undefined) text = text.min(input.minLength);
  if (input.maxLength !== undefined) text = text.max(input.maxLength);
  if (input.pattern !== undefined) text = text.regex(new RegExp(`^(?:${input.pattern})$`));
  return input.options && !input.allowCustom
    ? text.pipe(z.enum(courseInputOptions(input).map((item) => item.value)))
    : text;
}

export function courseInputStorageKey(courseKey: string, input: { id: string; sharedId?: string }): string {
  return input.sharedId
    ? `course-input:shared:${input.sharedId}`
    : `course:${courseKey}:input:${input.id}`;
}
