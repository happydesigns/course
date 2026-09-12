import { fileURLToPath } from "node:url";
import { defineVitestProject } from "@nuxt/test-utils/config";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: ["test/*.test.ts"],
          exclude: ["test/*.nuxt.test.ts"]
        }
      },
      await defineVitestProject({
        test: {
          name: "nuxt",
          include: ["test/*.nuxt.test.ts"],
          environment: "nuxt",
          environmentOptions: {
            nuxt: {
              rootDir: fileURLToPath(new URL("./test/fixtures/runtime", import.meta.url))
            }
          }
        }
      })
    ]
  }
});
