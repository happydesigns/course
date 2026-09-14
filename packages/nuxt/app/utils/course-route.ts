export function normalizeCourseRoutePath(path: string): string {
  return path.replace(/\/+$/, "") || "/";
}
