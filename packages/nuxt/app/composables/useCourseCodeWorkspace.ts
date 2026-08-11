import type { ComputedRef, Ref, VNode } from "vue";
import { computed, nextTick, ref, shallowRef, watch } from "vue";
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

  function rebuildTree(): void {
    tree.value = Object.fromEntries(
      [...sources.values()]
        .flatMap((sourceItems) => sourceItems)
        .map((item) => [item.label, item.component])
    );
  }

  function reset(): void {
    sources.clear();
    tree.value = {};
    activePath.value = "";
    changedPaths.value = new Set();
  }

  provideCourseCodeState({
    activePath,
    changedPaths,
    contentRevision,
    inputsReady: options.inputsReady,
    inputValues: options.inputValues,
    tree,
    register(source, newItems, registerOptions) {
      const previousItems = sources.get(source) ?? [];
      const renamedPaths = new Map(
        previousItems.flatMap((item, index) => {
          const replacement = newItems[index];
          return replacement ? [[item.label, replacement.label] as const] : [];
        })
      );

      sources.set(source, newItems);
      rebuildTree();
      activePath.value = renamedPaths.get(activePath.value) ?? activePath.value;
      changedPaths.value = new Set(
        [...changedPaths.value].map((path) => renamedPaths.get(path) ?? path)
      );

      if (registerOptions?.activate !== false) {
        changedPaths.value = new Set(newItems.map((item) => item.label));
        activePath.value = newItems.at(-1)?.label ?? activePath.value;
      }
    },
    unregister(source) {
      sources.delete(source);
      rebuildTree();
    }
  });

  watch(
    [options.inputValues, options.inputsReady],
    () => {
      contentRevision.value += 1;
    },
    { flush: "post" }
  );
  watch(options.currentPagePath, async () => {
    reset();
    await nextTick();
    contentRevision.value += 1;
  });

  return { activePath, changedPaths, items, tree };
}
