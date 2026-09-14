import type { MarkdownDocument } from "comark";
import type { CoursePage } from "../types/course";
import { courseCollectionSchema } from "../../schemas/collections";

/** Validate course metadata while retaining Comark's native document. */
export function toCoursePage(file: { path: string; data: unknown; nodes: MarkdownDocument["nodes"]; meta: Record<string, unknown> }): CoursePage {
  return { ...courseCollectionSchema.parse(file.data), path: file.path, nodes: file.nodes, meta: file.meta };
}
