<script setup lang="ts">
import type { Component } from "vue";
import type { Node } from "comark";
import type { CoursePage } from "@happydesigns/course-nuxt/types";
import { MarkdownDocument } from "@comark/vue";
import {
  ProseA, ProseBlockquote, ProseCode, ProseH1, ProseH2, ProseH3,
  ProseHr, ProseLi, ProseOl, ProseP, ProsePre, ProseStrong, ProseUl,
  ProseCallout
} from "#components";

defineProps<{
  page: CoursePage;
  data: Record<string, unknown>;
  components: Record<string, Component>;
}>();

const prose = {
  a: ProseA, blockquote: ProseBlockquote, code: ProseCode,
  h1: ProseH1, h2: ProseH2, h3: ProseH3, hr: ProseHr,
  li: ProseLi, ol: ProseOl, p: ProseP, pre: ProsePre,
  strong: ProseStrong, ul: ProseUl, callout: ProseCallout
};
</script>

<template>
  <MarkdownDocument
    :key="page.path"
    :value="{ nodes: page.body.value as Node[] }"
    :data="data"
    :components="{ ...prose, ...components }"
  />
</template>
