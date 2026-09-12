import { afterEach, describe, expect, it } from "vitest";
import { computed, defineComponent, h, nextTick, ref } from "vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { useCourseCodeWorkspace } from "../app/composables/useCourseCodeWorkspace";
import { useCourseCodeState, type CourseCodeState } from "../app/composables/useCourseCodeState";
import { extractCourseCodeDocument } from "../app/utils/course-code-document";

const code = (path: string, value: string) => ["code-tree-intersection", {}, ["pre", { filename: path, code: value }, ["code", {}, value]]];
const steps = (...nodes: unknown[]) => extractCourseCodeDocument({ value: nodes }).steps;
const wrappers: Array<{ unmount: () => void }> = [];
afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()));

async function mountWorkspace() {
  const page = ref("first");
  const input = ref({ name: "alpha" });
  const ready = ref(false);
  const history = ref(steps(code("{{ $doc.input.name }}.ts", "baseline {{ $doc.input.name }}"), code("keep.ts", "keep"), code("{{ $doc.input.name }}.ts", "latest baseline")));
  const current = ref(steps(code("{{ $doc.input.name }}.ts", "first {{ $doc.input.name }}"), code("later.ts", "later")));
  let state!: CourseCodeState;
  let workspace!: ReturnType<typeof useCourseCodeWorkspace>;
  const Activator = defineComponent({ setup() { state = useCourseCodeState()!; return () => h("div"); } });
  const wrapper = await mountSuspended(defineComponent({ setup() {
    workspace = useCourseCodeWorkspace({ currentPagePath: computed(() => page.value), history: computed(() => history.value), steps: computed(() => current.value), inputValues: computed(() => input.value), inputsReady: ready });
    return () => h(Activator);
  } }));
  wrappers.push(wrapper);
  return { workspace, state, page, input, ready, history, current };
}

describe("code workspace in Nuxt", () => {
  it("loads history without rendering any historical components, after inputs restore", async () => {
    const { workspace, state, ready } = await mountWorkspace();
    state.activate(1);
    expect(workspace.items.value).toEqual([]);
    ready.value = true;
    await nextTick();
    expect(workspace.items.value.map((item) => item.label)).toEqual(["alpha.ts", "keep.ts"]);
    expect(workspace.activePath.value).toBe("alpha.ts");
    expect(workspace.changedPaths.value.size).toBe(0);
  });

  it("rebuilds cumulative state and changed-file markers when scrolling in either direction", async () => {
    const { workspace, state, ready } = await mountWorkspace();
    ready.value = true;
    state.activate(1);
    expect(workspace.items.value.map((item) => item.file.code)).toEqual(["first alpha", "keep", "later"]);
    expect([...workspace.changedPaths.value]).toEqual(["later.ts"]);
    state.activate(0);
    expect(workspace.items.value.map((item) => item.label)).toEqual(["alpha.ts", "keep.ts"]);
    expect(workspace.activePath.value).toBe("alpha.ts");
    state.resetProgression();
    expect(workspace.items.value[0]!.file.code).toBe("latest baseline");
    expect(workspace.changedPaths.value.size).toBe(0);
  });

  it("keeps selection, code and changed paths synchronized across repeated input edits", async () => {
    const { workspace, state, input, ready } = await mountWorkspace();
    ready.value = true;
    state.activate(0);
    for (const name of ["beta", "gamma"]) {
      input.value = { name };
      await nextTick();
      expect(workspace.activePath.value).toBe(`${name}.ts`);
      expect(workspace.items.value[0]!.file.code).toBe(`first ${name}`);
      expect([...workspace.changedPaths.value]).toEqual([`${name}.ts`]);
    }
    workspace.activePath.value = "keep.ts";
    input.value = { name: "delta" };
    expect(workspace.activePath.value).toBe("keep.ts");
  });

  it("resets on route reuse without mounting new workspace or history components", async () => {
    const { workspace, state, page, current, history, ready } = await mountWorkspace();
    ready.value = true;
    state.activate(1);
    page.value = "second";
    history.value = steps(code("next.ts", "new baseline"));
    current.value = steps(code("future.ts", "hidden"));
    await nextTick();
    expect(workspace.items.value.map((item) => item.label)).toEqual(["next.ts"]);
    expect(workspace.activePath.value).toBe("next.ts");
    expect(workspace.changedPaths.value.size).toBe(0);
    state.activate(0);
    expect(workspace.items.value.map((item) => item.label)).toEqual(["next.ts", "future.ts"]);
  });
});
