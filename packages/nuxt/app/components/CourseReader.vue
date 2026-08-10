<script setup lang="ts">
import type { VNode } from "vue";
import type { CourseBackLink, CourseInput, CoursePage, CourseProgressData } from "../types/course";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import CodeTreeIntersection from "./CodeTreeIntersection.vue";
import CourseCheckpoint from "./CourseCheckpoint.vue";
import { provideCourseCodeState, type CourseCodeItem } from "../composables/useCourseCodeState";
import {
  courseProgressStorageKey,
  createEmptyCourseProgress,
  parseCourseProgress,
  provideCourseProgress,
  useCourseProgressMetrics
} from "../composables/useCourseProgress";
import {
  createCourseInputValues,
  interpolateCourseInputPlaceholders
} from "../utils/course-inputs";
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
const tree = shallowRef<Record<string, VNode>>({});
const codeSources = new Map<symbol, readonly CourseCodeItem[]>();
const activePath = ref("");
const changedPaths = ref<ReadonlySet<string>>(new Set());
const contentRevision = ref(0);
const inputValues = ref<Record<string, string>>({});
const inputsReady = ref(false);
const progressData = ref<CourseProgressData>(createEmptyCourseProgress());
const progressReady = ref(false);
const parametersOpen = ref((props.page ?? props.course).pageType === "lesson");
const mobileProjectOpen = ref(false);
const mobileNavigationOpen = ref(false);
const desktopNavigationOpen = ref(false);
let desktopNavigationCloseTimer: ReturnType<typeof setTimeout> | undefined;
const contentComponents = {
  "code-tree-intersection": CodeTreeIntersection,
  "course-checkpoint": CourseCheckpoint
};

