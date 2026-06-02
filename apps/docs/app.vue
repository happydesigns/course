<script setup lang="ts">
import { computed, ref, watch } from "vue";
import courseJson from "../../examples/basic-course/course.json";

type Course = typeof courseJson;
type Lesson = Course["lessons"][number];
type Step = Lesson["steps"][number];
type FileSnapshot = Course["fileSnapshots"][number];
type CourseAction = Step["actions"][number];

const course = courseJson;
const flattenedSteps = computed(() =>
  course.lessons.flatMap((lesson) =>
    lesson.steps.map((step) => ({
      lesson,
      step
    }))
  )
);
const selectedStepId = ref(flattenedSteps.value[0]?.step.id ?? "");
const selectedFilePath = ref("");

const selectedIndex = computed(() => {
  const index = flattenedSteps.value.findIndex(({ step }) => step.id === selectedStepId.value);
  return index >= 0 ? index : 0;
});

const selectedEntry = computed(() => flattenedSteps.value[selectedIndex.value]);
const selectedLesson = computed(() => selectedEntry.value?.lesson);
const selectedStep = computed(() => selectedEntry.value?.step);

const currentFiles = computed<FileSnapshot[]>(() => {
  const files = new Map<string, FileSnapshot>();

  for (const snapshot of course.fileSnapshots) {
    files.set(snapshot.path, { ...snapshot });
  }

  for (const { step } of flattenedSteps.value.slice(0, selectedIndex.value + 1)) {
    for (const change of step.codeChanges ?? []) {
      const current = files.get(change.file);
      files.set(change.file, {
        path: change.file,
        language: current?.language,
        content: change.after ?? current?.content ?? ""
      });
    }
  }

  return [...files.values()].sort((left, right) => left.path.localeCompare(right.path));
});

const visibleFilePaths = computed(() => {
  const paths = selectedStep.value?.visibleFiles;
  return paths?.length ? paths : currentFiles.value.map((file) => file.path);
});

const visibleFiles = computed(() =>
  visibleFilePaths.value
    .map((filePath) => currentFiles.value.find((file) => file.path === filePath))
    .filter((file): file is FileSnapshot => Boolean(file))
);

watch(
  visibleFilePaths,
  (paths) => {
    if (!paths.includes(selectedFilePath.value)) {
      selectedFilePath.value = paths[0] ?? "";
    }
  },
  { immediate: true }
);

const activeFile = computed(() => visibleFiles.value.find((file) => file.path === selectedFilePath.value));

function selectStep(step: Step): void {
  selectedStepId.value = step.id;
}

function actionLabel(action: CourseAction): string {
  if (action.type === "edit-file") {
    return `Edit ${action.file}`;
  }

  if (action.type === "run-command") {
    return action.command;
  }

  if (action.type === "open-url") {
    return action.url;
  }

  if (action.type === "use-tool") {
    return action.tool;
  }

  return "Manual";
}
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="title-block">
        <p class="eyebrow">Generic course</p>
        <h1>{{ course.title }}</h1>
        <p>{{ course.description }}</p>
      </div>
      <div class="version-pill">v{{ course.version }}</div>
    </header>

    <main class="reader-grid">
      <section class="lesson-pane" aria-label="Course steps">
        <nav class="lesson-list" aria-label="Lessons">
          <div v-for="lesson in course.lessons" :key="lesson.id" class="lesson-group">
            <div class="lesson-heading">
              <h2>{{ lesson.title }}</h2>
              <p v-if="lesson.description">{{ lesson.description }}</p>
            </div>
            <button
              v-for="step in lesson.steps"
              :key="step.id"
              class="step-button"
              :class="{ active: selectedStepId === step.id }"
              type="button"
              @click="selectStep(step)"
            >
              <span>{{ step.title }}</span>
              <small>{{ step.id }}</small>
            </button>
          </div>
        </nav>

        <article v-if="selectedStep && selectedLesson" class="step-detail">
          <p class="eyebrow">{{ selectedLesson.title }}</p>
          <h2>{{ selectedStep.title }}</h2>
          <p class="prose">{{ selectedStep.prose }}</p>

          <div v-if="selectedStep.actions.length" class="detail-section">
            <h3>Actions</h3>
            <ul class="action-list">
              <li v-for="(action, index) in selectedStep.actions" :key="`${action.type}-${index}`">
                <span class="action-type">{{ action.type }}</span>
                <span>{{ actionLabel(action) }}</span>
                <small v-if="'description' in action && action.description">{{ action.description }}</small>
              </li>
            </ul>
          </div>

          <div v-if="selectedStep.validation?.length" class="detail-section">
            <h3>Validation</h3>
            <ul class="validation-list">
              <li v-for="hint in selectedStep.validation" :key="`${hint.type}-${hint.description}`">
                <span>{{ hint.description }}</span>
                <code v-if="hint.command">{{ hint.command }}</code>
                <small v-if="hint.expected">{{ hint.expected }}</small>
              </li>
            </ul>
          </div>
        </article>
      </section>

      <aside class="code-pane" aria-label="Visible files">
        <div class="file-tree">
          <div class="pane-heading">
            <h2>Files</h2>
            <span>{{ visibleFiles.length }}</span>
          </div>
          <button
            v-for="file in visibleFiles"
            :key="file.path"
            class="file-button"
            :class="{ active: selectedFilePath === file.path }"
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
          <pre><code>{{ activeFile?.content ?? "" }}</code></pre>
        </div>
      </aside>
    </main>
  </div>
</template>

