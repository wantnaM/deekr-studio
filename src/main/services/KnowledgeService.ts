/**
 * Knowledge Service - Manages knowledge bases using RAG (Retrieval-Augmented Generation)
 *
 * This service handles creation, management, and querying of knowledge bases from various sources
 * including files, directories, URLs, sitemaps, and notes.
 *
 * Features:
 * - Concurrent task processing with workload management
 * - Multiple data source support
 * - Vector database integration
 *
 * For detailed documentation, see:
 * @see {@link ../../../docs/technical/KnowledgeService.md}
 */

import * as fs from 'node:fs'
import path from 'node:path'

import { RAGApplication, RAGApplicationBuilder, TextLoader } from '@cherrystudio/embedjs'
import type { ExtractChunkData } from '@cherrystudio/embedjs-interfaces'
import { LibSqlDb } from '@cherrystudio/embedjs-libsql'
import { SitemapLoader } from '@cherrystudio/embedjs-loader-sitemap'
import { WebLoader } from '@cherrystudio/embedjs-loader-web'
import Embeddings from '@main/embeddings/Embeddings'
import { addFileLoader } from '@main/loader'
import Reranker from '@main/reranker/Reranker'
import { windowService } from '@main/services/WindowService'
import { getAllFiles } from '@main/utils/file'
import { MB } from '@shared/config/constant'
import type { LoaderReturn } from '@shared/config/types'
import { IpcChannel } from '@shared/IpcChannel'
import { FileType, KnowledgeBaseParams, KnowledgeItem } from '@types'
import { app } from 'electron'
import Logger from 'electron-log'
import { v4 as uuidv4 } from 'uuid'

export interface KnowledgeBaseAddItemOptions {
  base: KnowledgeBaseParams
  item: KnowledgeItem
  forceReload?: boolean
}

interface KnowledgeBaseAddItemOptionsNonNullableAttribute {
  base: KnowledgeBaseParams
  item: KnowledgeItem
  forceReload: boolean
}

interface EvaluateTaskWorkload {
  workload: number
}

type LoaderDoneReturn = LoaderReturn | null

enum LoaderTaskItemState {
  PENDING,
  PROCESSING,
  DONE
}

interface LoaderTaskItem {
  state: LoaderTaskItemState
  task: () => Promise<unknown>
  evaluateTaskWorkload: EvaluateTaskWorkload
}

interface LoaderTask {
  loaderTasks: LoaderTaskItem[]
  loaderDoneReturn: LoaderDoneReturn
}

interface LoaderTaskOfSet {
  loaderTasks: Set<LoaderTaskItem>
  loaderDoneReturn: LoaderDoneReturn
}

interface QueueTaskItem {
  taskPromise: () => Promise<unknown>
  resolve: () => void
  evaluateTaskWorkload: EvaluateTaskWorkload
}

const loaderTaskIntoOfSet = (loaderTask: LoaderTask): LoaderTaskOfSet => {
  return {
    loaderTasks: new Set(loaderTask.loaderTasks),
    loaderDoneReturn: loaderTask.loaderDoneReturn
  }
}

class KnowledgeService {
  private storageDir = path.join(app.getPath('userData'), 'Data', 'KnowledgeBase')
  // Byte based
  private workload = 0
  private processingItemCount = 0
  private knowledgeItemProcessingQueueMappingPromise: Map<LoaderTaskOfSet, () => void> = new Map()
  private static MAXIMUM_WORKLOAD = 80 * MB
  private static MAXIMUM_PROCESSING_ITEM_COUNT = 30
  private static ERROR_LOADER_RETURN: LoaderReturn = { entriesAdded: 0, uniqueId: '', uniqueIds: [''], loaderType: '' }

  constructor() {
    this.initStorageDir()
  }

