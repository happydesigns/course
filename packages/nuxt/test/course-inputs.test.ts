import { describe, expect, it } from "vitest";
import {
  createCourseInputValues,
  interpolateCourseInputPlaceholders
} from "../app/utils/course-inputs";

describe("course input placeholders", () => {
  it("uses explicit values before defaults", () => {
    expect(
      createCourseInputValues(
        [{ id: "project", label: "Project", defaultValue: "starter" }],
        { project: "custom-app" }
      )
    ).toEqual({ project: "custom-app" });
  });

  it("resolves only explicit named placeholders", () => {
    const value = {
      title: "Open {{ $doc.input.project }}",
      body: [{ code: "cd {{ $doc.input.project }}" }],
      unrelated: "PROJECT",
      unknown: "{{ $doc.input.unknown }}"
    };

    expect(interpolateCourseInputPlaceholders(value, { project: "course-app" })).toEqual({
      title: "Open course-app",
      body: [{ code: "cd course-app" }],
      unrelated: "PROJECT",
      unknown: "{{ $doc.input.unknown }}"
    });
  });

  it("keeps defaults available when no value was entered", () => {
    expect(
      createCourseInputValues(
        [{ id: "name", label: "Name", defaultValue: "Ada" }],
        { name: "" }
      )
    ).toEqual({ name: "Ada" });
  });

  it("resolves placeholders split across highlighted code tokens", () => {
    const block = [
      "pre",
      {
        code: "CLASS zcl_helper_{{ $doc.input.groupId }} DEFINITION",
        filename: "ZCL_HELPER_{{ $doc.input.groupId }}.clas.abap"
      },
      [
        "code",
        { __ignoreMap: "" },
        ["span", { class: "keyword" }, "CLASS "],
        ["span", { class: "identifier" }, "zcl_helper_"],
        ["span", { class: "punctuation" }, "{{ "],
        ["span", { class: "variable" }, "$doc.input.groupId"],
        ["span", { class: "punctuation" }, " }}"],
        ["span", {}, " DEFINITION"]
      ]
    ];

    expect(interpolateCourseInputPlaceholders(block, { groupId: "JNF" })).toEqual([
      "pre",
      {
        code: "CLASS zcl_helper_JNF DEFINITION",
        filename: "ZCL_HELPER_JNF.clas.abap"
      },
      [
        "code",
        { __ignoreMap: "" },
        ["span", { class: "keyword" }, "CLASS "],
        ["span", { class: "identifier" }, "zcl_helper_"],
        ["span", { class: "punctuation" }, "JNF"],
        ["span", { class: "variable" }, ""],
        ["span", { class: "punctuation" }, ""],
        ["span", {}, " DEFINITION"]
      ]
    ]);
  });

});

 describe("native Comark inputs", () => {
  it("resolves binding nodes and placeholders split across highlighted tokens", () => {
    const nodes = [["binding", { ":value": "$doc.input.project" }], ["pre", {}, ["code", {}, ["span", {}, "{{ $doc."], ["span", {}, "input.project }}"]]]];
    const resolved = interpolateCourseInputPlaceholders(nodes, { project: "course-app" });
    expect(resolved[0]).toBe("course-app");
    expect(JSON.stringify(resolved)).not.toContain("{{");
    expect(JSON.stringify(nodes)).toContain("{{");
  });
});
