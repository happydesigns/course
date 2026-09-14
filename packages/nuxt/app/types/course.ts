import type { Toc } from "comark/plugins/toc";
import type { MarkdownDocument } from "comark";
import type { z } from "zod";
import type { courseCollectionSchema } from "../../schemas/collections";
import type { CourseInput as CoreCourseInput } from "@happydesigns/course";

export type CourseAuthor = NonNullable<CoursePage["authors"]>[number];

export type CourseInput = CoreCourseInput;

export type CoursePage = z.infer<typeof courseCollectionSchema> & Pick<MarkdownDocument, "nodes"> & {
  meta: { toc?: Toc; [key: string]: unknown };
  path: string;
};

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
