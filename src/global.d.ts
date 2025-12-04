// File: src/global.d.ts

declare module "*.css";

// Electron types
interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  onMediaKey: (callback: (key: string) => void) => void;
  removeMediaKeyListener: () => void;
  isElectron: boolean;
  platform: string;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

export {};
