from audio_separator.separator import Separator
from yt_dlp import YoutubeDL

def download_and_separate_audio(url):

    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [
            {'key': 'FFmpegExtractAudio',
            'preferredcodec': 'wav',
            'preferredquality': '192'},
            {'key': 'FFmpegMetadata'},
        ],
        'outtmpl': './downloaded_audio/download.%(ext)s',
    }

    with YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])

    title = ydl.extract_info(url, download=False).get('title', 'downloaded_audio')
    print(f"Downloaded audio for: {title}")

    input_file = './downloaded_audio/download.wav'

    title = title.replace(' ', '_').replace('/', '_')
    print(title)

    separator = Separator(output_dir = f'./separated_audio', output_single_stem="Vocals")

    output_file = {
        "Vocals": 'Vocals',
    }

    separator.load_model(model_filename='vocals_mel_band_roformer.ckpt')
    output_file = separator.separate(input_file, output_file)

    return output_file[0]

def revarb_remove(file):
    separator = Separator(output_dir = f'./separated_audio', output_single_stem="no reverb")

    output_file = {
        "no reverb": 'NoReverb',

    }

    separator.load_model(model_filename='UVR-DeEcho-DeReverb.pth')
    output_file = separator.separate(file, output_file)

    return output_file[0]

def harmony_remove(file):
    separator = Separator(output_dir = f'./separated_audio', output_single_stem="vocals")

    output_file = {
        "vocals": 'Noharmony',
    }

    separator.load_model(model_filename='UVR_MDXNET_KARA.onnx')
    output_file = separator.separate(file, output_file)

    return output_file[0]

def noize_remove(file):
    separator = Separator(output_dir = f'./separated_audio', output_single_stem="Vocals")

    output_file = {
        "Vocals": 'noize_removed',
    }

    separator.load_model(model_filename='vocals_mel_band_roformer.ckpt')
    output_file = separator.separate(file, output_file)

    return output_file[0]