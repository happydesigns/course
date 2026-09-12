import type { CoursePage } from "../app/types/course";
import { computed, ref } from "vue";
import { describe, expect, it } from "vitest";
import {
  getCoursePageTransitionName,
  useCourseReaderModel
} from "../app/composables/useCourseReaderModel";

function page(overrides: Partial<CoursePage>): CoursePage {
  return {
    path: "/courses/demo",
    title: "Demo {{ $doc.input.suffix }}",
    description: "Learn {{ $doc.input.suffix }}",
    nodes: [], meta: { toc: { title: "", searchDepth: 2, depth: 2, links: [] } },
    ...overrides
  } as CoursePage;
}

describe("course reader model", () => {
  it("chooses directional transitions only for sequential course navigation", () => {
    const surround = [
      { path: "/courses/demo/previous", title: "Previous" },
      { path: "/courses/demo/next", title: "Next" }
    ];

    expect(getCoursePageTransitionName("/courses/demo/next", surround))
      .toBe("course-page-forward");
    expect(getCoursePageTransitionName("/courses/demo/previous", surround))
      .toBe("course-page-backward");
    expect(getCoursePageTransitionName("/courses", surround))
      .toBe("course-page");
  });

  const course = page({ pageType: "course", courseId: "demo" });
  const lessons = [
    page({
        path: "/courses/demo/second",
      pageType: "lesson",
      order: 2,
      title: "Second"
    }),
    page({
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

  it("keeps history page bodies unchanged for workspace interpolation", () => {
    const historyBody = [["pre", { filename: "project/{{ $doc.input.suffix }}.ts" }, "code"]] as CoursePage["nodes"];
    const historyLesson = page({
        path: "/courses/demo/history",
      pageType: "lesson",
      order: 1,
      title: "History",
      nodes: historyBody
    });
    const currentLesson = page({
        path: "/courses/demo/current",
      pageType: "lesson",
      order: 2,
      title: "Current"
    });
    const model = useCourseReaderModel({
      course,
      page: currentLesson,
      lessons: [historyLesson, currentLesson],
      inputValues: computed(() => ({ suffix: "JNF" })),
      breadcrumbRoot: { label: "Courses", to: "/courses" }
    });

    expect(model.historyPages.value[0]?.nodes).toBe(historyBody);
    expect(model.historyPages.value[0]?.nodes).toContainEqual([
      "pre",
      { filename: "project/{{ $doc.input.suffix }}.ts" },
      "code"
    ]);
  });

  it("derives lesson checkpoints from the content body", () => {
    const lesson = page({
      path: "/courses/demo/checkpoints",
      pageType: "lesson",
      nodes: [
          ["course-checkpoint", { id: "first" }, "First"],
          ["course-checkpoint", { id: "second" }, "Second"]
        ]
    });
    const model = useCourseReaderModel({
      course,
      page: lesson,
      lessons: [lesson],
      inputValues: computed(() => ({})),
      breadcrumbRoot: undefined
    });

    expect(model.currentPage.value.checkpoints).toEqual(["first", "second"]);
    expect(model.orderedLessons.value[0]?.checkpoints).toEqual(["first", "second"]);
  });

  it("builds same-document links for the lesson outline", () => {
    const lesson = page({
      path: "/courses/demo/outline",
      pageType: "lesson",
      nodes: [],
      meta: {
        toc: {
          title: "",
          searchDepth: 2,
          depth: 2,
          links: [
            { id: "install", text: "Install", depth: 2 },
            { id: "configure", text: "Configure", depth: 2 }
          ]
        }
      }
    });
    const model = useCourseReaderModel({
      course,
      page: lesson,
      lessons: [lesson],
      inputValues: computed(() => ({})),
      breadcrumbRoot: undefined
    });

    expect(model.pageAnchorLinks.value).toEqual([
      {
        label: "Install",
        to: "#install",
        step: 1
      },
      {
        label: "Configure",
        to: "#configure",
        step: 2
      }
    ]);
  });
});
