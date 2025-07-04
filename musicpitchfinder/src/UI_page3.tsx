import React, { useRef, useEffect } from 'react';
import * as Tone from 'tone';
import './UI_page3.css';

const App: React.FC = () => {

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
  );
};

export default App;

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