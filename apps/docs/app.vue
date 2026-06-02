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
    <div v-if="course" class="app-shell">
      <header class="topbar">
        <div class="title-block">
          <p class="eyebrow">{{ course.category ?? "Course" }}</p>
          <h1>{{ course.title }}</h1>
          <p>{{ course.description }}</p>
        </div>
        <UBadge color="neutral" variant="soft" size="lg">v{{ course.version }}</UBadge>
      </header>

      <main class="reader-grid">
        <article class="article-pane">
          <nav v-if="tocLinks.length" class="section-nav" aria-label="Course sections">
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

          <ContentRenderer :value="course" class="course-prose" />
        </article>

        <aside class="code-pane" aria-label="Synchronized files">
          <div class="code-pane-header">
            <div>
              <p class="eyebrow">Code state</p>
              <h2>{{ activeSnapshot?.title ?? "Course files" }}</h2>
            </div>
            <UBadge color="primary" variant="soft">{{ activeSnapshot?.files.length ?? 0 }} files</UBadge>
          </div>

          <div class="code-workspace">
            <div class="file-tree" aria-label="Visible files">
              <button
                v-for="file in activeSnapshot?.files ?? []"
                :key="file.path"
                class="file-button"
                :class="{ active: file.path === activeFile?.path }"
                type="button"
                @click="selectedFilePath = file.path"
              >
                <span>{{ file.path }}</span>
                <small v-if="file.language">{{ file.language }}</small>
              </button>
            </div>

            <div class="file-viewer">
              <div class="file-toolbar">
                <span>{{ activeFile?.path ?? "No file selected" }}</span>
                <small v-if="activeFile?.language">{{ activeFile.language }}</small>
              </div>
              <pre><code>{{ activeFile?.code ?? "" }}</code></pre>
            </div>
          </div>
        </aside>
      </main>
    </div>
  </UApp>
</template>
