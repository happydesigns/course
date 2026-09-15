<script setup lang="ts">
import type { CourseInput } from "../types/course";
import { courseInputOptions, createCourseInputValueSchema } from "@happydesigns/course";
import { computed, ref } from "vue";

const props = defineProps<{
  inputs: CourseInput[];
  values: Readonly<Record<string, string>>;
  defaultOpen?: boolean;
}>();

const emit = defineEmits<{
  update: [input: CourseInput, value: string | number];
}>();

const open = ref(props.defaultOpen ?? false);
const summary = computed(() =>
  props.inputs
    .map((input) => `${input.label}: ${courseInputOptions(input).find((item) => item.value === fieldValue(input))?.label ?? (fieldValue(input) || input.defaultValue || "—")}`)
    .join(" · ")
);
function fieldValue(input: CourseInput): string {
  const value = props.values[input.id] ?? "";
  if (input.options && !input.allowCustom) {
    return createCourseInputValueSchema(input).safeParse(value).success ? value : input.defaultValue ?? "";
  }
  return value;
}

function fieldError(input: CourseInput): string | undefined {
  const value = props.values[input.id];
  if (!value || (input.options && !input.allowCustom)) return undefined;
  const result = createCourseInputValueSchema(input).safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
}
</script>

<template>
  <UCollapsible v-model:open="open" class="rounded-lg bg-elevated/30 p-2">
    <UButton
      :label="open ? `Course parameters (${inputs.length})` : `Course parameters · ${summary}`"
      icon="i-lucide-sliders-horizontal"
      :trailing-icon="open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
      color="neutral"
      variant="ghost"
      class="w-full justify-between"
      :ui="{ label: 'flex-1 text-left' }"
    />

    <template #content>
      <fieldset class="px-2 pt-4 pb-2">
        <legend class="sr-only">Course parameters</legend>
        <div class="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <UFormField
            v-for="input in inputs"
            :key="input.id"
            :label="input.label"
            :help="input.description"
            :error="fieldError(input)"
            size="md"
          >
            <USelect
              v-if="input.options && !input.allowCustom"
              :aria-label="input.label"
              :items="courseInputOptions(input)"
              :model-value="fieldValue(input)"
              :placeholder="input.placeholder ?? input.defaultValue"
              class="w-full"
              @update:model-value="(value) => emit('update', input, value)"
            />
            <UInputMenu
              v-else-if="input.options"
              mode="autocomplete"
              :aria-label="input.label"
              :items="courseInputOptions(input)"
              value-key="value"
              :model-value="fieldValue(input)"
              :placeholder="input.placeholder ?? input.defaultValue"
              :minlength="input.minLength"
              :maxlength="input.maxLength"
              :pattern="input.pattern"
              autocomplete="off"
              class="w-full"
              @update:model-value="(value) => emit('update', input, value)"
            />
            <UInput
              v-else
              :aria-label="input.label"
              :model-value="values[input.id] ?? ''"
              :placeholder="input.placeholder ?? input.defaultValue"
              :minlength="input.minLength"
              :maxlength="input.maxLength"
              :pattern="input.pattern"
              autocomplete="off"
              class="w-full"
              @update:model-value="(value) => emit('update', input, value)"
            />
          </UFormField>
        </div>
      </fieldset>
    </template>
  </UCollapsible>
</template>
