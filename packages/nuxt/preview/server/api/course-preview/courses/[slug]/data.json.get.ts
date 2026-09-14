import { previewContent } from '../../../../utils/course-content';
import { toCoursePage } from '../../../../../../app/utils/course-page';

export default defineEventHandler(async event => {
  const slug = getRouterParam(event, 'slug');
  const root = '/courses/' + slug;
  const entries = (await previewContent.list()).filter(entry => entry.path === root || entry.path.startsWith(root + '/'));
  if (!entries.some(entry => entry.path === root)) throw createError({ statusCode: 404, statusMessage: 'Course not found' });
  return Promise.all(entries.map(async entry => toCoursePage((await previewContent.get(entry.path))!)));
});
