import React, { useState, useRef, useEffect } from 'react';
import { CreateMLCEngine } from "@mlc-ai/web-llm";
import * as XLSX from 'xlsx';
import { Upload, Download, Settings, Play, CheckCircle2, Loader2, AlertCircle, Info } from 'lucide-react';
import './App.css';

const AVAILABLE_MODELS = [
  "Llama-3.1-8B-Instruct-q4f16_1-MLC",
  "gemma-2-2b-it-q4f16_1-MLC",
  "Phi-3.5-mini-instruct-q4f16_1-MLC"
];

const STYLES = [
  { name: "文學大師風格", desc: "以典雅文辭、溫潤意境與修辭隱喻賦予文字生命力；注重品格薰陶與文雅期許，將日常行為轉化為具文學厚度的成長篇章。" },
  { name: "亞里士多德美德風格", desc: "強調「卓越不是一種行為，而是一種習慣」；以「實踐智慧（Phronesis）」與「中庸之道」為軸，引導孩子在過度與不及之間找到理性平衡。" },
  { name: "阿德勒心理學風格", desc: "建構平等的水平夥伴關係，強調「社會興趣」、「不完美的勇氣」與「課題分離」；拒絕定型標籤，引導學生透過「自我決定」承擔行為責任。" },
  { name: "薩提爾教練風格", desc: "穿透表面的防衛行為，探索冰山底層的感受、渴望與自我價值；引導孩子學會自我覺察，建立表裡如一的「一致性溝通」並為自己負責。" },
  { name: "成長型思維風格", desc: "聚焦於「努力的過程」、「策略的調整」與「尚未（Not Yet）」的概念；將錯誤與挫折視為大腦升級的訊號，強調持續迭代與刻意練習。" },
  { name: "科學人系統風格", desc: "運用熱力學、多線程、反饋機制等客觀科學模型，將成長盲點解構為「待調校的系統參數」與「雜訊濾除」，理性且不帶批判色彩。" },
  { name: "愛因斯坦物理探索風格", desc: "以宇宙時空、量子引力、相對坐標與極致的「好奇心與想像力」為底色；引導孩子在靜止坐標系中收斂心神、聚焦能量，探索真理。" },
  { name: "敏捷教練 / PM風格", desc: "以精準、目標導向的專案管理語言撰寫，強調「優先級排序」、「專注衝刺」與「持續複盤」；建立清晰的自我管理檢核機制。" },
  { name: "杜威實用主義風格", desc: "「教育即生活，教育即生長，從做中學」；強調在真實生活經驗中持續進行「反思與重組」，培養民主社群中的主動協作意識。" },
  { name: "亞當斯密經濟學風格", desc: "透過「看不見的手」調控資源分配，探討「自利與利他」的和諧，強調內在資本（專注力、知識）的累積與邊際效益最大化。" },
  { name: "英雄之旅敘事風格", desc: "將成長轉折包裝為「冒險勇者的修練試煉」；將自律與常規轉化為「鍛造防具」，將專注與知識轉化為「磨礪寶劍」，賦予榮譽感與使命感。" },
  { name: "自然生態觀察家風格", desc: "以自然界的花木、根系、季節時序與生態和諧為隱喻，溫和接納生命時鐘；強調「向下深扎根系」的底蘊與「迎向陽光舒展」的主動性。" },
  { name: "老莊道家風格", desc: "順應孩子的天性稟賦，不強求齊一標準；強調「水善利萬物而不爭」的包容，引導孩子在動靜相生中學會「致虛極，守靜篤」，涵養大器。" },
  { name: "斯多葛哲學風格", desc: "聚焦於「控制二分法」——清楚劃分「自己能掌控的」與「無法掌控的」；鍛造內在堡壘與反脆弱的理性力量。" },
  { name: "正念覺察風格", desc: "強調「回到當下」與「非評價式的覺察」；引導孩子在呼吸與感知中安頓跳躍的心念，溫柔接納自己的情緒，將注意力重新聚焦。" },
  { name: "交響樂團風格", desc: "將成長比擬為「交響樂的合奏」；強調個人主旋律的精準、與同儕聲部的諧和共鳴，以及掌握「休止符（靜心聆聽與留白）」的藝術。" },
  { name: "建築美學風格", desc: "將學習與品格視為「建築結構的營造」；強調「地基」的穩固、「梁柱」的承重，以及「開窗採光（人際視野與包容）」的開闊。" },
  { name: "設計思考風格", desc: "以「同理心觀察」、「定義核心問題」、「快速嘗試」與「測試修正」為核心；把生活中的挫折，視為一場有趣的「解題與產品優化」歷程。" },
  { name: "其他", desc: "" }
];

const WORD_COUNTS = [
  "50字內",
  "50-100字",
  "100-150字",
  "150-200字",
  "200-250字",
  "300字內"
];

