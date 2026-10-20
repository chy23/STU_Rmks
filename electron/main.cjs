const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let llamaInstance = null;
let currentModel = null;
let currentContext = null;
let currentSession = null;
let currentModelFileName = null;
let currentAbortController = null;

const MODEL_DEFINITIONS = [
  {
    id: 'Llama-3.2-3B-Instruct-Q4_K_M.gguf',
    name: 'Llama 3.2 (3B) Instruct (Meta - 離線原生)',
    size: '2.0 GB',
    tag: '極速流暢推薦',
    hint: '記憶體需求低，速度極快，適合絕大多數日常學生評語生成與即時修改。'
  },
  {
    id: 'gemma-2-9b-it-Q4_K_M.gguf',
    name: 'Gemma 2 (9B) Instruct (Google - 離線原生)',
    size: '5.8 GB',
    tag: '旗艦深度文采',
    hint: 'Google 頂級開源模型，文學素養深厚，文字細膩典雅，適合哲理與長篇評語。需 8GB 以上記憶體。'
  }
];

function getModelDirs() {
  const dirs = [];
  // 1. Packaged app resources directory
  if (process.resourcesPath) {
    dirs.push(path.join(process.resourcesPath, 'models'));
  }
  // 2. Dev directory
  dirs.push(path.join(__dirname, '../models'));
  // 3. User data directory
  dirs.push(path.join(app.getPath('userData'), 'models'));
  return dirs;
}

function resolveModelPath(modelFileName) {
  const dirs = getModelDirs();
  for (const dir of dirs) {
    const fullPath = path.join(dir, modelFileName);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 880,
    minWidth: 960,
    minHeight: 700,
    title: '學生評語生成系統 - 桌面旗艦離線版',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('get-models-status', async () => {
  let gpuEngine = 'cpu';
  try {
    if (!llamaInstance) {
      const { getLlama } = await import('node-llama-cpp');
      llamaInstance = await getLlama();
    }
    gpuEngine = llamaInstance.gpu || 'cpu';
  } catch (e) {
    console.warn("無法取得硬體 GPU 資訊:", e.message);
  }

  const modelDirs = getModelDirs();
  const models = MODEL_DEFINITIONS.map(m => {
    const resolved = resolveModelPath(m.id);
    let realSize = 0;
    if (resolved) {
      try {
        realSize = fs.statSync(resolved).size;
      } catch (err) {}
    }
    return {
      ...m,
      isAvailable: !!resolved && realSize > 50 * 1024 * 1024,
      isLoaded: currentModelFileName === m.id,
      path: resolved,
      fileSizeMB: realSize > 0 ? (realSize / 1024 / 1024).toFixed(1) : 0
    };
  });

  return {
    platform: process.platform,
    gpuEngine,
    currentLoadedModel: currentModelFileName,
    models,
    modelDirs
  };
});

ipcMain.handle('load-model', async (event, modelFileName) => {
  try {
    const modelPath = resolveModelPath(modelFileName);
    if (!modelPath) {
      throw new Error(`找不到本機離線模型檔案: ${modelFileName}，請確認檔案已放置於 models 目錄。`);
    }

    if (!llamaInstance) {
      const { getLlama } = await import('node-llama-cpp');
      llamaInstance = await getLlama();
    }

    // Clean up previous context and model
    if (currentContext) {
      await currentContext.dispose();
      currentContext = null;
    }
    if (currentModel) {
      await currentModel.dispose();
      currentModel = null;
    }

    console.log(`[桌面引擎] 開始載入離線模型: ${modelPath}`);
    currentModel = await llamaInstance.loadModel({
      modelPath,
      gpuLayers: 'max' // Offload maximum layers to Metal (macOS) or Vulkan (Windows)
    });

    currentContext = await currentModel.createContext({
      contextSize: 4096
    });

    const { LlamaChatSession } = await import('node-llama-cpp');
    currentSession = new LlamaChatSession({
      contextSequence: currentContext.getSequence()
    });

    currentModelFileName = modelFileName;
    console.log(`[桌面引擎] 模型載入成功！GPU: ${llamaInstance.gpu}`);

    return {
      success: true,
      modelFileName,
      gpu: llamaInstance.gpu
    };
  } catch (err) {
    console.error("[桌面引擎] 模型載入失敗:", err);
    return {
      success: false,
      error: err.message
    };
  }
});

ipcMain.handle('unload-model', async () => {
  try {
    if (currentContext) {
      await currentContext.dispose();
      currentContext = null;
    }
    if (currentModel) {
      await currentModel.dispose();
      currentModel = null;
    }
    currentSession = null;
    currentModelFileName = null;
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('generate-comment', async (event, { prompt }) => {
  if (!currentSession) {
    throw new Error("本機模型尚未載入或就緒！");
  }

  currentAbortController = new AbortController();
  const signal = currentAbortController.signal;

  try {
    const response = await currentSession.prompt(prompt, {
      signal,
      temperature: 0.7,
      onTextChunk: (chunk) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('comment-chunk', chunk);
        }
      }
    });

    return {
      success: true,
      text: response
    };
  } catch (err) {
    if (signal.aborted) {
      return { success: false, aborted: true };
    }
    console.error("[桌面引擎] 推論過程發生錯誤:", err);
    return { success: false, error: err.message };
  } finally {
    currentAbortController = null;
  }
});

ipcMain.handle('stop-generation', async () => {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
  return { success: true };
});

app.whenReady().then(createWindow);

app.on('window-all-closed', async () => {
  if (currentContext) await currentContext.dispose();
  if (currentModel) await currentModel.dispose();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
