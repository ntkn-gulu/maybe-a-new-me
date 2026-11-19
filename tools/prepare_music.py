"""Turn downloaded music into the music player's tracks.

Usage (from the project root, ffmpeg on PATH):
    python tools/prepare_music.py

Reads audio_source/music/<slug>.mp3 (not in git), matches loudness across
tracks (two-pass linear loudnorm) and writes
public/audio/music/<channel>/<slug>.m4a (AAC, 44.1 kHz stereo). Updates the
"music" part of public/audio/credits.json for the Credits screen.
"""
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / 'audio_source' / 'music'
OUTPUT_DIR = ROOT / 'public' / 'audio' / 'music'
CREDITS_FILE = ROOT / 'public' / 'audio' / 'credits.json'

# Music sits louder than ambience (it is the main thing, ambience goes under it)
TARGET_LUFS = -16
TRUE_PEAK_DB = -1.5
SAMPLE_RATE = 44100
BITRATE = '128k'

HOLIZNA = 'HoliznaCC0'
HOLIZNA_URL = 'https://freemusicarchive.org/music/holiznacc0/'

# channel, slug, title, artist, license, page
TRACKS = [
    ('lofi', 'winter_blues', 'Winter Blues', HOLIZNA, 'CC0 1.0', HOLIZNA_URL + 'winter-lofi/winter-blues/'),
    ('lofi', 'first_snow', 'First Snow', HOLIZNA, 'CC0 1.0', HOLIZNA_URL + 'winter-lofi/first-snowmp3/'),
    ('lofi', 'fire_place', 'Fire Place', HOLIZNA, 'CC0 1.0', HOLIZNA_URL + 'winter-lofi/fire-place/'),
    ('lofi', 'kids', 'Kids', HOLIZNA, 'CC0 1.0', HOLIZNA_URL + 'spring-at-last-lofi-tape/kids/'),
    ('lofi', 'spring_at_last', 'Spring At Last', HOLIZNA, 'CC0 1.0', HOLIZNA_URL + 'spring-at-last-lofi-tape/spring-at-last/'),
    ('lofi', 'sense_of_purpose', 'Sense Of Purpose', HOLIZNA, 'CC0 1.0', HOLIZNA_URL + 'spring-at-last-lofi-tape/sense-of-purpose/'),
    ('lofi', 'april_showers', 'April Showers', HOLIZNA, 'CC0 1.0', HOLIZNA_URL + 'spring-at-last-lofi-tape/april-showers/'),
    ('lofi', 'dreams', 'Dreams', HOLIZNA, 'CC0 1.0', HOLIZNA_URL + 'only-in-the-milky-way-part-1/dreams-3/'),
    ('lofi', 'angels_we_have_heard_on_high', 'Angels We Have Heard On High (Lo-Fi)', HOLIZNA, 'CC0 1.0', HOLIZNA_URL + 'a-lo-fi-christmas-special/angels-we-have-heard-on-high-lo-fi/'),
    ('lofi', 'kodama', 'Kodama', HOLIZNA, 'CC0 1.0', HOLIZNA_URL + 'nature-spirit/kodama/'),
]


def run(arguments):
    return subprocess.run(arguments, check=True, capture_output=True, text=True)


def measureLoudness(source):
    result = run([
        'ffmpeg', '-hide_banner', '-i', str(source),
        '-af', f'loudnorm=I={TARGET_LUFS}:TP={TRUE_PEAK_DB}:LRA=20:print_format=json', '-f', 'null', '-',
    ])
    return json.loads(re.search(r'\{[^{}]*\}', result.stderr, re.S).group(0))


def prepareTrack(channel, slug):
    source = SOURCE_DIR / f'{slug}.mp3'
    output = OUTPUT_DIR / channel / f'{slug}.m4a'
    output.parent.mkdir(parents=True, exist_ok=True)
    measured = measureLoudness(source)
    loudnorm = (
        f'loudnorm=I={TARGET_LUFS}:TP={TRUE_PEAK_DB}:LRA=20:linear=true'
        f":measured_I={measured['input_i']}:measured_TP={measured['input_tp']}"
        f":measured_LRA={measured['input_lra']}:measured_thresh={measured['input_thresh']}"
    )
    run([
        'ffmpeg', '-hide_banner', '-y', '-i', str(source), '-map_metadata', '-1', '-vn',
        '-af', loudnorm, '-ar', str(SAMPLE_RATE), '-ac', '2', '-c:a', 'aac', '-b:a', BITRATE,
        '-movflags', '+faststart', str(output),
    ])
    return output


def main():
    credits = []
    for channel, slug, title, artist, license_name, page in TRACKS:
        output = prepareTrack(channel, slug)
        print(f'{channel:5} {slug:30} {output.stat().st_size / 1024:7.0f} KB')
        credits.append({'channel': channel, 'track': slug, 'title': title, 'author': artist, 'license': license_name, 'url': page})
    existing = json.loads(CREDITS_FILE.read_text(encoding='utf-8')) if CREDITS_FILE.exists() else {}
    existing['music'] = credits
    CREDITS_FILE.write_text(json.dumps(existing, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
