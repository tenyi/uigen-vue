import { v4 as uuidv4 } from 'uuid'
import type {
  VirtualFile,
  VirtualDirectory,
  FileSystemState,
  FileSystemOperation,
  FileSearchOptions,
  FileSearchResult,
  FileSystemWatcher,
  FileSystemEvent,
  FileSystemSnapshot,
  FileMetadata,
} from '@shared/types/file-system'
import {
  FileSystemOperationType,
  FileSystemEventType,
} from '@shared/types/file-system'
import { FileType } from '@shared/types'

/**
 * 虛擬檔案系統
 * 提供完整的檔案和目錄操作功能，支援即時預覽和 AI 工具整合
 */
export class VirtualFileSystem {
  private state: FileSystemState
  private watchers: Map<string, FileSystemWatcher> = new Map()
  private snapshots: Map<string, FileSystemSnapshot> = new Map()
  private maxOperationHistory = 1000

  constructor() {
    this.state = this.initializeState()
  }

  /**
   * 初始化檔案系統狀態
   */
  private initializeState(): FileSystemState {
    const rootId = uuidv4()
    const rootDirectory: VirtualDirectory = {
      id: rootId,
      name: 'root',
      path: '/',
      children: [],
      lastModified: new Date(),
      isDirectory: true,
      metadata: {
        description: 'Root directory',
        isHidden: false,
      },
    }

    return {
      files: new Map(),
      directories: new Map([[rootId, rootDirectory]]),
      operations: [],
      currentPath: '/',
      rootId,
    }
  }

  /**
   * 創建檔案
   */
  createFile(
    path: string,
    content: string = '',
    type?: FileType,
    metadata?: FileMetadata
  ): VirtualFile {
    const normalizedPath = this.normalizePath(path)
    const { directory, filename } = this.parsePath(normalizedPath)

    // 檢查檔案是否已存在
    if (this.getFileByPath(normalizedPath)) {
      throw new Error(`File already exists: ${normalizedPath}`)
    }

    // 確保父目錄存在
    const parentDir = this.ensureDirectoryExists(directory)

    // 推斷檔案類型
    const fileType = type || this.inferFileType(filename)

    // 創建檔案
    const file: VirtualFile = {
      id: uuidv4(),
      name: filename,
      path: normalizedPath,
      content,
      type: fileType,
      size: new Blob([content]).size,
      lastModified: new Date(),
      isDirectory: false,
      parentId: parentDir.id,
      metadata: {
        encoding: 'utf-8',
        mimeType: this.getMimeType(fileType),
        language: this.getLanguage(fileType),
        isExecutable: false,
        permissions: {
          read: true,
          write: true,
          execute: false,
        },
        tags: [],
        ...metadata,
      },
    }

    // 添加到檔案系統
    this.state.files.set(file.id, file)
    parentDir.children.push(file)

    // 記錄操作
    this.recordOperation({
      type: FileSystemOperationType.CREATE_FILE,
      path: normalizedPath,
      content,
      timestamp: new Date(),
    })

    // 觸發事件
    this.emitEvent({
      type: FileSystemEventType.FILE_CREATED,
      path: normalizedPath,
      file,
      timestamp: new Date(),
    })

    return file
  }

  /**
   * 創建目錄
   */
  createDirectory(path: string): VirtualDirectory {
    const normalizedPath = this.normalizePath(path)

    // 檢查目錄是否已存在
    if (this.getDirectoryByPath(normalizedPath)) {
      throw new Error(`Directory already exists: ${normalizedPath}`)
    }

    const { directory: parentPath, filename: dirName } = this.parsePath(normalizedPath)
    const parentDir = this.ensureDirectoryExists(parentPath)

    const newDirectory: VirtualDirectory = {
      id: uuidv4(),
      name: dirName,
      path: normalizedPath,
      parentId: parentDir.id,
      children: [],
      lastModified: new Date(),
      isDirectory: true,
      metadata: {
        description: '',
        tags: [],
        isHidden: false,
      },
    }

    this.state.directories.set(newDirectory.id, newDirectory)
    parentDir.children.push(newDirectory)

    // 記錄操作
    this.recordOperation({
      type: FileSystemOperationType.CREATE_DIRECTORY,
      path: normalizedPath,
      timestamp: new Date(),
    })

    // 觸發事件
    this.emitEvent({
      type: FileSystemEventType.DIRECTORY_CREATED,
      path: normalizedPath,
      directory: newDirectory,
      timestamp: new Date(),
    })

    return newDirectory
  }

