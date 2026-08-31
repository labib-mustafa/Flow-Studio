import { exec } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { app } from 'electron';

export interface FSEntry {
  name: string;
  isDir: boolean;
  size: number;
  freeSpace?: number;
  modifiedAt: string;
}

interface CacheEntry {
  timestamp: number;
  files: FSEntry[];
}

const CACHE_TTL_MS = 60000;
const listCache = new Map<string, CacheEntry>();

export class FileSystemService {
  private static invalidateCache(dirPath: string) {
    listCache.delete(dirPath);
  }

  /**
   * Resolve and sanitize a filesystem path.
   * Mirrors the logic from the backend REST API to ensure sandbox boundaries.
   */
  private static resolveFsPath(reqPath: string, mode?: string): string {
    if (mode === 'global') {
      return reqPath ? path.normalize(reqPath) : '';
    }
    const root = path.join(os.homedir(), 'Documents', 'FlowStudio-Data');
    if (!fs.existsSync(root)) {
      fs.mkdirSync(root, { recursive: true });
    }
    const safePath = path.normalize(reqPath || '/').replace(/^(\.\.(\/|\\|$))+/, '');
    return path.join(root, safePath);
  }

  /**
   * Get all logical drives on Windows using WMIC
   */
  static getDrives(): Promise<{ files: FSEntry[] }> {
    return new Promise((resolve, reject) => {
      exec('wmic logicaldisk get name,freespace,size', (error, stdout) => {
        if (error) {
          console.error('[FileSystemService] Error fetching drives:', error);
          return reject(error);
        }

        const lines = stdout.split('\n').map(l => l.trim()).filter(Boolean);
        const drives: FSEntry[] = [];

        // Skip header line
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(/\s+/);
          if (parts.length >= 2) {
            let name = '', freeSpace = 0, totalSize = 0;

            if (parts.length === 3) {
              freeSpace = parseInt(parts[0], 10) || 0;
              name = parts[1];
              totalSize = parseInt(parts[2], 10) || 0;
            } else if (parts.length === 2) {
              name = parts[0];
              if (name.length > 2) {
                name = parts[1];
              }
            } else {
              name = parts[0];
            }

            if (name && name.endsWith(':') && totalSize > 0) {
              drives.push({
                name,
                isDir: true,
                size: totalSize,
                freeSpace,
                modifiedAt: ''
              });
            }
          }
        }
        resolve({ files: drives });
      });
    });
  }

  /**
   * Get quick access locations like Desktop, Documents, Downloads, etc.
   */
  static getQuickAccess(): Record<string, string> {
    const homedir = app.getPath('home');
    return {
      home: homedir,
      desktop: app.getPath('desktop'),
      documents: app.getPath('documents'),
      downloads: app.getPath('downloads'),
      pictures: app.getPath('pictures'),
      videos: app.getPath('videos'),
      music: app.getPath('music')
    };
  }

  static async listFiles(reqPath: string, mode?: string, forceRefresh?: boolean): Promise<{ files: FSEntry[] }> {
    const targetPath = this.resolveFsPath(reqPath, mode);
    
    if (mode === 'global' && !targetPath) {
      return this.getDrives();
    }

    if (!fs.existsSync(targetPath)) {
      return { files: [] };
    }

    if (!forceRefresh && listCache.has(targetPath)) {
      const entry = listCache.get(targetPath)!;
      if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
        return { files: entry.files };
      }
    }

    const entries = await fs.promises.readdir(targetPath, { withFileTypes: true });
    
    // Process stats in batches to prevent event loop blocking and EMFILE errors
    const batchSize = 100;
    const files: FSEntry[] = [];
    
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(async (e) => {
        const ePath = path.join(targetPath, e.name);
        let size = 0, modifiedAt = '';
        try {
          const stat = await fs.promises.stat(ePath);
          size = stat.size;
          modifiedAt = stat.mtime.toISOString();
        } catch (err) {}
        return {
          name: e.name,
          isDir: e.isDirectory(),
          size,
          modifiedAt
        };
      }));
      files.push(...batchResults);
    }

    files.sort((a, b) => {
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      return a.name.localeCompare(b.name);
    });

    listCache.set(targetPath, { timestamp: Date.now(), files });

    return { files };
  }

  /**
   * Read text file contents
   */
  static async readFileString(reqPath: string, mode?: string): Promise<string> {
    const targetPath = this.resolveFsPath(reqPath, mode);
    if (!fs.existsSync(targetPath)) throw new Error('Not found');
    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) throw new Error('Is a directory');
    
    return fs.readFileSync(targetPath, 'utf8');
  }

  /**
   * Read file as Base64, optionally generating a thumbnail via sharp
   */
  static async readFileBase64(reqPath: string, mode?: string, options?: { thumb?: boolean }): Promise<string> {
    const targetPath = this.resolveFsPath(reqPath, mode);
    if (!fs.existsSync(targetPath)) throw new Error('Not found');
    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) throw new Error('Is a directory');

    if (options?.thumb) {
      const ext = path.extname(targetPath).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
        try {
          const buffer = await sharp(targetPath).resize(256, 256, { fit: 'cover' }).toBuffer();
          return buffer.toString('base64');
        } catch (err) {
          // fallback to original if sharp fails
        }
      }
    }

    return fs.readFileSync(targetPath).toString('base64');
  }

  static async mkdir(targetPath: string, name: string, mode?: string): Promise<{ success: boolean }> {
    const dir = this.resolveFsPath(path.join(targetPath || '/', name), mode);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      this.invalidateCache(path.dirname(dir));
    }
    return { success: true };
  }

  static async rename(oldPath: string, newPath: string, mode?: string): Promise<{ success: boolean }> {
    const oldT = this.resolveFsPath(oldPath, mode);
    const newT = this.resolveFsPath(newPath, mode);
    if (fs.existsSync(oldT)) {
      fs.renameSync(oldT, newT);
      this.invalidateCache(path.dirname(oldT));
      this.invalidateCache(path.dirname(newT));
    }
    return { success: true };
  }

  static async copy(sourcePath: string, targetPath: string, mode?: string): Promise<{ success: boolean }> {
    const src = this.resolveFsPath(sourcePath, mode);
    const dest = this.resolveFsPath(targetPath, mode);
    if (!fs.existsSync(src)) throw new Error('Source not found');
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      fs.cpSync(src, dest, { recursive: true });
    } else {
      fs.copyFileSync(src, dest);
    }
    this.invalidateCache(path.dirname(dest));
    return { success: true };
  }

  static async delete(delPath: string, mode?: string): Promise<{ success: boolean }> {
    const targetPath = this.resolveFsPath(delPath, mode);
    if (fs.existsSync(targetPath)) {
      const stat = fs.statSync(targetPath);
      if (stat.isDirectory()) {
        fs.rmSync(targetPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(targetPath);
      }
      this.invalidateCache(path.dirname(targetPath));
    }
    return { success: true };
  }

  static async trash(delPath: string, mode?: string): Promise<{ success: boolean }> {
    const { shell } = require('electron');
    const targetPath = this.resolveFsPath(delPath, mode);
    if (fs.existsSync(targetPath)) {
      await shell.trashItem(targetPath);
      this.invalidateCache(path.dirname(targetPath));
    }
    return { success: true };
  }

  static async openDefault(reqPath: string, mode?: string): Promise<{ success: boolean }> {
    const { shell } = require('electron');
    const targetPath = this.resolveFsPath(reqPath, mode);
    if (fs.existsSync(targetPath)) {
      await shell.openPath(targetPath);
    }
    return { success: true };
  }

  static async getProperties(reqPath: string, mode?: string): Promise<any> {
    const targetPath = this.resolveFsPath(reqPath, mode);
    if (fs.existsSync(targetPath)) {
      const stat = fs.statSync(targetPath);
      return {
        size: stat.size,
        created: stat.birthtime.toISOString(),
        modified: stat.mtime.toISOString(),
        isDirectory: stat.isDirectory()
      };
    }
    throw new Error('Not found');
  }

  static async upload(targetPath: string, mode: string | undefined, arrayBuffer: ArrayBuffer): Promise<{ success: boolean }> {
    const dest = this.resolveFsPath(targetPath, mode);
    const parentDir = path.dirname(dest);
    if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });
    fs.writeFileSync(dest, Buffer.from(arrayBuffer));
    this.invalidateCache(parentDir);
    return { success: true };
  }
}
