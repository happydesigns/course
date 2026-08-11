<script setup lang="ts">
import type { CoursePage } from "../types/course";
import { computed, ref } from "vue";

const props = defineProps<{
  course: CoursePage;
  lessons: CoursePage[];
  currentLessonIndex: number;
}>();

const mobileOpen = ref(false);
const desktopOpen = ref(false);

const positionLabel = computed(
  () => `Step ${props.currentLessonIndex + 1} of ${props.lessons.length}`
);
const outlineAriaLabel = computed(() =>
  `Course outline, step ${props.currentLessonIndex + 1} of ${props.lessons.length}`
);

function toggleOutline(): void {
  if (window.matchMedia("(min-width: 64rem)").matches) {
    desktopOpen.value = !desktopOpen.value;
    return;
  }

  mobileOpen.value = !mobileOpen.value;
}

defineShortcuts({
  meta_shift_l: {
    handler: toggleOutline,
    usingInput: true
  }
});

function close(): void {
  setTimeout(() => {
    desktopOpen.value = false;
    mobileOpen.value = false;
  });
}
</script>

<template>
  <span class="hidden lg:inline-flex">
    <UPopover
      v-model:open="desktopOpen"
      mode="click"
      :content="{ side: 'bottom', align: 'start', sideOffset: 8, collisionPadding: 12 }"
      :ui="{
        content: 'w-96 max-w-[calc(100vw-5rem)] bg-default/80 p-0 shadow-2xl ring-accented backdrop-blur-xl backdrop-saturate-150'
      }"
    >
      <UTooltip text="Course outline" :kbds="['meta', 'shift', 'l']">
        <UButton
          :label="positionLabel"
          icon="i-lucide-list-tree"
          color="neutral"
          variant="ghost"
          size="xs"
          :aria-label="outlineAriaLabel"
          aria-keyshortcuts="Control+Shift+L Meta+Shift+L"
          class="-ms-2 text-muted hover:text-highlighted"
          :ui="{ label: 'font-normal' }"
        />
      </UTooltip>

      <template #content>
        <div class="max-h-[calc(100vh-6rem)] overscroll-contain overflow-x-hidden overflow-y-auto p-4">
          <p class="mb-3 text-sm font-semibold text-highlighted">{{ course.title }}</p>
          <CourseNavigation :course="course" :lessons="lessons" @navigate="close" />
        </div>
      </template>
    </UPopover>
  </span>

  <UTooltip text="Course outline" :kbds="['meta', 'shift', 'l']" class="lg:hidden">
    <UButton
      :label="positionLabel"
      icon="i-lucide-list-tree"
      color="neutral"
      variant="ghost"
      size="xs"
      :aria-label="outlineAriaLabel"
      aria-keyshortcuts="Control+Shift+L Meta+Shift+L"
      aria-haspopup="dialog"
      :aria-expanded="mobileOpen"
      class="-ms-2 text-muted hover:text-highlighted"
      :ui="{ label: 'font-normal' }"
      @click="mobileOpen = true"
    />
  </UTooltip>

  <USlideover v-model:open="mobileOpen" :title="course.title" side="left">
    <template #body>
      <CourseNavigation :course="course" :lessons="lessons" @navigate="close" />
    </template>
  </USlideover>
</template>
