<script setup lang="ts">
definePageMeta({ layout: 'course-preview', header: false, footer: false, key: route => route.path.replace(/\/+$/, '') || '/' });
import { resolveNextCourses } from "@happydesigns/course";
import type { CoursePage } from '../../../../app/types/course';
const requestFetch = useRequestFetch();
const route = useRoute();
const routePath = normalizeCourseRoutePath(route.path);

const { data, error } = await useAsyncData(
  `course-page:${routePath}`,
  async () => {
    const slug = routePath.split("/")[2];
    const pages = await requestFetch<CoursePage[]>(`/api/course-preview/courses/${encodeURIComponent(slug!)}/data.json`);
    const page = pages.find(item => item.path === routePath);

    if (!page) {
      throw createError({ statusCode: 404, statusMessage: "Page not found", fatal: true });
    }

    const rootPath = page.pageType === "lesson"
      ? page.path.split("/").slice(0, 3).join("/")
      : page.path;
    const course = page.pageType === "lesson"
      ? pages.find(item => item.path === rootPath)
      : page;

    if (!course) {
      throw createError({ statusCode: 404, statusMessage: "Course not found", fatal: true });
    }

    const lessons = course.courseId
      ? pages.filter(item => item.courseId === course.courseId && item.pageType === "lesson").sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      : [];

    const catalog = course.nextCourses?.length
      ? await requestFetch<CoursePage[]>("/api/course-preview/catalog.json")
      : [];
    return { course, page, lessons, nextCourses: resolveNextCourses(course, catalog) };
  }
);

if (error.value) {
  throw createError(error.value);
}

// A host can mount this route while its hydration is still completing. Only a
// completed content query can establish a 404; an idle result is still loading.
watch(error, value => { if (value) showError(value); });

useSeoMeta({
  title: () => data.value?.page.title,
  description: () => data.value?.page.description
});
</script>

<template>
  <UMain>
    <UProgress v-if="!data" aria-label="Loading course" class="max-w-xl mx-auto my-12" />
    <CourseReader
      v-if="data"
      :course="data.course"
      :page="data.page"
      :lessons="data.lessons"
      :next-courses="data.nextCourses"
      :course-key="data.course.courseId ?? data.course.path"
      :back="{
        icon: 'i-lucide-square-library',
        label: 'Courses',
        to: '/courses'
      }"
    />
  </UMain>
</template>
