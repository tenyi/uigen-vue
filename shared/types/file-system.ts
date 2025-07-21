// 虛擬檔案系統相關型別定義
import type { FileType } from './index'

export interface VirtualFile {
  id: string
  name: string
  path: string
  content: string
  type: FileType
  size: number
  lastModified: Date
  isDirectory: boolean
  parentId?: string
  children?: VirtualFile[]
  metadata?: FileMetadata
}

export interface FileMetadata {
  encoding?: string
  mimeType?: string
  language?: string
  isExecutable?: boolean
  permissions?: FilePermissions
  tags?: string[]
  description?: string
}

export interface FilePermissions {
  read: boolean
  write: boolean
  execute: boolean
}

export interface VirtualDirectory {
  id: string
  name: string
  path: string
  parentId?: string
  children: (VirtualFile | VirtualDirectory)[]
  lastModified: Date
  isDirectory: boolean
  metadata?: DirectoryMetadata
}

export interface DirectoryMetadata {
  description?: string
  tags?: string[]
  isHidden?: boolean
}

export interface FileSystemOperation {
  type: FileSystemOperationType
  path: string
  content?: string
  newPath?: string
  timestamp: Date
  userId?: string
}

export const FileSystemOperationType = {
  CREATE_FILE: 'create_file',
  CREATE_DIRECTORY: 'create_directory',
  UPDATE_FILE: 'update_file',
  DELETE_FILE: 'delete_file',
  DELETE_DIRECTORY: 'delete_directory',
  MOVE_FILE: 'move_file',
  MOVE_DIRECTORY: 'move_directory',
  COPY_FILE: 'copy_file',
  COPY_DIRECTORY: 'copy_directory',
  RENAME_FILE: 'rename_file',
  RENAME_DIRECTORY: 'rename_directory',
} as const

export type FileSystemOperationType = typeof FileSystemOperationType[keyof typeof FileSystemOperationType]

export interface FileSystemState {
  files: Map<string, VirtualFile>
  directories: Map<string, VirtualDirectory>
  operations: FileSystemOperation[]
  currentPath: string
  rootId: string
}

export interface FileSearchOptions {
  query: string
  fileTypes?: FileType[]
  includeContent?: boolean
  caseSensitive?: boolean
  useRegex?: boolean
  maxResults?: number
}

export interface FileSearchResult {
  file: VirtualFile
  matches: FileMatch[]
  score: number
}

export interface FileMatch {
  line: number
  column: number
  text: string
  context: string
}

export interface FileSystemWatcher {
  id: string
  path: string
  recursive: boolean
  events: FileSystemEventType[]
  callback: (event: FileSystemEvent) => void
}

export const FileSystemEventType = {
  FILE_CREATED: 'file_created',
  FILE_UPDATED: 'file_updated',
  FILE_DELETED: 'file_deleted',
  FILE_MOVED: 'file_moved',
  DIRECTORY_CREATED: 'directory_created',
  DIRECTORY_DELETED: 'directory_deleted',
  DIRECTORY_MOVED: 'directory_moved',
} as const

export type FileSystemEventType = typeof FileSystemEventType[keyof typeof FileSystemEventType]

export interface FileSystemEvent {
  type: FileSystemEventType
  path: string
  newPath?: string
  file?: VirtualFile
  directory?: VirtualDirectory
  timestamp: Date
}

export interface FileSystemSnapshot {
  id: string
  timestamp: Date
  description?: string
  files: VirtualFile[]
  directories: VirtualDirectory[]
  metadata: {
    totalFiles: number
    totalDirectories: number
    totalSize: number
    version: string
  }
}