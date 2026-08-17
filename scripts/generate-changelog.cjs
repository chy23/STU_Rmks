const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const translationMap = {
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
