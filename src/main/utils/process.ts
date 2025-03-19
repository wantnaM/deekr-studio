import { spawn } from 'child_process'
import log from 'electron-log'
import fs from 'fs'
import os from 'os'
import path from 'path'

import { getResourcePath } from '.'

export function runInstallScript(scriptPath: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const installScriptPath = path.join(getResourcePath(), 'scripts', scriptPath)
    log.info(`Running script at: ${installScriptPath}`)

    const nodeProcess = spawn(process.execPath, [installScriptPath], {
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }
    })

    nodeProcess.stdout.on('data', (data) => {
      log.info(`Script output: ${data}`)
    })

    nodeProcess.stderr.on('data', (data) => {
      log.error(`Script error: ${data}`)
    })

    nodeProcess.on('close', (code) => {
      if (code === 0) {
        log.info('Script completed successfully')
        resolve()
      } else {
        log.error(`Script exited with code ${code}`)
        reject(new Error(`Process exited with code ${code}`))
      }
    })
  })
}

export async function getBinaryPath(name: string): Promise<string> {
  let cmd = process.platform === 'win32' ? `${name}.exe` : name
  const binariesDir = path.join(os.homedir(), '.deekrstudio', 'bin')
  const binariesDirExists = await fs.existsSync(binariesDir)
  cmd = binariesDirExists ? path.join(binariesDir, cmd) : name
  return cmd
}

export async function isBinaryExists(name: string): Promise<boolean> {
  const cmd = await getBinaryPath(name)
  return await fs.existsSync(cmd)
}
