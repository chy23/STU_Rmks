const fs = require('fs');
let c = fs.readFileSync('src/App.jsx', 'utf-8');

c = c.replace(
  /if \(dropdownRef\.current && !dropdownRef\.current\.contains\(event\.target\)\) {\n\s*setIsDropdownOpen\(false\);\n\s*}/,
  `if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target)) {
        setIsModelDropdownOpen(false);
      }`
);

c = c.replace(
  /<div className="upload-area" onClick={\(\) => fileInputRef\.current\.click\(\)}>/,
  `<div 
                className={\`upload-area \${isDragging ? 'drag-active' : ''}\`}
                onClick={() => fileInputRef.current.click()}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >`
);

c = c.replace(
  /<select value={selectedModel} onChange={e => setSelectedModel\(e\.target\.value\)} disabled={engine \|\| modelLoading}>[\s\S]*?<\/select>/,
  `<div className="custom-select-wrapper" ref={modelDropdownRef} style={{flex: 1}}>
              <div className="custom-select-trigger" onClick={() => !engine && !modelLoading && setIsModelDropdownOpen(!isModelDropdownOpen)}>
                <span style={{fontWeight: 500}}>{AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name}</span>
                <ChevronDown size={18} color="var(--text-muted)" />
              </div>
              {isModelDropdownOpen && (
                <div className="custom-select-menu">
                  {AVAILABLE_MODELS.map(m => (
                    <div 
                      key={m.id} 
                      className={\`custom-select-option \${selectedModel === m.id ? 'selected' : ''}\`}
                      onClick={() => { setSelectedModel(m.id); setIsModelDropdownOpen(false); }}
                    >
                      <div className="option-title">{m.name}</div>
                      <div className="option-desc" style={{ marginTop: '4px' }}>
                        {m.hint}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>`
);

c = c.replace(
  /<div className="model-hint">[\s\S]*?<\/div>/,
  ''
);

c = c.replace(
  /{loadProgress && !engine && <div className="progress-text">{loadProgress}<\/div>}/,
  `{loadProgress && !engine && (
            <div className="progress-text">
              <div style={{ marginBottom: '8px' }}>{loadProgress}</div>
              {loadProgressObj && loadProgressObj.progress !== undefined && (
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: \`\${Math.round(loadProgressObj.progress * 100)}%\` }}></div>
                </div>
              )}
            </div>
          )}`
);

c = c.replace(
  /<table className="data-table">/,
  `{students.length === 0 ? (
              <div className="empty-state">
                <Users size={48} />
                <h3>尚未載入學生資料</h3>
                <p>請先在上方上傳 Excel 檔案</p>
              </div>
            ) : (
              <table className="data-table">`
);

c = c.replace(
  /<\/table>/,
  `</table>
            )}`
);

c = c.replace(
  /<div className={`generated \$\{s\.status\}`}>\n\s*\{s\.remark \|\| '-'\}\n\s*<\/div>/g,
  `<div className={\`generated \${s.status}\`}>
                        {s.remark || '-'}
                      </div>
                      {s.status === 'done' && (
                        <button className="copy-btn" onClick={() => handleCopy(s.remark)} title="複製評語">
                          <Copy size={14} /> 複製
                        </button>
                      )}`
);

c = c.replace(
  /<\/main>/,
  `  <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={\`toast \${t.type}\`}>
              {t.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {t.msg}
            </div>
          ))}
        </div>
      </main>`
);

fs.writeFileSync('src/App.jsx', c);
console.log('Update script finished');
