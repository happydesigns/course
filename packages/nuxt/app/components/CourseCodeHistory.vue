<script setup lang="ts">
import type { CoursePage } from "../types/course";
import { computed } from "vue";
import { provideCourseCodeCollectionMode } from "../composables/useCourseCodeCollectionMode";
import { toCourseCodeCollectionBody } from "../utils/course-content";
import CourseCodeSequence from "./CourseCodeSequence.vue";
import CodeTreeIntersection from "./CodeTreeIntersection.vue";

const props = defineProps<{
  pages: CoursePage[];
  data: Record<string, unknown>;
}>();

provideCourseCodeCollectionMode(true);

const components = {
  "code-tree-intersection": CodeTreeIntersection
};
const collectionPages = computed(() =>
  props.pages.map((page) => ({
    ...page,
    body: toCourseCodeCollectionBody(page.body)
  }))
);
</script>

<template>
  <div class="hidden" aria-hidden="true">
    <CourseCodeSequence
      v-for="page in collectionPages"
      :key="page.path"
      :page-path="page.path"
      :progressive="false"
    >
      <ContentRenderer
        :value="page"
        :data="data"
        :components="components"
      />
    </CourseCodeSequence>
  </div>
</template>
