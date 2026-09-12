import { parseComarkCourse } from "../utils/comark-course";

export default defineCachedEventHandler(async () => {
  const storage = useStorage("assets:comark-course");
  const keys = (await storage.getKeys()).filter((key) => key.endsWith(".md")).sort();
  return Promise.all(keys.map(async (key) => {
    const source = await storage.getItem<string>(key);
    if (typeof source !== "string") throw createError({ statusCode: 500, statusMessage: "Missing pilot source" });
    return parseComarkCourse(source, key);
  }));
}, { maxAge: 60 * 60 });
