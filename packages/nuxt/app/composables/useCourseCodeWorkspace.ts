import type { ComputedRef, Ref, VNode } from "vue";
import { computed, nextTick, ref, shallowRef, watch } from "vue";
import { interpolateCourseCodeVNode } from "../utils/course-code";
import { interpolateCourseInputPlaceholders } from "../utils/course-inputs";
import {
  provideCourseCodeState,
  type CourseCodeItem,
  type CourseCodeSource
} from "./useCourseCodeState";

export interface CourseCodeWorkspace {
  activePath: Ref<string>;
  changedPaths: Ref<ReadonlySet<string>>;
  items: ComputedRef<CourseCodeItem[]>;
  tree: Ref<Record<string, VNode>>;
}

export interface CourseCodeSourceEntry<T> {
  items: readonly T[];
  progressive: boolean;
  source: CourseCodeSource;
}

export function selectCourseCodeSources<T>(
  sources: readonly CourseCodeSourceEntry<T>[],
  activeProgressiveSource: CourseCodeSource | undefined
): T[] {
  const hasActiveSource = activeProgressiveSource !== undefined
    && sources.some(
      (entry) => entry.progressive && entry.source === activeProgressiveSource
    );
  let passedActiveSource = false;

  return sources.flatMap((entry) => {
    if (!entry.progressive) {
      return [...entry.items];
    }

    if (!hasActiveSource || passedActiveSource) {
      return [];
    }

    if (entry.source === activeProgressiveSource) {
      passedActiveSource = true;
    }

    return [...entry.items];
  });
}

export function useCourseCodeWorkspace(options: {
  currentPagePath: ComputedRef<string>;
  inputValues: ComputedRef<Readonly<Record<string, string>>>;
  inputsReady: Ref<boolean>;
}): CourseCodeWorkspace {
  const tree = shallowRef<Record<string, VNode>>({});
  const sources = new Map<CourseCodeSource, readonly CourseCodeItem[]>();
  const renderedSources = new Map<CourseCodeSource, readonly CourseCodeItem[]>();
  const progressiveSources = new Set<CourseCodeSource>();
  let activeProgressiveSource: CourseCodeSource | undefined;
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

  function rebuildTree(): CourseCodeItem[] {
    const selectedItems = selectCourseCodeSources(
      [...renderedSources].map(([source, sourceItems]) => ({
        source,
        items: sourceItems,
        progressive: progressiveSources.has(source)
      })),
      activeProgressiveSource
    );
    tree.value = Object.fromEntries(
      selectedItems.map((item) => [item.label, item.component])
    );
    return selectedItems;
  }

  function selectBaseline(items: readonly CourseCodeItem[]): void {
    activePath.value = items.at(-1)?.label ?? "";
    changedPaths.value = new Set();
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
    progressiveSources.clear();
    activeProgressiveSource = undefined;
    tree.value = {};
    activePath.value = "";
    changedPaths.value = new Set();
  }

  provideCourseCodeState({
    activePath,
    changedPaths,
    contentRevision,
    inputValues: options.inputValues,
    inputsReady: options.inputsReady,
    tree,
    activate(source, fallbackItems) {
      if (!sources.has(source)) {
        sources.set(source, fallbackItems);
        renderedSources.set(source, renderItems(fallbackItems));
        progressiveSources.add(source);
      }

      activeProgressiveSource = source;
      rebuildTree();

      const renderedItems = renderedSources.get(source) ?? [];
      changedPaths.value = new Set(renderedItems.map((item) => item.label));
      activePath.value = renderedItems.at(-1)?.label ?? activePath.value;
    },
    resetProgression() {
      activeProgressiveSource = undefined;
      selectBaseline(rebuildTree());
    },
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
      if (registerOptions?.progressive) {
        progressiveSources.add(source);
      } else {
        progressiveSources.delete(source);
      }

      if (registerOptions?.activate && registerOptions.progressive) {
        activeProgressiveSource = source;
      }

      const selectedItems = rebuildTree();
      applyRenamedPaths(renamedPaths);

      if (
        !registerOptions?.progressive
        && activeProgressiveSource === undefined
        && progressiveSources.size === 0
      ) {
        selectBaseline(selectedItems);
      }

      if (registerOptions?.activate !== false) {
        changedPaths.value = new Set(renderedItems.map((item) => item.label));
        activePath.value = renderedItems.at(-1)?.label ?? activePath.value;
      }
    },
    unregister(source) {
      sources.delete(source);
      renderedSources.delete(source);
      progressiveSources.delete(source);

      if (activeProgressiveSource === source) {
        activeProgressiveSource = undefined;
        selectBaseline(rebuildTree());
      } else {
        rebuildTree();
      }
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
