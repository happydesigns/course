<script setup lang="ts">
import type { CourseCodeItem } from "../composables/useCourseCodeState";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

interface CourseCodeStageConfig {
  label: string;
  emptyLabel: string;
  minTreeWidth: number;
  maxTreeWidth: number;
  minCodeWidth: number;
  defaultTreeWidth: number;
  expandAll: boolean;
}

const props = defineProps<{
  items: CourseCodeItem[];
  modelValue: string;
  config: CourseCodeStageConfig;
  storageKey: string;
  mobile?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

type MobileView = "files" | "code";

const collapsedDrawerHeight = 90;
const collapsedSnapPoint = ref(collapsedDrawerHeight / 768);
const mobileSnapPoints = computed(() => [collapsedSnapPoint.value, 0.55, 0.96]);
const mobileView = ref<MobileView>("files");
const activeSnapPoint = ref(collapsedSnapPoint.value);
const isMobileCollapsed = computed(() => activeSnapPoint.value === collapsedSnapPoint.value);

function updateCollapsedSnapPoint(): void {
  const wasCollapsed = activeSnapPoint.value === collapsedSnapPoint.value;
  collapsedSnapPoint.value = collapsedDrawerHeight / window.innerHeight;

  if (wasCollapsed) {
    activeSnapPoint.value = collapsedSnapPoint.value;
  }
}

onMounted(() => {
  updateCollapsedSnapPoint();
  window.addEventListener("resize", updateCollapsedSnapPoint);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateCollapsedSnapPoint);
});

function toggleMobileDrawer(): void {
  if (isMobileCollapsed.value) {
    mobileView.value = "files";
    activeSnapPoint.value = 0.55;
    return;
  }

  activeSnapPoint.value = collapsedSnapPoint.value;
}

function selectMobilePath(value: string): void {
  emit("update:modelValue", value);
  mobileView.value = "code";
  activeSnapPoint.value = 0.96;
}

watch(activeSnapPoint, (value) => {
  if (value === collapsedSnapPoint.value) {
    mobileView.value = "files";
  }
});
</script>

<template>
  <UDrawer
    v-if="mobile && items.length"
    v-model:active-snap-point="activeSnapPoint"
    :open="true"
    :title="config.label"
    :snap-points="mobileSnapPoints"
    :overlay="false"
    :modal="!isMobileCollapsed"
    :dismissible="false"
    :no-body-styles="isMobileCollapsed"
    direction="bottom"
    :ui="{
      content: 'mt-0 h-dvh max-h-dvh lg:hidden',
      container: 'min-h-0 gap-0 overflow-hidden p-0',
      handle: 'mt-3 mb-5',
      header: 'px-4 pb-3',
      wrapper: 'w-full',
      title: 'w-full',
      body: 'min-h-0 flex-1 overflow-hidden overscroll-contain border-t border-default'
    }"
  >
    <template #title>
      <button
        type="button"
        class="flex min-h-10 w-full min-w-0 items-center gap-2 text-left text-sm font-medium"
        :aria-expanded="!isMobileCollapsed"
        @click="toggleMobileDrawer"
      >
        <UIcon name="i-lucide-folder-tree" class="size-4 shrink-0 text-muted" />
        <span class="min-w-0 flex-1 truncate">{{ config.label }}</span>
        <UIcon
          :name="isMobileCollapsed ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="size-4 shrink-0 text-muted"
        />
      </button>
    </template>

    <template #body>
      <CourseCodePanel
        :model-value="modelValue"
        :items="items"
        :config="config"
        :storage-key="storageKey"
        :mobile-view="mobileView"
        mobile
        @update:model-value="selectMobilePath"
        @update:mobile-view="mobileView = $event"
      />
    </template>
  </UDrawer>

  <nav
    v-else-if="!mobile"
    class="course-code-stage relative hidden lg:sticky lg:top-(--ui-header-height) lg:block"
    :aria-label="config.label"
  >
    <CourseCodePanel
      v-if="modelValue"
      :model-value="modelValue"
      :items="items"
      :config="config"
      :storage-key="storageKey"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <div v-else class="flex h-full items-center justify-center border-l border-default p-8 text-center">
      <div class="space-y-3 text-muted">
        <UIcon name="i-lucide-arrow-down" class="mx-auto size-10 motion-safe:animate-bounce text-dimmed" />
        <p class="text-sm">{{ config.emptyLabel }}</p>
      </div>
    </div>
  </nav>
</template>
