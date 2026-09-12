import type { CoursePage, CourseStorage } from "../app/types/course";
import type { CourseProgressContext } from "../app/composables/useCourseProgress";
import { afterEach, describe, expect, it } from "vitest";
import { computed, defineComponent, h, nextTick, ref } from "vue";
import { clearNuxtState } from "#imports";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { useCourseProgressController } from "../app/composables/useCourseProgressController";
import { provideCourseStorage } from "../app/composables/useCourseStorage";

function lesson(courseId: string): CoursePage {
  return {
    path: `/courses/${courseId}/lesson`,
    courseId,
    pageType: "lesson",
    checkpoints: ["done"],
    title: "Lesson",
    description: "A lesson with one checkpoint"
  } as CoursePage;
}

function memoryStorage(): CourseStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); }
  };
}

const wrappers: Array<{ unmount: () => void }> = [];

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
  clearNuxtState();
  window.localStorage.clear();
});

async function mountReaders(
  storages: Array<CourseStorage | undefined>,
  sharedStorage?: CourseStorage
) {
  const controllers: CourseProgressContext[] = [];
  const current = ref(lesson("demo"));
  const Reader = defineComponent({
    setup() {
      controllers.push(useCourseProgressController({
        course: current,
        currentPage: current,
        orderedLessons: computed(() => [current.value]),
        courseKey: computed(() => current.value.courseId!)
      }));
      return () => h("div");
    }
  });
  const providers = storages.map((storage) => defineComponent({
    setup() {
      if (storage) provideCourseStorage(storage);
      return () => h(Reader);
    }
  }));
  const wrapper = await mountSuspended(defineComponent({
    setup() {
      if (sharedStorage) provideCourseStorage(sharedStorage);
      return () => h("div", providers.map((provider) => h(provider)));
    }
  }));
  wrappers.push(wrapper);
  return { controllers, current };
}

describe("course progress in Nuxt", () => {
  it("isolates two previews of the same course with separate storage providers", async () => {
    const firstStorage = memoryStorage();
    const secondStorage = memoryStorage();
    const { controllers: [first, second] } = await mountReaders([firstStorage, secondStorage]);

    first!.setCheckpointComplete("/courses/demo/lesson", "done", true);
    await nextTick();

    expect(first!.percent.value).toBe(100);
    expect(second!.percent.value).toBe(0);
    expect(JSON.parse(firstStorage.getItem("course-progress:demo")!).completedLessons)
      .toEqual(["/courses/demo/lesson"]);
    expect(JSON.parse(secondStorage.getItem("course-progress:demo")!).completedLessons)
      .toEqual([]);
  });

  it("keeps the default learner state synchronized across readers", async () => {
    const { controllers: [first, second] } = await mountReaders([undefined, undefined]);

    first!.setCheckpointComplete("/courses/demo/lesson", "done", true);
    await nextTick();

    expect(second!.percent.value).toBe(100);
    expect(JSON.parse(window.localStorage.getItem("course-progress:demo")!).completedLessons)
      .toEqual(["/courses/demo/lesson"]);
  });

  it("shares progress between readers beneath the same storage provider", async () => {
    const storage = memoryStorage();
    const { controllers: [first, second] } = await mountReaders([undefined, undefined], storage);

    first!.setCheckpointComplete("/courses/demo/lesson", "done", true);
    await nextTick();

    expect(second!.percent.value).toBe(100);
    expect(window.localStorage.getItem("course-progress:demo")).toBeNull();
    expect(JSON.parse(storage.getItem("course-progress:demo")!).completedLessons)
      .toEqual(["/courses/demo/lesson"]);
  });

  it("does not let a preview restore overwrite a learner's state", async () => {
    const { controllers: [learner] } = await mountReaders([undefined]);
    learner!.setCheckpointComplete("/courses/demo/lesson", "done", true);

    const { controllers: [preview] } = await mountReaders([memoryStorage()]);

    expect(learner!.percent.value).toBe(100);
    expect(preview!.percent.value).toBe(0);
  });

  it("switches courses without changing the state held by another reader", async () => {
    const { controllers: [first], current } = await mountReaders([undefined]);
    const { controllers: [other] } = await mountReaders([undefined]);
    first!.setCheckpointComplete("/courses/demo/lesson", "done", true);

    current.value = lesson("second");
    await nextTick();
    first!.setCheckpointComplete("/courses/second/lesson", "done", true);

    expect(other!.data.value.completedLessons).toEqual(["/courses/demo/lesson"]);
    expect(first!.data.value.completedLessons).toEqual(["/courses/second/lesson"]);

    current.value = lesson("demo");
    await nextTick();
    expect(first!.data.value.completedLessons).toEqual(["/courses/demo/lesson"]);
  });
});
