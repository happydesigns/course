<script setup lang="ts">
import type { VNode } from "vue";
import { defineComponent, h, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useCourseCodeState, type CourseCodeItem } from "../composables/useCourseCodeState";
import { useCourseCodeCollectionMode } from "../composables/useCourseCodeCollectionMode";
import { interpolateCourseCodeVNode } from "../utils/course-code";

const props = defineProps<{
  default?: boolean;
}>();

const slots = defineSlots();
const target = ref<HTMLElement | null>(null);
const state = useCourseCodeState();
const collectOnly = useCourseCodeCollectionMode();
const source = Symbol("course-code-intersection");
let renderedSlots: VNode[] = [];
let observer: IntersectionObserver | undefined;
let hasRegistered = false;
let isMounted = false;

function collectItems(): CourseCodeItem[] {
  return renderedSlots.map(transformSlot).filter(isCourseCodeItem);
}

// MDC supplies code blocks through the default slot. Capture those VNodes while
// Vue is rendering the slot so later intersection updates never invoke a slot
// outside its render owner (which would break dependency tracking).
const SlotRenderer = defineComponent({
  setup() {
    return () => {
      renderedSlots = slots.default?.() ?? [];

      if (props.default || collectOnly) {
        return null;
      }

      const displayedSlots = renderedSlots.map((slot) =>
        interpolateCourseCodeVNode(slot, state?.inputValues.value ?? {})
      );

      return h("div", { ref: target, "data-course-code-step": "" }, displayedSlots);
    };
  }
});

function register(options?: { activate?: boolean }): void {
  const items = collectItems();

  if (state?.inputsReady.value && items.length > 0) {
    if (collectOnly) {
      state.register(source, items, { activate: false });
      hasRegistered = true;
    } else if (options?.activate !== false) {
      // The hidden CourseCodeHistory owns the canonical tree sources. Visible
      // intersections only select the active file; registering their already
      // rendered VNodes would introduce a second, timing-dependent source.
      state.activate(items);
    }
  }
}

function registerForCurrentPosition(): void {
  if (collectOnly) {
    register();
    return;
  }

  if (props.default) {
    register();
    return;
  }

  const rect = target.value?.getBoundingClientRect();

  if (rect && rect.top < window.innerHeight * 0.5) {
    register();
  }
}

watch(
  () => state?.contentRevision.value,
  () => {
    if (hasRegistered) {
      register({ activate: false });
    } else if (isMounted) {
      registerForCurrentPosition();
    }
  },
  { flush: "post" }
);

onMounted(() => {
  isMounted = true;
  registerForCurrentPosition();

  if (collectOnly || props.default || !target.value) {
    return;
  }

  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        register();
      }
    },
    {
      rootMargin: "-200px 0px -50% 0px",
      threshold: 0
    }
  );

  observer.observe(target.value);
});

onBeforeUnmount(() => {
  isMounted = false;
  observer?.disconnect();

  if (hasRegistered) {
    state?.unregister(source);
  }
});

function findCodeBlock(slot: VNode): VNode | undefined {
  const slotProps = slot.props ?? {};

  if (slotProps.filename || slotProps.label) {
    return slot;
  }

  if (isSlotChildren(slot.children)) {
    for (const child of slot.children.default()) {
      const found = findCodeBlock(child);

      if (found) {
        return found;
      }
    }
  }

  return undefined;
}

function transformSlot(slot: unknown, index: number): CourseCodeItem | undefined {
  if (!isVNode(slot)) {
    return undefined;
  }

  if (typeof slot.type === "symbol" && Array.isArray(slot.children)) {
    return slot.children
      .map((child, childIndex) => transformSlot(child, childIndex))
      .find(isCourseCodeItem);
  }

  const codeBlock = findCodeBlock(slot);

  if (!codeBlock) {
    return undefined;
  }

  const filename = String(codeBlock.props?.filename ?? codeBlock.props?.label ?? index);

  return {
    label: filename,
    icon: typeof codeBlock.props?.icon === "string" ? codeBlock.props.icon : undefined,
    component: codeBlock
  };
}

function isSlotChildren(value: unknown): value is { default: () => VNode[] } {
  return typeof value === "object" && value !== null && "default" in value;
}

function isVNode(value: unknown): value is VNode {
  return typeof value === "object" && value !== null && "type" in value;
}

function isCourseCodeItem(value: unknown): value is CourseCodeItem {
  return typeof value === "object" && value !== null && "label" in value && "component" in value;
}
</script>

<template>
  <SlotRenderer />
</template>
