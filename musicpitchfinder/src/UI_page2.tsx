import React, { useState, useCallback, useEffect } from 'react';
import './UI_page2.css';
import { supabase } from "./supabase";
import { Link, useNavigate } from "react-router-dom";

interface FileInputBoxProps {
  title: string;
  onFileSelect: (file: File) => void;
  url: string;
  onUrlChange: (url: string) => void;
}

const FileInputBox: React.FC<FileInputBoxProps> = ({ title, onFileSelect, url, onUrlChange }) => {
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
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
      />
    </div>
  );
};


export default function UI_page2() {
  const navigate = useNavigate();

  const [error, setError] = useState<string>('');
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string>('');
  const [coverUrl, setCoverUrl] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [keyDifference, setKeyDifference] = useState<string>('-');
  const [recommendedKey, setRecommendedKey] = useState<string>('-');

  const [userPitch, setUserPitch] = useState<{ high_sound: string; low_sound: string; } | null>(null);

  useEffect(() => {
    const fetchUserPitch = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('pitch')
            .select('high_sound, low_sound')
            .eq('id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') {
            throw error;
          }

          if (data) {
            setUserPitch(data);
          }
        }
      } catch (err: any) {
        console.error("音域データの取得エラー:", err);
      }
    };

    fetchUserPitch();
  }, []);


  const handleOriginalFile = (file: File) => {
    setOriginalFile(file);
  };

  const handleCoverFile = (file: File) => {
    setCoverFile(file);
  };

  const handleCompare = async () => {
    if (!originalUrl || !coverUrl) {
      setError('原曲とカバー楽曲の両方のURLを入力してください。');
      return;
    }

    setError('');
    setIsLoading(true);
    setKeyDifference('-');
    setRecommendedKey('-');

    try {
      const apiUrl = 'http://127.0.0.1:8000/separate';

      const requestBody: {
        original_url: string;
        cover_url: string;
        user_high_note?: string;
        user_low_note?: string;
      } = {
        original_url: originalUrl,
        cover_url: coverUrl,
      };

      if (userPitch) {
        requestBody.user_high_note = userPitch.high_sound;
        requestBody.user_low_note = userPitch.low_sound;
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'APIリクエストに失敗しました。');
      }

      const result = await response.json();

      const currentRecommendedKey = result.user_key_shift !== undefined ? result.user_key_shift.toString() : '取得不可';
      const currentKeyDifference = result.key_difference ?? '取得不可';

      setRecommendedKey(currentRecommendedKey);
      setKeyDifference(currentKeyDifference);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error("ユーザーが認証されていません。保存をスキップします。");
          return;
        }

        if (!result.original) {
          console.error("APIレスポンスに原曲データが含まれていません。保存をスキップします。");
          return;
        }

        const { error: insertError } = await supabase
          .from('music')
          .insert({
            profiles_id: user.id,
            "title": result.original.title,
            "original_url": originalUrl,
            "cover_url": coverUrl,
            "high_pitch": result.original.max_note,
            "low_pitch": result.original.min_note,
            "optimal_pitch": currentRecommendedKey,
            "comparison_pitch": currentKeyDifference,
          });

        if (insertError) {
          throw insertError;
        }

        console.log("比較結果が正常に保存されました。");

      } catch (dbError: any) {
        console.error("データベースへの保存中にエラーが発生しました:", dbError);
        setError(prevError => prevError ? `${prevError}\n結果の保存に失敗しました。` : '結果の保存に失敗しました。');
      }

    } catch (err: any) {
      console.error("比較処理中にエラーが発生しました:", err);
      setError(err.message || '比較処理中にエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
      try {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
        navigate("/");
      } catch (err) {
        console.error("サインアウト中にエラーが発生しました:", err);
        setError((err as Error).message);
      }
    };

  return (
    <>
      <header className="header">
        <Link to="/dashboard"><h1 className="bold">Singalyzer</h1></Link>
        <nav className="flex_container">
          <ul className="nav-links">
            <li><Link to="/UI_page2"><button className="button_hover">➕</button></Link></li>
            <li><Link to="/UI_page3"><button className="button_hover">🎶</button></Link></li>
            <li><button onClick={signOut} className="button_hover">Sign out</button></li>
          </ul>
        </nav>
      </header>
      <div className="main_container">
        <div className="app-container">
          <div className="main-content">
            <div className="inputs-grid">
              <FileInputBox
                title="原曲"
                onFileSelect={handleOriginalFile}
                url={originalUrl}
                onUrlChange={setOriginalUrl}
              />
              <FileInputBox
                title="カバー楽曲"
                onFileSelect={handleCoverFile}
                url={coverUrl}
                onUrlChange={setCoverUrl}
              />
            </div>

            <div className="results-area">
              <button
                onClick={handleCompare}
                className="compare-button"
                disabled={isLoading}
              >
                {isLoading ? '比較中...' : '比較する'}
              </button>

              {error && <p className="error-message">{error}</p>}

              <div className="result-box">
                <h3 className="result-title">キーの差</h3>
                <div className="result-display">{keyDifference}</div>
              </div>
              <div className="result-box">
                <h3 className="result-title">おすすめキー</h3>
                <div className="result-display">{recommendedKey}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}