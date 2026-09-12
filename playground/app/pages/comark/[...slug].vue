<script setup lang="ts">
import type { CoursePage } from "@happydesigns/course-nuxt/types";
const route = useRoute();
// The server emits plain JSON. An explicit return type avoids Nitro's depth-limited
// serialization type expanding the recursive document into an incompatible tuple.
const { data: pages } = await useAsyncData("comark-pilot", () => $fetch<CoursePage[]>("/api/comark-course"));
const course = computed(() => pages.value?.find((page) => page.pageType === "course"));
const page = computed(() => pages.value?.find((page) => page.path === route.path.replace(/\/$/, "")));
const lessons = computed(() => pages.value?.filter((page) => page.pageType === "lesson") ?? []);

if (!course.value || !page.value) {
  throw createError({ statusCode: 404, statusMessage: "Pilot page not found", fatal: true });
}

useSeoMeta({ title: () => page.value?.title, robots: "noindex, nofollow" });
</script>

<template>
  <UMain>
    <CourseReader
      v-if="course && page"
      :course="course"
      :page="page"
      :lessons="lessons"
      course-key="comark-pilot-rap120"
      :back="{ label: 'Courses', to: '/courses' }"
    >
      <template #body="body">
        <ComarkCourseBody v-bind="body" />
      </template>
    </CourseReader>
  </UMain>
</template>
