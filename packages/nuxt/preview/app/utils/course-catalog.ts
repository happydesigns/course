import { getCourseCheckpointIds } from '../../../app/utils/course-content';
import type { CoursePage } from '../../../app/types/course';

type CatalogSource = Pick<CoursePage, 'path' | 'title' | 'description' | 'date' | 'category' | 'authors' | 'courseId' | 'pageType' | 'optional' | 'checkpoints' | 'body'>;

/** Keep the same checkpoint semantics without serializing lesson bodies. */
export function courseCatalogEntry(page: CatalogSource) {
  const { body, ...metadata } = page;
  const derived = getCourseCheckpointIds(body);
  return { ...metadata, checkpoints: derived.length ? derived : page.checkpoints };
}