const hasInputs = has("courseInputs");
const hasCodeStage = has("courseCodeStage");
const currentPage = computed(() => props.page ?? props.course);
const orderedLessons = computed(() =>
  [...props.lessons].sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
);
const currentLessonIndex = computed(() =>
  orderedLessons.value.findIndex((lesson) => lesson.path === currentPage.value.path)
);
const isLesson = computed(() => currentPage.value.pageType === "lesson");
const currentLessonPath = computed(() =>
  isLesson.value ? currentPage.value.path : undefined
);
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
const courseInputs = computed<CourseInput[]>(() => {
  const enabled = (config.value.courseInputs as { enabled?: boolean } | undefined)?.enabled ?? true;
  return hasInputs.value && enabled ? (props.course.inputs ?? []) : [];
});
const resolvedInputValues = computed(() =>
  createCourseInputValues(courseInputs.value, inputValues.value)
);
const contentData = computed(() => ({ input: resolvedInputValues.value }));
const renderedPage = computed<CoursePage>(() => ({
  ...currentPage.value,
  title: interpolateCourseInputPlaceholders(currentPage.value.title, resolvedInputValues.value),
  description: interpolateCourseInputPlaceholders(
    currentPage.value.description,
    resolvedInputValues.value
  ),
  body: interpolateCourseInputPlaceholders(currentPage.value.body, resolvedInputValues.value)
}));
const breadcrumbRoot = computed(() => props.back ?? navigationConfig.value.breadcrumbs);
const breadcrumbItems = computed(() => {
  const items = breadcrumbRoot.value
    ? [{
        label: breadcrumbRoot.value.label,
        to: breadcrumbRoot.value.to,
        icon: breadcrumbRoot.value.icon
      }]
    : [];

  if (isLesson.value) {
    items.push({ label: props.course.title, to: props.course.path, icon: undefined });
  }

  return items;
});
const currentBreadcrumb = computed(() => ({
  label: renderedPage.value.title,
  to: renderedPage.value.path
}));
const renderedHistoryPages = computed<CoursePage[]>(() =>
  orderedLessons.value
    .slice(0, Math.max(0, currentLessonIndex.value))
    .map((page) => ({
      ...page,
      body: interpolateCourseInputPlaceholders(page.body, resolvedInputValues.value)
    }))
);
const tocLinks = computed(() => renderedPage.value.body?.toc?.links ?? []);
const navigationTocLinks = computed(() =>
  isLesson.value && tocLinks.value.length >= 2 ? tocLinks.value : []
);
const pageAnchorLinks = computed(() =>
  navigationTocLinks.value.map((link, index) => ({
    label: link.text,
    to: `#${link.id}`,
    step: index + 1
  }))
);
const hasPageCodeStage = computed(
  () => hasCodeStage.value && hasCourseCodeTree(renderedPage.value.body)
);
const items = computed<CourseCodeItem[]>(() =>
  Object.entries(tree.value).map(([label, component]) => ({
    label,
    component,
    icon: changedPaths.value.has(label) ? "i-lucide-file-pen-line" : undefined
  }))
);
const codeTreeStorageKey = computed(() => `course:${props.courseKey}:code-tree-width`);
const progressStorageKey = computed(() =>
  courseProgressStorageKey(
    props.course.courseId ?? props.courseKey,
    progressConfig.value.storagePrefix
  )
);
const { requiredLessons, completedRequiredCount, percent } = useCourseProgressMetrics(
  progressData,
  orderedLessons
);
const parameterSummary = computed(() =>
  courseInputs.value
    .map((input) => `${input.label}: ${resolvedInputValues.value[input.id] ?? ""}`)
    .join(" · ")
);
const coursePositionLabel = computed(() =>
  isLesson.value && currentLessonIndex.value >= 0
    ? `${currentLessonIndex.value + 1} / ${orderedLessons.value.length}`
    : "Overview"
);
const courseOutlineAriaLabel = computed(() =>
  isLesson.value && currentLessonIndex.value >= 0
    ? `Course outline, exercise ${currentLessonIndex.value + 1} of ${orderedLessons.value.length}`
    : "Course outline, overview"
);
const surround = computed(() => {
  const firstLesson = orderedLessons.value[0];

  if (!isLesson.value) {
    return firstLesson
      ? [
          null,
          {
            title: firstLesson.title,
            description: interpolateCourseInputPlaceholders(
              firstLesson.description,
              resolvedInputValues.value
            ),
            path: firstLesson.path
          }
        ] as unknown as Array<{ title: string; description?: string; path: string }>
      : [];
  }

  if (currentLessonIndex.value < 0) {
    return [];
  }

  const previousLesson = orderedLessons.value[currentLessonIndex.value - 1];
  const next = orderedLessons.value[currentLessonIndex.value + 1];
  return [
    previousLesson
      ? {
          title: previousLesson.title,
          description: interpolateCourseInputPlaceholders(
            previousLesson.description,
            resolvedInputValues.value
          ),
          path: previousLesson.path
        }
      : {
          title: "Course overview",
          description: interpolateCourseInputPlaceholders(
            props.course.description,
            resolvedInputValues.value
          ),
          path: props.course.path
        },
    next
      ? {
          title: next.title,
          description: interpolateCourseInputPlaceholders(
            next.description,
            resolvedInputValues.value
          ),
          path: next.path
        }
      : null
  ] as unknown as Array<{ title: string; description?: string; path: string }>;
});
const contentPageUi = computed(() => {
  return {
    root: hasPageCodeStage.value
      ? "lg:grid-cols-10 lg:gap-0 2xl:grid-cols-[clamp(48rem,50vw,56rem)_minmax(0,1fr)]"
      : "lg:grid-cols-10 lg:gap-0",
    center: hasPageCodeStage.value
      ? "min-w-0 px-4 sm:px-6 lg:col-span-5 lg:px-0 lg:pe-8 lg:ps-10 xl:ps-20 2xl:col-span-1"
      : "mx-auto w-full max-w-5xl min-w-0 px-4 sm:px-6 lg:col-span-10 lg:px-8",
    right: "lg:col-span-5 lg:min-h-0 2xl:col-span-1"
  };
});

function rebuildCodeTree(): void {
  tree.value = Object.fromEntries(
    [...codeSources.values()]
      .flatMap((sourceItems) => sourceItems)
      .map((item) => [item.label, item.component])
  );
}

