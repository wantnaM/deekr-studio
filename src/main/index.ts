import { electronApp, optimizer } from '@electron-toolkit/utils'
import { replaceDevtoolsFont } from '@main/utils/windowUtil'
import { IpcChannel } from '@shared/IpcChannel'
import { app, ipcMain } from 'electron'
import installExtension, { REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } from 'electron-devtools-installer'
import Logger from 'electron-log'

import { registerIpc } from './ipc'
import { configManager } from './services/ConfigManager'
import mcpService from './services/MCPService'
import {
  CHERRY_STUDIO_PROTOCOL,
  handleProtocolUrl,
  registerProtocolClient,
  setupAppImageDeepLink
} from './services/ProtocolClient'
import { registerShortcuts } from './services/ShortcutService'
import { TrayService } from './services/TrayService'
import { windowService } from './services/WindowService'
import { setUserDataDir } from './utils/file'

// Check for single instance lock
if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
} else {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.

  app.whenReady().then(async () => {
    // Set app user model id for windows
    electronApp.setAppUserModelId(import.meta.env.VITE_MAIN_BUNDLE_ID || 'com.deerk.DeekrStudio')

    // Mac: Hide dock icon before window creation when launch to tray is set
    const isLaunchToTray = configManager.getLaunchToTray()
    if (isLaunchToTray) {
      app.dock?.hide()
    }

    const mainWindow = windowService.createMainWindow()
    new TrayService()

    app.on('activate', function () {
      const mainWindow = windowService.getMainWindow()
      if (!mainWindow || mainWindow.isDestroyed()) {
        windowService.createMainWindow()
      } else {
        windowService.showMainWindow()
      }
    })

    registerShortcuts(mainWindow)

    registerIpc(mainWindow, app)

    replaceDevtoolsFont(mainWindow)

    setUserDataDir()

    // Setup deep link for AppImage on Linux
    await setupAppImageDeepLink()

    if (process.env.NODE_ENV === 'development') {
      installExtension([REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS])
        .then((name) => console.log(`Added Extension:  ${name}`))
        .catch((err) => console.log('An error occurred: ', err))
    }
    ipcMain.handle(IpcChannel.System_GetDeviceType, () => {
      return process.platform === 'darwin' ? 'mac' : process.platform === 'win32' ? 'windows' : 'linux'
    })

    ipcMain.handle(IpcChannel.System_GetHostname, () => {
      return require('os').hostname()
    })
  })

  registerProtocolClient(app)

  // macOS specific: handle protocol when app is already running
  app.on('open-url', (event, url) => {
    event.preventDefault()
    handleProtocolUrl(url)
  })

  // Listen for second instance
  app.on('second-instance', (_event, argv) => {
    windowService.showMainWindow()

    // Protocol handler for Windows/Linux
    // The commandLine is an array of strings where the last item might be the URL
    const url = argv.find((arg) => arg.startsWith(CHERRY_STUDIO_PROTOCOL + '://'))
    if (url) handleProtocolUrl(url)
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  app.on('before-quit', () => {
    app.isQuitting = true
  })

  app.on('will-quit', async () => {
    // event.preventDefault()
    try {
      await mcpService.cleanup()
    } catch (error) {
      Logger.error('Error cleaning up MCP service:', error)
    }
  })

  // In this file you can include the rest of your app"s specific main process
  // code. You can also put them in separate files and require them here.
}
