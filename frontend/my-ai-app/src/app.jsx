import React, { useState, useRef } from 'react';
import './App.css'; // 引入你的 CSS 檔案

const API_URL = 'http://127.0.0.1:8000/predict';

export default function App() {
  // --- 狀態管理 (State) ---
  const [mode, setMode] = useState(null); // 'url' 或 'file'
  const [imageUrl, setImageUrl] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [resultText, setResultText] = useState(null);
  const [isError, setIsError] = useState(false);

  const fileInputRef = useRef(null);

  // --- 事件處理 ---
  const handleUrlChange = (e) => {
    const url = e.target.value;
    setImageUrl(url);
    if (url.trim() !== '') {
      setMode('url');
      setFile(null);
      setPreview(url);
      clearResult();
    } else {
      setMode(null);
      setPreview(null);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    processFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    processFile(droppedFile);
  };

  const processFile = (selectedFile) => {
    if (selectedFile) {
      setMode('file');
      setImageUrl('');
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(selectedFile);
      clearResult();
    }
  };

  const clearResult = () => {
    setResultText(null);
    setIsError(false);
  };

  // --- 呼叫後端 API ---
  const handleSubmit = async () => {
    setIsLoading(true);
    clearResult();

    try {
      let response;
      
      if (mode === 'url') {
        response = await fetch(`${API_URL}/url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_url: imageUrl.trim() })
        });
      } else if (mode === 'file') {
        const formData = new FormData();
        formData.append('file', file);
        response = await fetch(API_URL, {
          method: 'POST',
          body: formData
        });
      }

      if (!response.ok) throw new Error('伺服器回應異常');
      
      const data = await response.json();
      
      // 💡 智慧紅綠燈邏輯
      if (data.result && data.result.includes("NOT")) {
        setIsError(true);
      } else {
        setIsError(false);
      }
      setResultText(data.result || '辨識完成！');

    } catch (error) {
      setIsError(true);
      setResultText('❌ 無法連線至 EC2 伺服器');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>智慧門禁辨識系統</h1>
        <p>React Cloud AI Demo</p>
      </header>

      {/* 方法一：網址輸入 */}
      <div className="input-group">
        <div className="section-title">方法一：輸入圖片網址</div>
        <input 
          type="text" 
          className="url-input" 
          placeholder="請貼上圖片的 URL 網址..." 
          value={imageUrl}
          onChange={handleUrlChange}
        />
      </div>

      {/* 方法二：檔案上傳 */}
      <div className="input-group">
        <div className="section-title">方法二：上傳本地相片</div>
        <div 
          className={`upload-area ${isDragOver ? 'dragover' : ''}`}
          onClick={() => fileInputRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
          onDrop={handleDrop}
        >
          <span style={{ fontSize: '32px' }}>📁</span>
          <p>將照片拖曳至此，或 <span>點擊瀏覽檔案</span></p>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept="image/*"
            onChange={handleFileChange} 
          />
        </div>
      </div>

      {/* 圖片預覽 */}
      {preview && (
        <div className="preview-container" style={{ display: 'block' }}>
          <img src={preview} alt="Preview" />
        </div>
      )}

      {/* 送出按鈕 */}
      <button 
        type="button" 
        className="btn-submit" 
        disabled={!mode || isLoading}
        onClick={handleSubmit}
      >
        傳送至雲端 EC2 進行辨識
      </button>

      {/* 辨識結果區 */}
      {(isLoading || resultText) && (
        <div className="result-container" style={{ display: 'block' }}>
          
          {isLoading && (
            <div className="status-box">
              <div className="spinner"></div>
              <span>AI 正在分析影像中，請稍候...</span>
            </div>
          )}

          {!isLoading && resultText && (
            <div className={`response-box ${isError ? 'error' : 'success'}`}>
              {resultText}
            </div>
          )}
          
        </div>
      )}
    </div>
  );
}