#!/usr/bin/env node
import { readFile, readdir, stat } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import type { CourseInput } from "./schema.js";
import { formatValidationPath, validateCourse } from "./validation.js";
import { validateCourseMarkdown } from "./markdown.js";

const args = process.argv.slice(2);
const command = args[0];
const coursePath = args[1];

if (command !== "validate" || !coursePath) {
  printUsage();
  process.exitCode = 2;
} else {
  await validateFile(coursePath);
}

async function validateFile(inputPath: string): Promise<void> {
  const resolvedPath = resolve(process.cwd(), inputPath);

  try {
    if ((await stat(resolvedPath)).isDirectory()) {
      await validateMarkdownDirectory(inputPath, resolvedPath);
      return;
    }

    const raw = await readFile(resolvedPath, "utf8");

    if (isMarkdownPath(resolvedPath)) {
      await validateMarkdownFile(inputPath, resolvedPath, raw);
      return;
    }

    const input = JSON.parse(raw) as unknown;
    const result = validateCourse(input);

    if (result.success && result.course) {
      const stepCount = result.course.lessons.reduce((count, lesson) => count + lesson.steps.length, 0);
      console.log(
        `OK: ${inputPath} is a valid course (${result.course.lessons.length} lesson(s), ${stepCount} step(s)).`
      );
      return;
    }

    console.error(`Validation failed for ${inputPath}:`);

    for (const issue of result.issues) {
      console.error(`- [${issue.code}] ${formatValidationPath(issue.path)}: ${issue.message}`);
    }

    process.exitCode = 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Unable to validate ${inputPath}: ${message}`);
    process.exitCode = 1;
  }
}

async function validateMarkdownDirectory(inputPath: string, resolvedPath: string): Promise<void> {
  const files = await findMarkdownFiles(resolvedPath);

  if (files.length === 0) {
    throw new Error("The course directory does not contain Markdown files.");
  }

  const sources = await Promise.all(
    files.map(async (filePath) => ({
      filePath,
      raw: await readFile(filePath, "utf8")
    }))
  );
  const preliminary = await Promise.all(
    sources.map(({ filePath, raw }) => validateCourseMarkdown(raw, { filePath }))
  );
  const overview = preliminary.find((result) => result.metadata?.pageType === "course");
  const inheritedInputs: readonly CourseInput[] = overview?.metadata?.inputs ?? [];
  let snapshotCount = 0;
  let fileCount = 0;
  let valid = true;

  for (const source of sources) {
    const result = await validateCourseMarkdown(source.raw, {
      filePath: source.filePath,
      inheritedInputs
    });
    snapshotCount += result.snapshots.length;
    fileCount += result.snapshots.reduce((count, snapshot) => count + snapshot.files.length, 0);

    if (!result.success) {
      valid = false;
      const displayPath = relative(resolvedPath, source.filePath).replaceAll("\\", "/");
      console.error(`Validation failed for ${inputPath}/${displayPath}:`);

      for (const issue of result.issues) {
        console.error(`- [${issue.code}] ${formatValidationPath(issue.path)}: ${issue.message}`);
      }
    }
  }

  if (!overview?.metadata) {
    valid = false;
    console.error(`Validation failed for ${inputPath}: no pageType: course overview was found.`);
  }

  if (!valid) {
    process.exitCode = 1;
    return;
  }

  console.log(
    `OK: ${inputPath} is a valid multi-page Markdown course (${files.length - 1} lesson(s), ${snapshotCount} code block(s), ${fileCount} file(s)).`
  );
}

async function findMarkdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(directory, entry.name);
      return entry.isDirectory()
        ? findMarkdownFiles(path)
        : isMarkdownPath(path)
          ? [path]
          : [];
    })
  );
  return files.flat().sort();
}

async function validateMarkdownFile(inputPath: string, resolvedPath: string, raw: string): Promise<void> {
  const result = await validateCourseMarkdown(raw, { filePath: resolvedPath });

  if (result.success && result.metadata) {
    const fileCount = result.snapshots.reduce((count, snapshot) => count + snapshot.files.length, 0);
    console.log(
      `OK: ${inputPath} is a valid Markdown course (${result.snapshots.length} code block(s), ${fileCount} file(s)).`
    );
    return;
  }

  console.error(`Validation failed for ${inputPath}:`);

  for (const issue of result.issues) {
    console.error(`- [${issue.code}] ${formatValidationPath(issue.path)}: ${issue.message}`);
  }

  process.exitCode = 1;
}

function isMarkdownPath(inputPath: string): boolean {
  const extension = extname(inputPath).toLowerCase();
  return extension === ".md" || extension === ".mdc";
}

function printUsage(): void {
  console.error("Usage: course validate <path-to-course.json|path-to-course.md|course-directory>");
}
