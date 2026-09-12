import type { ComputedRef, Ref } from "vue";
import type { CourseCodeItem, CourseCodeStep } from "../types/course-code";
import { computed, ref, watch } from "vue";
import { courseCodeSnapshot, resolveCourseCodeSteps } from "../utils/course-code";
import { provideCourseCodeState } from "./useCourseCodeState";

export function useCourseCodeWorkspace(options: {
  currentPagePath: ComputedRef<string>;
  history: ComputedRef<CourseCodeStep[]>;
  steps: ComputedRef<CourseCodeStep[]>;
  inputValues: ComputedRef<Readonly<Record<string, string>>>;
  inputsReady: Ref<boolean>;
}) {
  const activeIndex = ref<number>();
  // Keep the source filename selected when an input renames the rendered file.
  const selectedPath = ref("");
  // Resolve tokens only when content or inputs change, never on scroll activation.
  const history = computed(() => resolveCourseCodeSteps(options.history.value, options.inputValues.value));
  const steps = computed(() => resolveCourseCodeSteps(options.steps.value, options.inputValues.value));
  const resolvedFiles = computed(() => options.inputsReady.value
    ? courseCodeSnapshot(history.value, steps.value, activeIndex.value)
    : []);
  const changedPaths = computed<ReadonlySet<string>>(() => new Set(
    steps.value.find((step) => step.index === activeIndex.value)?.files.map((file) => file.path) ?? []
  ));
  const items = computed<CourseCodeItem[]>(() => resolvedFiles.value.map((file) => ({
    label: file.path,
    file,
    icon: changedPaths.value.has(file.path) ? "i-lucide-file-pen-line" : file.icon
  })));
  const activePath = computed({
    get: () => {
      const baselinePath = options.history.value.at(-1)?.files.at(-1)?.path;
      return resolvedFiles.value.find((file) => file.sourcePath === (selectedPath.value || baselinePath))?.path
        ?? resolvedFiles.value.at(-1)?.path ?? "";
    },
    set: (path: string) => {
      const entry = resolvedFiles.value.find((file) => file.path === path);
      if (entry) selectedPath.value = entry.sourcePath;
    }
  });
  function resetProgression(): void {
    activeIndex.value = undefined;
    selectedPath.value = "";
  }
  provideCourseCodeState({
    inputsReady: options.inputsReady,
    activate(index) {
      if (!options.inputsReady.value) return;
      const step = options.steps.value.find((step) => step.index === index);
      if (!step) return;
      activeIndex.value = index;
      selectedPath.value = step.files.at(-1)?.path ?? selectedPath.value;
    },
    resetProgression
  });
  watch(options.currentPagePath, resetProgression, { flush: "sync" });
  return { activePath, changedPaths, items };
}