  private initStorageDir = (): void => {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true })
    }
  }

  private getRagApplication = async ({
    id,
    model,
    apiKey,
    apiVersion,
    baseURL,
    dimensions
  }: KnowledgeBaseParams): Promise<RAGApplication> => {
    let ragApplication: RAGApplication
    const embeddings = new Embeddings({ model, apiKey, apiVersion, baseURL, dimensions } as KnowledgeBaseParams)
    try {
      ragApplication = await new RAGApplicationBuilder()
        .setModel('NO_MODEL')
        .setEmbeddingModel(embeddings)
        .setVectorDatabase(new LibSqlDb({ path: path.join(this.storageDir, id) }))
        .build()
    } catch (e) {
      Logger.error(e)
      throw new Error(`Failed to create RAGApplication: ${e}`)
    }

    return ragApplication
  }

  public create = async (_: Electron.IpcMainInvokeEvent, base: KnowledgeBaseParams): Promise<void> => {
    this.getRagApplication(base)
  }

  public reset = async (_: Electron.IpcMainInvokeEvent, { base }: { base: KnowledgeBaseParams }): Promise<void> => {
    const ragApplication = await this.getRagApplication(base)
    await ragApplication.reset()
  }

  public delete = async (_: Electron.IpcMainInvokeEvent, id: string): Promise<void> => {
    const dbPath = path.join(this.storageDir, id)
    if (fs.existsSync(dbPath)) {
      fs.rmSync(dbPath, { recursive: true })
    }
  }

  private maximumLoad() {
    return (
      this.processingItemCount >= KnowledgeService.MAXIMUM_PROCESSING_ITEM_COUNT ||
      this.workload >= KnowledgeService.MAXIMUM_WORKLOAD
    )
  }

  private fileTask(
    ragApplication: RAGApplication,
    options: KnowledgeBaseAddItemOptionsNonNullableAttribute
  ): LoaderTask {
    const { base, item, forceReload } = options
    const file = item.content as FileType

    const loaderTask: LoaderTask = {
      loaderTasks: [
        {
          state: LoaderTaskItemState.PENDING,
          task: () =>
            addFileLoader(ragApplication, file, base, forceReload)
              .then((result) => {
                loaderTask.loaderDoneReturn = result
                return result
              })
              .catch((err) => {
                Logger.error(err)
                return KnowledgeService.ERROR_LOADER_RETURN
              }),
          evaluateTaskWorkload: { workload: file.size }
        }
      ],
      loaderDoneReturn: null
    }

    return loaderTask
  }

  private directoryTask(
    ragApplication: RAGApplication,
    options: KnowledgeBaseAddItemOptionsNonNullableAttribute
  ): LoaderTask {
    const { base, item, forceReload } = options
    const directory = item.content as string
    const files = getAllFiles(directory)
    const totalFiles = files.length
    let processedFiles = 0

    const sendDirectoryProcessingPercent = (totalFiles: number, processedFiles: number) => {
      const mainWindow = windowService.getMainWindow()
      mainWindow?.webContents.send(IpcChannel.DirectoryProcessingPercent, {
        itemId: item.id,
        percent: (processedFiles / totalFiles) * 100
      })
    }

    const loaderDoneReturn: LoaderDoneReturn = {
      entriesAdded: 0,
      uniqueId: `DirectoryLoader_${uuidv4()}`,
      uniqueIds: [],
      loaderType: 'DirectoryLoader'
    }
    const loaderTasks: LoaderTaskItem[] = []
    for (const file of files) {
      loaderTasks.push({
        state: LoaderTaskItemState.PENDING,
        task: () =>
          addFileLoader(ragApplication, file, base, forceReload)
            .then((result) => {
              loaderDoneReturn.entriesAdded += 1
              processedFiles += 1
              sendDirectoryProcessingPercent(totalFiles, processedFiles)
              loaderDoneReturn.uniqueIds.push(result.uniqueId)
              return result
            })
            .catch((err) => {
              Logger.error(err)
              return KnowledgeService.ERROR_LOADER_RETURN
            }),
        evaluateTaskWorkload: { workload: file.size }
      })
    }

    return {
      loaderTasks,
      loaderDoneReturn
    }
  }

  private urlTask(
    ragApplication: RAGApplication,
    options: KnowledgeBaseAddItemOptionsNonNullableAttribute
  ): LoaderTask {
    const { base, item, forceReload } = options
    const content = item.content as string

    const loaderTask: LoaderTask = {
      loaderTasks: [
        {
          state: LoaderTaskItemState.PENDING,
          task: () => {
            const loaderReturn = ragApplication.addLoader(
              new WebLoader({
                urlOrContent: content,
                chunkSize: base.chunkSize,
                chunkOverlap: base.chunkOverlap
              }),
              forceReload
            ) as Promise<LoaderReturn>

            return loaderReturn
              .then((result) => {
                const { entriesAdded, uniqueId, loaderType } = result
                loaderTask.loaderDoneReturn = {
                  entriesAdded: entriesAdded,
                  uniqueId: uniqueId,
                  uniqueIds: [uniqueId],
                  loaderType: loaderType
                }
                return result
              })
              .catch((err) => {
                Logger.error(err)
                return KnowledgeService.ERROR_LOADER_RETURN
              })
          },
          evaluateTaskWorkload: { workload: 2 * MB }
        }
      ],
      loaderDoneReturn: null
    }
    return loaderTask
  }

  private sitemapTask(
    ragApplication: RAGApplication,
    options: KnowledgeBaseAddItemOptionsNonNullableAttribute
  ): LoaderTask {
    const { base, item, forceReload } = options
    const content = item.content as string

    const loaderTask: LoaderTask = {
      loaderTasks: [
        {
          state: LoaderTaskItemState.PENDING,
          task: () =>
            ragApplication
              .addLoader(
                new SitemapLoader({ url: content, chunkSize: base.chunkSize, chunkOverlap: base.chunkOverlap }) as any,
                forceReload
              )
              .then((result) => {
                const { entriesAdded, uniqueId, loaderType } = result
                loaderTask.loaderDoneReturn = {
                  entriesAdded: entriesAdded,
                  uniqueId: uniqueId,
                  uniqueIds: [uniqueId],
                  loaderType: loaderType
                }
                return result
              })
              .catch((err) => {
                Logger.error(err)
                return KnowledgeService.ERROR_LOADER_RETURN
              }),
          evaluateTaskWorkload: { workload: 20 * MB }
        }
      ],
      loaderDoneReturn: null
    }
    return loaderTask
  }

  private noteTask(
    ragApplication: RAGApplication,
    options: KnowledgeBaseAddItemOptionsNonNullableAttribute
  ): LoaderTask {
    const { base, item, forceReload } = options
    const content = item.content as string

    const encoder = new TextEncoder()
    const contentBytes = encoder.encode(content)
    const loaderTask: LoaderTask = {
      loaderTasks: [
        {
          state: LoaderTaskItemState.PENDING,
          task: () => {
            const loaderReturn = ragApplication.addLoader(
              new TextLoader({ text: content, chunkSize: base.chunkSize, chunkOverlap: base.chunkOverlap }),
              forceReload
            ) as Promise<LoaderReturn>

            return loaderReturn
              .then(({ entriesAdded, uniqueId, loaderType }) => {
                loaderTask.loaderDoneReturn = {
                  entriesAdded: entriesAdded,
                  uniqueId: uniqueId,
                  uniqueIds: [uniqueId],
                  loaderType: loaderType
                }
              })
              .catch((err) => {
                Logger.error(err)
                return KnowledgeService.ERROR_LOADER_RETURN
              })
          },
          evaluateTaskWorkload: { workload: contentBytes.length }
        }
      ],
      loaderDoneReturn: null
    }
    return loaderTask
  }

  private processingQueueHandle() {
    const getSubtasksUntilMaximumLoad = (): QueueTaskItem[] => {
      const queueTaskList: QueueTaskItem[] = []
      that: for (const [task, resolve] of this.knowledgeItemProcessingQueueMappingPromise) {
        for (const item of task.loaderTasks) {
          if (this.maximumLoad()) {
            break that
          }

          const { state, task: taskPromise, evaluateTaskWorkload } = item

          if (state !== LoaderTaskItemState.PENDING) {
            continue
          }

          const { workload } = evaluateTaskWorkload
          this.workload += workload
          this.processingItemCount += 1
          item.state = LoaderTaskItemState.PROCESSING
          queueTaskList.push({
            taskPromise: () =>
              taskPromise().then(() => {
                this.workload -= workload
                this.processingItemCount -= 1
                task.loaderTasks.delete(item)
                if (task.loaderTasks.size === 0) {
                  this.knowledgeItemProcessingQueueMappingPromise.delete(task)
                  resolve()
                }
                this.processingQueueHandle()
              }),
            resolve: () => {},
            evaluateTaskWorkload
          })
        }
      }
      return queueTaskList
    }
    const subTasks = getSubtasksUntilMaximumLoad()
    if (subTasks.length > 0) {
      const subTaskPromises = subTasks.map(({ taskPromise }) => taskPromise())
      Promise.all(subTaskPromises).then(() => {
        subTasks.forEach(({ resolve }) => resolve())
      })
    }
  }

  private appendProcessingQueue(task: LoaderTask): Promise<LoaderReturn> {
    return new Promise((resolve) => {
      this.knowledgeItemProcessingQueueMappingPromise.set(loaderTaskIntoOfSet(task), () => {
        resolve(task.loaderDoneReturn!)
      })
    })
  }

  public add = (_: Electron.IpcMainInvokeEvent, options: KnowledgeBaseAddItemOptions): Promise<LoaderReturn> => {
    return new Promise((resolve) => {
      const { base, item, forceReload = false } = options
      const optionsNonNullableAttribute = { base, item, forceReload }
      this.getRagApplication(base)
        .then((ragApplication) => {
          const task = (() => {
            switch (item.type) {
              case 'file':
                return this.fileTask(ragApplication, optionsNonNullableAttribute)
              case 'directory':
                return this.directoryTask(ragApplication, optionsNonNullableAttribute)
              case 'url':
                return this.urlTask(ragApplication, optionsNonNullableAttribute)
              case 'sitemap':
                return this.sitemapTask(ragApplication, optionsNonNullableAttribute)
              case 'note':
                return this.noteTask(ragApplication, optionsNonNullableAttribute)
              default:
                return null
            }
          })()

          if (task) {
            this.appendProcessingQueue(task).then(() => {
              resolve(task.loaderDoneReturn!)
            })
            this.processingQueueHandle()
          } else {
            resolve(KnowledgeService.ERROR_LOADER_RETURN)
          }
        })
        .catch((err) => {
          Logger.error(err)
          resolve(KnowledgeService.ERROR_LOADER_RETURN)
        })
    })
  }

  public remove = async (
    _: Electron.IpcMainInvokeEvent,
    { uniqueId, uniqueIds, base }: { uniqueId: string; uniqueIds: string[]; base: KnowledgeBaseParams }
  ): Promise<void> => {
    const ragApplication = await this.getRagApplication(base)
    console.log(`[ KnowledgeService Remove Item UniqueId: ${uniqueId}]`)
    for (const id of uniqueIds) {
      await ragApplication.deleteLoader(id)
    }
  }

  public search = async (
    _: Electron.IpcMainInvokeEvent,
    { search, base }: { search: string; base: KnowledgeBaseParams }
  ): Promise<ExtractChunkData[]> => {
    const ragApplication = await this.getRagApplication(base)
    return await ragApplication.search(search)
  }

  public rerank = async (
    _: Electron.IpcMainInvokeEvent,
    { search, base, results }: { search: string; base: KnowledgeBaseParams; results: ExtractChunkData[] }
  ): Promise<ExtractChunkData[]> => {
    if (results.length === 0) {
      return results
    }
    return await new Reranker(base).rerank(search, results)
  }
}

export default new KnowledgeService()
