#!/usr/bin/env node
// Launch Hermes F against this checkout's isolated local Hermes installation.
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const desktopDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repoDir = path.resolve(desktopDir, '../..')
const sandbox = path.join(repoDir, '.hermes-local-sandbox')
const hermesHome = path.join(sandbox, 'hermes-home')
const userData = path.join(sandbox, 'user-data-f')
const workspace = path.join(sandbox, 'work')
const url = 'http://127.0.0.1:5174/'

if (!existsSync(hermesHome)) {
  throw new Error(`The isolated Hermes installation is missing: ${hermesHome}`)
}

function installedPython() {
  const installs = path.join(hermesHome, 'installs')
  const candidates = readdirSync(installs, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .flatMap(entry => {
      const environments = path.join(installs, entry.name, 'environments')
      if (!existsSync(environments)) return []
      return readdirSync(environments, { withFileTypes: true })
        .filter(item => item.isDirectory())
        .map(item => path.join(environments, item.name, 'venv', 'bin', 'python'))
        .filter(candidate => existsSync(candidate) && statSync(candidate).isFile())
    })
  if (candidates.length !== 1) {
    throw new Error(`Expected one local Hermes Python environment, found ${candidates.length}`)
  }
  return candidates[0]
}

const python = installedPython()
for (const dir of [userData, workspace]) mkdirSync(dir, { recursive: true })

const env = {
  ...process.env,
  HERMES_DESKTOP_APP_NAME: 'Hermes F',
  HERMES_DESKTOP_CWD: workspace,
  HERMES_DESKTOP_CDP_PORT: 'off',
  HERMES_DESKTOP_DEV_SERVER: url,
  HERMES_DESKTOP_USER_DATA_DIR: userData,
  HERMES_DESKTOP_PYTHON: python,
  HERMES_DESKTOP_VARIANT: '',
  HERMES_HOME: hermesHome
}

for (const key of [
  'HERMES_DESKTOP_HERMES',
  'HERMES_DESKTOP_HERMES_ROOT',
  'HERMES_DATA_DIR_SUFFIX',
  'HERMES_BUILD_COMMIT',
  'HERMES_PAYLOAD_TAG',
  '_HERMES_CHANNEL_REQUEST_JSON'
]) delete env[key]

const children = new Set()
let stopping = false

function start(command, args) {
  const child = spawn(command, args, { cwd: desktopDir, env, stdio: 'inherit' })
  children.add(child)
  child.once('exit', () => children.delete(child))
  return child
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = start(command, args)
    child.once('error', reject)
    child.once('exit', (code, signal) => {
      if (code === 0) resolve()
      else reject(new Error(`${path.basename(command)} exited (${signal || code})`))
    })
  })
}

async function waitForRenderer(renderer) {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    if (renderer.exitCode !== null || renderer.signalCode !== null) throw new Error('Renderer stopped before becoming ready')
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) })
      if (response.ok) return
    } catch {
      // Vite is still starting.
    }
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  throw new Error('Hermes F renderer did not start on port 5174')
}

function stopChildren() {
  stopping = true
  for (const child of children) child.kill('SIGTERM')
}

for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, stopChildren)

try {
  await run(process.execPath, ['scripts/assert-root-install.mjs'])
  await run(process.execPath, [path.join(repoDir, 'node_modules/typescript/bin/tsc'), '--build', 'tsconfig.electron.json'])
  await run(process.execPath, ['scripts/bundle-electron-main.mjs', '--dev'])
  const renderer = start(process.execPath, [
    path.join(repoDir, 'node_modules/vite/bin/vite.js'),
    '--host', '127.0.0.1', '--port', '5174', '--strictPort'
  ])
  await waitForRenderer(renderer)
  console.log(`Hermes F: ${url}`)
  console.log(`Hermes home: ${hermesHome}`)
  await run(process.execPath, [path.join(repoDir, 'node_modules/electron/cli.js'), '.'])
} catch (error) {
  if (!stopping) {
    console.error(error)
    process.exitCode = 1
  }
} finally {
  stopChildren()
}
