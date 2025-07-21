
// src/stores/file-system.ts

import { defineStore } from 'pinia';
import { VirtualFileSystem } from '../lib/file-system';

export const useFileSystemStore = defineStore('file-system', {
  state: () => ({
    vfs: new VirtualFileSystem(),
  }),
  getters: {
    files: (state) => state.vfs.listFiles(),
  },
  actions: {
    createFile(path: string, content: string) {
      this.vfs.writeFile(path, content);
    },
    readFile(path: string) {
      return this.vfs.readFile(path);
    },
    deleteFile(path: string) {
      this.vfs.deleteFile(path);
    },
  },
});
