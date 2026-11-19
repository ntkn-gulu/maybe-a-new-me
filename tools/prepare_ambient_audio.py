"""Turn downloaded field recordings into the app's ambient loops.

Usage (from the project root, ffmpeg on PATH):
    python tools/prepare_ambient_audio.py

Reads audio_source/<id>.mp3 (CC0 recordings from BigSoundBank, not in git),
cuts the steadiest part of each (picked from its loudness over time),
matches loudness across files and writes public/audio/ambient/<layer>.m4a
(AAC, 32 kHz stereo). The cut keeps LOOP_SEAM_SECONDS extra at the end:
the app crossfades that tail into the start, so the loop point is seamless.
Also writes public/audio/credits.json for the Credits screen.
"""
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / 'audio_source'
OUTPUT_DIR = ROOT / 'public' / 'audio' / 'ambient'
CREDITS_FILE = ROOT / 'public' / 'audio' / 'credits.json'

# Must match AMBIENT_SEAM_SECONDS in src/sound/ambient_files.ts
LOOP_SEAM_SECONDS = 2

# Loudness every file is matched to (ambience sits low: the mixer levels go on top)
TARGET_LUFS = -18
TRUE_PEAK_DB = -1.5
SAMPLE_RATE = 32000
BITRATE = '112k'

# layer, source id, title, start (s), loop length without the seam (s)
CLIPS = [
    ('rain', '1019', 'Summer Rain on Terrace', 2, 78),
    ('thunderstorm', '0740', 'Rain and Thunder #2', 25, 113),
    ('night_train', '2727', 'Train car', 1, 45),
    ('waves', '0698', 'Sea Waves', 10, 88),
    ('night_field', '0110', 'Campaign at night #1', 2, 66),
    ('creek', '0823', 'Small Stream', 2, 88),
    ('countryside', '0097', 'Countryside', 0, 75),
    ('cafe', '2561', 'Coffee Shop at the Capucins', 30, 118),
]

AUTHOR = 'Joseph SARDIN (BigSoundBank.com)'
LICENSE = 'CC0 1.0'


def run(arguments):
    return subprocess.run(arguments, check=True, capture_output=True, text=True)


def measureLoudness(source, start, duration):
    """First loudnorm pass: the clip's measured loudness, for an exact linear second pass."""
    result = run([
        'ffmpeg', '-hide_banner', '-ss', str(start), '-t', str(duration), '-i', str(source),
        '-af', f'loudnorm=I={TARGET_LUFS}:TP={TRUE_PEAK_DB}:LRA=20:print_format=json', '-f', 'null', '-',
    ])
    measured = json.loads(re.search(r'\{[^{}]*\}', result.stderr, re.S).group(0))
    return measured


def prepareClip(layer, source_id, start, length):
    source = SOURCE_DIR / f'{source_id}.mp3'
    output = OUTPUT_DIR / f'{layer}.m4a'
    duration = length + LOOP_SEAM_SECONDS
    measured = measureLoudness(source, start, duration)
    loudnorm = (
        f'loudnorm=I={TARGET_LUFS}:TP={TRUE_PEAK_DB}:LRA=20:linear=true'
        f":measured_I={measured['input_i']}:measured_TP={measured['input_tp']}"
        f":measured_LRA={measured['input_lra']}:measured_thresh={measured['input_thresh']}"
    )
    run([
        'ffmpeg', '-hide_banner', '-y', '-ss', str(start), '-t', str(duration), '-i', str(source),
        '-af', loudnorm, '-ar', str(SAMPLE_RATE), '-ac', '2', '-c:a', 'aac', '-b:a', BITRATE,
        '-movflags', '+faststart', str(output),
    ])
    return output


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    credits = []
    for layer, source_id, title, start, length in CLIPS:
        output = prepareClip(layer, source_id, start, length)
        print(f'{layer:14} {output.stat().st_size / 1024:7.0f} KB  <- #{source_id} {title}')
        credits.append({
            'layer': layer,
            'title': title,
            'author': AUTHOR,
            'license': LICENSE,
            'url': f'https://bigsoundbank.com/sound-{source_id}-x.html',
        })
    CREDITS_FILE.write_text(json.dumps({'ambient': credits}, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
