from audio_separator.separator import Separator
from yt_dlp import YoutubeDL

def download_and_separate_audio():
    url = input("Enter the YouTube video URL: ")

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

    separator = Separator(output_dir = f'./separated_audio/{title}', output_single_stem="Vocals")

    output_file = {
        "Vocals": f'(Vocals)_{title}',
    }

    separator.load_model(model_filename='vocals_mel_band_roformer.ckpt')
    output_file = separator.separate(input_file, output_file)

    return output_file

result = download_and_separate_audio()
print(result)