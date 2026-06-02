<script setup lang="ts">
import { computed, provide, ref, watch } from "vue";
import {
  COURSE_CODE_STATE_KEY,
  extractCourseCodeSnapshots,
  type CourseCodeFile
} from "../../utils/course-code";

const route = useRoute();

const { data: course, error } = await useAsyncData(`course-${route.path}`, () =>
  queryCollection("courses").path(route.path).first()
);

if (error.value) {
  throw createError(error.value);
}

if (!course.value) {
  throw createError({ statusCode: 404, statusMessage: "Page not found", fatal: true });
}

const title = computed(() => course.value?.title ?? "Course");
const description = computed(() => course.value?.description ?? "");
const snapshots = computed(() => extractCourseCodeSnapshots(course.value?.body));
const activeSnapshotId = ref("");
const selectedFilePath = ref("");
let snapshotIndex = 0;

const activeSnapshot = computed(() => {
  return snapshots.value.find((snapshot) => snapshot.id === activeSnapshotId.value) ?? snapshots.value[0];
});

const activeFile = computed<CourseCodeFile | undefined>(() => {
  return activeSnapshot.value?.files.find((file) => file.path === selectedFilePath.value) ?? activeSnapshot.value?.files[0];
});

provide(COURSE_CODE_STATE_KEY, {
  registerSnapshot(): string {
    const snapshotId = `code-tree-${snapshotIndex}`;
    snapshotIndex += 1;
    return snapshotId;
  },
  activateSnapshot(snapshotId: string): void {
    activeSnapshotId.value = snapshotId;
  }
});

watch(
  snapshots,
  (nextSnapshots) => {
    if (!nextSnapshots.some((snapshot) => snapshot.id === activeSnapshotId.value)) {
      activeSnapshotId.value = nextSnapshots[0]?.id ?? "";
    }
  },
  { immediate: true }
);

watch(
  activeSnapshot,
  (snapshot) => {
    if (!snapshot?.files.some((file) => file.path === selectedFilePath.value)) {
      selectedFilePath.value = snapshot?.files[0]?.path ?? "";
    }
  },
  { immediate: true }
);

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
</script>

<template>
  <UMain v-if="course" class="min-h-screen">
    <UContainer class="py-6 sm:py-8">
      <UPage
        :ui="{
          center: 'min-w-0 lg:col-span-5 lg:px-0',
          right: 'lg:col-span-5'
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

          <template #links>
            <UBadge color="primary" variant="soft">{{ course.category ?? "Course" }}</UBadge>
            <UBadge color="neutral" variant="outline">v{{ course.version }}</UBadge>
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
          <nav class="hidden h-full max-h-[calc(100vh-var(--ui-header-height,0px))] lg:sticky lg:top-0 lg:block">
            <div
              v-if="activeSnapshot"
              class="grid h-full min-h-[36rem] grid-rows-[auto_minmax(0,1fr)] border-l border-default"
            >
              <div class="flex min-h-14 items-center justify-between gap-4 border-b border-default px-4">
                <div class="min-w-0">
                  <p class="text-xs font-medium uppercase text-muted">Code state</p>
                  <h2 class="truncate text-sm font-semibold text-highlighted">{{ activeSnapshot.title }}</h2>
                </div>
                <UBadge color="primary" variant="soft">{{ activeSnapshot.files.length }} files</UBadge>
              </div>

              <div class="grid min-h-0 grid-cols-[minmax(13rem,0.36fr)_minmax(0,0.64fr)]">
                <UScrollArea class="border-r border-default">
                  <div class="grid gap-1 p-2" aria-label="Visible files">
                    <UButton
                      v-for="file in activeSnapshot.files"
                      :key="file.path"
                      color="neutral"
                      :variant="file.path === activeFile?.path ? 'subtle' : 'ghost'"
                      block
                      type="button"
                      class="justify-start"
                      :ui="{ base: 'h-auto min-h-11 px-3 py-2' }"
                      @click="selectedFilePath = file.path"
                    >
                      <span class="flex min-w-0 flex-col items-start gap-0.5 text-left">
                        <span class="w-full truncate text-sm font-medium">{{ file.path }}</span>
                        <span v-if="file.language" class="text-xs text-muted">{{ file.language }}</span>
                      </span>
                    </UButton>
                  </div>
                </UScrollArea>

                <div class="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)]">
                  <div class="flex min-h-11 items-center justify-between gap-3 border-b border-default px-4">
                    <span class="truncate text-sm font-medium text-highlighted">
                      {{ activeFile?.path ?? "No file selected" }}
                    </span>
                    <UBadge v-if="activeFile?.language" color="neutral" variant="soft" size="sm">
                      {{ activeFile.language }}
                    </UBadge>
                  </div>

                  <pre class="m-0 overflow-auto bg-muted/40 p-4 font-mono text-sm/6 text-toned"><code>{{ activeFile?.code ?? "" }}</code></pre>
                </div>
              </div>
            </div>

            <div v-else class="flex h-full min-h-[36rem] items-center justify-center border-l border-default">
              <UIcon name="i-lucide-arrow-down" class="size-12 animate-bounce text-dimmed" />
            </div>
          </nav>
        </template>
      </UPage>
    </UContainer>
  </UMain>
</template>
