<script setup lang="ts">
import type { CourseBackLink, CoursePage } from "../types/course";
import { computed } from "vue";
import CodeTreeIntersection from "./CodeTreeIntersection.vue";
import CourseCheckpoint from "./CourseCheckpoint.vue";
import { useCourseCodeWorkspace } from "../composables/useCourseCodeWorkspace";
import { useCourseInputs } from "../composables/useCourseInputs";
import { useCourseProgressController } from "../composables/useCourseProgressController";
import { useCourseReaderModel } from "../composables/useCourseReaderModel";
import { hasCourseCodeTree } from "../utils/course-content";

interface CourseMetadataConfig {
  dateLocale?: string;
  draftLabel?: string;
}

interface CourseCodeStageConfig {
  label?: string;
  emptyLabel?: string;
  minTreeWidth?: number;
  maxTreeWidth?: number;
  minCodeWidth?: number;
  defaultTreeWidth?: number;
}

interface CourseProgressConfig {
  storagePrefix?: string;
}

interface CourseNavigationConfig {
  breadcrumbs?: CourseBackLink;
}

const props = withDefaults(
  defineProps<{
    course: CoursePage;
    page?: CoursePage;
    lessons?: CoursePage[];
    courseKey?: string;
    back?: CourseBackLink;
  }>(),
  {
    courseKey: "course",
    lessons: () => []
  }
);

const { config, has } = useVariant("course");
const hasInputs = has("courseInputs");
const hasCodeStage = has("courseCodeStage");
const metadataConfig = computed(
  () => (config.value.courseMetadata ?? {}) as CourseMetadataConfig
);
const progressConfig = computed(
  () => (config.value.courseProgress ?? {}) as CourseProgressConfig
);
const navigationConfig = computed(
  () => (config.value.courseNavigation ?? {}) as CourseNavigationConfig
);
const codeStageConfig = computed(() => {
  const configured = (config.value.courseCodeStage ?? {}) as CourseCodeStageConfig;
  const fileTree = (config.value.courseFileTree ?? {}) as { expandAll?: boolean };

  return {
    label: configured.label ?? "Project files",
    emptyLabel: configured.emptyLabel ?? "Scroll to a code step to inspect the project.",
    minTreeWidth: configured.minTreeWidth ?? 220,
    maxTreeWidth: configured.maxTreeWidth ?? 520,
    minCodeWidth: configured.minCodeWidth ?? 360,
    defaultTreeWidth: configured.defaultTreeWidth ?? 288,
    expandAll: fileTree.expandAll ?? true
  };
});
const inputsEnabled = computed(() => {
  const enabled = (config.value.courseInputs as { enabled?: boolean } | undefined)?.enabled ?? true;
  return hasInputs.value && enabled;
});
const breadcrumbRoot = computed(() => props.back ?? navigationConfig.value.breadcrumbs);
const courseKey = computed(() => props.courseKey);
const courseInputs = useCourseInputs({
  course: () => props.course,
  courseKey,
  enabled: inputsEnabled
});
const {
  currentPage,
  orderedLessons,
  currentLessonIndex,
  isLesson,
  renderedPage,
  historyPages,
  breadcrumbItems,
  currentBreadcrumb,
  pageAnchorLinks,
  surround,
  contentSurround
} = useCourseReaderModel({
  course: () => props.course,
  page: () => props.page,
  lessons: () => props.lessons,
  inputValues: courseInputs.resolvedValues,
  breadcrumbRoot
});
const progress = useCourseProgressController({
  course: () => props.course,
  currentPage,
  orderedLessons,
  courseKey,
  storagePrefix: () => progressConfig.value.storagePrefix
});
const codeWorkspace = useCourseCodeWorkspace({
  currentPagePath: computed(() => currentPage.value.path),
  inputValues: courseInputs.resolvedValues,
  inputsReady: courseInputs.ready
});
const contentComponents = {
  "code-tree-intersection": CodeTreeIntersection,
  "course-checkpoint": CourseCheckpoint
};
const contentData = computed(() => ({ input: courseInputs.resolvedValues.value }));
const codeCollectionPages = computed(() => [
  ...historyPages.value,
  currentPage.value
]);
const hasPageCodeStage = computed(
  () => hasCodeStage.value && hasCourseCodeTree(renderedPage.value.body)
);
const codeTreeStorageKey = computed(() => `course:${props.courseKey}:code-tree-width`);
const contentPageUi = computed(() => ({
  root: hasPageCodeStage.value
    ? "lg:grid-cols-10 lg:gap-0 2xl:grid-cols-[clamp(48rem,50vw,56rem)_minmax(0,1fr)]"
    : "lg:grid-cols-10 lg:gap-0",
  center: hasPageCodeStage.value
    ? "min-w-0 px-4 sm:px-6 lg:col-span-5 lg:px-10 xl:px-12 2xl:col-span-1"
    : "mx-auto w-full max-w-5xl min-w-0 px-4 sm:px-6 lg:col-span-10 lg:px-8",
  right: "lg:col-span-5 lg:min-h-0 2xl:col-span-1"
}));
</script>

