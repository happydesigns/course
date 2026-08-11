export interface CoursePageTransitionContext {
  currentPath: string;
  previousPath?: string;
  nextPath?: string;
}

export function useCoursePageTransitionContext() {
  return useState<CoursePageTransitionContext | null>(
    "course-page-transition-context",
    () => null
  );
}
