import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import * as Tone from 'tone';
import './UI_page3.css';

// (略)...インターフェース定義や定数は変更なし...
interface KeyInfo {
  note: string;
  type: 'white' | 'black';
  octave: string;
  octaveNoteName: string;
}

const octaveNotes: Omit<KeyInfo, 'octave' | 'octaveNoteName'>[] = [
  { note: 'A', type: 'white' }, { note: 'A#', type: 'black' }, { note: 'B', type: 'white' },
  { note: 'C', type: 'white' }, { note: 'C#', type: 'black' }, { note: 'D', type: 'white' },
  { note: 'D#', type: 'black' }, { note: 'E', 'type': 'white' }, { note: 'F', type: 'white' },
  { note: 'F#', type: 'black' }, { note: 'G', type: 'white' }, { note: 'G#', type: 'black' },
];

const octaveRanges = [
  { name: 'low', number: 2 }, { name: 'mid1', number: 3 }, { name: 'mid2', number: 4 },
  { name: 'hi', number: 5 }, { name: 'hihi', number: 6 },
];

const fullKeyboard: KeyInfo[] = octaveRanges.flatMap(octave =>
  octaveNotes.map(key => {
    let currentOctaveNumber = ['A', 'A#', 'B'].includes(key.note) ? octave.number - 1 : octave.number;
    return { ...key, octave: octave.name, octaveNoteName: `${key.note}${currentOctaveNumber}` };
  })
);

const WHITE_KEY_WIDTH = 56;
const BLACK_KEY_WIDTH = 35;
const OCTAVE_WIDTH = 7 * WHITE_KEY_WIDTH;

const getKeyStyle = (index: number): React.CSSProperties => {
  const key = fullKeyboard[index];
  let whiteKeyIndex = 0;
  for (let i = 0; i < index; i++) { if (fullKeyboard[i].type === 'white') { whiteKeyIndex++; } }
  if (key.type === 'white') { return { left: `${whiteKeyIndex * WHITE_KEY_WIDTH}px` }; }
  else { return { left: `${(whiteKeyIndex * WHITE_KEY_WIDTH) - (BLACK_KEY_WIDTH / 2)}px` }; }
};


