import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import * as Tone from 'tone';
import './UI_page3.css';

export default function UI_page3() {
  const navigate = useNavigate()
  const [error, setError] = useState<any>(null);

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

  const Header: React.FC = () => {

    const synth = useRef<Tone.Synth | null>(null);

    useEffect(() => {
      synth.current = new Tone.Synth().toDestination();

      return () => {
        synth.current?.dispose();
      };
    }, []); //空の配列渡して、マウントされたときにTone.jsのシンセを初期化

    const handleKeyDown = async (note: string) => {
      if (!synth.current) return;

      await Tone.start();

      synth.current.triggerAttackRelease(note, "8n");
    };

    return (
      <>
        <header className="header">
          <Link to="/dashboard"><h1 className="bold">Music Pitch Finder</h1></Link>
            <nav className="flex_container">
              <ul className="nav-links">
                <li>
                  <Link to="/UI_page2"><button className="button_hover">➕</button></Link>
                </li>
                <li>
                  <Link to="/UI_page3"><button className="button_hover">🎶</button></Link>
                </li>
                <li>
                  <button onClick={signOut} className="button_hover">Sign out</button>
                </li>
              </ul>
            </nav>
        </header>
        <div className='main_container'>
          <div className="app-container">
            <div className="keyboard-wrapper">
              <div className="scroll-content">
                <div className="keyboard-container">
                  {fullKeyboard.map((key, index) => (
                    <div
                      key={key.octaveNoteName}
                      className={`key ${key.type}-key`}
                      style={getKeyStyle(index)}
                      onMouseDown={() => handleKeyDown(key.octaveNoteName)}
                    >
                      <span className="key-name">{key.note}</span>
                    </div>
                  ))}
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
            <div className="action-buttons">
              <button className="action-button">最低音</button>
              <button className="action-button">最高音</button>
            </div>
          </div>
        </div>
      </>
    );
  };
  return <Header />;
}

interface KeyInfo {
  note: string; type: 'white' | 'black'; octave: string; octaveNoteName: string;
}
const octaveNotes: Omit<KeyInfo, 'octave' | 'octaveNoteName'>[] = [
  { note: 'A', type: 'white' }, { note: 'A#', type: 'black' }, { note: 'B', type: 'white' },
  { note: 'C', type: 'white' }, { note: 'C#', type: 'black' }, { note: 'D', type: 'white' },
  { note: 'D#', type: 'black' }, { note: 'E', type: 'white' }, { note: 'F', type: 'white' },
  { note: 'F#', type: 'black' }, { note: 'G', type: 'white' }, { note: 'G#', type: 'black' },
];
const octaveRanges = [
  { name: 'low', number: 2 }, { name: 'mid1', number: 3 }, { name: 'mid2', number: 4 },
  { name: 'hi', number: 5 }, { name: 'hihi', number: 6 },
];
const fullKeyboard: KeyInfo[] = octaveRanges.flatMap(octave =>
  octaveNotes.map(key => {
    let currentOctaveNumber = ['A', 'A#', 'B'].includes(key.note) ? octave.number - 1 : octave.number;
    return { ...key, octave: octave.name, octaveNoteName: `${key.note}${currentOctaveNumber}`, };
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