<template>
  <div :class="['min-h-screen overflow-x-clip', hasPageCodeStage && 'pb-24 lg:pb-0']">
    <UPage class="mx-auto w-full max-w-[120rem]" :ui="contentPageUi">
      <CourseReaderHeader
        :course="course"
        :page="renderedPage"
        :lessons="orderedLessons"
        :current-lesson-index="currentLessonIndex"
        :is-lesson="isLesson"
        :breadcrumb-items="breadcrumbItems"
        :current-breadcrumb="currentBreadcrumb"
        :page-anchor-links="pageAnchorLinks"
        :inputs="courseInputs.inputs.value"
        :input-values="courseInputs.values.value"
        :compact-navigation="hasPageCodeStage"
        :date-locale="metadataConfig.dateLocale"
        :draft-label="metadataConfig.draftLabel"
        @update-input="courseInputs.setInputValue"
      />

      <UPageBody>
        <CourseCodeHistory
          v-if="hasPageCodeStage"
          :pages="codeCollectionPages"
          :data="contentData"
        />

        <CourseProjectStage
          v-if="hasPageCodeStage"
          :model-value="codeWorkspace.activePath.value"
          :items="codeWorkspace.items.value"
          :config="codeStageConfig"
          :storage-key="codeTreeStorageKey"
          mobile
          @update:model-value="codeWorkspace.activePath.value = $event"
        />

        <ContentRenderer
          v-if="renderedPage.body"
          :value="renderedPage"
          :data="contentData"
          :components="contentComponents"
          :class="!isLesson ? 'w-full max-w-none' : undefined"
        />

        <CourseCurriculum v-if="!isLesson" :lessons="orderedLessons" />

        <div
          v-if="isLesson && !currentPage.checkpoints?.length"
          class="not-prose mt-10 flex justify-end border-t border-default pt-6"
        >
          <UButton
            :label="progress.isLessonComplete(currentPage.path)
              ? 'Exercise completed'
              : 'Mark exercise complete'"
            :icon="progress.isLessonComplete(currentPage.path)
              ? 'i-lucide-circle-check'
              : 'i-lucide-check'"
            :color="progress.isLessonComplete(currentPage.path) ? 'success' : 'primary'"
            :variant="progress.isLessonComplete(currentPage.path) ? 'soft' : 'solid'"
            @click="progress.setLessonComplete(
              currentPage.path,
              !progress.isLessonComplete(currentPage.path)
            )"
          />
        </div>

        <template v-if="surround.length">
          <USeparator class="my-8" />
          <UContentSurround :surround="contentSurround" />
        </template>
      </UPageBody>

      <template v-if="hasPageCodeStage" #right>
        <CourseProjectStage
          :model-value="codeWorkspace.activePath.value"
          :items="codeWorkspace.items.value"
          :config="codeStageConfig"
          :storage-key="codeTreeStorageKey"
          @update:model-value="codeWorkspace.activePath.value = $event"
        />
      </template>
    </UPage>
  </div>
</template>
