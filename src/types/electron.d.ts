export interface FSEntry {
  name: string;
  isDir: boolean;
  size: number;
  freeSpace?: number;
  modifiedAt: string;
}

export interface ElectronAPI {
  isDesktop: boolean;
  fs: {
    getDrives: () => Promise<{ files: FSEntry[] }>;
    getQuickAccess: () => Promise<Record<string, string>>;
    listFiles: (reqPath: string, mode?: string, forceRefresh?: boolean) => Promise<{ files: FSEntry[] }>;
    readFileString: (reqPath: string, mode?: string) => Promise<string>;
    readFileBase64: (reqPath: string, mode?: string, options?: { thumb?: boolean }) => Promise<string>;
    mkdir: (targetPath: string, name: string, mode?: string) => Promise<{ success: boolean }>;
    rename: (oldPath: string, newPath: string, mode?: string) => Promise<{ success: boolean }>;
    copy: (sourcePath: string, targetPath: string, mode?: string) => Promise<{ success: boolean }>;
    delete: (delPath: string, mode?: string) => Promise<{ success: boolean }>;
    trash: (delPath: string, mode?: string) => Promise<{ success: boolean }>;
    openDefault: (reqPath: string, mode?: string) => Promise<{ success: boolean }>;
    getProperties: (reqPath: string, mode?: string) => Promise<any>;
    upload: (targetPath: string, mode: string | undefined, arrayBuffer: ArrayBuffer) => Promise<{ success: boolean }>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