  /**
   * 讀取檔案內容
   */
  readFile(path: string): string {
    const file = this.getFileByPath(path)
    if (!file) {
      throw new Error(`File not found: ${path}`)
    }
    return file.content
  }

  /**
   * 更新檔案內容
   */
  updateFile(path: string, content: string): VirtualFile {
    const file = this.getFileByPath(path)
    if (!file) {
      throw new Error(`File not found: ${path}`)
    }

    // const oldContent = file.content // 保留以備將來使用
    file.content = content
    file.size = new Blob([content]).size
    file.lastModified = new Date()

    // 記錄操作
    this.recordOperation({
      type: FileSystemOperationType.UPDATE_FILE,
      path,
      content,
      timestamp: new Date(),
    })

    // 觸發事件
    this.emitEvent({
      type: FileSystemEventType.FILE_UPDATED,
      path,
      file,
      timestamp: new Date(),
    })

    return file
  }

  /**
   * 刪除檔案
   */
  deleteFile(path: string): boolean {
    const file = this.getFileByPath(path)
    if (!file) {
      return false
    }

    // 從父目錄移除
    if (file.parentId) {
      const parentDir = this.state.directories.get(file.parentId)
      if (parentDir) {
        parentDir.children = parentDir.children.filter(child => child.id !== file.id)
      }
    }

    // 從檔案系統移除
    this.state.files.delete(file.id)

    // 記錄操作
    this.recordOperation({
      type: FileSystemOperationType.DELETE_FILE,
      path,
      timestamp: new Date(),
    })

    // 觸發事件
    this.emitEvent({
      type: FileSystemEventType.FILE_DELETED,
      path,
      file,
      timestamp: new Date(),
    })

    return true
  }

  /**
   * 刪除目錄（遞迴）
   */
  deleteDirectory(path: string, recursive: boolean = false): boolean {
    const directory = this.getDirectoryByPath(path)
    if (!directory) {
      return false
    }

    // 檢查是否為根目錄
    if (directory.id === this.state.rootId) {
      throw new Error('Cannot delete root directory')
    }

    // 檢查是否為空目錄
    if (!recursive && directory.children.length > 0) {
      throw new Error('Directory is not empty. Use recursive option to delete.')
    }

    // 遞迴刪除子項目
    if (recursive) {
      for (const child of directory.children) {
        if (child.isDirectory) {
          this.deleteDirectory(child.path, true)
        } else {
          this.deleteFile(child.path)
        }
      }
    }

    // 從父目錄移除
    if (directory.parentId) {
      const parentDir = this.state.directories.get(directory.parentId)
      if (parentDir) {
        parentDir.children = parentDir.children.filter(child => child.id !== directory.id)
      }
    }

    // 從檔案系統移除
    this.state.directories.delete(directory.id)

    // 記錄操作
    this.recordOperation({
      type: FileSystemOperationType.DELETE_DIRECTORY,
      path,
      timestamp: new Date(),
    })

    // 觸發事件
    this.emitEvent({
      type: FileSystemEventType.DIRECTORY_DELETED,
      path,
      directory,
      timestamp: new Date(),
    })

    return true
  }

  /**
   * 移動檔案或目錄
   */
  move(sourcePath: string, targetPath: string): boolean {
    const normalizedSource = this.normalizePath(sourcePath)
    const normalizedTarget = this.normalizePath(targetPath)

    const sourceFile = this.getFileByPath(normalizedSource)
    const sourceDir = this.getDirectoryByPath(normalizedSource)

    if (!sourceFile && !sourceDir) {
      throw new Error(`Source not found: ${normalizedSource}`)
    }

    if (sourceFile) {
      return this.moveFile(sourceFile, normalizedTarget)
    } else if (sourceDir) {
      return this.moveDirectory(sourceDir, normalizedTarget)
    }

    return false
  }

