import { courses } from "../../utils/course-content";
export default defineEventHandler(event => {
  const request = toWebRequest(event);
  // H3's mounted path excludes Nuxt's app base; the original Request URL does not.
  return courses.handler(new Request(new URL(event.path, request.url), request));
});