provideCourseCodeState({
  activePath,
  changedPaths,
  contentRevision,
  inputsReady,
  inputValues: resolvedInputValues,
  tree,
  register(source, newItems, options) {
    const previousItems = codeSources.get(source) ?? [];
    const renamedPaths = new Map(
      previousItems.flatMap((item, index) => {
        const replacement = newItems[index];
        return replacement ? [[item.label, replacement.label] as const] : [];
      })
    );

    codeSources.set(source, newItems);
    rebuildCodeTree();

    activePath.value = renamedPaths.get(activePath.value) ?? activePath.value;
    changedPaths.value = new Set(
      [...changedPaths.value].map((path) => renamedPaths.get(path) ?? path)
    );

    if (options?.activate !== false) {
      changedPaths.value = new Set(newItems.map((item) => item.label));
      activePath.value = newItems.at(-1)?.label ?? activePath.value;
    }
  },
  unregister(source) {
    codeSources.delete(source);
    rebuildCodeTree();
  }
});

provideCourseProgress({
  data: progressData,
  ready: progressReady,
  currentLessonPath,
  requiredLessons,
  completedRequiredCount,
  percent,
  isLessonComplete,
  isCheckpointComplete,
  setCheckpointComplete,
  setLessonComplete,
  visitLesson
});

function inputStorageKey(input: CourseInput): string {
  return `course:${props.courseKey}:input:${input.id}`;
}

function inputValue(input: CourseInput): string {
  return inputValues.value[input.id] ?? input.defaultValue ?? "";
}

function setInputValue(input: CourseInput, value: string | number): void {
  const normalizedValue = String(value);

  if (inputValues.value[input.id] === normalizedValue) {
    return;
  }

  inputValues.value = { ...inputValues.value, [input.id]: normalizedValue };
  contentRevision.value += 1;
  localStorage.setItem(inputStorageKey(input), normalizedValue);
}

function restoreInputValues(): void {
  inputValues.value = Object.fromEntries(
    courseInputs.value.map((input) => [
      input.id,
      localStorage.getItem(inputStorageKey(input)) ?? input.defaultValue ?? ""
    ])
  );
  inputsReady.value = true;
  contentRevision.value += 1;
}

function restoreProgress(): void {
  progressData.value = parseCourseProgress(localStorage.getItem(progressStorageKey.value));
  progressReady.value = true;

  if (currentLessonPath.value) {
    visitLesson(currentLessonPath.value);
    reconcileLessonCompletion(currentPage.value);
  }
}

function persistProgress(): void {
  if (progressReady.value) {
    localStorage.setItem(progressStorageKey.value, JSON.stringify(progressData.value));
  }
}

function isLessonComplete(path: string): boolean {
  return progressData.value.completedLessons.includes(path);
}

function isCheckpointComplete(lessonPath: string, checkpointId: string): boolean {
  return progressData.value.completedCheckpoints[lessonPath]?.includes(checkpointId) ?? false;
}

function setCheckpointComplete(lessonPath: string, checkpointId: string, complete: boolean): void {
  const checkpoints = new Set(progressData.value.completedCheckpoints[lessonPath] ?? []);

  if (complete) {
    checkpoints.add(checkpointId);
  } else {
    checkpoints.delete(checkpointId);
  }

  progressData.value = {
    ...progressData.value,
    completedCheckpoints: {
      ...progressData.value.completedCheckpoints,
      [lessonPath]: [...checkpoints]
    }
  };

  if (currentPage.value.path === lessonPath) {
    reconcileLessonCompletion(currentPage.value);
  }

  persistProgress();
}

function setLessonComplete(path: string, complete: boolean): void {
  const completedLessons = new Set(progressData.value.completedLessons);

  if (complete) {
    completedLessons.add(path);
  } else {
    completedLessons.delete(path);
  }

  progressData.value = {
    ...progressData.value,
    completedLessons: [...completedLessons]
  };
  persistProgress();
}

