import { createHash } from "node:crypto";
import {
  closeSync,
  existsSync,
  openSync,
  readFileSync,
  realpathSync,
  unlinkSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const commandArguments = process.argv.slice(2);

if (commandArguments.length === 0) {
  console.error("Usage: node scripts/with-nuxt-lock.mjs <command> [...arguments]");
  process.exit(2);
}

const repositoryRoot = realpathSync(fileURLToPath(new URL("..", import.meta.url)));
const repositoryId = createHash("sha256").update(repositoryRoot).digest("hex").slice(0, 16);
const lockPath = join(tmpdir(), `happydesigns-course-nuxt-${repositoryId}.lock`);
const requestedCommand = commandArguments.join(" ");

acquireLock();

let released = false;

function releaseLock() {
  if (released) {
    return;
  }

  released = true;
  try {
    unlinkSync(lockPath);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      console.error(`Unable to release Nuxt workspace lock at ${lockPath}.`, error);
    }
  }
}

process.once("exit", releaseLock);

const [rawCommand, ...rawArgs] = commandArguments;
const { command, args } = resolveCommand(rawCommand, rawArgs);
const child = spawn(command, args, {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit"
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    child.kill(signal);
  });
}

child.once("error", (error) => {
  console.error(`Unable to start "${requestedCommand}".`, error);
  releaseLock();
  process.exitCode = 1;
});

child.once("exit", (code, signal) => {
  releaseLock();
  process.exitCode = code ?? signalExitCode(signal);
});

function acquireLock() {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const descriptor = openSync(lockPath, "wx");
      writeFileSync(descriptor, JSON.stringify({
        pid: process.pid,
        command: requestedCommand,
        startedAt: new Date().toISOString(),
        repositoryRoot
      }, null, 2));
      closeSync(descriptor);
      return;
    } catch (error) {
      if (error?.code !== "EEXIST") {
        throw error;
      }

      const owner = readLockOwner();
      if (owner?.pid && isProcessRunning(owner.pid)) {
        console.error([
          "Nuxt workspace is already in use.",
          `Active command: ${owner.command ?? "unknown"}`,
          `Process: ${owner.pid}`,
          "Stop the development server before running another Nuxt build or typecheck."
        ].join("\n"));
        process.exit(1);
      }

      try {
        unlinkSync(lockPath);
      } catch (unlinkError) {
        if (unlinkError?.code !== "ENOENT") {
          throw unlinkError;
        }
      }
    }
  }

  throw new Error(`Unable to acquire Nuxt workspace lock at ${lockPath}.`);
}

function readLockOwner() {
  try {
    return JSON.parse(readFileSync(lockPath, "utf8"));
  } catch {
    return undefined;
  }
}

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === "EPERM";
  }
}

function signalExitCode(signal) {
  if (signal === "SIGINT") {
    return 130;
  }

  if (signal === "SIGTERM") {
    return 143;
  }

  return 1;
}

function resolveCommand(command, args) {
  if (process.platform !== "win32" || command !== "pnpm") {
    return { command, args };
  }

  const pnpmEntryPoints = [
    process.env.npm_execpath,
    join(dirname(process.execPath), "node_modules", "corepack", "dist", "pnpm.js")
  ].filter(Boolean);
  const pnpmEntryPoint = pnpmEntryPoints.find(entryPoint => existsSync(entryPoint));

  if (!pnpmEntryPoint) {
    throw new Error("Unable to locate the pnpm JavaScript entry point on Windows.");
  }

  return {
    command: process.execPath,
    args: [pnpmEntryPoint, ...args]
  };
}
