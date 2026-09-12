/** Serializable code data. Vue components are created only by the code panel. */
export type CourseCodeToken = string | {
  tag: string;
  props: Record<string, unknown>;
  children: CourseCodeToken[];
};

export interface CourseCodeFile {
  path: string;
  code: string;
  language?: string;
  icon?: string;
  props: Record<string, unknown>;
  tokens: CourseCodeToken[];
}

export interface CourseCodeStep<T extends CourseCodeFile = CourseCodeFile> {
  index: number;
  files: T[];
}

export interface ResolvedCourseCodeFile extends CourseCodeFile {
  sourcePath: string;
}

export interface CourseCodeItem {
  label: string;
  file: CourseCodeFile;
  icon?: string;
}
