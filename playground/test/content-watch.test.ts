import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it, vi } from "vitest";
import { createPreviewContent } from "../../packages/nuxt/preview/content";

it("keeps initial, changed, added and removed filesystem documents at the same course paths", async () => {
  const dir = await mkdtemp(join(tmpdir(), "course-watch-"));
  const folder = join(dir, "courses", "watch-smoke");
  await mkdir(folder, { recursive: true });
  const overview = join(folder, "0.index.md");
  const lesson = join(folder, "1.lesson.md");
  const markdown = (title: string) => `---\ntitle: ${title}\n---\n\n${title}\n`;
  await writeFile(overview, markdown("Initial"), "utf8");
  const content = createPreviewContent(dir);
  let stop: (() => Promise<void>) | undefined;
  try {
    await content.init({ partial: false, ignoreCache: true });
    expect((await content.list()).map(file => file.path)).toEqual(["/courses/watch-smoke"]);
    stop = await content.watch();

    for (const title of ["Updated once", "Updated twice"]) {
      await writeFile(overview, markdown(title), "utf8");
      await vi.waitFor(async () => {
        const entries = await content.list();
        expect(entries.map(file => file.path)).toEqual(["/courses/watch-smoke"]);
        expect(entries[0]!.data.title).toBe(title);
        expect((await content.get("/courses/watch-smoke"))!.data.title).toBe(title);
      }, { timeout: 10000 });
    }

    await writeFile(lesson, markdown("Added"), "utf8");
    await vi.waitFor(async () => {
      expect((await content.list()).map(file => file.path).sort()).toEqual([
        "/courses/watch-smoke", "/courses/watch-smoke/lesson"
      ]);
    }, { timeout: 10000 });

    await rm(lesson);
    await vi.waitFor(async () => {
      expect((await content.list()).map(file => file.path)).toEqual(["/courses/watch-smoke"]);
    }, { timeout: 10000 });
  } finally {
    await stop?.();
    await rm(dir, { recursive: true, force: true });
  }
}, 30000);
