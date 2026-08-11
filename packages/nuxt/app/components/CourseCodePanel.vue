<script setup lang="ts">
import type { CSSProperties } from "vue";
import type { CourseCodeItem } from "../composables/useCourseCodeState";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useCourseStorage } from "../composables/useCourseStorage";

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
  mobileView?: "files" | "code";
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  "update:mobileView": [value: "files" | "code"];
}>();

const storage = useCourseStorage();
const panel = ref<HTMLElement | null>(null);
const treeWidth = ref(props.config.defaultTreeWidth);
const isResizing = ref(false);
const mobileTreeCollapsed = ref(false);
const activePath = computed({
  get: () => props.modelValue,
  set: (value: string | undefined) => {
    if (typeof value === "string") {
      emit("update:modelValue", value);
    }
  }
});
const panelStyle = computed<CSSProperties>(() => ({
  "--course-code-tree-list-width": `${treeWidth.value}px`
}));

watch(
  () => props.mobileView,
  (view) => {
    if (view === "files") {
      mobileTreeCollapsed.value = false;
    }
  }
);

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
  storage.setItem(props.storageKey, String(treeWidth.value));
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

  const storedValue = storage.getItem(props.storageKey);
  const storedWidth = storedValue === null ? Number.NaN : Number(storedValue);

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
      'relative flex h-full min-h-0 flex-col',
      isResizing && 'course-code-tree-resizing'
    ]"
  >
    <div
      v-if="mobile && mobileView === 'code'"
      class="flex shrink-0 items-center border-b border-default p-2"
    >
      <UButton
        class="min-h-10 w-full justify-start sm:hidden"
        label="Project files"
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="soft"
        size="md"
        @click="emit('update:mobileView', 'files')"
      />
      <UButton
        class="hidden sm:inline-flex"
        :label="mobileTreeCollapsed ? 'Show project files' : 'Hide project files'"
        :icon="mobileTreeCollapsed ? 'i-lucide-panel-left-open' : 'i-lucide-panel-left-close'"
        color="neutral"
        variant="ghost"
        size="sm"
        @click="mobileTreeCollapsed = !mobileTreeCollapsed"
      />
    </div>

    <ProseCodeTree
      v-model="activePath"
      :items="items"
      :expand-all="config.expandAll"
      :class="[
        'course-code-tree my-0 min-h-0 flex-1 rounded-none border-y-0 border-r-0 border-default',
        mobile ? 'h-auto' : 'h-full',
        mobile && !mobileTreeCollapsed && 'sm:grid-cols-[minmax(11rem,14rem)_minmax(0,1fr)]',
        mobile && mobileTreeCollapsed && 'sm:grid-cols-1'
      ]"
      :ui="{
        root: 'h-full min-h-0',
        list: [
          'course-code-tree-list border-default',
          mobile && 'h-full min-h-0 overflow-y-auto overscroll-contain border-r-0 sm:border-r',
          mobile && mobileView === 'code' && 'hidden sm:block',
          mobile && mobileTreeCollapsed && 'sm:hidden'
        ],
        content: [
          'course-code-tree-content min-h-0 [&>div]:min-h-0 [&>div>pre]:min-h-0 [&>div>pre]:rounded-none [&>div>pre]:border-default [&>div>pre]:bg-muted/50',
          mobile && 'h-full overflow-auto overscroll-contain',
          mobile && mobileView !== 'code' && 'hidden sm:flex'
        ]
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
