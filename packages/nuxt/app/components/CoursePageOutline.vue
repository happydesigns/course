<script setup lang="ts">
import type { CoursePageAnchor } from "../composables/useCourseReaderModel";

defineProps<{
  links: CoursePageAnchor[];
}>();
</script>

<template>
  <section
    aria-labelledby="course-page-outline-title"
    class="mt-6 rounded-lg bg-elevated/40 p-4"
  >
    <div class="flex items-center justify-between gap-4">
      <h2
        id="course-page-outline-title"
        class="flex items-center gap-2 text-sm font-semibold text-highlighted"
      >
        <UIcon name="i-lucide-list" class="size-4 text-muted" />
        On this exercise
      </h2>
      <span class="text-xs text-muted">{{ links.length }} sections</span>
    </div>

    <UPageAnchors
      :links="links"
      class="mt-2"
      :ui="{
        list: 'grid gap-1',
        link: 'items-start py-1.5',
        linkLeading: 'bg-transparent p-0 ring-0 group-hover:bg-transparent group-hover:ring-0',
        linkLabel: 'whitespace-normal'
      }"
    >
      <template #link-leading="{ link }">
        <span class="flex size-5 shrink-0 items-center justify-center rounded-full border border-muted text-[10px] font-semibold text-muted">
          {{ link.step }}
        </span>
      </template>
    </UPageAnchors>
  </section>
</template>
