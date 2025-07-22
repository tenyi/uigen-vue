
// src/stores/file-system.ts

import { defineStore } from 'pinia';
import { VirtualFileSystem } from '../lib/file-system';

export const useFileSystemStore = defineStore('file-system', {
  state: () => ({
    vfs: new VirtualFileSystem(),
  }),
  getters: {
    files: (state) => state.vfs.listDirectory('/'),
  },
  actions: {
    createFile(path: string, content: string) {
      // 檢查檔案是否存在，如果存在則更新，否則建立
      try {
        this.vfs.updateFile(path, content);
      } catch (error) {
        this.vfs.createFile(path, content);
      }
    },
    readFile(path: string) {
      return this.vfs.readFile(path);
    },
    deleteFile(path: string) {
      this.vfs.deleteFile(path);
    },
  },
});
