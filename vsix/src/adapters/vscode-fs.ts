import * as fsp from "node:fs/promises";
import * as path from "node:path";
import type { IFileSystem } from "../../../src/domain/interfaces";

/**
 * IFileSystem implementation using Node.js fs APIs.
 * All paths are resolved relative to the workspace root.
 */
export class VsCodeFileSystem implements IFileSystem {
  constructor(private readonly workspaceRoot: string) {}

  private resolve(p: string): string {
    const resolved = path.resolve(this.workspaceRoot, p);
    if (!resolved.startsWith(this.workspaceRoot + path.sep) && resolved !== this.workspaceRoot) {
      throw new Error(`Path "${p}" escapes workspace root`);
    }
    return resolved;
  }

  async readFile(filePath: string): Promise<string> {
    return fsp.readFile(this.resolve(filePath), "utf-8");
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    await fsp.writeFile(this.resolve(filePath), content, "utf-8");
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fsp.access(this.resolve(filePath));
      return true;
    } catch {
      return false;
    }
  }

  async mtime(filePath: string): Promise<number> {
    const stat = await fsp.stat(this.resolve(filePath));
    return stat.mtimeMs;
  }

  async glob(pattern: string, cwd: string): Promise<string[]> {
    const { glob } = await import("node:fs/promises");
    const absoluteCwd = path.resolve(this.workspaceRoot, cwd);
    const results: string[] = [];
    for await (const entry of glob(pattern, { cwd: absoluteCwd })) {
      results.push(entry);
    }
    return results;
  }

  async mkdir(dirPath: string): Promise<void> {
    await fsp.mkdir(this.resolve(dirPath), { recursive: true });
  }

  async delete(filePath: string): Promise<void> {
    try {
      await fsp.unlink(this.resolve(filePath));
    } catch (e: unknown) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    }
  }
}
