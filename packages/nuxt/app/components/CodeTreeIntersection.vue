<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useCourseCodeState } from "../composables/useCourseCodeState";

const props = defineProps<{ default?: boolean; stepIndex?: number }>();
const target = ref<HTMLElement | null>(null);
const state = useCourseCodeState();
let observer: IntersectionObserver | undefined;
let activationFrame: number | undefined;
let ready = false;

function activate(): void {
  if (props.stepIndex !== undefined) state?.activate(props.stepIndex);
}

function activateAtCurrentPosition(): void {
  const top = target.value?.getBoundingClientRect().top;
  if (props.default || (top !== undefined && top < window.innerHeight * 0.5)) {
    activate();
  }
}

watch(() => state?.inputsReady.value, () => {
  if (ready) activateAtCurrentPosition();
}, { flush: "post" });

onMounted(() => {
  if (props.default) {
    ready = true;
    activate();
    return;
  }
  // Allow Nuxt to restore the new route's scroll position before activation.
  activationFrame = requestAnimationFrame(() => {
    activationFrame = requestAnimationFrame(() => {
      activationFrame = undefined;
      ready = true;
      activateAtCurrentPosition();
      if (!target.value) return;
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          activate();
        } else if (
          props.stepIndex === 0
          && target.value
          && target.value.getBoundingClientRect().top >= window.innerHeight * 0.5
        ) {
          state?.resetProgression();
        }
      }, { rootMargin: "-200px 0px -50% 0px", threshold: 0 });
      observer.observe(target.value);
    });
  });
});

onBeforeUnmount(() => {
  ready = false;
  if (activationFrame !== undefined) cancelAnimationFrame(activationFrame);
  observer?.disconnect();
});
</script>

<template>
  <div v-if="!props.default" ref="target" data-course-code-step>
    <slot />
  </div>
</template>
