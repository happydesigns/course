import type { CoursePage } from "../app/types/course";
import { afterEach, describe, expect, it } from "vitest";
import { defineComponent, h, nextTick, ref } from "vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { useCourseInputs } from "../app/composables/useCourseInputs";
import { provideCourseStorage } from "../app/composables/useCourseStorage";
import { provideCourseInputValues } from "../app/composables/useCourseInputState";
import CourseVariant from "../app/components/CourseVariant.vue";
import CourseParameters from "../app/components/CourseParameters.vue";

const wrappers: Array<{ unmount: () => void }> = [];
afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()));
const inputs = [
  { id: "ide", label: "Editor", sharedId: "test.editor", options: [{ value: "eclipse", label: "Eclipse" }, { value: "vscode", label: "VS Code" }], defaultValue: "eclipse" },
  { id: "name", label: "Name", defaultValue: "example" },
  { id: "shell", label: "Shell", options: ["Bash", { value: "pwsh", label: "PowerShell" }], allowCustom: true }
];

async function readers(stored: Record<string, string> = {}) {
  const state: Record<string, ReturnType<typeof useCourseInputs>> = {};
  const current = ref("a");
  const Reader = defineComponent({ props: { id: { type: String, required: true } }, setup(props) {
    const controller = useCourseInputs({ course: { inputs } as CoursePage, courseKey: () => props.id === "route" ? current.value : props.id, enabled: true });
    state[props.id] = controller;
    provideCourseInputValues(controller.resolvedValues);
    return () => h("div", { "data-reader": props.id }, [
      h(CourseParameters, { inputs, values: controller.values.value, defaultOpen: true, onUpdate: controller.setInputValue }),
      h(CourseVariant, { parameter: "ide", value: "eclipse" }, () => "Eclipse instructions"),
      h(CourseVariant, { parameter: "ide", value: "vscode" }, () => "VS Code instructions")
    ]);
  } });
  const wrapper = await mountSuspended(defineComponent({ setup() {
    provideCourseStorage({ getItem: (key) => stored[key] ?? null, setItem: (key, value) => { stored[key] = value; } });
    return () => h("div", [h(Reader, { id: "route" }), h(Reader, { id: "b" })]);
  } }));
  wrappers.push(wrapper);
  return { state, current, stored, wrapper };
}

describe("native parameters in Nuxt", () => {
  it("shares opted-in inputs live but keeps local values and route changes separate", async () => {
    const { state, current, stored } = await readers();
    state.route!.setInputValue(inputs[0]!, "vscode");
    state.route!.setInputValue(inputs[1]!, "my-course");
    expect(state.b!.resolvedValues.value.ide).toBe("vscode");
    expect(state.b!.resolvedValues.value.name).toBe("example");
    current.value = "b";
    await nextTick();
    expect(state.route!.resolvedValues.value.name).toBe("example");
    current.value = "a";
    await nextTick();
    expect(state.route!.resolvedValues.value.name).toBe("my-course");
    expect(stored["course-input:shared:test.editor"]).toBe("vscode");
    expect(stored["course:a:input:name"]).toBe("my-course");
  });
  it("restores shared values, filters instructions, and isolates storage providers", async () => {
    const first = await readers({ "course-input:shared:test.editor": "vscode" });
    expect(first.wrapper.text()).toContain("VS Code instructions");
    expect(first.wrapper.text()).not.toContain("Eclipse instructions");
    const second = await readers();
    expect(second.state.route!.resolvedValues.value.ide).toBe("eclipse");
  });
  it("falls back from obsolete fixed values and rejects unsupported selections", async () => {
    const { state } = await readers({ "course-input:shared:test.editor": "removed-ide" });
    expect(state.route!.resolvedValues.value.ide).toBe("eclipse");
    state.route!.setInputValue(inputs[0]!, "unknown");
    expect(state.route!.resolvedValues.value.ide).toBe("eclipse");
  });
  it("accepts arbitrary text through Nuxt UI autocomplete and keeps it after remount", async () => {
    const { wrapper, state, stored } = await readers();
    const shell = wrapper.get('[data-reader="route"] input[aria-label="Shell"]');
    await shell.setValue("Power");
    const suggestion = document.body.querySelector('[role="option"]');
    expect(suggestion?.textContent).toContain("PowerShell");
    suggestion?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    suggestion?.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
    suggestion?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    expect(state.route!.resolvedValues.value.shell).toBe("pwsh");
    await shell.setValue("Fish");
    expect(state.route!.resolvedValues.value.shell).toBe("Fish");
    await shell.trigger("blur");
    expect(state.route!.resolvedValues.value.shell).toBe("Fish");
    const restored = await readers(stored);
    expect(restored.state.route!.resolvedValues.value.shell).toBe("Fish");
  });
});
