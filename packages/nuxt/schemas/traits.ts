import { z } from "zod";

const authorSchema = z.object({
  name: z.string().min(1),
  to: z.string().optional(),
  avatar: z
    .object({
      src: z.string().optional(),
      alt: z.string().optional()
    })
    .optional()
});

const inputSchema = z.object({
  id: z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]*$/),
  label: z.string().min(1),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  defaultValue: z.string().optional(),
  minLength: z.number().int().nonnegative().optional(),
  maxLength: z.number().int().positive().optional(),
  pattern: z.string().optional()
});

export const courseVariantSchemas = {
  courseMetadata: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    version: z.string().min(1).optional(),
    date: z.string().optional(),
    image: z.string().optional(),
    category: z.string().optional(),
    authors: z.array(authorSchema).optional(),
    metadata: z.record(z.string(), z.unknown()).optional()
  }),
  courseInputs: z.object({
    inputs: z.array(inputSchema).optional()
  }),
  courseStructure: z.object({
    courseId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    pageType: z.enum(["course", "lesson"]).optional(),
    order: z.number().int().nonnegative().optional(),
    optional: z.boolean().optional(),
    estimatedMinutes: z.number().int().positive().optional(),
    checkpoints: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)).optional()
  })
};