export default function UI_page3() {
  const navigate = useNavigate();

  const [error, setError] = useState<any>(null);
  const [selectionMode, setSelectionMode] = useState<'lowest' | 'highest' | null>(null);
  const [lowestNote, setLowestNote] = useState<string | null>(null);
  const [highestNote, setHighestNote] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [submissionMessage, setSubmissionMessage] = useState<string>('');
  
  const [userPitch, setUserPitch] = useState<{ high_sound: string; low_sound: string; } | null>(null);
  const [isLoadingPitch, setIsLoadingPitch] = useState(true);

  const synth = useRef<Tone.Synth | null>(null);

  useEffect(() => {
    synth.current = new Tone.Synth().toDestination();
    return () => {
      synth.current?.dispose();
    };
  }, []);
  
  useEffect(() => {
    const fetchUserPitch = async () => {
      setIsLoadingPitch(true);
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
      } finally {
        setIsLoadingPitch(false);
      }
    };

    fetchUserPitch();
  }, []);

  // (略)...signOut, handleKeyClickなどの関数は変更なし...
  const signOut = async () => {
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      navigate("/");
    } catch (err) {
      console.error("サインアウト中にエラーが発生しました:", err);
      setError(err);
    }
  };

  const handleKeyClick = async (keyInfo: KeyInfo) => {
    if (synth.current) {
      await Tone.start();
      synth.current.triggerAttackRelease(keyInfo.octaveNoteName, "8n");
    }

    if (submissionStatus !== 'idle') {
      setSubmissionStatus('idle');
      setSubmissionMessage('');
    }

    if (selectionMode === 'lowest') {
      setLowestNote(keyInfo.octaveNoteName);
      setSelectionMode(null);
    } else if (selectionMode === 'highest') {
      setHighestNote(keyInfo.octaveNoteName);
      setSelectionMode(null);
    }
  };

  const handleSetLowest = () => {
    setSelectionMode('lowest');
  };

  const handleSetHighest = () => {
    setSelectionMode('highest');
  };

  const formatNoteForDisplay = (noteValue: string | null): string => {
    if (!noteValue) {
      return '未選択';
    }
    const keyInfo = fullKeyboard.find(k => k.octaveNoteName === noteValue);
    if (keyInfo) {
      return `${keyInfo.octave}${keyInfo.note}`;
    }
    return '未選択';
  };

  const handleConfirm = async () => {
    if (!lowestNote || !highestNote) {
      setSubmissionMessage('最低音と最高音の両方を選択してください。');
      setSubmissionStatus('error');
      return;
    }

    setSubmissionStatus('loading');
    setSubmissionMessage('保存中...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("ユーザーが認証されていません。");
      }

      const highSoundFormatted = formatNoteForDisplay(highestNote);
      const lowSoundFormatted = formatNoteForDisplay(lowestNote);

      const { error: upsertError } = await supabase
        .from('pitch')
        .upsert({
          id: user.id,
          high_sound: highSoundFormatted,
          low_sound: lowSoundFormatted,
        });

      if (upsertError) {
        throw upsertError;
      }

      setSubmissionStatus('success');
      setSubmissionMessage('音域が正常に保存されました！');
      
      setUserPitch({ high_sound: highSoundFormatted, low_sound: lowSoundFormatted });

      setLowestNote(null);
      setHighestNote(null);

    } catch (e: any) {
      console.error('保存中にエラーが発生しました:', e);
      setSubmissionStatus('error');
      setSubmissionMessage(`エラー: ${e.message || '音域の保存に失敗しました。'}`);
    }
  };

  return (
    <>
      <header className="header">
        <Link to="/dashboard"><h1 className="bold">Music Pitch Finder</h1></Link>
        <nav className="flex_container">
          <ul className="nav-links">
            {/* ▼▼▼【変更】ヘッダーから音域表示を削除 ▼▼▼ */}
            <li><Link to="/UI_page2"><button className="button_hover">➕</button></Link></li>
            <li><Link to="/UI_page3"><button className="button_hover">🎶</button></Link></li>
            <li>
              <button onClick={signOut} className="button_hover">Sign out</button>
            </li>
          </ul>
        </nav>
      </header>

      <div className='main_container'>
        <div className="app-container">
        
          {/* ▼▼▼【変更】音域表示をこの位置に移動 ▼▼▼ */}
          <div className="current-pitch-container" style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f9f9f9' }}>
            <h3 style={{ margin: '0', marginBottom: '0.5rem', color: '#333' }}>あなたの現在の音域</h3>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#007bff' }}>
              {isLoadingPitch ? (
                <span>読み込み中...</span>
              ) : userPitch ? (
                <span>
                  {userPitch.low_sound} ~ {userPitch.high_sound}
                </span>
              ) : (
                <span>未設定</span>
              )}
            </div>
          </div>

          <div className="selected-notes-container" style={{ display: 'flex', gap: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '1rem' }}>
            <div className="note-display">
              最低音: <span style={{ fontWeight: 'bold' }}>{formatNoteForDisplay(lowestNote)}</span>
            </div>
            <div className="note-display">
              最高音: <span style={{ fontWeight: 'bold' }}>{formatNoteForDisplay(highestNote)}</span>
            </div>
          </div>

          <div className="action-buttons">
            <button
              onClick={handleSetLowest}
              className={`action-button ${selectionMode === 'lowest' ? 'selecting' : ''}`}
            >
              {selectionMode === 'lowest' ? '鍵盤を選択...' : '最低音を設定'}
            </button>
            <button
              onClick={handleSetHighest}
              className={`action-button ${selectionMode === 'highest' ? 'selecting' : ''}`}
            >
              {selectionMode === 'highest' ? '鍵盤を選択...' : '最高音を設定'}
            </button>
          </div>

          {/* (略)...キーボード以下の部分は変更なし... */}
          <div className="keyboard-wrapper">
            <div className="scroll-content">
              <div className="keyboard-container">
                {fullKeyboard.map((key, index) => {
                  const isSelectedLow = lowestNote === key.octaveNoteName;
                  const isSelectedHigh = highestNote === key.octaveNoteName;
                  const selectedClass = isSelectedLow ? 'selected-low' : isSelectedHigh ? 'selected-high' : '';

                  return (
                    <div
                      key={key.octaveNoteName}
                      className={`key ${key.type}-key ${selectedClass}`}
                      style={getKeyStyle(index)}
                      onMouseDown={() => handleKeyClick(key)}
                    >
                      <span className="key-name">{key.note}</span>
                    </div>
                  );
                })}
              </div>
              <div className="range-bar-container">
                {octaveRanges.map(octave => (
                  <div
                    key={octave.name}
                    className={`range-segment ${octave.name}`}
                    style={{ width: `${OCTAVE_WIDTH}px` }}
                  >
                    {octave.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="confirm-section" style={{ marginTop: '2rem', width: '100%', textAlign: 'center' }}>
            <button
              onClick={handleConfirm}
              disabled={!lowestNote || !highestNote || submissionStatus === 'loading'}
              className="action-button"
            >
              {submissionStatus === 'loading' ? '保存中...' : '確定'}
            </button>
            {submissionMessage && (
              <p
                className={`submission-message ${submissionStatus}`}
                style={{ marginTop: '1rem' }}
              >
                {submissionMessage}
              </p>
            )}
          </div>

          {error && <p>Error: {error.message}</p>}
        </div>
      </div>
    </>
  );
}