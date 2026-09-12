import { describe, expect, it } from "vitest";
import { extractCourseCodeDocument } from "../app/utils/course-code-document";
import { courseCodeSnapshot, resolveCourseCodeFile, resolveCourseCodeSteps } from "../app/utils/course-code";

const pre = (filename: string, code: string) => ["pre", { filename, code, language: "ts", highlights: [1] }, ["code", { __ignoreMap: "" }, ["span", { class: "line" }, code]]];
const step = (...files: unknown[]) => ["code-tree-intersection", {}, ...files];

describe("code documents", () => {
  it("normalizes HAST classes so Vue merges them with the code component theme", () => {
    const { steps } = extractCourseCodeDocument({ value: [step([
      "pre", { filename: "app.ts", code: "const a = 1", className: "language-ts shiki" },
      ["code", {}, ["span", { className: ["line", "highlight"] }, "const a = 1"]]
    ])] });
    const file = steps[0]!.files[0]!;
    expect(file.props.class).toBe("language-ts shiki");
    expect(file.props).not.toHaveProperty("className");
    expect(file.tokens).toEqual([{ tag: "code", props: {}, children: [
      { tag: "span", props: { class: ["line", "highlight"] }, children: ["const a = 1"] }
    ] }]);
  });

  it("extracts every named file in source order, including files inside wrappers", () => {
    const body = { type: "minimark", value: [
      pre("outside.ts", "ignore"),
      ["callout", { data: step(pre("prop.ts", "ignore")) }, step(["code-collapse", {}, pre("a.ts", "a"), pre("b.ts", "b")])],
      step(pre("a.ts", "updated")),
      ["course-checkpoint", { id: "done" }, "Done"]
    ] };
    const original = structuredClone(body);
    const result = extractCourseCodeDocument(body);
    expect(result.steps.map((entry) => entry.files.map((file) => [file.path, file.code])))
      .toEqual([[["a.ts", "a"], ["b.ts", "b"]], [["a.ts", "updated"]]]);
    expect(result.steps.map((entry) => entry.index)).toEqual([0, 1]);
    expect(JSON.stringify(result.body)).toContain('"step-index":1');
    expect(body).toEqual(original);
    expect(result.steps[0]!.files[0]).toMatchObject({ language: "ts", props: { highlights: [1] } });
    expect(JSON.parse(JSON.stringify(result.steps))).toEqual(result.steps);
  });

  it("supports object MDC trees and code text without a duplicated code prop", () => {
    const { steps } = extractCourseCodeDocument({ type: "root", children: [{
      tag: "code-tree-intersection", props: {}, children: [{ tag: "pre", props: { label: "app.ts", icon: "file-icon" }, children: [
        { tag: "code", props: {}, children: [{ type: "text", value: "const answer = 42" }] }
      ] }]
    }] });
    expect(steps[0]!.files[0]).toMatchObject({ path: "app.ts", code: "const answer = 42", icon: "file-icon" });
  });

  it("keeps indices stable for empty steps and does not collect nested steps twice", () => {
    const { steps } = extractCourseCodeDocument({ value: [
      step(["pre", { code: "unnamed" }]),
      step(pre("outer.ts", "outer"), step(pre("inner.ts", "inner")))
    ] });
    expect(steps.map((entry) => [entry.index, entry.files.map((file) => file.path)]))
      .toEqual([[0, []], [1, ["outer.ts"]], [2, ["inner.ts"]]]);
  });

  it("resolves filenames, clipboard code and split highlight tokens from immutable sources", () => {
    const code = "CLASS zcl_{{ $doc.input.groupId }} DEFINITION";
    const { steps } = extractCourseCodeDocument({ value: [step([
      "pre", { code, filename: "zcl_{{ $doc.input.groupId }}.abap", language: "abap" },
      ["code", {}, ["span", {}, "CLASS zcl_"], ["span", { style: "color:red" }, "{{ "],
        ["span", {}, "$doc.input.groupId"], ["span", {}, " }}"], ["span", {}, " DEFINITION"]]
    ])] });
    const source = steps[0]!.files[0]!;
    for (const groupId of ["JNF", "ABC", ""]) {
      const file = resolveCourseCodeFile(source, { groupId });
      expect(file.path).toBe(`zcl_${groupId}.abap`);
      expect(file.code).toBe(`CLASS zcl_${groupId} DEFINITION`);
      expect(file.props.code).toBe(file.code);
      const root = file.tokens[0];
      expect(typeof root).toBe("object");
      if (typeof root === "object") {
        expect(root.children.map((token) => typeof token === "object" ? token.children.join("") : token).join("")).toBe(file.code);
      }
    }
    expect(source.code).toBe(code);
    expect(resolveCourseCodeFile(source, {}).code).toBe(code);
  });
});

describe("project snapshots", () => {
  const history = extractCourseCodeDocument({ value: [step(pre("a.ts", "initial")), step(pre("b.ts", "baseline"))] }).steps;
  const current = extractCourseCodeDocument({ value: [step(pre("a.ts", "first")), step(pre("a.ts", "second"), pre("later.ts", "new"))] }).steps;
  const snapshot = (index?: number) => courseCodeSnapshot(history, current, index).map(({ path, code }) => [path, code]);

  it("shows only previous lessons before activation or for an unknown step", () => {
    expect(snapshot()).toEqual([["a.ts", "initial"], ["b.ts", "baseline"]]);
    expect(snapshot(99)).toEqual(snapshot());
  });
  it("includes all preceding steps and uses the latest version of each file", () => {
    expect(snapshot(1)).toEqual([["a.ts", "second"], ["b.ts", "baseline"], ["later.ts", "new"]]);
  });
  it("restores earlier versions and hides later files when scrolling back", () => {
    snapshot(1);
    expect(snapshot(0)).toEqual([["a.ts", "first"], ["b.ts", "baseline"]]);
    expect(snapshot()).toEqual([["a.ts", "initial"], ["b.ts", "baseline"]]);
  });
  it("applies last-write order after resolving filenames that collide", () => {
    const before = extractCourseCodeDocument({ value: [step(pre("{{ $doc.input.name }}.ts", "initial"), pre("app.ts", "middle"))] }).steps;
    const after = extractCourseCodeDocument({ value: [step(pre("{{ $doc.input.name }}.ts", "latest"))] }).steps;
    expect(courseCodeSnapshot(resolveCourseCodeSteps(before, { name: "app" }), resolveCourseCodeSteps(after, { name: "app" }), 0).map(({ path, code }) => [path, code]))
      .toEqual([["app.ts", "latest"]]);
  });
});
