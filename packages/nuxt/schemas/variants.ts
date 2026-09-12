import { defineVariantRegistry } from "@happydesigns/nuxt-variants/schemas";

/**
 * Course capabilities shared by runtime rendering and Comark schemas.
 * Entries describe structural behavior, never individual course content.
 */
export const courseVariantRegistry = defineVariantRegistry({
  courseMetadata: {},
  courseInputs: {},
  courseStructure: {},
  courseNavigation: {},
  courseProgress: {},
  courseCodeStage: {},
  courseFileTree: {},
  courseReviewMarkers: {},
  course: {
    extends: [
      "courseMetadata",
      "courseInputs",
      "courseStructure",
      "courseNavigation",
      "courseProgress",
      "courseCodeStage",
      "courseFileTree",
      "courseReviewMarkers"
    ],
    config: {}
  }
});
