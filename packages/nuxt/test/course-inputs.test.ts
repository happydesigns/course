import { describe, expect, it } from "vitest";
import { h } from "vue";
import { interpolateCourseCodeVNode } from "../app/utils/course-code";
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

  it("re-renders code VNodes from their unchanged placeholder source", () => {
    const source = h("pre", {
      filename: "ZCL_HELPER_{{ $doc.input.groupId }}.clas.abap",
      code: "CLASS zcl_helper_{{ $doc.input.groupId }} DEFINITION"
    });

    const first = interpolateCourseCodeVNode(source, { groupId: "JNF" });
    const second = interpolateCourseCodeVNode(source, { groupId: "ABC" });

    expect(first.props).toMatchObject({
      filename: "ZCL_HELPER_JNF.clas.abap",
      code: "CLASS zcl_helper_JNF DEFINITION"
    });
    expect(second.props).toMatchObject({
      filename: "ZCL_HELPER_ABC.clas.abap",
      code: "CLASS zcl_helper_ABC DEFINITION"
    });
    expect(source.props).toMatchObject({
      filename: "ZCL_HELPER_{{ $doc.input.groupId }}.clas.abap"
    });
  });
});