  /**
   * 複製檔案
   */
  copyFile(sourcePath: string, targetPath: string): VirtualFile {
    const sourceFile = this.getFileByPath(sourcePath)
    if (!sourceFile) {
      throw new Error(`Source file not found: ${sourcePath}`)
    }

    return this.createFile(
      targetPath,
      sourceFile.content,
      sourceFile.type,
      { ...sourceFile.metadata }
    )
  }

  /**
   * 搜尋檔案
   */
  searchFiles(options: FileSearchOptions): FileSearchResult[] {
    const results: FileSearchResult[] = []
    const { query, fileTypes, includeContent, caseSensitive, useRegex, maxResults = 100 } = options

    const searchRegex = useRegex
      ? new RegExp(query, caseSensitive ? 'g' : 'gi')
      : new RegExp(this.escapeRegex(query), caseSensitive ? 'g' : 'gi')

    for (const file of this.state.files.values()) {
      // 檔案類型過濾
      if (fileTypes && !fileTypes.includes(file.type)) {
        continue
      }

      const matches: any[] = []
      let score = 0

      // 檔案名稱搜尋
      if (searchRegex.test(file.name)) {
        score += 10
        matches.push({
          line: 0,
          column: 0,
          text: file.name,
          context: `Filename: ${file.name}`,
        })
      }

      // 檔案內容搜尋
      if (includeContent && file.content) {
        const lines = file.content.split('\n')
        lines.forEach((line, lineIndex) => {
          const lineMatches = Array.from(line.matchAll(searchRegex))
          lineMatches.forEach(match => {
            score += 1
            matches.push({
              line: lineIndex + 1,
              column: match.index || 0,
              text: match[0],
              context: line.trim(),
            })
          })
        })
      }

      if (matches.length > 0) {
        results.push({
          file,
          matches,
          score,
        })
      }

      if (results.length >= maxResults) {
        break
      }
    }

    // 按分數排序
    return results.sort((a, b) => b.score - a.score)
  }

  /**
   * 獲取目錄內容
   */
  listDirectory(path: string = '/'): (VirtualFile | VirtualDirectory)[] {
    const directory = this.getDirectoryByPath(path)
    if (!directory) {
      throw new Error(`Directory not found: ${path}`)
    }
    return [...directory.children]
  }

  /**
   * 獲取檔案樹結構
   */
  getFileTree(path: string = '/'): VirtualDirectory {
    const directory = this.getDirectoryByPath(path)
    if (!directory) {
      throw new Error(`Directory not found: ${path}`)
    }

    // 深度複製並構建樹結構
    const buildTree = (dir: VirtualDirectory): VirtualDirectory => {
      return {
        ...dir,
        children: dir.children.map(child => {
          if (child.isDirectory) {
            return buildTree(child as VirtualDirectory)
          }
          return { ...child }
        }),
      }
    }

    return buildTree(directory)
  }

  /**
   * 創建快照
   */
  createSnapshot(description?: string): FileSystemSnapshot {
    const snapshot: FileSystemSnapshot = {
      id: uuidv4(),
      timestamp: new Date(),
      description,
      files: Array.from(this.state.files.values()),
      directories: Array.from(this.state.directories.values()),
      metadata: {
        totalFiles: this.state.files.size,
        totalDirectories: this.state.directories.size,
        totalSize: Array.from(this.state.files.values()).reduce((sum, file) => sum + file.size, 0),
        version: '1.0.0',
      },
    }

    this.snapshots.set(snapshot.id, snapshot)
    return snapshot
  }

