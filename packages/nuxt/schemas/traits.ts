import {
  CourseDateSchema,
  CourseNextCoursesSchema,
  CourseInputSchema,
  CourseVersionSchema
} from "@happydesigns/course";
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

export const courseVariantSchemas = {
  courseMetadata: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    version: CourseVersionSchema.optional(),
    date: CourseDateSchema.optional(),
    image: z.string().optional(),
    category: z.string().optional(),
    authors: z.array(authorSchema).optional(),
    metadata: z.record(z.string(), z.unknown()).optional()
  }),
  courseInputs: z.object({
    inputs: z.array(CourseInputSchema).optional()
  }),
  courseStructure: z.object({
    courseId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    nextCourses: CourseNextCoursesSchema.optional(),
    pageType: z.enum(["course", "lesson"]).optional(),
    order: z.number().int().nonnegative().optional(),
    optional: z.boolean().optional(),
    estimatedMinutes: z.number().int().positive().optional(),
    checkpoints: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)).optional()
  })
};
