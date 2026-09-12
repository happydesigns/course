import { getCourseCheckpointIds } from '../../../app/utils/course-content';
import type { CoursePage } from '../../../app/types/course';

type CatalogSource = Pick<CoursePage, 'path' | 'title' | 'description' | 'date' | 'category' | 'authors' | 'courseId' | 'pageType' | 'optional' | 'checkpoints' | 'nodes'>;

/** Keep the same checkpoint semantics without serializing lesson bodies. */
export function courseCatalogEntry(page: CatalogSource) {
  const { path, title, description, date, category, authors, courseId, pageType, optional, checkpoints, nodes } = page;
  const metadata = { path, title, description, date, category, authors, courseId, pageType, optional, checkpoints };
  const derived = getCourseCheckpointIds(nodes);
  return { ...metadata, checkpoints: derived.length ? derived : page.checkpoints };
}