  /**
   * 恢復快照
   */
  restoreSnapshot(snapshotId: string): boolean {
    const snapshot = this.snapshots.get(snapshotId)
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`)
    }

    // 清空當前狀態
    this.state.files.clear()
    this.state.directories.clear()

    // 恢復檔案和目錄
    snapshot.files.forEach(file => this.state.files.set(file.id, file))
    snapshot.directories.forEach(dir => this.state.directories.set(dir.id, dir))

    // 重建根目錄引用
    const rootDir = Array.from(this.state.directories.values()).find(dir => dir.path === '/')
    if (rootDir) {
      this.state.rootId = rootDir.id
    }

    return true
  }

  /**
   * 添加檔案系統監聽器
   */
  addWatcher(watcher: Omit<FileSystemWatcher, 'id'>): string {
    const id = uuidv4()
    const fullWatcher: FileSystemWatcher = { ...watcher, id }
    this.watchers.set(id, fullWatcher)
    return id
  }

  /**
   * 移除檔案系統監聽器
   */
  removeWatcher(watcherId: string): boolean {
    return this.watchers.delete(watcherId)
  }

  /**
   * 獲取檔案系統統計資訊
   */
  getStats() {
    const totalSize = Array.from(this.state.files.values()).reduce((sum, file) => sum + file.size, 0)
    
    return {
      totalFiles: this.state.files.size,
      totalDirectories: this.state.directories.size,
      totalSize,
      totalOperations: this.state.operations.length,
      totalWatchers: this.watchers.size,
      totalSnapshots: this.snapshots.size,
    }
  }

  // 私有輔助方法

  private getFileByPath(path: string): VirtualFile | undefined {
    const normalizedPath = this.normalizePath(path)
    return Array.from(this.state.files.values()).find(file => file.path === normalizedPath)
  }

  private getDirectoryByPath(path: string): VirtualDirectory | undefined {
    const normalizedPath = this.normalizePath(path)
    return Array.from(this.state.directories.values()).find(dir => dir.path === normalizedPath)
  }

  private normalizePath(path: string): string {
    return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/'
  }

  private parsePath(path: string): { directory: string; filename: string } {
    const normalizedPath = this.normalizePath(path)
    const lastSlashIndex = normalizedPath.lastIndexOf('/')
    
    if (lastSlashIndex === 0) {
      return {
        directory: '/',
        filename: normalizedPath.slice(1),
      }
    }
    
    return {
      directory: normalizedPath.slice(0, lastSlashIndex),
      filename: normalizedPath.slice(lastSlashIndex + 1),
    }
  }

  private ensureDirectoryExists(path: string): VirtualDirectory {
    const normalizedPath = this.normalizePath(path)
    let directory = this.getDirectoryByPath(normalizedPath)
    
    if (!directory) {
      // 遞迴創建父目錄
      const { directory: parentPath } = this.parsePath(normalizedPath)
      if (parentPath !== normalizedPath) {
        this.ensureDirectoryExists(parentPath)
      }
      directory = this.createDirectory(normalizedPath)
    }
    
    return directory
  }

  private inferFileType(filename: string): FileType {
    const extension = filename.split('.').pop()?.toLowerCase()
    
    switch (extension) {
      case 'vue': return FileType.VUE
      case 'ts': return FileType.TYPESCRIPT
      case 'js': return FileType.JAVASCRIPT
      case 'css': return FileType.CSS
      case 'html': return FileType.HTML
      case 'json': return FileType.JSON
      case 'md': return FileType.MARKDOWN
      default: return FileType.TYPESCRIPT
    }
  }

  private getMimeType(fileType: FileType): string {
    switch (fileType) {
      case FileType.VUE: return 'text/x-vue'
      case FileType.TYPESCRIPT: return 'text/typescript'
      case FileType.JAVASCRIPT: return 'text/javascript'
      case FileType.CSS: return 'text/css'
      case FileType.HTML: return 'text/html'
      case FileType.JSON: return 'application/json'
      case FileType.MARKDOWN: return 'text/markdown'
      default: return 'text/plain'
    }
  }

  private getLanguage(fileType: FileType): string {
    switch (fileType) {
      case FileType.VUE: return 'vue'
      case FileType.TYPESCRIPT: return 'typescript'
      case FileType.JAVASCRIPT: return 'javascript'
      case FileType.CSS: return 'css'
      case FileType.HTML: return 'html'
      case FileType.JSON: return 'json'
      case FileType.MARKDOWN: return 'markdown'
      default: return 'text'
    }
  }

  private moveFile(file: VirtualFile, targetPath: string): boolean {
    const normalizedTarget = this.normalizePath(targetPath)
    const { directory: targetDir } = this.parsePath(normalizedTarget)
    
    // 確保目標目錄存在
    const newParentDir = this.ensureDirectoryExists(targetDir)
    
    // 從舊父目錄移除
    if (file.parentId) {
      const oldParentDir = this.state.directories.get(file.parentId)
      if (oldParentDir) {
        oldParentDir.children = oldParentDir.children.filter(child => child.id !== file.id)
      }
    }
    
    // 更新檔案資訊
    const oldPath = file.path
    file.path = normalizedTarget
    file.parentId = newParentDir.id
    file.lastModified = new Date()
    
    // 添加到新父目錄
    newParentDir.children.push(file)
    
    // 記錄操作
    this.recordOperation({
      type: FileSystemOperationType.MOVE_FILE,
      path: oldPath,
      newPath: normalizedTarget,
      timestamp: new Date(),
    })
    
    // 觸發事件
    this.emitEvent({
      type: FileSystemEventType.FILE_MOVED,
      path: oldPath,
      newPath: normalizedTarget,
      file,
      timestamp: new Date(),
    })
    
    return true
  }

  private moveDirectory(directory: VirtualDirectory, targetPath: string): boolean {
    const normalizedTarget = this.normalizePath(targetPath)
    const { directory: targetParentPath } = this.parsePath(normalizedTarget)
    
    // 確保目標父目錄存在
    const newParentDir = this.ensureDirectoryExists(targetParentPath)
    
    // 從舊父目錄移除
    if (directory.parentId) {
      const oldParentDir = this.state.directories.get(directory.parentId)
      if (oldParentDir) {
        oldParentDir.children = oldParentDir.children.filter(child => child.id !== directory.id)
      }
    }
    
    // 更新目錄資訊
    const oldPath = directory.path
    directory.path = normalizedTarget
    directory.parentId = newParentDir.id
    directory.lastModified = new Date()
    
    // 遞迴更新子項目路徑
    this.updateChildrenPaths(directory, oldPath, normalizedTarget)
    
    // 添加到新父目錄
    newParentDir.children.push(directory)
    
    // 記錄操作
    this.recordOperation({
      type: FileSystemOperationType.MOVE_DIRECTORY,
      path: oldPath,
      newPath: normalizedTarget,
      timestamp: new Date(),
    })
    
    // 觸發事件
    this.emitEvent({
      type: FileSystemEventType.DIRECTORY_MOVED,
      path: oldPath,
      newPath: normalizedTarget,
      directory,
      timestamp: new Date(),
    })
    
    return true
  }

  private updateChildrenPaths(directory: VirtualDirectory, oldBasePath: string, newBasePath: string): void {
    for (const child of directory.children) {
      const relativePath = child.path.slice(oldBasePath.length)
      child.path = newBasePath + relativePath
      child.lastModified = new Date()
      
      if (child.isDirectory) {
        this.updateChildrenPaths(child as VirtualDirectory, oldBasePath, newBasePath)
      }
    }
  }

  private recordOperation(operation: FileSystemOperation): void {
    this.state.operations.push(operation)
    
    // 限制操作歷史記錄數量
    if (this.state.operations.length > this.maxOperationHistory) {
      this.state.operations = this.state.operations.slice(-this.maxOperationHistory)
    }
  }

  private emitEvent(event: FileSystemEvent): void {
    for (const watcher of this.watchers.values()) {
      // 檢查路徑匹配
      const isPathMatch = watcher.recursive
        ? event.path.startsWith(watcher.path)
        : event.path === watcher.path || event.path.startsWith(watcher.path + '/')
      
      // 檢查事件類型匹配
      const isEventMatch = watcher.events.includes(event.type)
      
      if (isPathMatch && isEventMatch) {
        try {
          watcher.callback(event)
        } catch (error) {
          console.error('Error in file system watcher callback:', error)
        }
      }
    }
  }

  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
}