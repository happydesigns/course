import type { MarkdownDocument } from "comark";
import type { CoursePage } from "../types/course";
import { z } from "zod";
import { courseVariantSchemas } from "../../schemas/traits";

const schema = z.object({
  ...courseVariantSchemas.courseMetadata.shape,
  ...courseVariantSchemas.courseInputs.shape,
  ...courseVariantSchemas.courseStructure.shape
});

/** Validate course metadata while retaining Comark's native document. */
export function toCoursePage(file: { path: string; data: unknown; nodes: MarkdownDocument["nodes"]; meta: Record<string, unknown> }): CoursePage {
  return { ...schema.parse(file.data), path: file.path, nodes: file.nodes, meta: file.meta };
}
