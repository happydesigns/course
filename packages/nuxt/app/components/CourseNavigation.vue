<script setup lang="ts">
import { useCourseLabels } from "../composables/useCourseLabels";
import type { CoursePage } from "../types/course";
import { computed } from "vue";
import { useCourseProgress } from "../composables/useCourseProgress";

const label = useCourseLabels();

interface TocLink {
  id: string;
  text: string;
  depth: number;
  children?: TocLink[];
}

const props = defineProps<{
  course: CoursePage;
  lessons: CoursePage[];
  tocLinks?: TocLink[];
  tocTitle?: string;
}>();
const emit = defineEmits<{
  navigate: [];
}>();

const progress = useCourseProgress();
const orderedLessons = computed(() =>
  [...props.lessons].sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
);
const navigation = computed(() => [
  {
    title: label("overview"),
    path: props.course.path,
    icon: "i-lucide-layout-dashboard",
    overview: true,
    completed: false,
    step: undefined,
    optional: false
  },
  ...orderedLessons.value.map((lesson, index) => ({
    title: lesson.title,
    path: lesson.path,
    icon: "i-lucide-circle-check",
    overview: false,
    completed: progress?.isLessonComplete(lesson.path) ?? false,
    step: index + 1,
    optional: lesson.optional
  }))
]);
</script>

<template>
  <div class="space-y-5">
    <div>
      <div class="mb-2 flex items-center justify-between gap-3 text-xs text-muted">
        <span>
          {{ label('requiredSteps', { done: progress?.completedRequiredStepCount.value ?? 0, total: progress?.requiredStepCount.value ?? 0 }) }}
        </span>
        <span>{{ progress?.percent.value ?? 0 }}%</span>
      </div>
      <UProgress :model-value="progress?.percent.value ?? 0" :max="100" size="sm" />
    </div>

    <UContentNavigation
      :navigation="navigation"
      :collapsible="false"
      color="neutral"
      :ui="{ linkLeadingIcon: 'data-[active=false]:text-muted' }"
      @click="emit('navigate')"
    >
      <template #link-leading="{ link, active }">
        <UIcon
          v-if="link.overview || link.completed"
          :name="link.icon"
          :class="[
            'size-4 shrink-0',
            link.completed
              ? 'text-success'
              : active
                ? 'text-highlighted'
                : 'text-dimmed'
          ]"
        />
        <span
          v-else
          :class="[
            'flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold',
            active
              ? 'border-primary bg-primary text-inverted'
              : 'border-muted text-dimmed'
          ]"
        >
          {{ link.step }}
        </span>
      </template>

      <template #link-trailing="{ link }">
        <UBadge v-if="link.optional" label="Optional" color="neutral" variant="subtle" size="sm" />
      </template>
    </UContentNavigation>

    <template v-if="tocLinks?.length">
      <USeparator />
      <UContentToc :title="tocTitle ?? label('onStep')" :links="tocLinks" highlight color="neutral" />
    </template>
  </div>
</template>
