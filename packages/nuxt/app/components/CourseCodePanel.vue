<script setup lang="ts">
import type { CSSProperties } from "vue";
import type { CourseCodeItem } from "../composables/useCourseCodeState";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

interface CourseCodePanelConfig {
  minTreeWidth: number;
  maxTreeWidth: number;
  minCodeWidth: number;
  defaultTreeWidth: number;
  expandAll: boolean;
}

const props = defineProps<{
  items: CourseCodeItem[];
  modelValue: string;
  config: CourseCodePanelConfig;
  storageKey: string;
  mobile?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const panel = ref<HTMLElement | null>(null);
const treeWidth = ref(props.config.defaultTreeWidth);
const isResizing = ref(false);
const activePath = computed({
  get: () => props.modelValue,
  set: (value: string) => emit("update:modelValue", value)
});
const panelStyle = computed<CSSProperties>(() => ({
  "--course-code-tree-list-width": `${treeWidth.value}px`
}));

function clampTreeWidth(width: number): number {
  const panelWidth = panel.value?.getBoundingClientRect().width ?? Number.POSITIVE_INFINITY;
  const panelMaximum = Math.max(props.config.minTreeWidth, panelWidth - props.config.minCodeWidth);
  const maximum = Math.min(props.config.maxTreeWidth, panelMaximum);

  return Math.round(Math.min(Math.max(width, props.config.minTreeWidth), maximum));
}

function setTreeWidth(width: number): void {
  treeWidth.value = clampTreeWidth(width);
}

function persistTreeWidth(): void {
  localStorage.setItem(props.storageKey, String(treeWidth.value));
}

function resize(event: PointerEvent): void {
  const rect = panel.value?.getBoundingClientRect();

  if (rect) {
    setTreeWidth(event.clientX - rect.left);
  }
}

function stopResize(): void {
  isResizing.value = false;
  window.removeEventListener("pointermove", resize);
  window.removeEventListener("pointerup", stopResize);
  document.documentElement.classList.remove("course-code-tree-resizing-global");
  persistTreeWidth();
}

function startResize(event: PointerEvent): void {
  if (props.mobile || event.button !== 0) {
    return;
  }

  event.preventDefault();
  isResizing.value = true;
  resize(event);
  document.documentElement.classList.add("course-code-tree-resizing-global");
  window.addEventListener("pointermove", resize);
  window.addEventListener("pointerup", stopResize);
  (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
}

function adjustTreeWidth(delta: number): void {
  setTreeWidth(treeWidth.value + delta);
  persistTreeWidth();
}

function handleResizerKeydown(event: KeyboardEvent): void {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    adjustTreeWidth(-24);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    adjustTreeWidth(24);
  } else if (event.key === "Home") {
    event.preventDefault();
    setTreeWidth(props.config.minTreeWidth);
    persistTreeWidth();
  } else if (event.key === "End") {
    event.preventDefault();
    setTreeWidth(props.config.maxTreeWidth);
    persistTreeWidth();
  }
}

onMounted(() => {
  if (props.mobile) {
    return;
  }

  const storedWidth = Number(localStorage.getItem(props.storageKey));

  if (Number.isFinite(storedWidth)) {
    setTreeWidth(storedWidth);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("pointermove", resize);
  window.removeEventListener("pointerup", stopResize);
  document.documentElement.classList.remove("course-code-tree-resizing-global");
});
</script>

<template>
  <div
    ref="panel"
    :style="panelStyle"
    :class="[
      'relative h-full min-h-0',
      isResizing && 'course-code-tree-resizing'
    ]"
  >
    <ProseCodeTree
      v-model="activePath"
      :items="items"
      :expand-all="config.expandAll"
      class="course-code-tree my-0 h-full min-h-0 rounded-none border-y-0 border-r-0 border-default"
      :ui="{
        root: 'h-full min-h-0 lg:h-full',
        list: 'course-code-tree-list border-default',
        content: 'course-code-tree-content min-h-0 [&>div]:min-h-0 [&>div>pre]:min-h-0 [&>div>pre]:rounded-none [&>div>pre]:border-default [&>div>pre]:bg-muted/50'
      }"
    />

    <div
      v-if="!mobile"
      role="separator"
      aria-label="Resize file tree"
      aria-orientation="vertical"
      :aria-valuemin="config.minTreeWidth"
      :aria-valuemax="config.maxTreeWidth"
      :aria-valuenow="treeWidth"
      tabindex="0"
      class="course-code-tree-resizer"
      @pointerdown="startResize"
      @keydown="handleResizerKeydown"
    />
  </div>
</template>
