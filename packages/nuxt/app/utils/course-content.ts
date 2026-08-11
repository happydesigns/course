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

export function getCourseCheckpointIds(value: unknown): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();

  function visit(entry: unknown): void {
    if (Array.isArray(entry)) {
      if (entry[0] === "course-checkpoint") {
        addCheckpointId(readStringProp(entry[1], "id"));
      }

      entry.forEach(visit);
      return;
    }

    if (!isRecord(entry)) {
      return;
    }

    if (entry.tag === "course-checkpoint") {
      addCheckpointId(
        readStringProp(entry.props, "id") ?? readStringProp(entry.attributes, "id")
      );
    }

    Object.values(entry).forEach(visit);
  }

  function addCheckpointId(id: string | undefined): void {
    if (id && !seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  }

  visit(value);
  return ids;
}

/**
 * Build the minimal secondary body needed to collect cumulative project files.
 * The original code-tree nodes stay intact so ContentRenderer can still turn
 * their code blocks into the canonical VNodes used by the project stage.
 */
export function toCourseCodeCollectionBody<T>(value: T): T {
  if (Array.isArray(value)) {
    return collectCourseCodeTreeNodes(value) as T;
  }

  if (!isRecord(value)) {
    return value;
  }

  if (Array.isArray(value.value)) {
    return {
      ...value,
      value: collectCourseCodeTreeNodes(value.value)
    } as T;
  }

  if (Array.isArray(value.children)) {
    return {
      ...value,
      children: collectCourseCodeTreeNodes(value.children)
    } as T;
  }

  return value;
}

function collectCourseCodeTreeNodes(value: unknown): unknown[] {
  const nodes: unknown[] = [];

  function visit(entry: unknown): void {
    if (isMinimarkElement(entry)) {
      if (entry[0] === "code-tree-intersection") {
        nodes.push(entry);
        return;
      }

      entry.slice(2).forEach(visit);
      return;
    }

    if (Array.isArray(entry)) {
      entry.forEach(visit);
      return;
    }

    if (!isRecord(entry)) {
      return;
    }

    if (entry.tag === "code-tree-intersection") {
      nodes.push(entry);
      return;
    }

    visit(entry.children);
  }

  visit(value);
  return nodes;
}

function isMinimarkElement(value: unknown): value is unknown[] & [string] {
  return Array.isArray(value) && typeof value[0] === "string";
}

function readStringProp(value: unknown, key: string): string | undefined {
  return isRecord(value) && typeof value[key] === "string" && value[key].length > 0
    ? value[key]
    : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
