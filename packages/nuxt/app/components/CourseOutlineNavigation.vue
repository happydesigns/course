<script setup lang="ts">
import type { CoursePage } from "../types/course";

defineProps<{
  course: CoursePage;
  lessons: CoursePage[];
}>();

const emit = defineEmits<{
  navigate: [];
}>();

</script>

<template>
  <CourseNavigation
    :course="course"
    :lessons="lessons"
    @navigate="emit('navigate')"
  />
</template>
