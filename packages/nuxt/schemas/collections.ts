import { z } from "zod";
import { courseVariantSchemas } from "./traits";

/** Source-agnostic metadata shared by validation and the reader's inferred type. */
export const courseCollectionSchema = z.object({
  ...courseVariantSchemas.courseMetadata.shape,
  ...courseVariantSchemas.courseInputs.shape,
  ...courseVariantSchemas.courseStructure.shape
});
