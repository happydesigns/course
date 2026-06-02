#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
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
  console.error("Usage: course validate <path-to-course.json|path-to-course.md>");
}
