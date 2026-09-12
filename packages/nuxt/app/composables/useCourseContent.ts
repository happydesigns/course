import { comarkContent } from "comark-content/runtime";
import snapshot from "comark-content/sources/snapshot";
import { toCoursePage } from "../utils/course-page";

/** Pre-parsed snapshots work with both Nitro and static hosting. */
export function useCourseContent(basePath = "/api/content") {
  const requestFetch = useRequestFetch();
  const content = comarkContent({
    source: snapshot(() => requestFetch(basePath + "/snapshot.json"))
  });
  return {
    async all() {
      const entries = await content.list();
      return Promise.all(entries.map(async entry => {
        const file = await content.get(entry.path);
        if (!file) throw new Error("Course document missing: " + entry.path);
        return toCoursePage(file);
      }));
    }
  };
}
