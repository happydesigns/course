import { createVariantSchemaResolver } from "@happydesigns/nuxt-variants/schemas";
import { courseVariantSchemas } from "./traits";
import { courseVariantRegistry } from "./variants";

const resolveCourseVariantSchema = createVariantSchemaResolver(
  courseVariantRegistry,
  courseVariantSchemas
);

/**
 * Source-agnostic schema for consumer-owned Nuxt Content page collections.
 */
export const courseCollectionSchema = resolveCourseVariantSchema(["course"]);
