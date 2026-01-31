import type { IFileSystem } from "../../src/domain/interfaces.ts";

export class MockFileSystem implements IFileSystem {
  files = new Map<string, { content: string; mtime: number }>();

  async readFile(path: string): Promise<string> {
    const file = this.files.get(path);
    if (!file) throw new Error(`File not found: ${path}`);
    return file.content;
  }

  async writeFile(path: string, content: string): Promise<void> {
    this.files.set(path, { content, mtime: Date.now() });
  }

  async exists(path: string): Promise<boolean> {
    return this.files.has(path);
  }

  async mtime(path: string): Promise<number> {
    const file = this.files.get(path);
    if (!file) throw new Error(`File not found: ${path}`);
    return file.mtime;
  }

  async glob(pattern: string, _cwd: string): Promise<string[]> {
    const suffix = pattern.replace("*", "");
    return [...this.files.keys()].filter((k) => k.endsWith(suffix));
  }

  async mkdir(_path: string): Promise<void> {
    // no-op in memory
  }

  async delete(path: string): Promise<void> {
    this.files.delete(path);
  }

  setFile(path: string, content: string, mtime?: number): void {
    this.files.set(path, { content, mtime: mtime ?? Date.now() });
  }
}
