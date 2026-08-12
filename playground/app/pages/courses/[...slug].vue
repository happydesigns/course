<script setup lang="ts">
const route = useRoute();
const routePath = computed(() => normalizeCourseRoutePath(route.path));

const { data, error } = await useAsyncData(
  computed(() => `course-page:${routePath.value}`),
  async () => {
    const page = await queryCollection("courses").path(routePath.value).first();

    if (!page) {
      return undefined;
    }

    const rootPath = page.pageType === "lesson"
      ? page.path.split("/").slice(0, 3).join("/")
      : page.path;
    const course = page.pageType === "lesson"
      ? await queryCollection("courses").path(rootPath).first()
      : page;

    if (!course) {
      return undefined;
    }

    const lessons = course.courseId
      ? await queryCollection("courses")
          .where("courseId", "=", course.courseId)
          .where("pageType", "=", "lesson")
          .order("order", "ASC")
          .all()
      : [];

    return { course, page, lessons };
  },
  { watch: [routePath] }
);

if (error.value) {
  throw createError(error.value);
}

if (!data.value) {
  throw createError({ statusCode: 404, statusMessage: "Page not found", fatal: true });
}

useSeoMeta({
  title: () => data.value?.page.title,
  description: () => data.value?.page.description
});
</script>

<template>
  <UMain>
    <CourseReader
      v-if="data"
      :course="data.course"
      :page="data.page"
      :lessons="data.lessons"
      :course-key="data.course.courseId ?? data.course.path"
      :back="{
        icon: 'i-lucide-square-library',
        label: 'Courses',
        to: '/courses'
      }"
    />
  </UMain>
</template>
