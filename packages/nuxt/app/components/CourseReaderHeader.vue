<script setup lang="ts">
import type { CourseInput, CoursePage } from "../types/course";
import type { CoursePageAnchor } from "../composables/useCourseReaderModel";

interface BreadcrumbItem {
  label: string;
  to: string;
  icon?: string;
}

const props = defineProps<{
  course: CoursePage;
  page: CoursePage;
  lessons: CoursePage[];
  currentLessonIndex: number;
  isLesson: boolean;
  breadcrumbItems: BreadcrumbItem[];
  currentBreadcrumb: BreadcrumbItem;
  pageAnchorLinks: CoursePageAnchor[];
  inputs: CourseInput[];
  inputValues: Readonly<Record<string, string>>;
  compactNavigation?: boolean;
  dateLocale?: string;
  draftLabel?: string;
}>();

const emit = defineEmits<{
  updateInput: [input: CourseInput, value: string | number];
}>();

function formatDate(date?: string): string {
  if (!date) {
    return props.draftLabel ?? "Draft";
  }

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.valueOf())) {
    return date;
  }

  return new Intl.DateTimeFormat(props.dateLocale, {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(parsedDate);
}
</script>

<template>
  <div class="pt-8">
    <HBreadcrumbs :items="breadcrumbItems" :current="currentBreadcrumb" />
  </div>

  <UPageHeader
    :title="page.title"
    :description="page.description"
    :ui="{
      root: inputs.length ? 'pt-6 pb-4' : 'pt-6',
      title: 'relative flex items-center'
    }"
  >
    <template #headline>
      <div class="flex flex-wrap items-center gap-2">
        <template v-if="isLesson">
          <span class="text-muted font-normal">
            Exercise {{ currentLessonIndex + 1 }} of {{ lessons.length }}
          </span>
          <UBadge v-if="page.optional" label="Optional" color="neutral" variant="subtle" />
          <span v-if="page.estimatedMinutes" aria-hidden="true" class="text-dimmed">·</span>
          <span v-if="page.estimatedMinutes" class="text-muted font-normal">
            {{ page.estimatedMinutes }} min
          </span>
        </template>
        <template v-else>
          <time class="text-muted font-normal">{{ formatDate(course.date) }}</time>
          <UBadge v-if="course.version" color="neutral" variant="subtle" :label="`v${course.version}`" />
        </template>
      </div>
    </template>

    <div v-if="!isLesson && course.authors?.length" class="mt-6 flex flex-wrap items-center gap-6">
      <template v-for="author in course.authors" :key="author.name">
        <ULink v-if="author.to" :to="author.to" target="_blank" class="group flex items-center gap-3">
          <UAvatar :src="author.avatar?.src" :alt="author.avatar?.alt ?? author.name" size="lg" />
          <div class="flex flex-col">
            <span class="text-sm font-medium text-highlighted">{{ author.name }}</span>
            <span class="text-xs text-muted transition-colors group-hover:text-primary">
              {{ author.to.replace(/^https?:\/\//, "") }}
            </span>
          </div>
        </ULink>
        <div v-else class="flex items-center gap-3">
          <UAvatar :src="author.avatar?.src" :alt="author.avatar?.alt ?? author.name" size="lg" />
          <span class="text-sm font-medium text-highlighted">{{ author.name }}</span>
        </div>
      </template>
    </div>

    <CourseReaderNavigation
      v-if="lessons.length"
      :course="course"
      :lessons="lessons"
      :current-lesson-index="currentLessonIndex"
      :is-lesson="isLesson"
      :compact="compactNavigation"
    />

    <CoursePageOutline v-if="pageAnchorLinks.length" :links="pageAnchorLinks" />

    <CourseParameters
      v-if="inputs.length"
      :key="page.path"
      :inputs="inputs"
      :values="inputValues"
      :default-open="isLesson"
      :class="!isLesson && course.authors?.length ? 'mt-8' : 'mt-4'"
      @update="(input, value) => emit('updateInput', input, value)"
    />
  </UPageHeader>
</template>
