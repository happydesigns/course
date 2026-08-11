import type { ComputedRef, Ref, VNode } from "vue";
import { computed, nextTick, ref, shallowRef, watch } from "vue";
import { interpolateCourseCodeVNode } from "../utils/course-code";
import { interpolateCourseInputPlaceholders } from "../utils/course-inputs";
import { provideCourseCodeState, type CourseCodeItem } from "./useCourseCodeState";

export interface CourseCodeWorkspace {
  activePath: Ref<string>;
  changedPaths: Ref<ReadonlySet<string>>;
  items: ComputedRef<CourseCodeItem[]>;
  tree: Ref<Record<string, VNode>>;
}

export function useCourseCodeWorkspace(options: {
  currentPagePath: ComputedRef<string>;
  inputValues: ComputedRef<Readonly<Record<string, string>>>;
  inputsReady: Ref<boolean>;
}): CourseCodeWorkspace {
  const tree = shallowRef<Record<string, VNode>>({});
  const sources = new Map<symbol, readonly CourseCodeItem[]>();
  const renderedSources = new Map<symbol, readonly CourseCodeItem[]>();
  const activePath = ref("");
  const changedPaths = ref<ReadonlySet<string>>(new Set());
  const contentRevision = ref(0);
  const items = computed<CourseCodeItem[]>(() =>
    Object.entries(tree.value).map(([label, component]) => ({
      label,
      component,
      icon: changedPaths.value.has(label) ? "i-lucide-file-pen-line" : undefined
    }))
  );

  function renderItems(sourceItems: readonly CourseCodeItem[]): CourseCodeItem[] {
    return sourceItems.map((item) => ({
      ...item,
      label: interpolateCourseInputPlaceholders(item.label, options.inputValues.value),
      component: interpolateCourseCodeVNode(item.component, options.inputValues.value)
    }));
  }

  function rebuildTree(): void {
    tree.value = Object.fromEntries(
      [...renderedSources.values()]
        .flatMap((sourceItems) => sourceItems)
        .map((item) => [item.label, item.component])
    );
  }

  function applyRenamedPaths(renamedPaths: ReadonlyMap<string, string>): void {
    activePath.value = renamedPaths.get(activePath.value) ?? activePath.value;
    changedPaths.value = new Set(
      [...changedPaths.value].map((path) => renamedPaths.get(path) ?? path)
    );
  }

  function refreshRenderedSources(): void {
    const renamedPaths = new Map<string, string>();

    for (const [source, sourceItems] of sources) {
      const previousItems = renderedSources.get(source) ?? [];
      const nextItems = renderItems(sourceItems);

      previousItems.forEach((item, index) => {
        const replacement = nextItems[index];
        if (replacement) {
          renamedPaths.set(item.label, replacement.label);
        }
      });

      renderedSources.set(source, nextItems);
    }

    rebuildTree();
    applyRenamedPaths(renamedPaths);
  }

  function reset(): void {
    sources.clear();
    renderedSources.clear();
    tree.value = {};
    activePath.value = "";
    changedPaths.value = new Set();
  }

  provideCourseCodeState({
    activePath,
    changedPaths,
    contentRevision,
    inputsReady: options.inputsReady,
    tree,
    register(source, newItems, registerOptions) {
      const previousItems = renderedSources.get(source) ?? [];
      const renderedItems = renderItems(newItems);
      const renamedPaths = new Map(
        previousItems.flatMap((item, index) => {
          const replacement = renderedItems[index];
          return replacement ? [[item.label, replacement.label] as const] : [];
        })
      );

      sources.set(source, newItems);
      renderedSources.set(source, renderedItems);
      rebuildTree();
      applyRenamedPaths(renamedPaths);

      if (registerOptions?.activate !== false) {
        changedPaths.value = new Set(renderedItems.map((item) => item.label));
        activePath.value = renderedItems.at(-1)?.label ?? activePath.value;
      }
    },
    unregister(source) {
      sources.delete(source);
      renderedSources.delete(source);
      rebuildTree();
    }
  });

  // Let the input and ContentRenderer finish their shared update before the
  // code tree swaps its derived VNodes. A synchronous swap can make the tree
  // briefly clear its model while Vue is still patching the previous item.
  watch(options.inputValues, refreshRenderedSources, { flush: "post" });
  watch(options.inputsReady, () => {
    contentRevision.value += 1;
  }, { flush: "post" });
  watch(options.currentPagePath, async () => {
    reset();
    await nextTick();
    contentRevision.value += 1;
  });

  return { activePath, changedPaths, items, tree };
}
