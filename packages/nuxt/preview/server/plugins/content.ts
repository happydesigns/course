import { previewContent } from "../utils/course-content";
export default defineNitroPlugin(async nitro => {
  if (import.meta.dev) {
    const stop = await previewContent.watch();
    nitro.hooks.hook("close", stop);
  }
});
