import { courses } from "../utils/course-content";
export default defineNitroPlugin(async nitro => {
  if (import.meta.dev) {
    const stop = await courses.watch();
    nitro.hooks.hook("close", stop);
  }
});
