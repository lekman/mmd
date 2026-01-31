import type { IFileSystem } from "../domain/interfaces.ts";

/**
 * Real filesystem adapter using Bun/Node APIs.
 *
 * This is a system adapter — excluded from unit test coverage.
 */
export class NodeFileSystem implements IFileSystem {
  async readFile(path: string): Promise<string> {
    const file = Bun.file(path);
    return file.text();
  }

  async writeFile(path: string, content: string): Promise<void> {
    await Bun.write(path, content);
  }

  async exists(path: string): Promise<boolean> {
    const file = Bun.file(path);
    return file.exists();
  }

  async mtime(path: string): Promise<number> {
    const file = Bun.file(path);
    return file.lastModified;
  }

  async glob(pattern: string, cwd: string): Promise<string[]> {
    const glob = new Bun.Glob(pattern);
    const matches: string[] = [];
    for await (const match of glob.scan({ cwd })) {
      matches.push(match);
    }
    return matches;
  }

  async mkdir(path: string): Promise<void> {
    const { mkdir: fsMkdir } = await import("node:fs/promises");
    await fsMkdir(path, { recursive: true });
  }

  async delete(path: string): Promise<void> {
    const { unlink } = await import("node:fs/promises");
    try {
      await unlink(path);
    } catch {
      // ignore if file does not exist
    }
  }
}
