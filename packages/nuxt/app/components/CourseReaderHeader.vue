<script setup lang="ts">
import { useCourseLabels } from "../composables/useCourseLabels";
import type { CourseInput, CoursePage } from "../types/course";
import type { CoursePageAnchor } from "../composables/useCourseReaderModel";
import { onBeforeUnmount, onMounted, ref } from "vue";

const label = useCourseLabels();

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
  dateLocale?: string;
  draftLabel?: string;
}>();

const emit = defineEmits<{
  updateInput: [input: CourseInput, value: string | number];
}>();

const navigationSentinel = ref<HTMLElement>();
const navigationStuck = ref(false);
let navigationObserver: IntersectionObserver | undefined;

onMounted(() => {
  if (!navigationSentinel.value) {
    return;
  }

  const headerHeight = document.querySelector("header")?.getBoundingClientRect().height ?? 64;

  navigationObserver = new IntersectionObserver(
    ([entry]) => {
      navigationStuck.value = !entry?.isIntersecting;
    },
    {
      rootMargin: `-${Math.ceil(headerHeight)}px 0px 0px`,
      threshold: 0
    }
  );
  navigationObserver.observe(navigationSentinel.value);
});

onBeforeUnmount(() => {
  navigationObserver?.disconnect();
});

function formatDate(date?: string): string {
  if (!date) {
    return props.draftLabel ?? label("draft");
  }

  const parsedDate = new Date(`${date}T00:00:00`);
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

  <div v-if="isLesson" ref="navigationSentinel" aria-hidden="true" class="h-px -mb-px" />

  <div
    v-if="isLesson"
    :class="[
      'sticky top-(--ui-header-height) z-30 -mx-2 mt-4 flex min-h-10 flex-wrap items-center gap-2 bg-default/75 px-2 py-2 backdrop-blur',
      navigationStuck && 'border-b border-default shadow-sm'
    ]"
  >
    <CourseReaderNavigation
      :course="course"
      :lessons="lessons"
      :current-lesson-index="currentLessonIndex"
    />
    <UBadge v-if="page.optional" label="Optional" color="neutral" variant="subtle" />
    <span v-if="page.estimatedMinutes" aria-hidden="true" class="text-dimmed">·</span>
    <span v-if="page.estimatedMinutes" class="text-sm text-muted font-normal">
      {{ page.estimatedMinutes }} min
    </span>
  </div>

  <div v-else class="mt-4 flex flex-wrap items-center gap-2">
    <span v-if="course.date" class="text-sm text-muted font-normal">
      {{ label('updated') }} <time :datetime="course.date">{{ formatDate(course.date) }}</time>
    </span>
    <span v-else class="text-sm text-muted font-normal">{{ draftLabel ?? label("draft") }}</span>
    <UBadge v-if="course.version" color="neutral" variant="subtle" :label="`v${course.version}`" />
  </div>

  <UPageHeader
    :title="page.title"
    :description="page.description"
    :ui="{
      root: inputs.length ? 'pt-2 pb-4' : 'pt-2',
      title: 'relative flex items-center'
    }"
  >
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

    <CoursePageOutline
      v-if="pageAnchorLinks.length"
      :links="pageAnchorLinks"
    />

    <CourseParameters
      v-if="inputs.length"
      :key="page.path"
      :inputs="inputs"
      :values="inputValues"
      :default-open="!isLesson"
      :class="!isLesson && course.authors?.length ? 'mt-8' : 'mt-4'"
      @update="(input, value) => emit('updateInput', input, value)"
    />
  </UPageHeader>
</template>
