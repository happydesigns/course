<script setup lang="ts">
import type { CourseLink } from "../types/course";

withDefaults(defineProps<{
  courses: CourseLink[];
  title?: string;
  courseLabel?: string;
  linkLabel?: string;
}>(), { title: "What's next", courseLabel: "Next course", linkLabel: "Open course" });
</script>

<template>
  <section v-if="courses.length" :aria-label="title" class="not-prose mt-12 border-t border-default pt-10">
    <h2 class="text-xl font-semibold text-highlighted">{{ title }}</h2>
    <div :class="['mt-4 grid gap-4', courses.length > 1 && 'sm:grid-cols-2']">
      <UPageCard
        v-for="course in courses"
        :key="course.path"
        :to="course.path"
        :title="course.title"
        :description="course.description"
        variant="soft"
      >
        <template #header>
          <UBadge
            :label="courseLabel"
            icon="i-lucide-graduation-cap"
            color="primary"
            variant="subtle"
            size="sm"
          />
        </template>
        <template #footer>
          <span class="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            {{ linkLabel }}
            <UIcon name="i-lucide-arrow-right" class="size-4" aria-hidden="true" />
          </span>
        </template>
      </UPageCard>
    </div>
  </section>
</template>
