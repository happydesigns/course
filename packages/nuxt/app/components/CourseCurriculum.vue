<script setup lang="ts">
import type { CoursePage } from "../types/course";
import { computed } from "vue";
import { useCourseProgress } from "../composables/useCourseProgress";

const props = defineProps<{
  lessons: CoursePage[];
}>();

const progress = useCourseProgress();
const orderedLessons = computed(() =>
  [...props.lessons].sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
);
const requiredCount = computed(() => orderedLessons.value.filter((lesson) => !lesson.optional).length);
const optionalCount = computed(() => orderedLessons.value.length - requiredCount.value);
const totalMinutes = computed(() =>
  orderedLessons.value
    .reduce((total, lesson) => total + (lesson.estimatedMinutes ?? 0), 0)
);
const completedRequiredCount = computed(() => progress?.completedRequiredCount.value ?? 0);
const nextRequiredLesson = computed(() =>
  orderedLessons.value.find(
    (lesson) => !lesson.optional && !progress?.isLessonComplete(lesson.path)
  )
);
const courseActionPath = computed(() =>
  nextRequiredLesson.value?.path ?? orderedLessons.value[0]?.path
);
const courseActionLabel = computed(() => {
  if (requiredCount.value > 0 && completedRequiredCount.value >= requiredCount.value) {
    return "Review course";
  }

  return completedRequiredCount.value > 0 ? "Continue course" : "Start course";
});

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (hours === 0) {
    return `${remainder} min`;
  }

  return remainder > 0 ? `${hours} hr ${remainder} min` : `${hours} hr`;
}

</script>

<template>
  <section v-if="orderedLessons.length" class="not-prose mt-12 border-t border-default pt-8">
    <div>
      <h2 class="text-2xl font-bold text-highlighted">Course content</h2>
      <p class="mt-1 text-sm text-muted">Work through the core exercises in order or open any lesson directly.</p>
    </div>

    <div class="mt-5 grid gap-5 rounded-lg bg-elevated/30 p-4 lg:grid-cols-[minmax(18rem,1.5fr)_minmax(22rem,1fr)_auto] lg:items-center">
      <div>
        <div class="flex items-center justify-between gap-4">
          <p class="text-sm font-semibold text-highlighted">
            Your progress
            <span class="ms-2 font-normal text-muted">
              {{ progress?.completedRequiredCount.value ?? 0 }} of {{ requiredCount }} completed
            </span>
          </p>
          <span class="text-sm font-medium text-highlighted">{{ progress?.percent.value ?? 0 }}%</span>
        </div>
        <UProgress
          :model-value="progress?.percent.value ?? 0"
          :max="100"
          size="sm"
          class="mt-2"
          aria-label="Required course progress"
        />
      </div>

      <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:border-s lg:border-default lg:ps-5">
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-list-checks" class="size-5 shrink-0 text-muted" aria-hidden="true" />
          <div>
            <dt class="text-xs text-muted">Course structure</dt>
            <dd class="mt-0.5 flex items-center gap-2 text-sm font-semibold text-highlighted">
              <span>{{ requiredCount }} core</span>
              <span v-if="optionalCount" class="font-normal text-dimmed" aria-hidden="true">&middot;</span>
              <span v-if="optionalCount">{{ optionalCount }} optional</span>
            </dd>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-clock-3" class="size-5 shrink-0 text-muted" aria-hidden="true" />
          <div>
            <dt class="text-xs text-muted">Estimated duration</dt>
            <dd class="mt-0.5 text-sm font-semibold text-highlighted">
              {{ totalMinutes ? formatDuration(totalMinutes) : "Not specified" }}
            </dd>
          </div>
        </div>
      </dl>

      <UButton
        v-if="courseActionPath"
        :to="courseActionPath"
        :label="courseActionLabel"
        icon="i-lucide-play"
        class="w-full justify-center sm:w-auto"
      />
    </div>

    <div class="mt-5 border-y border-default">
      <ULink
        v-for="(lesson, index) in orderedLessons"
        :key="lesson.path"
        :to="lesson.path"
        class="group flex items-start gap-3 rounded-none border-b border-default py-4 last:border-b-0"
      >
        <div
          :class="[
            'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
            progress?.isLessonComplete(lesson.path)
              ? 'border-success/40 bg-success/10 text-success'
              : 'border-muted text-muted'
          ]"
        >
          <UIcon
            v-if="progress?.isLessonComplete(lesson.path)"
            name="i-lucide-check"
            class="size-4"
          />
          <span v-else>{{ index + 1 }}</span>
        </div>
        <div class="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-medium text-highlighted group-hover:text-primary">{{ lesson.title }}</span>
              <UBadge v-if="lesson.optional" label="Optional" color="neutral" variant="subtle" size="sm" />
              <span v-if="progress?.isLessonComplete(lesson.path)" class="sr-only">Completed</span>
            </div>
            <p class="mt-1 text-sm text-muted">{{ lesson.description }}</p>
          </div>
          <p v-if="lesson.estimatedMinutes" class="mt-2 flex shrink-0 items-center gap-1.5 text-xs text-dimmed sm:mt-0">
            <UIcon name="i-lucide-clock-3" class="size-3.5" aria-hidden="true" />
            Estimated {{ lesson.estimatedMinutes }} min
          </p>
        </div>
        <UIcon name="i-lucide-chevron-right" class="size-4 shrink-0 self-center text-dimmed group-hover:text-muted" />
      </ULink>
    </div>
  </section>
</template>
