import { WebDavConfig } from '@types'
import Logger from 'electron-log'
import Stream from 'stream'
import {
  BufferLike,
  createClient,
  CreateDirectoryOptions,
  GetFileContentsOptions,
  PutFileContentsOptions,
  WebDAVClient
} from 'webdav'
export default class WebDav {
  public instance: WebDAVClient | undefined
  private webdavPath: string

  constructor(params: WebDavConfig) {
    this.webdavPath = params.webdavPath

    this.instance = createClient(params.webdavHost, {
      username: params.webdavUser,
      password: params.webdavPass,
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    })

    this.putFileContents = this.putFileContents.bind(this)
    this.getFileContents = this.getFileContents.bind(this)
    this.createDirectory = this.createDirectory.bind(this)
    this.deleteFile = this.deleteFile.bind(this)
  }

  public putFileContents = async (
    filename: string,
    data: string | BufferLike | Stream.Readable,
    options?: PutFileContentsOptions
  ) => {
    if (!this.instance) {
      return new Error('WebDAV client not initialized')
    }

    try {
      if (!(await this.instance.exists(this.webdavPath))) {
        await this.instance.createDirectory(this.webdavPath, {
          recursive: true
        })
      }
    } catch (error) {
      Logger.error('[WebDAV] Error creating directory on WebDAV:', error)
      throw error
    }

    const remoteFilePath = `${this.webdavPath}/${filename}`

    try {
      return await this.instance.putFileContents(remoteFilePath, data, options)
    } catch (error) {
      Logger.error('[WebDAV] Error putting file contents on WebDAV:', error)
      throw error
    }
  }

  public getFileContents = async (filename: string, options?: GetFileContentsOptions) => {
    if (!this.instance) {
      throw new Error('WebDAV client not initialized')
    }

    const remoteFilePath = `${this.webdavPath}/${filename}`

    try {
      return await this.instance.getFileContents(remoteFilePath, options)
    } catch (error) {
      Logger.error('[WebDAV] Error getting file contents on WebDAV:', error)
      throw error
    }
  }

  public checkConnection = async () => {
    if (!this.instance) {
      throw new Error('WebDAV client not initialized')
    }

    try {
      return await this.instance.exists('/')
    } catch (error) {
      Logger.error('[WebDAV] Error checking connection:', error)
      throw error
    }
  }

  public createDirectory = async (path: string, options?: CreateDirectoryOptions) => {
    if (!this.instance) {
      throw new Error('WebDAV client not initialized')
    }

    try {
      return await this.instance.createDirectory(path, options)
    } catch (error) {
      Logger.error('[WebDAV] Error creating directory on WebDAV:', error)
      throw error
    }
  }

  public deleteFile = async (filename: string) => {
    if (!this.instance) {
      throw new Error('WebDAV client not initialized')
    }

    const remoteFilePath = `${this.webdavPath}/${filename}`

    try {
      return await this.instance.deleteFile(remoteFilePath)
    } catch (error) {
      Logger.error('[WebDAV] Error deleting file on WebDAV:', error)
      throw error
    }
  }
}
