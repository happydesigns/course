<script setup lang="ts">
import type { CourseInput } from "../types/course";
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
  props.inputs.map((input) => `${input.label}: ${props.values[input.id] ?? ""}`).join(" · ")
);
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
            :description="input.description"
            size="md"
          >
            <UInput
              :model-value="values[input.id] ?? input.defaultValue ?? ''"
              :placeholder="input.placeholder"
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
