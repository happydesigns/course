<script setup lang="ts">
import { provideCourseCodeSequence } from "../composables/useCourseCodeSequence";

const props = defineProps<{
  pagePath: string;
  progressive: boolean;
}>();

provideCourseCodeSequence(props.pagePath, props.progressive);
</script>

<template>
  <slot />
</template>
