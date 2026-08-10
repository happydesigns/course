import { fileURLToPath } from "node:url";
import { courseVariantRegistry } from "./schemas/variants";

const courseStyles = fileURLToPath(new URL("./app/assets/css/course.css", import.meta.url));

export default defineNuxtConfig({
  $meta: {
    name: "@happydesigns/course-nuxt"
  },
  extends: ["@happydesigns/ui"],
  components: [
    { path: "./components", pathPrefix: false }
  ],
  css: [courseStyles],
  modules: [
    "@happydesigns/nuxt-variants",
    "@nuxt/ui",
    "@nuxt/content"
  ],
  variants: {
    registry: courseVariantRegistry
  }
});
