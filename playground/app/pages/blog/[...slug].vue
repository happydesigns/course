<script setup lang="ts">
import type { CSSProperties, VNode } from "vue";
import { computed, onBeforeUnmount, onMounted, provide, ref } from "vue";

const CODE_TREE_WIDTH_STORAGE_KEY = "course.codeTree.width";
const MIN_CODE_TREE_WIDTH = 220;
const MAX_CODE_TREE_WIDTH = 520;
const MIN_CODE_CONTENT_WIDTH = 360;

const route = useRoute();
const coursePath = computed(() => route.path.replace(/^\/blog\//, "/courses/"));

const { data: course, error } = await useAsyncData(`course-${route.path}`, () =>
  queryCollection("courses").path(coursePath.value).first()
);

if (error.value) {
  throw createError(error.value);
}

if (!course.value) {
  throw createError({ statusCode: 404, statusMessage: "Page not found", fatal: true });
}

const title = computed(() => course.value?.title ?? "Course");
const description = computed(() => course.value?.description ?? "");
const tree = ref<Record<string, VNode>>({});
const activePath = ref("");
const items = computed(() => Object.entries(tree.value).map(([label, component]) => ({ label, component })));
const codePane = ref<HTMLElement | null>(null);
const codeTreeWidth = ref(288);
const isCodeTreeResizing = ref(false);
const codePaneStyle = computed<CSSProperties>(() => ({
  "--course-code-tree-list-width": `${codeTreeWidth.value}px`
}));

provide("tree", tree);
provide("activePath", activePath);

useSeoMeta({
  title,
  description
});

function formatDate(date?: string): string {
  if (!date) {
    return "Draft";
  }

  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function clampCodeTreeWidth(width: number): number {
  const paneWidth = codePane.value?.getBoundingClientRect().width ?? Number.POSITIVE_INFINITY;
  const paneMax = Math.max(MIN_CODE_TREE_WIDTH, paneWidth - MIN_CODE_CONTENT_WIDTH);
  const maxWidth = Math.min(MAX_CODE_TREE_WIDTH, paneMax);

  return Math.round(Math.min(Math.max(width, MIN_CODE_TREE_WIDTH), maxWidth));
}

function setCodeTreeWidth(width: number): void {
  codeTreeWidth.value = clampCodeTreeWidth(width);
}

function persistCodeTreeWidth(): void {
  localStorage.setItem(CODE_TREE_WIDTH_STORAGE_KEY, String(codeTreeWidth.value));
}

function resizeCodeTree(event: PointerEvent): void {
  const rect = codePane.value?.getBoundingClientRect();

  if (!rect) {
    return;
  }

  setCodeTreeWidth(event.clientX - rect.left);
}

function stopCodeTreeResize(): void {
  isCodeTreeResizing.value = false;
  window.removeEventListener("pointermove", resizeCodeTree);
  window.removeEventListener("pointerup", stopCodeTreeResize);
  document.documentElement.classList.remove("course-code-tree-resizing-global");
  persistCodeTreeWidth();
}

function startCodeTreeResize(event: PointerEvent): void {
  if (event.button !== 0) {
    return;
  }

  event.preventDefault();
  isCodeTreeResizing.value = true;
  resizeCodeTree(event);
  document.documentElement.classList.add("course-code-tree-resizing-global");
  window.addEventListener("pointermove", resizeCodeTree);
  window.addEventListener("pointerup", stopCodeTreeResize);
  (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
}

function adjustCodeTreeWidth(delta: number): void {
  setCodeTreeWidth(codeTreeWidth.value + delta);
  persistCodeTreeWidth();
}

function handleCodeTreeResizerKeydown(event: KeyboardEvent): void {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    adjustCodeTreeWidth(-24);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    adjustCodeTreeWidth(24);
  } else if (event.key === "Home") {
    event.preventDefault();
    setCodeTreeWidth(MIN_CODE_TREE_WIDTH);
    persistCodeTreeWidth();
  } else if (event.key === "End") {
    event.preventDefault();
    setCodeTreeWidth(MAX_CODE_TREE_WIDTH);
    persistCodeTreeWidth();
  }
}

onMounted(() => {
  const storedWidth = Number(localStorage.getItem(CODE_TREE_WIDTH_STORAGE_KEY));

  if (Number.isFinite(storedWidth)) {
    setCodeTreeWidth(storedWidth);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("pointermove", resizeCodeTree);
  window.removeEventListener("pointerup", stopCodeTreeResize);
  document.documentElement.classList.remove("course-code-tree-resizing-global");
});
</script>

<template>
  <UMain v-if="course" class="min-h-screen">
    <UPage
      :ui="{
        center: 'min-w-0 px-4 sm:px-6 lg:col-span-5 lg:pl-8 lg:pr-0',
        right: 'lg:col-span-5 lg:h-[calc(100vh-var(--ui-header-height,0px))]'
      }"
      class="lg:gap-8"
    >
      <UPageHeader :title="course.title" :description="course.description" :ui="{ title: 'relative flex items-center' }">
        <template #headline>
          <UButton
            icon="i-lucide-arrow-left"
            label="Back to blog"
            to="/blog"
            variant="link"
            class="p-0"
            :ui="{ leadingIcon: 'size-4' }"
          />
          <span class="text-muted">&middot;</span>
          <time class="text-muted font-normal">{{ formatDate(course.date) }}</time>
        </template>

        <div v-if="course.authors?.length" class="mt-6 flex flex-wrap items-center gap-6">
          <template v-for="author in course.authors" :key="author.name">
            <ULink v-if="author.to" :to="author.to" target="_blank" class="group flex items-center gap-3">
              <UAvatar :src="author.avatar?.src" :alt="author.name" size="lg" />
              <div class="flex flex-col">
                <span class="text-sm font-medium text-highlighted">{{ author.name }}</span>
                <span class="text-xs text-muted transition-colors group-hover:text-primary">
                  {{ author.to.replace(/^https?:\/\//, "") }}
                </span>
              </div>
            </ULink>
            <div v-else class="flex items-center gap-3">
              <UAvatar :src="author.avatar?.src" :alt="author.name" size="lg" />
              <span class="text-sm font-medium text-highlighted">{{ author.name }}</span>
            </div>
          </template>
        </div>
      </UPageHeader>

      <UPageBody>
        <ContentRenderer v-if="course.body" :value="course" />
      </UPageBody>

      <template #right>
        <nav
          ref="codePane"
          :style="codePaneStyle"
          :class="[
            'relative hidden h-[calc(100vh-var(--ui-header-height,0px))] lg:sticky lg:top-(--ui-header-height) lg:block',
            isCodeTreeResizing && 'course-code-tree-resizing'
          ]"
        >
          <ProseCodeTree
            v-if="activePath"
            v-model="activePath"
            :items="items"
            expand-all
            class="course-code-tree my-0 h-full min-h-0 rounded-none border-y-0 border-r-0 border-default lg:h-full"
            :ui="{
              list: 'course-code-tree-list border-default',
              content: 'course-code-tree-content min-h-0 [&>div]:min-h-0 [&>div>pre]:min-h-0 [&>div>pre]:rounded-none [&>div>pre]:border-default [&>div>pre]:bg-muted/50'
            }"
          />

          <div
            v-if="activePath"
            role="separator"
            aria-label="Resize file tree"
            aria-orientation="vertical"
            :aria-valuemin="MIN_CODE_TREE_WIDTH"
            :aria-valuemax="MAX_CODE_TREE_WIDTH"
            :aria-valuenow="codeTreeWidth"
            tabindex="0"
            class="course-code-tree-resizer hidden lg:block"
            @pointerdown="startCodeTreeResize"
            @keydown="handleCodeTreeResizerKeydown"
          />

          <div v-else class="flex h-full items-center justify-center border-l border-default">
            <UIcon name="i-lucide-arrow-down" class="size-12 animate-bounce text-dimmed" />
          </div>
        </nav>
      </template>
    </UPage>
  </UMain>
</template>
