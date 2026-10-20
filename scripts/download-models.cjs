const fs = require('fs');
const path = require('path');
const https = require('https');

const MODELS = [
  {
    id: 'llama-3.2-3b',
    fileName: 'Llama-3.2-3B-Instruct-Q4_K_M.gguf',
    url: 'https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf',
    sizeBytes: 2020000000,
    desc: 'Llama 3.2 (3B) Instruct Q4_K_M (~2.0 GB)'
  },
  {
    id: 'gemma-2-9b',
    fileName: 'gemma-2-9b-it-Q4_K_M.gguf',
    url: 'https://huggingface.co/bartowski/gemma-2-9b-it-GGUF/resolve/main/gemma-2-9b-it-Q4_K_M.gguf',
    sizeBytes: 5880000000,
    desc: 'Gemma 2 (9B) Instruct Q4_K_M (~5.8 GB)'
  }
];

const targetDir = path.join(__dirname, '../models');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    
    function makeRequest(currentUrl) {
      https.get(currentUrl, (response) => {
        // Handle HTTP redirects (HuggingFace CDN redirects)
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          return makeRequest(response.headers.location);
        }
        
        if (response.statusCode !== 200) {
          return reject(new Error(`下載失敗，HTTP 狀態碼: ${response.statusCode}`));
        }

        const totalBytes = parseInt(response.headers['content-length'], 10) || 0;
        let downloadedBytes = 0;
        let lastReportTime = Date.now();

        response.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          file.write(chunk);

          const now = Date.now();
          if (now - lastReportTime > 800) {
            const percent = totalBytes > 0 ? ((downloadedBytes / totalBytes) * 100).toFixed(1) : 0;
            const downloadedMB = (downloadedBytes / (1024 * 1024)).toFixed(1);
            const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
            process.stdout.write(`\r[下載中] ${percent}% (${downloadedMB}MB / ${totalMB}MB) `);
            lastReportTime = now;
          }
        });

        response.on('end', () => {
          file.end();
          console.log(`\n✅ 下載完成: ${destPath}`);
          resolve();
        });

        response.on('error', (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
      }).on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    }

    makeRequest(url);
  });
}

async function main() {
  const targetModelId = process.argv[2];
  const listToDownload = targetModelId 
    ? MODELS.filter(m => m.id === targetModelId || m.fileName.toLowerCase().includes(targetModelId.toLowerCase()))
    : MODELS;

  if (listToDownload.length === 0) {
    console.log("未找到指定的模型，可選模型 ID: " + MODELS.map(m => m.id).join(', '));
    return;
  }

  for (const model of listToDownload) {
    const dest = path.join(targetDir, model.fileName);
    if (fs.existsSync(dest)) {
      const stats = fs.statSync(dest);
      if (stats.size > 100 * 1024 * 1024) { // > 100MB
        console.log(`⏩ 模型已存在，略過下載: ${model.fileName} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
        continue;
      }
    }

    console.log(`\n📥 開始下載離線本地模型: ${model.desc}`);
    console.log(`來源: ${model.url}`);
    console.log(`儲存路徑: ${dest}`);
    try {
      await downloadFile(model.url, dest);
    } catch (err) {
      console.error(`❌ 下載失敗: ${err.message}`);
    }
  }
}

main();
