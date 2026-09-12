import type { Toc } from "comark/plugins/toc";
import type { MarkdownDocument } from "comark";
import type { CourseInput as CoreCourseInput } from "@happydesigns/course";

export interface CourseAuthor {
  name: string;
  to?: string;
  avatar?: {
    src?: string;
    alt?: string;
  };
}

export type CourseInput = CoreCourseInput;

export interface CoursePage extends Pick<MarkdownDocument, "nodes"> {
  meta: { toc?: Toc; [key: string]: unknown };
  path: string;
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

/** Catalogs can provide extracted checkpoints without a complete lesson body. */
export type CourseProgressLesson = Pick<CoursePage, 'path' | 'optional' | 'checkpoints'> & {
  nodes?: CoursePage['nodes'];
};

export interface CourseBackLink {
  label: string;
  to: string;
  icon?: string;
}

/** Persistence adapter for learner progress, parameters, and reader preferences. */
export interface CourseStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}
