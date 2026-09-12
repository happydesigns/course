<script setup lang="ts">
import type { CourseCodeFile, CourseCodeToken } from "../types/course-code";
import type { VNodeChild } from "vue";
import { defineComponent, h } from "vue";

const props = defineProps<{ file: CourseCodeFile }>();
function renderToken(token: CourseCodeToken): VNodeChild {
  if (typeof token === "string") return token;
  const { __ignoreMap, ...attributes } = token.props;
  return h(token.tag, attributes, token.children.map(renderToken));
}
const Tokens = defineComponent({
  setup: () => () => props.file.tokens.length
    ? props.file.tokens.map(renderToken)
    : h("code", props.file.code)
});
</script>

<template>
  <ProsePre v-bind="file.props" :filename="file.path" :code="file.code" :language="file.language">
    <Tokens />
  </ProsePre>
</template>
