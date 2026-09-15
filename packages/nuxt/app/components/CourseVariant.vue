<script setup lang="ts">
import { useCourseInputValues } from "../composables/useCourseInputState";

defineProps<{ parameter: string; value: string; label?: string }>();
const values = useCourseInputValues();
</script>

<template>
  <div
    v-if="values?.[parameter] === value"
    :data-course-parameter="parameter"
    :data-course-value="value"
    class="my-6 border-s-2 border-primary ps-5"
  >
    <p v-if="label" class="text-sm font-medium text-primary">{{ label }}</p>
    <slot />
  </div>
</template>
