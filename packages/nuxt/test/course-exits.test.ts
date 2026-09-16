import { computed, ref } from "vue";
import { expect, it } from "vitest";
import { useCourseReaderModel } from "../app/composables/useCourseReaderModel";
import type { CoursePage } from "../app/types/course";

it("offers successors on overviews, the last required lesson and the final optional lesson", () => {
  const course = { path: '/demo', title: 'Demo', description: 'Demo', pageType: 'course', nodes: [], meta: {} } as CoursePage;
  const lessons = [false, false, true, true].map((optional, order) => ({ ...course, path: `/demo/${order}`, pageType: 'lesson', order, optional } as CoursePage));
  const current = ref<CoursePage | undefined>();
  const model = useCourseReaderModel({ course, page: current, lessons: [...lessons].reverse(), inputValues: computed(() => ({})), breadcrumbRoot: undefined });
  expect(model.isCourseExit.value).toBe(true);
  for (const [index, expected] of [false, true, false, true].entries()) {
    current.value = lessons[index];
    expect(model.isCourseExit.value).toBe(expected);
  }
  current.value = { ...course, pageType: 'lesson', path: '/unknown' };
  expect(model.isCourseExit.value).toBe(false);
});
