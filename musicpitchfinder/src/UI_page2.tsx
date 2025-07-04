import React, { useState, useCallback } from 'react';
import './UI_page2.css';

interface FileInputBoxProps {
  title: string;
  onFileSelect: (file: File) => void;
}

const FileInputBox: React.FC<FileInputBoxProps> = ({ title, onFileSelect }) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setFileName(files[0].name);
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFileName(files[0].name);
      onFileSelect(files[0]);
    }
  };

  const onButtonClick = () => {
    (document.getElementById(`file-input-${title}`) as HTMLElement).click();
  };

  const dropZoneClass = isDragging ? 'drop-zone dragging' : 'drop-zone';

  return (
    <div className="file-input-container">
      <h3 className="file-input-title">{title}</h3>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={dropZoneClass}
      >
        <input
          type="file"
          id={`file-input-${title}`}
          className="file-input"
          onChange={handleFileChange}
          accept="audio/*"
        />
        <button onClick={onButtonClick} className="select-button">
          ファイルを選択
        </button>
        <p className="drop-text">またはドラッグ＆ドロップ</p>
        {fileName && <p className="file-name">{fileName}</p>}
      </div>
      <input
        type="text"
        placeholder="ここにリンクを貼り付け"
        className="url-input"
      />
    </div>
  );
};


export default function App() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const handleOriginalFile = (file: File) => {
    console.log("Original file:", file);
    setOriginalFile(file);
  };

  const handleCoverFile = (file: File) => {
    console.log("Cover file:", file);
    setCoverFile(file);
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <div className="inputs-grid">
          <FileInputBox title="原曲" onFileSelect={handleOriginalFile} />
          <FileInputBox title="カバー楽曲" onFileSelect={handleCoverFile} />
        </div>

        <div className="results-area">
          <button className="compare-button">
            比較する
          </button>
          <div className="result-box">
            <h3 className="result-title">キーの差</h3>
            <div className="result-display">-</div>
          </div>
          <div className="result-box">
            <h3 className="result-title">おすすめキー</h3>
            <div className="result-display">-</div>
          </div>
        </div>
      </div>
    </div>
  );
}