import React, { useState, useRef, useEffect } from 'react';
import { CreateMLCEngine } from "@mlc-ai/web-llm";
import * as XLSX from 'xlsx';
import { Upload, Download, Settings, Play, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import './App.css';

const AVAILABLE_MODELS = [
  "Llama-3.1-8B-Instruct-q4f16_1-MLC",
  "Qwen2.5-7B-Instruct-q4f16_1-MLC",
  "gemma-2-2b-it-q4f16_1-MLC"
];

const STYLES = [
  "文學造詣極佳的文學",
  "阿德勒心理學家",
  "科學人的風格",
  "亞里士多德的風格",
  "杜威風格",
  "亞當斯密風格",
  "愛因斯坦的風格",
  "其他"
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
  
  // Settings
  const [style, setStyle] = useState(STYLES[0]);
  const [customStyle, setCustomStyle] = useState("");
  const [wordCount, setWordCount] = useState(WORD_COUNTS[1]);
  const [remarks, setRemarks] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

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
      const data = XLSX.utils.sheet_to_json(ws);
      
      // Map data to expected format (assuming '姓名' and '特質' or '過往評語' exist)
      const mappedStudents = data.map((row, idx) => {
        const name = row['姓名'] || row['Name'] || `學生${idx + 1}`;
        const traits = row['特質'] || row['過往評語'] || row['評語'] || row['特質與過往評語'] || JSON.stringify(row);
        return {
          id: idx,
          name: name,
          traits: traits,
          originalRow: row,
          generatedComment: "",
          status: "idle" // idle, generating, done, error
        };
      });
      setStudents(mappedStudents);
    };
    reader.readAsBinaryString(file);
  };

  const generatePrompt = (student) => {
    const finalStyle = style === "其他" ? customStyle : style;
    return `你是一位專業且充滿熱忱的教育工作者。請根據學生的特質與過去評語，用【${finalStyle}】的風格寫出一段給學生的期末評語。
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
      if (student.status !== "done") {
        await generateForStudent(student.id);
      }
    }
    setIsGenerating(false);
  };

  const exportExcel = () => {
    if (students.length === 0) return;
    const exportData = students.map(s => ({
      ...s.originalRow,
      "AI生成評語": s.generatedComment
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
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
            <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
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
                {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
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
