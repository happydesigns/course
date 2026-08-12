export interface CoursePageTransitionContext {
  currentPath: string;
  previousPath?: string;
  nextPath?: string;
}

export function normalizeCourseRoutePath(path: string): string {
  const normalizedPath = path.replace(/\/+$/, "");

  return normalizedPath || "/";
}

export function shouldRunCoursePageTransition(
  toPath: string,
  fromPath: string,
  fromMatchedRouteCount: number,
  isHydrating = false,
  serverRendered = false
): boolean {
  return !(isHydrating && serverRendered)
    && fromMatchedRouteCount > 0
    && normalizeCourseRoutePath(toPath) !== normalizeCourseRoutePath(fromPath);
}

export function useCoursePageTransitionContext() {
  return useState<CoursePageTransitionContext | null>(
    "course-page-transition-context",
    () => null
  );
}
