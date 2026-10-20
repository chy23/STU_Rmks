const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const translationMap = {
  "Feat: Add Electron desktop app infrastructure with offline native models (Llama-3.2-3B and Gemma-2-9B)": {
    title: "建置桌面原生 App 架構（支援 Mac M系列與 Windows，內建 Llama-3.2-3B 與 Gemma-2-9B）",
    details: "1. 導入 Electron 桌面端原生架構與 node-llama-cpp 推論引擎，支援一鍵打包為 macOS (Apple Silicon arm64 .dmg) 與 Windows (x64 .exe)。\n2. 內建兩大本地離線 GGUF 模型：Llama-3.2-3B-Instruct (極速日常首選) 與 Gemma-2-9B (旗艦深度文采)，支援 Apple Silicon Metal 與 Windows Vulkan/DirectML 硬體加速。\n3. 提供全自動模型下載腳本 (npm run download:models) 與自動封裝打包 (extraResources)。\n4. 介面無縫適配：桌面模式下自動優先啟動原生硬體加速離線推論，保留極致隱私與零連網開箱即用體驗。"
  },
  "Feat: 統一 WebLLM 模型規格，標註廠商、國家、大小、特點與建議": {
    title: "統一 WebLLM 本地模型規格與資訊卡",
    details: "1. 統一保留 6 款精選開源模型（Gemma 3 1B、Llama 3.2 1B/3B、Gemma 2 2B/9B、Llama 3.1 8B）。\n2. 於下拉選單與資訊卡全面標註模型的「廠商、國家、參數大小、核心特點、設備與使用建議」，以統一規格呈現。"
  },
  "Feat: Add Gemini Paid API dual-mode with gemini-4-argon fallback and confirmation dialog": {
    title: "新增「Gemini 付費 API」雙模式與 gemini-4-argon 備援機制",
    details: "1. 導入雙引擎模式，使用者可自由選擇「本機離線模式」或「雲端付費 API 模式」。\n2. 雲端 API 備援模型順序升級：gemini-3.8-flash → gemini-3.7-flash → gemini-3.6-flash → gemini-4-argon → gemini-3.1-pro-preview。\n3. 在調用最新旗艦模型 gemini-4-argon 前主動彈出確認視窗，提供「同意調用」、「略過嘗試下一個」或「取消」選項，保障使用者付費知情權。\n4. API Key 本機安全記憶與明文切換，支援 Esc 鍵快捷關閉確認對話框。"
  },
  "Fix: resolve blank screen by fixing undefined handleDrag reference": {
    title: "修正網頁白屏問題",
    details: "修復拖曳上傳區的程式碼參照錯誤，解決畫面載入時出現一片空白的問題。"
  },
  "Fix: restore missing favicon and translate changelog to Traditional Chinese": {
    title: "修復網站圖示與更新紀錄中文化",
    details: "1. 將不小心遺失的網站圖示 (Favicon) 補回大標題旁。\n2. 將系統更新紀錄全面改為繁體中文，並補上詳細的更新說明。"
  },
  "UI/UX: comprehensive visual and interactive overhaul": {
    title: "使用者介面與體驗 (UI/UX) 全面大升級",
    details: "1. 新增「一鍵複製」按鈕，提升操作效率。\n2. 建構全局角落彈出提示系統 (Toast)。\n3. 實裝動態模型載入進度條與拖曳動畫。\n4. 導入 Noto Sans TC 字體並優化卡片質感。\n5. 新增名單空狀態引導圖示，並凍結表格標題列。"
  },
  "Fix: fetch all git history in CI for complete changelog": {
    title: "修正更新紀錄顯示不全問題",
    details: "調整自動化部署腳本 (GitHub Actions)，解決因「淺層複製 (Shallow Clone)」導致更新紀錄只顯示最後一筆的問題，現在可完整呈現所有歷史紀錄。"
  },
  "Fix: correctly order 8B before 9B model": {
    title: "修正模型清單排序",
    details: "修正 8B 與 9B 模型的輕重度排序，將參數與硬體需求最大的 Gemma 2 (9B) 移至最後一位。"
  },
  "Enhance: add vendor and country tags to models, clarify Llama 3.1": {
    title: "新增模型廠商與國家標示",
    details: "在下拉選單中明確標示每個模型所屬的廠商與國家（Google/美國、Meta/美國），並移除容易混淆的 Gamma4 名稱，統一標示為 Llama 3.1 (8B)。"
  },
  "Enhance: record all future updates in changelog without limit": {
    title: "解除更新紀錄筆數限制",
    details: "解除原本 50 筆的限制，未來所有的更新紀錄都會被完整保留與顯示。"
  },
  "Fix: correct UI layout and JSX syntax for model selector": {
    title: "修正模型選單排版異常",
    details: "修復 JSX 標籤未正確閉合導致的編譯錯誤與排版問題。"
  },
  "Feat: Add app icon, watermarks, and automated changelog modal": {
    title: "新增網站圖示、防偽浮水印與更新紀錄彈窗",
    details: "為網站加上專屬圖示 (Favicon)，在畫面角落新增半透明浮水印，並實裝了點擊即可查看歷史版本的更新紀錄對話窗。"
  },
  "Feat: Add legendary athletes styles (Kobe, Jordan, Nadal, Ohtani, Curry, Tai, Honnold)": {
    title: "新增「傳奇運動員」評語風格",
    details: "包含：柯比·布萊恩 (極致自律)、麥可·喬丹 (承擔責任)、納達爾 (永不放棄)、大谷翔平 (謙遜二刀流)、柯瑞 (刻意練習)、戴資穎 (靈活應變) 等運動員風格。"
  },
  "Feat: Add comprehensive new styles (Philosophers, Scientists, Entrepreneurs)": {
    title: "新增「哲學家、科學家、企業家」評語風格",
    details: "包含：蘇格拉底、康德、尼采、愛因斯坦、居禮夫人、馬斯克、黃仁勳等多位名人的專屬指導風格與核心詞彙。"
  },
  "Feat: Add stop generation button to interrupt WebLLM inference": {
    title: "新增「停止生成」按鈕",
    details: "在生成大量評語時，若隨時想中斷生成，可點擊停止按鈕立即終止 AI 運算。"
  },
  "UI: Replace native select with custom dropdown for better description readability": {
    title: "優化風格下拉選單",
    details: "將原本單調的選單改為客製化樣式，讓風格的「核心精神」與「適用情境」能直接顯示在選項中，方便老師挑選。"
  },
  "Feat: Add drag-and-drop file upload functionality": {
    title: "新增「拖曳上傳」功能",
    details: "現在可以直接把 Excel 檔案拖曳到上傳區塊中，操作更加直覺快速。"
  },
  "Initial commit: WebLLM Student Remarks Generator": {
    title: "網站建立與核心系統上線",
    details: "基於 WebLLM 的純前端學生評語生成系統正式上線！確保資料 100% 在本地處理，無隱私外洩疑慮。"
  }
};

