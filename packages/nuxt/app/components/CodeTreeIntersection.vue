<script setup lang="ts">
import type { VNode } from "vue";
import { defineComponent, h, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useCourseCodeState, type CourseCodeItem } from "../composables/useCourseCodeState";
import { useCourseCodeCollectionMode } from "../composables/useCourseCodeCollectionMode";
import { useCourseCodeSequence } from "../composables/useCourseCodeSequence";
import { interpolateCourseCodeVNode } from "../utils/course-code";

const props = defineProps<{
  default?: boolean;
}>();

const slots = defineSlots();
const target = ref<HTMLElement | null>(null);
const state = useCourseCodeState();
const collectOnly = useCourseCodeCollectionMode();
const sequence = useCourseCodeSequence();
const step = sequence?.nextStep();
const source = step?.source ?? Symbol("course-code-intersection");
let renderedSlots: VNode[] = [];
let observer: IntersectionObserver | undefined;
let activationFrame: number | undefined;
let hasRegistered = false;
let isMounted = false;
let isActivationReady = false;

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
    state.register(source, items, {
      activate: false,
      progressive: sequence?.progressive ?? false
    });
    hasRegistered = true;

    if (!collectOnly && options?.activate !== false) {
      state.activate(source, items);
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
    } else if (isActivationReady) {
      registerForCurrentPosition();
    }
  },
  { flush: "post" }
);

onMounted(() => {
  isMounted = true;

  if (collectOnly || props.default) {
    isActivationReady = true;
    registerForCurrentPosition();
    return;
  }

  // Pre-register the current page in source order without revealing it. This
  // lets activation select the project state through the visible code step,
  // while later files remain excluded until their intersection is reached.
  register({ activate: false });

  // Nuxt restores the route scroll position after the new page has mounted.
  // Wait for that reset before evaluating a code step, otherwise the previous
  // page's scroll offset can briefly activate snippets near the new page's end.
  activationFrame = requestAnimationFrame(() => {
    activationFrame = requestAnimationFrame(() => {
      activationFrame = undefined;

      if (!isMounted) {
        return;
      }

      isActivationReady = true;
      registerForCurrentPosition();

      if (!target.value) {
        return;
      }

      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            register();
          } else if (
            sequence?.progressive
            && step?.index === 0
            && target.value
            && target.value.getBoundingClientRect().top >= window.innerHeight * 0.5
          ) {
            state?.resetProgression();
          }
        },
        {
          rootMargin: "-200px 0px -50% 0px",
          threshold: 0
        }
      );

      observer.observe(target.value);
    });
  });
});

onBeforeUnmount(() => {
  isMounted = false;
  isActivationReady = false;

  if (activationFrame !== undefined) {
    cancelAnimationFrame(activationFrame);
  }

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
