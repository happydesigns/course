import type { VNode } from "vue";
import { createVNode } from "vue";
import { interpolateCourseInputPlaceholders } from "./course-inputs";

export function interpolateCourseCodeVNode(
  vnode: VNode,
  inputValues: Readonly<Record<string, string>>
): VNode {
  return createVNode(
    vnode.type,
    interpolateCourseInputPlaceholders(vnode.props ?? {}, inputValues),
    interpolateVNodeChildren(vnode.children, inputValues) as VNode["children"]
  );
}

function interpolateVNodeChildren(
  value: unknown,
  inputValues: Readonly<Record<string, string>>
): unknown {
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
              interpolateVNodeChildren(
                (slot as (...slotArgs: unknown[]) => unknown)(...args),
                inputValues
              )
          : slot
      ])
    );
  }

  return value;
}

function isSlotChildren(value: unknown): value is { default: () => VNode[] } {
  return typeof value === "object" && value !== null && "default" in value;
}

function isVNode(value: unknown): value is VNode {
  return typeof value === "object" && value !== null && "type" in value;
}
