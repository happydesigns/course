<script setup lang="ts">
import type { CourseProgressLesson, CourseProgressData } from "../types/course";
import { computed, onMounted, ref } from "vue";
import {
  courseProgressStorageKey,
  parseCourseProgress,
  progressSummary
} from "../composables/useCourseProgress";
import { useCourseStorage } from "../composables/useCourseStorage";

const props = defineProps<{
  courseId: string;
  lessons: CourseProgressLesson[];
}>();

const storage = useCourseStorage();
const ready = ref(false);
const data = ref<CourseProgressData>(parseCourseProgress(null));
const summary = computed(() => progressSummary(data.value, props.lessons));

onMounted(() => {
  data.value = parseCourseProgress(storage.getItem(courseProgressStorageKey(props.courseId)));
  ready.value = true;
});
</script>

<template>
  <div v-if="ready && summary.total" class="mt-3 flex items-center gap-3">
    <UProgress :model-value="summary.percent" :max="100" size="xs" class="max-w-32 flex-1" />
    <span class="shrink-0 text-xs text-muted">
      {{ summary.completed }}/{{ summary.total }} complete
    </span>
  </div>
</template>
