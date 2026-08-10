<script setup lang="ts">
import { computed, ref } from "vue";
import { useCourseProgress } from "../composables/useCourseProgress";

const props = withDefaults(
  defineProps<{
    id: string;
    title?: string;
  }>(),
  {
    title: "Checkpoint"
  }
);

const progress = useCourseProgress();
const localComplete = ref(false);
const lessonPath = computed(() => progress?.currentLessonPath.value);
const checkboxId = computed(() => `course-checkpoint-${props.id}`);
const complete = computed({
  get: () => {
    if (!progress || !lessonPath.value) {
      return localComplete.value;
    }

    return progress.isCheckpointComplete(lessonPath.value, props.id);
  },
  set: (value: boolean | "indeterminate") => {
    const normalized = value === true;
    localComplete.value = normalized;

    if (progress && lessonPath.value) {
      progress.setCheckpointComplete(lessonPath.value, props.id, normalized);
    }
  }
});
</script>

<template>
  <div
    :class="[
      'not-prose my-8 flex gap-3 rounded-lg border p-4 transition-colors',
      complete ? 'border-success/40 bg-success/5' : 'border-default bg-elevated/30'
    ]"
  >
    <UCheckbox :id="checkboxId" v-model="complete" color="success" class="mt-0.5 shrink-0" />
    <label :for="checkboxId" class="min-w-0 cursor-pointer">
      <span class="block text-sm font-semibold text-highlighted">{{ title }}</span>
      <span class="mt-1 block text-sm text-muted">
        <slot mdc-unwrap="p" />
      </span>
    </label>
  </div>
</template>
