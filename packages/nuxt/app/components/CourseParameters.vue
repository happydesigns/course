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
const fixedInputs = computed(() => props.inputs.filter(input => input.fixedValue !== undefined));
const editableInputs = computed(() => props.inputs.filter(input => input.fixedValue === undefined));
const summary = computed(() =>
  editableInputs.value
    .map((input) => `${input.label}: ${courseInputOptions(input).find((item) => item.value === fieldValue(input))?.label ?? (fieldValue(input) || input.defaultValue || "—")}`)
    .join(" · ")
);
function fieldValue(input: CourseInput): string {
  if (input.fixedValue !== undefined) return input.fixedValue;
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
  <div class="space-y-3">
    <dl v-if="fixedInputs.length" class="flex flex-wrap gap-x-6 gap-y-2 rounded-lg bg-elevated/30 px-4 py-3">
      <div v-for="input in fixedInputs" :key="input.id" :data-course-fixed="input.id">
        <dt class="text-xs text-muted">{{ input.label }}</dt>
        <dd class="text-sm font-medium text-highlighted">{{ courseInputOptions(input).find(item => item.value === input.fixedValue)?.label ?? input.fixedValue }}</dd>
        <dd v-if="input.description" class="text-xs text-muted">{{ input.description }}</dd>
      </div>
    </dl>
    <UCollapsible v-if="editableInputs.length" v-model:open="open" class="rounded-lg bg-elevated/30 p-2">
      <UButton
        :label="open ? `Course parameters (${editableInputs.length})` : `Course parameters · ${summary}`"
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
              v-for="input in editableInputs"
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
  </div>
</template>
