<script setup lang="ts">
import { computed, provide, ref, watch } from "vue";
import {
  COURSE_CODE_STATE_KEY,
  extractCourseHeadings,
  extractCourseCodeSnapshots,
  type CourseCodeFile
} from "./utils/course-code";

const { data: course, error } = await useAsyncData("course-basic", () =>
  queryCollection("courses").path("/courses/basic").first()
);

if (error.value) {
  throw createError(error.value);
}

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

const tocLinks = computed(() => extractCourseHeadings(course.value?.body));

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

function scrollToHeading(id: string): void {
  if (!import.meta.client) {
    return;
  }

  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}
</script>

<template>
  <UApp>
    <UMain v-if="course" class="min-h-screen">
      <UContainer class="py-6 sm:py-8">
        <UPageHeader :title="course.title" :description="course.description" class="py-6 sm:py-8">
          <template #headline>
            <UBadge color="primary" variant="soft">{{ course.category ?? "Course" }}</UBadge>
          </template>

          <template #links>
            <UBadge color="neutral" variant="outline" size="lg">v{{ course.version }}</UBadge>
          </template>
        </UPageHeader>

        <UPageBody class="mt-6 pb-12">
          <UPage
            class="items-start"
            :ui="{
              root: 'flex flex-col gap-8 xl:grid xl:grid-cols-[minmax(0,0.9fr)_minmax(34rem,1.1fr)]',
              center: 'min-w-0 xl:col-auto',
              right: 'order-last xl:col-auto'
            }"
          >
            <article class="min-w-0">
              <nav
                v-if="tocLinks.length"
                class="sticky top-0 z-10 -mx-1 flex flex-wrap gap-1.5 bg-default/95 py-3 backdrop-blur"
                aria-label="Course sections"
              >
                <UButton
                  v-for="link in tocLinks"
                  :key="link.id"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  type="button"
                  @click="scrollToHeading(link.id)"
                >
                  {{ link.text }}
                </UButton>
              </nav>

              <ContentRenderer :value="course" class="max-w-none" />
            </article>

            <template #right>
              <aside class="sticky top-6 max-h-[calc(100vh-3rem)] min-h-[32rem]" aria-label="Synchronized files">
                <UCard
                  variant="subtle"
                  class="flex h-full min-h-[32rem] flex-col overflow-hidden"
                  :ui="{
                    header: 'flex items-start justify-between gap-4 px-4 py-3 sm:px-4',
                    body: 'flex min-h-0 flex-1 flex-col p-0 sm:p-0'
                  }"
                >
                  <template #header>
                    <div class="min-w-0">
                      <p class="mb-1 text-xs font-semibold uppercase text-muted">Code state</p>
                      <h2 class="truncate text-base font-semibold text-highlighted">
                        {{ activeSnapshot?.title ?? "Course files" }}
                      </h2>
                    </div>
                    <UBadge color="primary" variant="soft">{{ activeSnapshot?.files.length ?? 0 }} files</UBadge>
                  </template>

                  <div class="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[minmax(13rem,0.34fr)_minmax(0,0.66fr)] lg:grid-rows-1">
                    <UScrollArea class="max-h-56 border-b border-default lg:max-h-none lg:border-b-0 lg:border-r">
                      <div class="grid gap-1.5 p-2" aria-label="Visible files">
                        <UButton
                          v-for="file in activeSnapshot?.files ?? []"
                          :key="file.path"
                          color="neutral"
                          :variant="file.path === activeFile?.path ? 'subtle' : 'ghost'"
                          block
                          type="button"
                          class="justify-start"
                          :ui="{ base: 'h-auto min-h-12 px-3 py-2' }"
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
                </UCard>
              </aside>
            </template>
          </UPage>
        </UPageBody>
      </UContainer>
    </UMain>
  </UApp>
</template>
