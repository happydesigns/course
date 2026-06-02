<script setup lang="ts">
import type { Ref, VNode } from "vue";
import { computed, inject, onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps<{
  default?: boolean;
}>();

const slots = defineSlots();
const target = ref<HTMLElement | null>(null);
const tree = inject<Ref<Record<string, VNode>>>("tree", ref({}));
const activePath = inject<Ref<string>>("activePath", ref(""));
let observer: IntersectionObserver | undefined;

interface CodeTreeItem {
  label: string;
  icon?: string;
  component: VNode;
}

const children = computed(() => slots.default?.().map(transformSlot).filter(isCodeTreeItem) ?? []);

function findCodeBlock(slot: VNode): VNode | undefined {
  const props = slot.props ?? {};

  if (props.filename || props.label) {
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

function transformSlot(slot: unknown, index: number): CodeTreeItem | undefined {
  if (!isVNode(slot)) {
    return undefined;
  }

  if (typeof slot.type === "symbol" && Array.isArray(slot.children)) {
    return slot.children.map((child, childIndex) => transformSlot(child, childIndex)).find(isCodeTreeItem);
  }

  const codeBlock = findCodeBlock(slot);

  if (!codeBlock) {
    return undefined;
  }

  return {
    label: String(codeBlock.props?.filename ?? codeBlock.props?.label ?? index),
    icon: typeof codeBlock.props?.icon === "string" ? codeBlock.props.icon : undefined,
    component: codeBlock
  };
}

function addToTree(): void {
  for (const child of children.value) {
    tree.value[child.label] = child.component;
    activePath.value = child.label;
  }
}

onMounted(() => {
  if (props.default) {
    addToTree();
    return;
  }

  const rect = target.value?.getBoundingClientRect();

  if (rect && rect.top < window.innerHeight * 0.5) {
    addToTree();
  }

  if (!target.value) {
    return;
  }

  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        addToTree();
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
  observer?.disconnect();
});

function isSlotChildren(value: unknown): value is { default: () => VNode[] } {
  return typeof value === "object" && value !== null && "default" in value;
}

function isVNode(value: unknown): value is VNode {
  return typeof value === "object" && value !== null && "type" in value;
}

function isCodeTreeItem(value: unknown): value is CodeTreeItem {
  return typeof value === "object" && value !== null && "label" in value && "component" in value;
}
</script>

<template>
  <div v-if="!props.default" ref="target">
    <slot />
  </div>
</template>
