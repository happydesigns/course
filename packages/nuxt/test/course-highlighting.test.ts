import { describe, expect, it } from "vitest";
import { codeToHast } from "shiki";
import type { Root, Element, Text } from "hast";
import { courseInputHighlighting } from "../highlighting";
import { interpolateCourseTextSegments } from "../app/utils/course-inputs";

function leaves(tree: Root) {
  const result: { content: string; style: string }[] = [];
  function visit(node: Root | Element | Text, style = "") {
    if (node.type === "text") { result.push({ content: node.value, style }); return; }
    if (node.type === "element") style = String(node.properties.style ?? style);
    for (const child of node.children) if (child.type !== "comment" && child.type !== "doctype") visit(child, style);
  }
  visit(tree);
  return result;
}

describe("parameter syntax highlighting", () => {
  it("matches resolved ABAP highlighting for identifiers, strings and following keywords", async () => {
    const template = "CLASS zcl_demo_{{ $doc.input.id }} DEFINITION.\nCLASS zcl_demo_{{ $doc.input.id }} IMPLEMENTATION.\n out->write( 'Hallo {{ $doc.input.name }}' ).";
    const transformer = courseInputHighlighting();
    for (const theme of ["github-light-high-contrast", "github-dark-high-contrast"] as const) {
      for (const id of ["2601", "2699"]) {
        const highlighted = leaves(await codeToHast(template, { lang: "abap", theme, transformers: [transformer] }));
        const resolved = interpolateCourseTextSegments(highlighted.map(token => token.content), { id, name: "Ada" });
        const actual = highlighted.flatMap((token, index) => [...resolved[index]!].map(char => [char, token.style]));
        const code = template.replaceAll("{{ $doc.input.id }}", id).replaceAll("{{ $doc.input.name }}", "Ada");
        const expected = leaves(await codeToHast(code, { lang: "abap", theme }));
        expect(actual).toEqual(expected.flatMap(token => [...token.content].map(char => [char, token.style])));
        expect(highlighted.map(token => token.content).join("")).toBe(template);
      }
    }
  });
  it("leaves ordinary code intact", async () => {
    const options = { lang: "typescript", theme: "github-dark" } as const;
    const code = "const answer = 42";
    expect(await codeToHast(code, { ...options, transformers: [courseInputHighlighting()] }))
      .toEqual(await codeToHast(code, options));
  });
});
