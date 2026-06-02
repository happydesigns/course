<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted, ref } from "vue";
import { COURSE_CODE_STATE_KEY } from "../utils/course-code";

const props = defineProps<{
  snapshotId?: string;
}>();

const root = ref<HTMLElement | null>(null);
const courseCodeState = inject(COURSE_CODE_STATE_KEY, null);
const assignedSnapshotId = props.snapshotId ?? courseCodeState?.registerSnapshot() ?? "";
let observer: IntersectionObserver | undefined;

function activateSnapshot(): void {
  if (assignedSnapshotId) {
    courseCodeState?.activateSnapshot(assignedSnapshotId);
  }
}

onMounted(() => {
  if (!root.value) {
    return;
  }

  activateSnapshot();

  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        activateSnapshot();
      }
    },
    {
      rootMargin: "-22% 0px -58% 0px",
      threshold: 0
    }
  );

  observer.observe(root.value);
});

onBeforeUnmount(() => {
  observer?.disconnect();
});
</script>

<template>
  <section ref="root" class="code-tree-intersection" :data-code-snapshot="assignedSnapshotId">
    <slot />
  </section>
</template>
