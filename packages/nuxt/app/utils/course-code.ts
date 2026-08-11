import type { VNode } from "vue";
import { createVNode } from "vue";
import {
  interpolateCourseInputPlaceholders,
  interpolateCourseTextSegments
} from "./course-inputs";

export function interpolateCourseCodeVNode(
  vnode: VNode,
  inputValues: Readonly<Record<string, string>>
): VNode {
  const isHighlightedCodeBlock = typeof vnode.props?.code === "string";

  return createVNode(
    vnode.type,
    interpolateCourseInputPlaceholders(vnode.props ?? {}, inputValues),
    interpolateVNodeChildren(
      vnode.children,
      inputValues,
      isHighlightedCodeBlock
    ) as VNode["children"]
  );
}

function interpolateVNodeChildren(
  value: unknown,
  inputValues: Readonly<Record<string, string>>,
  interpolateAcrossTextNodes = false
): unknown {
  if (interpolateAcrossTextNodes && !isSlotChildren(value)) {
    return interpolateVNodeTextForest(value, inputValues);
  }

  if (typeof value === "string") {
    return interpolateCourseInputPlaceholders(value, inputValues);
  }

  if (Array.isArray(value)) {
    return value.map((entry) =>
      isVNode(entry)
        ? interpolateCourseCodeVNode(entry, inputValues)
        : interpolateVNodeChildren(entry, inputValues)
    );
  }

  if (isSlotChildren(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([name, slot]) => [
        name,
        typeof slot === "function"
          ? (...args: unknown[]) =>
              interpolateAcrossTextNodes
                ? interpolateVNodeTextForest(
                    (slot as (...slotArgs: unknown[]) => unknown)(...args),
                    inputValues
                  )
                : interpolateVNodeChildren(
                    (slot as (...slotArgs: unknown[]) => unknown)(...args),
                    inputValues
                  )
          : slot
      ])
    );
  }

  return value;
}

function interpolateVNodeTextForest(
  value: unknown,
  inputValues: Readonly<Record<string, string>>
): unknown {
  const segments: string[] = [];
  collectVNodeTextSegments(value, segments);
  const renderedSegments = interpolateCourseTextSegments(segments, inputValues);
  let segmentIndex = 0;

  function rebuild(entry: unknown): unknown {
    if (typeof entry === "string") {
      const rendered = renderedSegments[segmentIndex] ?? entry;
      segmentIndex += 1;
      return rendered;
    }

    if (Array.isArray(entry)) {
      return entry.map(rebuild);
    }

    if (isVNode(entry)) {
      return createVNode(
        entry.type,
        interpolateCourseInputPlaceholders(entry.props ?? {}, inputValues),
        rebuild(entry.children) as VNode["children"]
      );
    }

    return entry;
  }

  return rebuild(value);
}

function collectVNodeTextSegments(value: unknown, segments: string[]): void {
  if (typeof value === "string") {
    segments.push(value);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => collectVNodeTextSegments(entry, segments));
    return;
  }

  if (isVNode(value)) {
    collectVNodeTextSegments(value.children, segments);
  }
}

function isSlotChildren(value: unknown): value is { default: () => VNode[] } {
  return typeof value === "object" && value !== null && "default" in value;
}

function isVNode(value: unknown): value is VNode {
  return typeof value === "object" && value !== null && "type" in value;
}
