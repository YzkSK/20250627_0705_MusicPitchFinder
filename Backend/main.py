from typing import Union
from fastapi import FastAPI
import librosa
import matplotlib.pyplot as plt
import numpy as np
import matplotlib_fontja
import separator
import soundfile as sf
import math
import re
from scipy import stats
from yt_dlp import YoutubeDL

def my_round_int(number):
    return int((number * 2 + 1) // 2)

def hz_to_midi(hz):
    midi = 12 * (math.log2(hz / 440)) + 69
    midi = my_round_int(midi)
    return midi

def midi_to_hz(midi):
    hz = 440 * (2 ** ((midi - 69) / 12))
    hz = my_round_int(hz)
    return hz

def midi_to_simplified_note_name(midi_number):
    if not 0 <= midi_number <= 127:
        return "N/A"

    note_names_base = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    note_index = int(midi_number % 12)
    base_note = note_names_base[note_index]

    if midi_number <= 20:
        return "lowlowlow" + base_note
    elif midi_number <= 32:
        return "lowlow" + base_note
    elif midi_number <= 44:
        return "low" + base_note
    elif midi_number <= 56:
        return "mid1" + base_note
    elif midi_number <= 68:
        return "mid2" + base_note
    elif midi_number <= 80:
        return "hi" + base_note
    elif midi_number <= 92:
        return "hihi" + base_note
    elif midi_number <= 104:
        return "hihihi" + base_note
    else:
        return "hihihihi" + base_note

def note_name_to_midi(note_name):

    note_name = note_name.lower().strip()

    note_prefix = {
        "c" : 0,
        "c#": 1,
        "d": 2,
        "d#": 3,
        "e": 4,
        "f": 5,
        "f#": 6,
        "g": 7,
        "g#": 8,
        "a": 9,
        "a#": 10,
        "b": 11
    }

    octave_prefix = {
        "lowlowlow": 0,
        "lowlow": 1,
        "low": 2,
        "mid1": 3,
        "mid2": 4,
        "hi": 5,
        "hihi": 6,
        "hihihi": 7,
        "hihihihi": 8
    }

    match = re.match(r"([a-z,0-9]+)([a-z]#?)", note_name)
    if not match:
        return None

    octave, note = match.groups()

    if octave in octave_prefix and note in note_prefix:
        octave_val = octave_prefix[octave]
        note_val = note_prefix[note]

        if not note_val >= 9:
            midi_number = (octave_val + 1) * 12 + note_val
            return midi_number
        elif note_val >= 9:
            midi_number = (octave_val * 12) + note_val
            return midi_number
        else:
            return None

def analyze_audio_note(url):
    with YoutubeDL({'quiet': True, 'extract_flat': True}) as ydl:
        try:
            info = ydl.extract_info(url, download=False)
            title = info.get('title', 'downloaded_audio')
        except Exception as e:
            return None
    try:
        file = separator.download_and_separate_audio(url)
        reverb_removed_file = separator.revarb_remove(f"./separated_audio/{file}")
        harmony_removed_file = separator.harmony_remove(f"./separated_audio/{reverb_removed_file}")
        vocal_file_name = separator.noize_remove(f"./separated_audio/{harmony_removed_file}")
        file = f'./separated_audio/{vocal_file_name}'
        audio, sr = librosa.load(file)
        normalized_audio = librosa.util.normalize(audio)
        output_path = './separated_audio/final_output.wav'
        sf.write(output_path, normalized_audio, sr)
    except Exception as e:
        return None

    try:
        y, sr = librosa.load(output_path)
        intervals = librosa.effects.split(normalized_audio, top_db=30)
        all_f0 = [f0 for start_i, end_i in intervals if (f0 := librosa.pyin(normalized_audio[start_i:end_i], fmin=librosa.note_to_hz('C2'), fmax=librosa.note_to_hz('C6'))[0]).any()]
        f0_combined = np.concatenate(all_f0) if all_f0 else np.array([])
        valid_f0 = f0_combined[~np.isnan(f0_combined)]

        if len(valid_f0) < 2: return None

        mean, std_dev = np.mean(valid_f0), np.std(valid_f0)
        f0_cleaned_hz = valid_f0[np.abs((valid_f0 - mean) / std_dev) < 2.0]
        if len(f0_cleaned_hz) == 0: return None

        f0_midi = [hz_to_midi(f) for f in f0_cleaned_hz if f is not None]
        if not f0_midi: return None

        max_note = midi_to_simplified_note_name(hz_to_midi(np.max(f0_cleaned_hz)))
        min_note = midi_to_simplified_note_name(hz_to_midi(np.min(f0_cleaned_hz)))
        central_midi = int(stats.mode(f0_midi, keepdims=False).mode)
        central_note = midi_to_simplified_note_name(central_midi)
        return {
            "title": title,
            "max_note": max_note,
            "min_note": min_note,
            "central_midi": central_midi,
            "central_note": central_note,
        }
    except Exception as e:
        return None

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/separate")
def result_separete_audio(original_url: str, cover_url: str, user_high_note: Union[str, None] = None, user_low_note: Union[str, None] = None):
    original_results = analyze_audio_note(original_url)
    cover_results = analyze_audio_note(cover_url)

    if user_high_note is None and user_low_note is None:
        pass
    else:
        user_max_midi = note_name_to_midi(user_high_note)
        user_min_midi = note_name_to_midi(user_low_note)

        original_max_midi = note_name_to_midi(original_results["max_note"])
        original_min_midi = note_name_to_midi(original_results["min_note"])

        original_mid = (original_max_midi + original_min_midi) / 2
        user_mid = (user_max_midi + user_min_midi) / 2

        key_shift = round(user_mid - original_mid)

        if original_results and cover_results:
            key_difference = cover_results['central_midi'] - original_results['central_midi']
            return {
                "original": original_results,
                "cover": cover_results,
                "key_difference": key_difference,
                "user_key_shift": key_shift
            }

    if original_results and cover_results:
            key_difference = cover_results['central_midi'] - original_results['central_midi']
            return {
                "original": original_results,
                "cover": cover_results,
                "key_difference": key_difference,
            }