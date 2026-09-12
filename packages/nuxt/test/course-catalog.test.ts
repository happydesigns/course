import { describe, expect, it } from 'vitest';
import { courseCatalogEntry } from '../preview/app/utils/course-catalog';
import { progressSummary } from '../app/composables/useCourseProgress';

describe('course catalog payload', () => {
  it('preserves partial progress, optional lessons and body checkpoint precedence', () => {
    const lesson = {
      path: '/courses/demo/lesson', title: 'Lesson', description: 'Description',
      pageType: 'lesson' as const, courseId: 'demo', optional: false,
      checkpoints: ['outdated'],
      body: { type: 'minimal' as const, value: [
        ['course-checkpoint', { id: 'first' }],
        ['course-checkpoint', { id: 'second' }]
      ] }
    };
    const optional = { ...lesson, path: '/courses/demo/optional', optional: true };
    const data = { completedLessons: [], completedCheckpoints: { [lesson.path]: ['first'] } };
    const compact = [lesson, optional].map(courseCatalogEntry);
    expect(compact[0]).not.toHaveProperty('body');
    expect(compact[0]?.checkpoints).toEqual(['first', 'second']);
    expect(compact[0]?.title).toBe('Lesson');
    expect(progressSummary(data, compact)).toEqual(progressSummary(data, [lesson, optional]));
    expect(progressSummary(data, compact)).toEqual({ completed: 0, total: 1, percent: 50 });
  });

  it('retains declared checkpoints when none are embedded in the body', () => {
    const entry = courseCatalogEntry({
      path: '/lesson', title: 'Lesson', description: '', checkpoints: ['declared'],
      body: { type: 'minimal', value: [] }
    });
    expect(entry.checkpoints).toEqual(['declared']);
    expect(entry).not.toHaveProperty('body');
  });
});
