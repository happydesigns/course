import type { CoursePage } from "../app/types/course";
import { computed, ref } from "vue";
import { describe, expect, it } from "vitest";
import { useCourseReaderModel } from "../app/composables/useCourseReaderModel";

function page(overrides: Partial<CoursePage>): CoursePage {
  return {
    id: "course.md",
    stem: "course",
    extension: "md",
    path: "/courses/demo",
    title: "Demo {{ $doc.input.suffix }}",
    description: "Learn {{ $doc.input.suffix }}",
    body: {
      type: "minimark",
      value: [],
      toc: { title: "", searchDepth: 2, depth: 2, links: [] }
    },
    ...overrides
  } as CoursePage;
}

describe("course reader model", () => {
  const course = page({ pageType: "course", courseId: "demo" });
  const lessons = [
    page({
      id: "second.md",
      path: "/courses/demo/second",
      pageType: "lesson",
      order: 2,
      title: "Second"
    }),
    page({
      id: "first.md",
      path: "/courses/demo/first",
      pageType: "lesson",
      order: 1,
      title: "First"
    })
  ];

  it("orders lessons, interpolates metadata, and builds overview navigation", () => {
    const model = useCourseReaderModel({
      course,
      page: undefined,
      lessons,
      inputValues: computed(() => ({ suffix: "JNF" })),
      breadcrumbRoot: { label: "Courses", to: "/courses" }
    });

    expect(model.orderedLessons.value.map((lesson) => lesson.title)).toEqual(["First", "Second"]);
    expect(model.renderedPage.value.title).toBe("Demo JNF");
    expect(model.breadcrumbItems.value).toEqual([
      { label: "Courses", to: "/courses", icon: undefined }
    ]);
    expect(model.surround.value).toEqual([
      null,
      { title: "First", description: "Learn JNF", path: "/courses/demo/first" }
    ]);
  });

  it("reacts to lesson navigation and links the first lesson back to the overview", () => {
    const current = ref<CoursePage | undefined>(lessons[0]);
    const model = useCourseReaderModel({
      course,
      page: current,
      lessons,
      inputValues: computed(() => ({ suffix: "JNF" })),
      breadcrumbRoot: { label: "Courses", to: "/courses" }
    });

    current.value = lessons[1];

    expect(model.currentLessonIndex.value).toBe(0);
    expect(model.breadcrumbItems.value.at(-1)).toEqual({
      label: course.title,
      to: course.path,
      icon: undefined
    });
    expect(model.surround.value[0]).toEqual({
      title: "Course overview",
      description: "Learn JNF",
      path: "/courses/demo"
    });
  });
});