try {
  // Get all commits to keep full history as requested
  const logOutput = execSync('git log --pretty=format:"%H|%s|%b|%cd" --date=short').toString();
  
  const commits = logOutput.split('\n').filter(line => line.trim() !== '').map(line => {
    const parts = line.split('|');
    const originalTitle = parts[1] ? parts[1].trim() : '';
    const originalBody = parts[2] ? parts[2].trim() : '';
    
    let title = originalTitle;
    let body = originalBody;
    
    if (translationMap[originalTitle]) {
      title = translationMap[originalTitle].title;
      body = translationMap[originalTitle].details;
    }

    return {
      hash: parts[0],
      title: title,
      body: body,
      date: parts[3] || ''
    };
  });

  // Calculate version numbers based on total commit count
  const totalCommits = parseInt(execSync('git rev-list --count HEAD').toString().trim(), 10);
  
  const changelog = commits.map((c, index) => {
    return {
      version: `v1.0.${totalCommits - index}`,
      date: c.date,
      title: c.title,
      details: c.body,
      hash: c.hash.substring(0, 7)
    };
  });

  const targetPath = path.join(__dirname, '../src/changelog.json');
  fs.writeFileSync(targetPath, JSON.stringify(changelog, null, 2));
  console.log('Changelog generated successfully at ' + targetPath);
} catch (e) {
  console.error('Failed to generate changelog:', e);
}
