import type { InjectionKey } from "vue";
import type { CourseCodeSource } from "./useCourseCodeState";
import { inject, provide } from "vue";

interface CourseCodeSequence {
  nextStep: () => { index: number; source: CourseCodeSource };
  progressive: boolean;
}

const courseCodeSequenceKey: InjectionKey<CourseCodeSequence> = Symbol("course-code-sequence");

export function provideCourseCodeSequence(pagePath: string, progressive: boolean): void {
  let index = 0;

  provide(courseCodeSequenceKey, {
    progressive,
    nextStep: () => {
      const stepIndex = index++;
      return {
        index: stepIndex,
        source: `course-code:${pagePath}:${stepIndex}`
      };
    }
  });
}

export function useCourseCodeSequence(): CourseCodeSequence | undefined {
  return inject(courseCodeSequenceKey, undefined);
}
