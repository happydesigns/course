<script setup lang="ts">
import type { CoursePage } from "../types/course";
import { computed, onBeforeUnmount, ref } from "vue";

const props = defineProps<{
  course: CoursePage;
  lessons: CoursePage[];
  currentLessonIndex: number;
  isLesson: boolean;
  compact?: boolean;
}>();

const mobileOpen = ref(false);
const desktopOpen = ref(false);
let closeTimer: ReturnType<typeof setTimeout> | undefined;

const positionLabel = computed(() =>
  props.isLesson && props.currentLessonIndex >= 0
    ? `${props.currentLessonIndex + 1} / ${props.lessons.length}`
    : "Overview"
);
const outlineAriaLabel = computed(() =>
  props.isLesson && props.currentLessonIndex >= 0
    ? `Course outline, step ${props.currentLessonIndex + 1} of ${props.lessons.length}`
    : "Course outline, overview"
);

function openDesktop(): void {
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = undefined;
  }

  desktopOpen.value = true;
}

function scheduleDesktopClose(): void {
  if (closeTimer) {
    clearTimeout(closeTimer);
  }

  closeTimer = setTimeout(() => {
    desktopOpen.value = false;
    closeTimer = undefined;
  }, 180);
}

function close(): void {
  setTimeout(() => {
    desktopOpen.value = false;
    mobileOpen.value = false;
  });
}

onBeforeUnmount(() => {
  if (closeTimer) {
    clearTimeout(closeTimer);
  }
});
</script>

<template>
  <div
    :class="[
      'fixed top-1/2 z-40 hidden -translate-y-1/2 lg:block',
      compact
        ? 'start-[max(0px,calc((100vw-120rem)/2))] min-[1920px]:-translate-x-4'
        : 'start-0 xl:start-[calc(50%-32.75rem)] xl:-translate-x-full'
    ]"
    @mouseenter="openDesktop"
    @mouseleave="scheduleDesktopClose"
  >
    <UPopover
      v-model:open="desktopOpen"
      mode="click"
      :content="{ side: 'right', align: 'center', sideOffset: 12, collisionPadding: 12 }"
      :ui="{
        content: 'w-96 max-w-[calc(100vw-5rem)] bg-default/80 p-0 shadow-2xl ring-accented backdrop-blur-xl backdrop-saturate-150'
      }"
    >
      <UButton
        :label="positionLabel"
        icon="i-lucide-list-tree"
        color="neutral"
        variant="soft"
        size="sm"
        :aria-label="outlineAriaLabel"
        :class="[
          'rounded-e-full border border-default shadow-md',
          compact
            ? 'rounded-s-none border-s-0 px-2.5'
            : 'rounded-s-none border-s-0 xl:rounded-s-full xl:border-s'
        ]"
        :ui="{ label: compact ? 'hidden' : 'hidden xl:inline' }"
      />

      <template #content>
        <div
          class="max-h-[calc(100vh-6rem)] overscroll-contain overflow-x-hidden overflow-y-auto p-4"
          @mouseenter="openDesktop"
          @mouseleave="scheduleDesktopClose"
        >
          <p class="mb-3 text-sm font-semibold text-highlighted">{{ course.title }}</p>
          <CourseNavigation :course="course" :lessons="lessons" @navigate="close" />
        </div>
      </template>
    </UPopover>
  </div>

  <USlideover v-model:open="mobileOpen" :title="course.title" side="left">
    <UButton
      label="Course outline"
      icon="i-lucide-list-tree"
      color="neutral"
      variant="outline"
      class="mt-6 lg:hidden"
    />

    <template #body>
      <CourseNavigation :course="course" :lessons="lessons" @navigate="close" />
    </template>
  </USlideover>
</template>
