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
  it("renders fixed values as information and ignores storage and update attempts", async () => {
    const fixed = { ...inputs[0]!, defaultValue: undefined, fixedValue: "eclipse" };
    const stored: Record<string, string> = { "course-input:shared:test.editor": "vscode" };
    const definitions = ref([fixed]);
    let controller!: ReturnType<typeof useCourseInputs>;
    const wrapper = await mountSuspended(defineComponent({ setup() {
      provideCourseStorage({ getItem: key => stored[key] ?? null, setItem: (key, value) => { stored[key] = value; } });
      controller = useCourseInputs({ course: () => ({ inputs: definitions.value }) as CoursePage, courseKey: "fixed-test", enabled: true });
      provideCourseInputValues(controller.resolvedValues);
      return () => h("div", [
        h(CourseParameters, { inputs: definitions.value, values: controller.values.value, defaultOpen: true }),
        h(CourseVariant, { parameter: "ide", value: "eclipse" }, () => "Eclipse instructions"),
        h(CourseVariant, { parameter: "ide", value: "vscode" }, () => "VS Code instructions")
      ]);
    } }));
    wrappers.push(wrapper);
    expect(wrapper.get("dl").text()).toContain("Eclipse");
    expect(wrapper.find("input").exists()).toBe(false);
    expect(wrapper.find('[role="combobox"]').exists()).toBe(false);
    expect(wrapper.find('button[aria-expanded]').exists()).toBe(false);
    expect(wrapper.text()).toContain("Eclipse instructions");
    expect(wrapper.text()).not.toContain("VS Code instructions");
    controller.setInputValue(fixed, "vscode");
    expect(controller.resolvedValues.value.ide).toBe("eclipse");
    expect(stored["course-input:shared:test.editor"]).toBe("vscode");
    definitions.value = [{ ...fixed, fixedValue: "vscode" }];
    await nextTick();
    expect(controller.resolvedValues.value.ide).toBe("vscode");
  });
  it("shows fixed information alongside editable fields", async () => {
    const wrapper = await mountSuspended(CourseParameters, { props: {
      inputs: [{ id: "system", label: "System", fixedValue: "Training" }, inputs[1]!],
      values: {}, defaultOpen: true
    } });
    wrappers.push(wrapper);
    expect(wrapper.get("dl").text()).toContain("Training");
    expect(wrapper.get('input[aria-label="Name"]').exists()).toBe(true);
    expect(wrapper.find('input[aria-label="System"]').exists()).toBe(false);
    expect(wrapper.get('button[aria-expanded]').text()).toContain("(1)");
  });

  it("updates mounted browser readers when another tab changes or clears shared inputs", async () => {
    const input = { id: "name", label: "Name", sharedId: "test.browser-sync", defaultValue: "example" };
    const key = "course-input:shared:test.browser-sync";
    let controller!: ReturnType<typeof useCourseInputs>;
    const wrapper = await mountSuspended(defineComponent({ setup() {
      controller = useCourseInputs({ course: { inputs: [input] } as CoursePage, courseKey: "browser-sync", enabled: true });
      return () => h("p", controller.resolvedValues.value.name);
    } }));
    wrappers.push(wrapper);
    window.dispatchEvent(new StorageEvent("storage", { key, newValue: "from-another-course", storageArea: window.localStorage }));
    await nextTick();
    expect(wrapper.text()).toBe("from-another-course");
    window.dispatchEvent(new StorageEvent("storage", { key, newValue: "ignore-session-storage", storageArea: window.sessionStorage }));
    await nextTick();
    expect(wrapper.text()).toBe("from-another-course");
    window.dispatchEvent(new StorageEvent("storage", { key, newValue: null, storageArea: window.localStorage }));
    await nextTick();
    expect(wrapper.text()).toBe("example");
    controller.setInputValue(input, "local-value");
    window.dispatchEvent(new StorageEvent("storage", { key: null, storageArea: window.localStorage }));
    await nextTick();
    expect(wrapper.text()).toBe("example");
    window.localStorage.removeItem(key);
  });
  it("uses defaults for empty-field placeholders and summaries, then displays entered values", async () => {
    const wrapper = await mountSuspended(CourseParameters, {
      props: {
        inputs: [inputs[0]!, { id: "package", label: "Package", defaultValue: "ZYOUR_PACKAGE" }],
        values: {}
      }
    });
    wrappers.push(wrapper);
    const toggle = wrapper.get('button[aria-expanded]');
    expect(toggle.text()).toContain("Editor: Eclipse");
    expect(toggle.text()).toContain("Package: ZYOUR_PACKAGE");
    expect(toggle.text()).not.toContain("ZEXAMPLE");
    await toggle.trigger("click");
    const field = wrapper.get('input[aria-label="Package"]');
    expect((field.element as HTMLInputElement).value).toBe("");
    expect(field.attributes("placeholder")).toBe("ZYOUR_PACKAGE");
    await wrapper.setProps({ values: { package: "ZMY_PACKAGE" } });
    await toggle.trigger("click");
    expect(toggle.text()).toContain("Package: ZMY_PACKAGE");
    await wrapper.setProps({ inputs: [inputs[0]!, { id: "package", label: "Package", defaultValue: "ZYOUR_PACKAGE", placeholder: "ZEXAMPLE" }] });
    await toggle.trigger("click");
    expect(wrapper.get('input[aria-label="Package"]').attributes("placeholder")).toBe("ZEXAMPLE");
    await toggle.trigger("click");
    await wrapper.setProps({ values: { package: "" } });
    expect(toggle.text()).toContain("Package: ZYOUR_PACKAGE");
  });
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
