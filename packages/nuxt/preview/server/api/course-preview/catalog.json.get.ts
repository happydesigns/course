import { previewContent } from '../../utils/course-content';
import { toCoursePage } from '../../../../app/utils/course-page';
import { courseCatalogEntry } from '../../../app/utils/course-catalog';

export default defineEventHandler(async () => {
  const entries = await previewContent.list();
  return Promise.all(entries.map(async entry => courseCatalogEntry(toCoursePage((await previewContent.get(entry.path))!))));
});