function reconcileLessonCompletion(page: CoursePage): void {
  const checkpoints = page.checkpoints ?? [];

  if (page.pageType !== "lesson" || checkpoints.length === 0) {
    return;
  }

  setLessonComplete(
    page.path,
    checkpoints.every((checkpointId) => isCheckpointComplete(page.path, checkpointId))
  );
}

function visitLesson(path: string): void {
  if (progressData.value.lastVisitedLesson === path) {
    return;
  }

  progressData.value = {
    ...progressData.value,
    lastVisitedLesson: path
  };
  persistProgress();
}

function formatDate(date?: string): string {
  if (!date) {
    return metadataConfig.value.draftLabel ?? "Draft";
  }

  return new Intl.DateTimeFormat(metadataConfig.value.dateLocale, {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(date));
}

function openDesktopNavigation(): void {
  if (desktopNavigationCloseTimer) {
    clearTimeout(desktopNavigationCloseTimer);
    desktopNavigationCloseTimer = undefined;
  }

  desktopNavigationOpen.value = true;
}

function scheduleDesktopNavigationClose(): void {
  if (desktopNavigationCloseTimer) {
    clearTimeout(desktopNavigationCloseTimer);
  }

  desktopNavigationCloseTimer = setTimeout(() => {
    desktopNavigationOpen.value = false;
    desktopNavigationCloseTimer = undefined;
  }, 180);
}

function closeCourseNavigation(): void {
  setTimeout(() => {
    desktopNavigationOpen.value = false;
    mobileNavigationOpen.value = false;
  });
}

onMounted(() => {
  restoreInputValues();
  restoreProgress();
});

watch(
  () => currentPage.value.path,
  async () => {
    await nextTick();
    contentRevision.value += 1;
  },
  { flush: "post" }
);

onBeforeUnmount(() => {
  if (desktopNavigationCloseTimer) {
    clearTimeout(desktopNavigationCloseTimer);
  }
});
</script>

<template>
  <div class="min-h-screen">
    <div
      v-if="orderedLessons.length && isLesson"
      class="fixed start-[max(0px,calc((100vw-120rem)/2))] top-1/2 z-40 hidden -translate-y-1/2 lg:block min-[1920px]:-translate-x-4"
      @mouseenter="openDesktopNavigation"
      @mouseleave="scheduleDesktopNavigationClose"
    >
      <UPopover
        v-model:open="desktopNavigationOpen"
        mode="click"
        :content="{ side: 'right', align: 'center', sideOffset: 12, collisionPadding: 12 }"
        :ui="{
          content: 'w-96 max-w-[calc(100vw-5rem)] bg-elevated p-0 shadow-2xl ring-accented'
        }"
      >
        <UButton
          :label="coursePositionLabel"
          icon="i-lucide-list-tree"
          color="neutral"
          variant="soft"
          size="sm"
          :aria-label="courseOutlineAriaLabel"
          class="rounded-s-none rounded-e-full border border-s-0 border-default shadow-md"
          :ui="{ label: 'hidden xl:inline' }"
        />

        <template #content>
          <div
            class="max-h-[calc(100vh-6rem)] overscroll-contain overflow-x-hidden overflow-y-auto p-4"
            @mouseenter="openDesktopNavigation"
            @mouseleave="scheduleDesktopNavigationClose"
          >
            <p class="mb-3 text-sm font-semibold text-highlighted">{{ course.title }}</p>
            <CourseOutlineNavigation
              :course="course"
              :lessons="orderedLessons"
              @navigate="closeCourseNavigation"
            />
          </div>
        </template>
      </UPopover>
    </div>

    <UPage class="mx-auto w-full max-w-[120rem]" :ui="contentPageUi">
      <div class="pt-8">
        <HBreadcrumbs :items="breadcrumbItems" :current="currentBreadcrumb" />
      </div>

      <UPageHeader
        :title="renderedPage.title"
        :description="renderedPage.description"
        :ui="{
          root: courseInputs.length ? 'pt-6 pb-4' : 'pt-6',
          title: 'relative flex items-center'
        }"
      >
        <template #headline>
          <div class="flex flex-wrap items-center gap-2">
            <template v-if="isLesson">
              <span class="text-muted font-normal">
                Exercise {{ currentLessonIndex + 1 }} of {{ orderedLessons.length }}
              </span>
              <UBadge v-if="currentPage.optional" label="Optional" color="neutral" variant="subtle" />
              <span v-if="currentPage.estimatedMinutes" aria-hidden="true" class="text-dimmed">·</span>
              <span v-if="currentPage.estimatedMinutes" class="text-muted font-normal">
                {{ currentPage.estimatedMinutes }} min
              </span>
            </template>
            <template v-else>
              <time class="text-muted font-normal">{{ formatDate(course.date) }}</time>
              <UBadge v-if="course.version" color="neutral" variant="subtle" :label="`v${course.version}`" />
            </template>
          </div>
        </template>

        <div v-if="!isLesson && course.authors?.length" class="mt-6 flex flex-wrap items-center gap-6">
          <template v-for="author in course.authors" :key="author.name">
            <ULink v-if="author.to" :to="author.to" target="_blank" class="group flex items-center gap-3">
              <UAvatar :src="author.avatar?.src" :alt="author.avatar?.alt ?? author.name" size="lg" />
              <div class="flex flex-col">
                <span class="text-sm font-medium text-highlighted">{{ author.name }}</span>
                <span class="text-xs text-muted transition-colors group-hover:text-primary">
                  {{ author.to.replace(/^https?:\/\//, "") }}
                </span>
              </div>
            </ULink>
            <div v-else class="flex items-center gap-3">
              <UAvatar :src="author.avatar?.src" :alt="author.avatar?.alt ?? author.name" size="lg" />
              <span class="text-sm font-medium text-highlighted">{{ author.name }}</span>
            </div>
          </template>
        </div>

        <USlideover
          v-if="orderedLessons.length"
          v-model:open="mobileNavigationOpen"
          :title="course.title"
          side="left"
        >
          <UButton
            label="Course outline"
            icon="i-lucide-list-tree"
            color="neutral"
            variant="outline"
            class="mt-6 lg:hidden"
          />

          <template #body>
            <CourseOutlineNavigation
              :course="course"
              :lessons="orderedLessons"
              @navigate="closeCourseNavigation"
            />
          </template>
        </USlideover>

        <section
          v-if="pageAnchorLinks.length"
          aria-labelledby="course-page-outline-title"
          class="mt-6 rounded-lg bg-elevated/40 p-4"
        >
          <div class="flex items-center justify-between gap-4">
            <h2
              id="course-page-outline-title"
              class="flex items-center gap-2 text-sm font-semibold text-highlighted"
            >
              <UIcon name="i-lucide-list" class="size-4 text-muted" />
              On this exercise
            </h2>
            <span class="text-xs text-muted">
              {{ pageAnchorLinks.length }} sections
            </span>
          </div>

          <UPageAnchors
            :links="pageAnchorLinks"
            class="mt-2"
            :ui="{
              list: 'grid gap-1',
              link: 'items-start py-1.5',
              linkLeading: 'bg-transparent p-0 ring-0 group-hover:bg-transparent group-hover:ring-0',
              linkLabel: 'whitespace-normal'
            }"
          >
            <template #link-leading="{ link }">
              <span class="flex size-5 shrink-0 items-center justify-center rounded-full border border-muted text-[10px] font-semibold text-muted">
                {{ link.step }}
              </span>
            </template>
          </UPageAnchors>
        </section>

        <UCollapsible
          v-if="courseInputs.length"
          v-model:open="parametersOpen"
          :class="[
            'rounded-lg bg-elevated/30 p-2',
            !isLesson && course.authors?.length ? 'mt-8' : 'mt-4'
          ]"
        >
          <UButton
            :label="parametersOpen
              ? `Course parameters (${courseInputs.length})`
              : `Course parameters · ${parameterSummary}`"
            icon="i-lucide-sliders-horizontal"
            :trailing-icon="parametersOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
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
                  v-for="input in courseInputs"
                  :key="input.id"
                  :label="input.label"
                  :description="input.description"
                  size="md"
                >
                  <UInput
                    :model-value="inputValue(input)"
                    :placeholder="input.placeholder"
                    :minlength="input.minLength"
                    :maxlength="input.maxLength"
                    :pattern="input.pattern"
                    autocomplete="off"
                    class="w-full"
                    @update:model-value="(value) => setInputValue(input, value)"
                  />
                </UFormField>
              </div>
            </fieldset>
          </template>
        </UCollapsible>
      </UPageHeader>

      <UPageBody>
        <CourseCodeHistory
          v-if="hasPageCodeStage && renderedHistoryPages.length"
          :pages="renderedHistoryPages"
          :data="contentData"
        />

        <div v-if="hasPageCodeStage && activePath" class="fixed inset-x-4 bottom-4 z-40 lg:hidden">
          <div class="w-full overflow-hidden rounded-lg border border-default bg-default/95 shadow-lg backdrop-blur">
            <button
              type="button"
              class="flex w-full items-center justify-between gap-3 px-3 py-2 text-sm font-medium text-highlighted hover:bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-controls="course-mobile-project-panel"
              :aria-expanded="mobileProjectOpen"
              @click="mobileProjectOpen = !mobileProjectOpen"
            >
              <span class="flex items-center gap-2">
                <UIcon name="i-lucide-folder-code" class="size-5 text-muted" />
                {{ codeStageConfig.label }}
              </span>
              <UIcon
                name="i-lucide-chevron-down"
                :class="['size-4 text-muted transition-transform', mobileProjectOpen && 'rotate-180']"
              />
            </button>

            <div
              v-show="mobileProjectOpen"
              id="course-mobile-project-panel"
              class="h-[70vh] min-h-80 border-t border-default"
            >
              <CourseCodePanel
                v-if="activePath"
                v-model="activePath"
                :items="items"
                :config="codeStageConfig"
                :storage-key="codeTreeStorageKey"
                mobile
              />
            </div>
          </div>
        </div>

        <ContentRenderer
          v-if="renderedPage.body"
          :value="renderedPage"
          :data="contentData"
          :components="contentComponents"
          :class="!isLesson ? 'w-full max-w-none' : undefined"
        />

        <CourseCurriculum v-if="!isLesson" :lessons="orderedLessons" />

        <template v-if="isLesson">
          <div v-if="!currentPage.checkpoints?.length" class="not-prose mt-10 flex justify-end border-t border-default pt-6">
            <UButton
              :label="isLessonComplete(currentPage.path) ? 'Exercise completed' : 'Mark exercise complete'"
              :icon="isLessonComplete(currentPage.path) ? 'i-lucide-circle-check' : 'i-lucide-check'"
              :color="isLessonComplete(currentPage.path) ? 'success' : 'primary'"
              :variant="isLessonComplete(currentPage.path) ? 'soft' : 'solid'"
              @click="setLessonComplete(currentPage.path, !isLessonComplete(currentPage.path))"
            />
          </div>

        </template>

        <template v-if="surround.length">
          <USeparator class="my-8" />
          <UContentSurround :surround="surround" />
        </template>
      </UPageBody>

      <template v-if="hasPageCodeStage" #right>
        <nav
          class="course-code-stage relative hidden lg:sticky lg:top-(--ui-header-height) lg:block"
          :aria-label="codeStageConfig.label"
        >
          <CourseCodePanel
            v-if="activePath"
            v-model="activePath"
            :items="items"
            :config="codeStageConfig"
            :storage-key="codeTreeStorageKey"
          />
          <div v-else class="flex h-full items-center justify-center border-l border-default p-8 text-center">
            <div class="space-y-3 text-muted">
              <UIcon name="i-lucide-arrow-down" class="mx-auto size-10 animate-bounce text-dimmed" />
              <p class="text-sm">{{ codeStageConfig.emptyLabel }}</p>
            </div>
          </div>
        </nav>
      </template>
    </UPage>
  </div>
</template>
