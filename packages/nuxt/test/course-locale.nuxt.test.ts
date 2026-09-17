import { describe, expect, it } from "vitest";
import { defineComponent, h, nextTick, ref } from "vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import UApp from "@nuxt/ui/components/App.vue";
import { de, en, fr } from "@nuxt/ui/locale";
import CoursePageOutline from "../app/components/CoursePageOutline.vue";
import CourseParameters from "../app/components/CourseParameters.vue";

describe("course language", () => {
  it("follows UApp language changes and falls back to English", async () => {
    const locale = ref(en);
    const wrapper = await mountSuspended(defineComponent({
      setup: () => () => h(UApp, { locale: locale.value }, () => [
        h(CoursePageOutline, { links: [{ label: "First", to: "#first", step: 1 }] }),
        h(CourseParameters, { inputs: [{ id: "name", label: "Name" }], values: {} })
      ])
    }));
    try {
      expect(wrapper.text()).toContain("On this step");
      expect(wrapper.text()).toContain("Course parameters");
      locale.value = de;
      await nextTick();
      expect(wrapper.text()).toContain("In dieser Lektion");
      expect(wrapper.text()).toContain("Kursparameter");
      expect(wrapper.text()).not.toContain("Course parameters");
      locale.value = fr;
      await nextTick();
      expect(wrapper.text()).toContain("On this step");
    } finally {
      wrapper.unmount();
    }
  });
});
