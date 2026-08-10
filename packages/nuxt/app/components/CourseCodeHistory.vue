<script setup lang="ts">
import type { CoursePage } from "../types/course";
import { provideCourseCodeCollectionMode } from "../composables/useCourseCodeCollectionMode";
import CodeTreeIntersection from "./CodeTreeIntersection.vue";

defineProps<{
  pages: CoursePage[];
  data: Record<string, unknown>;
}>();

provideCourseCodeCollectionMode(true);

const components = {
  "code-tree-intersection": CodeTreeIntersection
};
</script>

<template>
  <div class="hidden" aria-hidden="true">
    <ContentRenderer
      v-for="page in pages"
      :key="page.path"
      :value="page"
      :data="data"
      :components="components"
    />
  </div>
</template>