function App() {
  const [engine, setEngine] = useState(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState("");
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0]);

  const [students, setStudents] = useState([]);
  const [originalAoa, setOriginalAoa] = useState(null);
  const [headerRowIndex, setHeaderRowIndex] = useState(-1);
  
  // Settings
  const [style, setStyle] = useState(STYLES[0].name);
  const [customStyle, setCustomStyle] = useState("");
  const [wordCount, setWordCount] = useState(WORD_COUNTS[1]);
  const [remarks, setRemarks] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  const translateProgress = (text) => {
    let t = text;
    t = t.replace('Fetching param cache', '下載模型參數快取');
    t = t.replace('MB fetched.', 'MB 已下載。');
    t = t.replace('completed,', '完成，');
    t = t.replace('secs elapsed.', '秒經過。');
    t = t.replace('It can take a while when we first visit this page to populate the cache.', '初次載入需要較長時間下載數 GB 的模型檔案。');
    t = t.replace('Later refreshes will become faster.', '未來再次開啟網頁將會直接從本機快取讀取，速度會大幅加快。');
    t = t.replace('Loading model from cache', '從本機快取讀取模型');
    t = t.replace('Finish loading', '載入完成');
    return t;
  };

  const handleInitModel = async () => {
    if (engine) return;
    setModelLoading(true);
    try {
      const newEngine = await CreateMLCEngine(selectedModel, {
        initProgressCallback: (progress) => {
          setLoadProgress(translateProgress(progress.text));
        }
      });
      setEngine(newEngine);
    } catch (err) {
      console.error(err);
      alert("載入模型失敗，請確認您的硬體是否支援 WebGPU，或更換較小的模型。");
    } finally {
      setModelLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      
      let headerRowIdx = -1;
      let nameColIdx = -1;
      let traitsColIdx = -1;

      for (let i = 0; i < Math.min(data.length, 30); i++) {
        const row = data[i];
        if (!Array.isArray(row)) continue;
        
        const nIdx = row.findIndex(c => typeof c === 'string' && (c.replace(/\s+/g, '') === '姓名' || c.replace(/\s+/g, '') === 'Name'));
        if (nIdx !== -1) {
          headerRowIdx = i;
          nameColIdx = nIdx;
          traitsColIdx = row.findIndex(c => typeof c === 'string' && (c.includes('特質') || c.includes('評語') || c.includes('日常') || c.includes('表現')));
          break;
        }
      }

      if (headerRowIdx === -1) {
        alert("找不到「姓名」欄位，請確定上傳的檔案中有包含學生姓名的標題行。");
        return;
      }

      const mappedStudents = [];
      for (let i = headerRowIdx + 1; i < data.length; i++) {
        const row = data[i];
        if (!Array.isArray(row) || !row[nameColIdx]) continue;

        const name = String(row[nameColIdx]).trim();
        if (!name) continue;

        let traits = "";
        if (traitsColIdx !== -1 && row[traitsColIdx]) {
          traits = String(row[traitsColIdx]);
        } else {
          traits = row.filter((c, idx) => idx !== nameColIdx && typeof c === 'string' && c.length > 2).join(' ');
        }

        mappedStudents.push({
          id: i,
          name: name,
          traits: traits || "無",
          originalRowIndex: i,
          generatedComment: "",
          status: "idle"
        });
      }

      setOriginalAoa(data);
      setHeaderRowIndex(headerRowIdx);
      setStudents(mappedStudents);
    };
    reader.readAsBinaryString(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload({ target: { files: e.dataTransfer.files } });
    }
  };

  const generatePrompt = (student) => {
    let finalStyle = style;
    let styleDesc = "";
    if (style === "其他") {
      finalStyle = customStyle;
    } else {
      const s = STYLES.find(x => x.name === style);
      if (s && s.desc) styleDesc = `\n此風格的核心精神為：${s.desc}`;
    }

    return `你是一位專業且充滿熱忱的教育工作者。請根據學生的特質與過去評語，用【${finalStyle}】的風格寫出一段給學生的期末評語。${styleDesc}
字數限制為：${wordCount}。
特別備註：${remarks || "無"}。

【絕對要求】：無論使用何種風格，用詞必須正向、帶有期許。若有不足之處，請提供具有建設性的調適方向，絕不可出現負面批評或嚴厲責罵。

學生姓名：${student.name}
特質/過去評語：${student.traits}

請直接輸出評語內容，不要包含其他問候語或解釋。`;
  };

  const generateForStudent = async (studentId) => {
    if (!engine) {
      alert("請先載入 AI 模型！");
      return;
    }
    
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: "generating", generatedComment: "" } : s));
    
    const student = students.find(s => s.id === studentId);
    const prompt = generatePrompt(student);

    try {
      const messages = [{ role: "user", content: prompt }];
      
      const asyncChunkGenerator = await engine.chat.completions.create({
        messages,
        stream: true,
        temperature: 0.7,
      });

      let currentText = "";
      for await (const chunk of asyncChunkGenerator) {
        currentText += chunk.choices[0]?.delta?.content || "";
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, generatedComment: currentText } : s));
      }
      
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: "done" } : s));
    } catch (err) {
      console.error(err);
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: "error" } : s));
    }
  };

  const generateAll = async () => {
    setIsGenerating(true);
    for (const student of students) {
      await generateForStudent(student.id);
    }
    setIsGenerating(false);
  };

  const exportExcel = () => {
    if (students.length === 0 || !originalAoa) return;
    
    const exportAoa = originalAoa.map(row => Array.isArray(row) ? [...row] : []);
    
    const targetHeaderRow = exportAoa[headerRowIndex];
    targetHeaderRow.push("AI生成評語");
    const aiCommentColIdx = targetHeaderRow.length - 1;

    students.forEach(s => {
      while (exportAoa[s.originalRowIndex].length <= aiCommentColIdx) {
        exportAoa[s.originalRowIndex].push("");
      }
      exportAoa[s.originalRowIndex][aiCommentColIdx] = s.generatedComment;
    });
    
    const ws = XLSX.utils.aoa_to_sheet(exportAoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "評語結果");
    XLSX.writeFile(wb, "學生評語生成結果.xlsx");
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>學生評語生成系統 🎓</h1>
        <p>基於 WebLLM 技術，確保您的資料 100% 在本地處理，無隱私外洩風險。</p>
      </header>

      <main className="app-main">
        {/* Model Section */}
        <section className="card">
          <div className="card-header">
            <h2>1. AI 模型設定</h2>
          </div>
          <div className="model-controls">
            <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} disabled={engine || modelLoading}>
              {AVAILABLE_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <button 
              className={`btn primary ${engine ? 'success' : ''}`}
              onClick={handleInitModel} 
              disabled={engine || modelLoading}
            >
              {engine ? <><CheckCircle2 size={16}/> 模型已就緒</> : modelLoading ? <><Loader2 className="spin" size={16}/> 載入中...</> : '載入模型'}
            </button>
          </div>
          {loadProgress && !engine && <div className="progress-text">{loadProgress}</div>}
          <div className="alert info">
            <AlertCircle size={16}/>
            初次載入需下載數GB模型檔至瀏覽器快取，請耐心等候。建議使用具備獨立顯卡或大記憶體之設備。
          </div>
        </section>

        {/* Upload & Settings Section */}
        <div className="grid-2">
          <section className="card">
            <div className="card-header">
              <h2>2. 上傳學生名單</h2>
            </div>
            <div 
              className={`upload-area ${isDragging ? 'drag-active' : ''}`} 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload size={32} />
              <p>點擊或拖曳 Excel 檔案上傳</p>
              <span>(.xlsx / .csv)，需包含「姓名」與「特質」欄位</span>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".xlsx, .xls, .csv" 
                style={{ display: 'none' }} 
              />
            </div>
            {students.length > 0 && (
              <p className="success-text">✅ 成功載入 {students.length} 筆資料</p>
            )}
          </section>

          <section className="card">
            <div className="card-header">
              <h2>3. 生成條件設定</h2>
            </div>
            <div className="form-group">
              <label>評語風格：</label>
              <select value={style} onChange={e => setStyle(e.target.value)}>
                {STYLES.map(s => <option key={s.name} value={s.name} title={s.desc}>{s.name}</option>)}
              </select>
              {style !== "其他" && STYLES.find(s => s.name === style)?.desc && (
                <div className="style-description-box">
                  <Info size={16} className="icon" />
                  <span>{STYLES.find(s => s.name === style)?.desc}</span>
                </div>
              )}
              {style === "其他" && (
                <input type="text" placeholder="輸入自訂風格..." value={customStyle} onChange={e => setCustomStyle(e.target.value)} className="mt-2" />
              )}
            </div>
            <div className="form-group">
              <label>字數限制：</label>
              <select value={wordCount} onChange={e => setWordCount(e.target.value)}>
                {WORD_COUNTS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>全班共同備註 / 提醒事項：</label>
              <textarea 
                value={remarks} 
                onChange={e => setRemarks(e.target.value)}
                placeholder="例如：這學期班上共同表現活潑，請加入鼓勵他們多閱讀的建議..."
                rows={3}
              ></textarea>
            </div>
          </section>
        </div>

        {/* Data Table Section */}
        {students.length > 0 && (
          <section className="card full-width">
            <div className="card-header flex-between">
              <h2>4. 預覽與生成</h2>
              <div className="actions">
                <button className="btn primary" onClick={generateAll} disabled={isGenerating || !engine}>
                  <Play size={16} /> 全部生成
                </button>
                <button className="btn outline" onClick={exportExcel} disabled={students.every(s => s.status !== 'done')}>
                  <Download size={16} /> 匯出 Excel
                </button>
              </div>
            </div>
            
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th width="10%">姓名</th>
                    <th width="35%">特質/過往評語</th>
                    <th width="45%">AI 生成評語</th>
                    <th width="10%">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id}>
                      <td>{student.name}</td>
                      <td><div className="scroll-cell">{student.traits}</div></td>
                      <td>
                        <div className={`scroll-cell generated ${student.status}`}>
                          {student.generatedComment || (student.status === 'idle' ? <span className="text-muted">等待生成...</span> : '')}
                        </div>
                      </td>
                      <td>
                        <button 
                          className="btn small" 
                          onClick={() => generateForStudent(student.id)}
                          disabled={student.status === 'generating' || !engine}
                        >
                          {student.status === 'generating' ? <Loader2 className="spin" size={14}/> : '生成'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
