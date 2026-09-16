<script setup lang="ts">
import type { CourseBackLink, CourseLink, CoursePage } from "../types/course";
import { computed } from "vue";
import CodeTreeIntersection from "./CodeTreeIntersection.vue";
import CourseVariant from "./CourseVariant.vue";
import { provideCourseInputValues } from "../composables/useCourseInputState";
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
  nextCoursesTitle?: string;
  nextCourseLabel?: string;
  nextCourseLinkLabel?: string;
}

const props = withDefaults(
  defineProps<{
    course: CoursePage;
    page?: CoursePage;
    lessons?: CoursePage[];
    nextCourses?: CourseLink[];
    courseKey?: string;
    back?: CourseBackLink;
  }>(),
  {
    lessons: () => [],
    nextCourses: () => []
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
const courseKey = computed(() => props.courseKey ?? props.course.courseId ?? props.course.path);
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
  isCourseExit,
  renderedPage,
  codeHistory,
  codeSteps,
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
  history: codeHistory,
  steps: codeSteps,
  inputValues: courseInputs.resolvedValues,
  inputsReady: courseInputs.ready
});
provideCourseInputValues(courseInputs.resolvedValues);
const contentComponents = {
  "course-variant": CourseVariant,
  "code-tree-intersection": CodeTreeIntersection,
  "course-checkpoint": CourseCheckpoint
};
const contentData = computed(() => ({ input: courseInputs.resolvedValues.value }));
const hasPageCodeStage = computed(
  () => hasCodeStage.value && hasCourseCodeTree(renderedPage.value.nodes)
);
const codeTreeStorageKey = computed(() => `course:${courseKey.value}:code-tree-width`);
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
  <div
    :class="['course-reader min-h-screen overflow-x-clip', hasPageCodeStage && 'pb-24 lg:pb-0']"
  >
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
        :date-locale="metadataConfig.dateLocale"
        :draft-label="metadataConfig.draftLabel"
        @update-input="courseInputs.setInputValue"
      />

      <UPageBody>
        <CourseProjectStage
          v-if="hasPageCodeStage"
          :model-value="codeWorkspace.activePath.value"
          :items="codeWorkspace.items.value"
          :config="codeStageConfig"
          :storage-key="codeTreeStorageKey"
          mobile
          @update:model-value="codeWorkspace.activePath.value = $event"
        />

        <slot name="body" :page="renderedPage" :data="contentData" :components="contentComponents">
          <MarkdownDocument
            v-if="renderedPage.nodes"
            :key="renderedPage.path"
            :value="{ nodes: renderedPage.nodes }"
            :data="contentData"
            :components="contentComponents"
            :class="!isLesson ? 'w-full max-w-none' : undefined"
          />
        </slot>

        <CourseCurriculum v-if="!isLesson" :lessons="orderedLessons" />

        <div
          v-if="isLesson && !currentPage.checkpoints?.length"
          class="not-prose mt-10 flex justify-end border-t border-default pt-6"
        >
          <UButton
            :label="progress.isLessonComplete(currentPage.path)
              ? 'Step completed'
              : 'Mark step complete'"
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
        <CourseNextCourses
          v-if="isCourseExit"
          :courses="nextCourses"
          :title="navigationConfig.nextCoursesTitle"
          :course-label="navigationConfig.nextCourseLabel"
          :link-label="navigationConfig.nextCourseLinkLabel"
        />
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
