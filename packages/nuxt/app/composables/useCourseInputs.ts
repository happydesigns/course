import type { ComputedRef, MaybeRefOrGetter, Ref } from "vue";
import type { CourseInput, CoursePage } from "../types/course";
import { computed, onMounted, ref, toValue, watch } from "vue";
import { createCourseInputValues } from "../utils/course-inputs";
import { useCourseStorage } from "./useCourseStorage";

export interface CourseInputsController {
  inputs: ComputedRef<CourseInput[]>;
  values: Ref<Record<string, string>>;
  resolvedValues: ComputedRef<Readonly<Record<string, string>>>;
  ready: Ref<boolean>;
  inputValue: (input: CourseInput) => string;
  setInputValue: (input: CourseInput, value: string | number) => void;
}

export function useCourseInputs(options: {
  course: MaybeRefOrGetter<CoursePage>;
  courseKey: MaybeRefOrGetter<string>;
  enabled: MaybeRefOrGetter<boolean>;
}): CourseInputsController {
  const storage = useCourseStorage();
  const values = ref<Record<string, string>>({});
  const ready = ref(false);
  const inputs = computed(() => toValue(options.enabled) ? (toValue(options.course).inputs ?? []) : []);
  const resolvedValues = computed(() => createCourseInputValues(inputs.value, values.value));

  function storageKey(input: CourseInput): string {
    return `course:${toValue(options.courseKey)}:input:${input.id}`;
  }

  function restore(): void {
    values.value = Object.fromEntries(
      inputs.value.map((input) => [
        input.id,
        storage.getItem(storageKey(input)) ?? input.defaultValue ?? ""
      ])
    );
    ready.value = true;
  }

  function inputValue(input: CourseInput): string {
    return values.value[input.id] ?? input.defaultValue ?? "";
  }

  function setInputValue(input: CourseInput, value: string | number): void {
    const normalizedValue = String(value);

    if (values.value[input.id] === normalizedValue) {
      return;
    }

    values.value = { ...values.value, [input.id]: normalizedValue };
    storage.setItem(storageKey(input), normalizedValue);
  }

  onMounted(restore);
  watch(
    [() => toValue(options.courseKey), inputs],
    () => {
      if (ready.value) {
        restore();
      }
    }
  );

  return { inputs, values, resolvedValues, ready, inputValue, setInputValue };
}