<style>
:root {
  color: #17201b;
  background: #f6f8f7;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
}

button {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
  padding: 24px;
}

.topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  max-width: 1440px;
  margin: 0 auto 20px;
  padding-bottom: 18px;
  border-bottom: 1px solid #d7ded9;
}

.title-block {
  max-width: 880px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #4d6b5d;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 8px;
  font-size: clamp(2rem, 5vw, 4.6rem);
  line-height: 0.96;
}

.title-block p:last-child {
  margin-bottom: 0;
  color: #4e5b54;
  font-size: 1rem;
  line-height: 1.6;
}

.version-pill {
  flex: 0 0 auto;
  padding: 8px 12px;
  border: 1px solid #b7c7bd;
  border-radius: 999px;
  color: #284334;
  background: #ffffff;
  font-size: 0.9rem;
  font-weight: 700;
}

.reader-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(460px, 1.08fr);
  gap: 18px;
  max-width: 1440px;
  margin: 0 auto;
}

.lesson-pane,
.code-pane {
  min-height: calc(100vh - 185px);
}

.lesson-pane {
  display: grid;
  grid-template-columns: minmax(220px, 0.42fr) minmax(0, 0.58fr);
  gap: 16px;
}

.lesson-list,
.step-detail,
.file-tree,
.file-viewer {
  border: 1px solid #d7ded9;
  background: #ffffff;
}

.lesson-list {
  overflow: auto;
  max-height: calc(100vh - 185px);
  padding: 14px;
  border-radius: 8px;
}

.lesson-group + .lesson-group {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid #edf1ee;
}

.lesson-heading h2 {
  margin-bottom: 4px;
  font-size: 1rem;
}

.lesson-heading p {
  margin-bottom: 10px;
  color: #65726b;
  font-size: 0.86rem;
  line-height: 1.45;
}

.step-button,
.file-button {
  display: grid;
  width: 100%;
  min-height: 56px;
  margin-top: 8px;
  padding: 10px 12px;
  border: 1px solid transparent;
  border-radius: 6px;
  color: #25372d;
  background: #f7faf8;
  text-align: left;
  cursor: pointer;
}

.step-button:hover,
.file-button:hover {
  border-color: #aebfb4;
}

.step-button.active,
.file-button.active {
  border-color: #1f7a4d;
  background: #e9f5ee;
}

.step-button span,
.file-button span {
  overflow-wrap: anywhere;
  font-weight: 700;
}

.step-button small,
.file-button small {
  margin-top: 3px;
  color: #67746d;
  font-size: 0.76rem;
}

.step-detail {
  overflow: auto;
  max-height: calc(100vh - 185px);
  padding: 22px;
  border-radius: 8px;
}

.step-detail h2 {
  margin-bottom: 12px;
  font-size: 1.65rem;
  line-height: 1.15;
}

.prose {
  color: #3f4f46;
  line-height: 1.65;
}

.detail-section {
  margin-top: 24px;
}

.detail-section h3,
.pane-heading h2 {
  margin-bottom: 10px;
  font-size: 0.95rem;
  text-transform: uppercase;
}

.action-list,
.validation-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.action-list li,
.validation-list li {
  display: grid;
  gap: 5px;
  padding: 12px;
  border-left: 3px solid #d39d28;
  background: #fbf7ec;
}

.action-type {
  color: #835d12;
  font-size: 0.74rem;
  font-weight: 800;
  text-transform: uppercase;
}

.action-list small,
.validation-list small {
  color: #607067;
}

.validation-list code {
  width: fit-content;
  max-width: 100%;
  padding: 3px 6px;
  overflow-wrap: anywhere;
  border-radius: 4px;
  background: #17201b;
  color: #e9f5ee;
  font-size: 0.85rem;
}

.code-pane {
  display: grid;
  grid-template-columns: minmax(180px, 0.34fr) minmax(0, 0.66fr);
  gap: 16px;
}

.file-tree,
.file-viewer {
  overflow: hidden;
  max-height: calc(100vh - 185px);
  border-radius: 8px;
}

.file-tree {
  padding: 14px;
}

.pane-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.pane-heading span {
  display: inline-grid;
  min-width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 50%;
  background: #213a2d;
  color: #ffffff;
  font-size: 0.78rem;
  font-weight: 800;
}

.file-viewer {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  background: #101815;
}

.file-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 46px;
  padding: 12px 14px;
  border-bottom: 1px solid #26342e;
  color: #e6eee9;
  background: #17201b;
  font-size: 0.9rem;
  font-weight: 700;
}

.file-toolbar span {
  overflow-wrap: anywhere;
}

.file-toolbar small {
  color: #a6beb0;
}

pre {
  min-height: 0;
  margin: 0;
  padding: 18px;
  overflow: auto;
  color: #dbe9e2;
  font-size: 0.9rem;
  line-height: 1.6;
  white-space: pre-wrap;
}

code {
  font-family: "Cascadia Code", "SFMono-Regular", Consolas, monospace;
}

@media (max-width: 1180px) {
  .reader-grid,
  .lesson-pane,
  .code-pane {
    grid-template-columns: 1fr;
  }

  .lesson-pane,
  .code-pane,
  .lesson-list,
  .step-detail,
  .file-tree,
  .file-viewer {
    min-height: auto;
    max-height: none;
  }
}

@media (max-width: 720px) {
  .app-shell {
    padding: 16px;
  }

  .topbar {
    display: grid;
  }

  h1 {
    font-size: 2rem;
    line-height: 1.08;
  }

  .step-detail {
    padding: 18px;
  }
}
</style>
