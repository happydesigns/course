import type { ComputedRef, MaybeRefOrGetter } from "vue";
import type { CourseBackLink, CoursePage } from "../types/course";
import { computed, toValue } from "vue";
import { getCourseCheckpointIds } from "../utils/course-content";
import { interpolateCourseInputPlaceholders } from "../utils/course-inputs";
import { extractCourseCodeDocument } from "../utils/course-code-document";

export interface CourseSurroundLink {
  [key: string]: unknown;
  title: string;
  description?: string;
  path: string;
}

export interface CoursePageAnchor {
  label: string;
  to: string;
  step: number;
}

export function useCourseReaderModel(options: {
  course: MaybeRefOrGetter<CoursePage>;
  page: MaybeRefOrGetter<CoursePage | undefined>;
  lessons: MaybeRefOrGetter<CoursePage[]>;
  inputValues: ComputedRef<Readonly<Record<string, string>>>;
  breadcrumbRoot: MaybeRefOrGetter<CourseBackLink | undefined>;
  overviewLabel?: MaybeRefOrGetter<string>;
}) {
  const currentPage = computed(() => withDerivedCheckpoints(
    toValue(options.page) ?? toValue(options.course)
  ));
  const orderedLessons = computed(() =>
    [...toValue(options.lessons)]
      .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
      .map(withDerivedCheckpoints)
  );
  const currentLessonIndex = computed(() =>
    orderedLessons.value.findIndex((lesson) => lesson.path === currentPage.value.path)
  );
  const isLesson = computed(() => currentPage.value.pageType === "lesson");
  const isCourseExit = computed(() => !isLesson.value || (
    currentLessonIndex.value >= 0 && (
      currentLessonIndex.value === orderedLessons.value.length - 1
      || currentPage.value.path === orderedLessons.value.findLast(lesson => !lesson.optional)?.path
    )
  ));
  const codeDocument = computed(() => extractCourseCodeDocument(currentPage.value.nodes));
  const codeSteps = computed(() => codeDocument.value.steps);
  const renderedPage = computed<CoursePage>(() => ({
    ...currentPage.value,
    title: interpolateCourseInputPlaceholders(currentPage.value.title, options.inputValues.value),
    description: interpolateCourseInputPlaceholders(
      currentPage.value.description,
      options.inputValues.value
    ),
    nodes: interpolateCourseInputPlaceholders(codeDocument.value.body, options.inputValues.value)
  }));
  // Keep original placeholders so changing an input can resolve every file again.
  const historyPages = computed<CoursePage[]>(() =>
    orderedLessons.value
      .slice(0, Math.max(0, currentLessonIndex.value))
  );
  const codeHistory = computed(() => historyPages.value.flatMap((page) => extractCourseCodeDocument(page.nodes).steps));
  const breadcrumbItems = computed(() => {
    const root = toValue(options.breadcrumbRoot);
    const items = root
      ? [{ label: root.label, to: root.to, icon: root.icon }]
      : [];

    if (isLesson.value) {
      items.push({ label: toValue(options.course).title, to: toValue(options.course).path, icon: undefined });
    }

    return items;
  });
  const currentBreadcrumb = computed(() => ({
    label: renderedPage.value.title,
    to: renderedPage.value.path
  }));
  const navigationTocLinks = computed(() => {
    const links = renderedPage.value.meta?.toc?.links ?? [];
    return isLesson.value && links.length >= 2 ? links : [];
  });
  const pageAnchorLinks = computed<CoursePageAnchor[]>(() =>
    navigationTocLinks.value.map((link, index) => ({
      label: link.text,
      to: `#${link.id}`,
      step: index + 1
    }))
  );
  const surround = computed<[CourseSurroundLink | null, CourseSurroundLink | null] | []>(() => {
    const firstLesson = orderedLessons.value[0];

    if (!isLesson.value) {
      return firstLesson
        ? [null, toSurroundLink(firstLesson, options.inputValues.value)]
        : [];
    }

    if (currentLessonIndex.value < 0) {
      return [];
    }

    const previousLesson = orderedLessons.value[currentLessonIndex.value - 1];
    const nextLesson = orderedLessons.value[currentLessonIndex.value + 1];
    return [
      previousLesson
        ? toSurroundLink(previousLesson, options.inputValues.value)
        : toSurroundLink(toValue(options.course), options.inputValues.value, toValue(options.overviewLabel) ?? "Course overview"),
      nextLesson ? toSurroundLink(nextLesson, options.inputValues.value) : null
    ];
  });
  // Nuxt UI renders missing neighbours when an entry is null, although its
  // current public prop type omits null from the array element type.
  const contentSurround = computed<CourseSurroundLink[]>(
    () => surround.value as CourseSurroundLink[]
  );

  return {
    currentPage,
    orderedLessons,
    currentLessonIndex,
    isLesson,
    isCourseExit,
    renderedPage,
    historyPages,
    codeSteps,
    codeHistory,
    breadcrumbItems,
    currentBreadcrumb,
    navigationTocLinks,
    pageAnchorLinks,
    surround,
    contentSurround
  };
}

function withDerivedCheckpoints(page: CoursePage): CoursePage {
  if (page.pageType !== "lesson") {
    return page;
  }

  const derivedCheckpoints = getCourseCheckpointIds(page.nodes);
  return {
    ...page,
    checkpoints: derivedCheckpoints.length > 0
      ? derivedCheckpoints
      : page.checkpoints ?? []
  };
}

function toSurroundLink(
  page: CoursePage,
  values: Readonly<Record<string, string>>,
  title = page.title
): CourseSurroundLink {
  return {
    title,
    description: interpolateCourseInputPlaceholders(page.description, values),
    path: page.path
  };
}
