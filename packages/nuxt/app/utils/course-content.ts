export function hasCourseCodeTree(value: unknown): boolean {
  if (Array.isArray(value)) {
    return (
      value[0] === "code-tree-intersection" ||
      value.some((entry) => hasCourseCodeTree(entry))
    );
  }

  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    record.tag === "code-tree-intersection" ||
    Object.values(record).some((entry) => hasCourseCodeTree(entry))
  );
}
