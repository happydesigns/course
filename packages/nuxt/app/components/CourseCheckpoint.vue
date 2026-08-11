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
const anchorId = computed(() => `checkpoint-${props.id}`);
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
  <UAlert
    :id="anchorId"
    as="label"
    :for="checkboxId"
    :title="title"
    :color="complete ? 'success' : 'neutral'"
    variant="subtle"
    :class="[
      'not-prose my-8 scroll-mt-24 cursor-pointer transition-colors has-focus-visible:ring-2 has-focus-visible:ring-primary',
      complete
        ? 'hover:bg-success/15'
        : 'hover:bg-elevated'
    ]"
    :ui="{
      title: 'font-semibold text-highlighted',
      description: 'text-muted'
    }"
  >
    <template #leading>
      <UCheckbox
        :id="checkboxId"
        v-model="complete"
        color="success"
        class="mt-0.5 shrink-0 cursor-pointer"
      />
    </template>

    <template #description>
      <slot mdc-unwrap="p" />
    </template>
  </UAlert>
</template>
