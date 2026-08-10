import type { PageCollectionItemBase } from "@nuxt/content";

export interface CourseAuthor {
  name: string;
  to?: string;
  avatar?: {
    src?: string;
    alt?: string;
  };
}

export interface CourseInput {
  id: string;
  label: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface CoursePage extends PageCollectionItemBase {
  title: string;
  description: string;
  version?: string;
  date?: string;
  category?: string;
  authors?: CourseAuthor[];
  inputs?: CourseInput[];
  courseId?: string;
  pageType?: "course" | "lesson";
  order?: number;
  optional?: boolean;
  estimatedMinutes?: number;
  checkpoints?: string[];
  metadata?: Record<string, unknown>;
}

export interface CourseProgressData {
  completedLessons: string[];
  completedCheckpoints: Record<string, string[]>;
  lastVisitedLesson?: string;
}

export interface CourseBackLink {
  label: string;
  to: string;
  icon?: string;
}
