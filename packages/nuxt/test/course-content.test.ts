import { describe, expect, it } from "vitest";
import {
  getCourseCheckpointIds,
  hasCourseCodeTree,
  toCourseCodeCollectionBody
} from "../app/utils/course-content";

describe("course content capabilities", () => {
  it("finds code intersections in Nuxt Content minimark values", () => {
    expect(hasCourseCodeTree({
      type: "minimark",
      value: [
        ["p", {}, "Introduction"],
        ["code-tree-intersection", {}, ["pre", { language: "text" }, "code"]]
      ]
    })).toBe(true);
  });

  it("keeps prose-only pages in reading mode", () => {
    expect(hasCourseCodeTree({
      type: "minimark",
      value: [["p", {}, "Introduction"]]
    })).toBe(false);
  });

  it("derives checkpoint ids in document order from minimark", () => {
    expect(getCourseCheckpointIds({
      type: "minimark",
      value: [
        ["course-checkpoint", { id: "project-ready" }, "Ready"],
        ["div", {}, ["course-checkpoint", { id: "preview-verified" }, "Verified"]],
        ["course-checkpoint", { id: "project-ready" }, "Duplicate"]
      ]
    })).toEqual(["project-ready", "preview-verified"]);
  });

  it("supports object-shaped MDC nodes", () => {
    expect(getCourseCheckpointIds({
      type: "root",
      children: [
        { type: "element", tag: "course-checkpoint", props: { id: "done" } }
      ]
    })).toEqual(["done"]);
  });

  it("extracts only code intersections for the secondary collection render", () => {
    const nestedIntersection = [
      "code-tree-intersection",
      {},
      ["code-collapse", {}, ["pre", { filename: "src/app.ts" }, "code"]]
    ];
    const directIntersection = [
      "code-tree-intersection",
      {},
      ["pre", { filename: "src/main.ts" }, "code"]
    ];
    const body = {
      type: "minimark",
      value: [
        ["h2", { id: "install", class: "section" }, "Install"],
        ["callout", {}, nestedIntersection],
        ["course-checkpoint", { id: "checkpoint" }, "Done"],
        directIntersection
      ],
      toc: {
        links: [{ id: "install", text: "Install", depth: 2 }]
      }
    };

    const collectionBody = toCourseCodeCollectionBody(body);

    expect(collectionBody).toEqual({
      type: "minimark",
      value: [nestedIntersection, directIntersection],
      toc: {
        links: [{ id: "install", text: "Install", depth: 2 }]
      }
    });
    expect(collectionBody.value[0]).toBe(nestedIntersection);
    expect(collectionBody.value[1]).toBe(directIntersection);
    expect(body.value).toHaveLength(4);
    expect(getCourseCheckpointIds(collectionBody)).toEqual([]);
  });

  it("extracts code intersections from object-shaped content trees", () => {
    const intersection = {
      type: "element",
      tag: "code-tree-intersection",
      props: {},
      children: [{ type: "element", tag: "pre", props: { filename: "app.vue" } }]
    };
    const body = {
      type: "root",
      children: [
        {
          type: "element",
          tag: "section",
          children: [
            { type: "element", tag: "h2", props: { id: "setup" } },
            intersection
          ]
        },
        {
          type: "element",
          tag: "course-checkpoint",
          props: { id: "done" }
        }
      ]
    };

    const collectionBody = toCourseCodeCollectionBody(body);

    expect(collectionBody).toEqual({
      type: "root",
      children: [intersection]
    });
    expect(collectionBody.children[0]).toBe(intersection);
  });
});
