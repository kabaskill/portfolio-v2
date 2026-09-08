#!/usr/bin/env python3
"""Regenerate the hero's real audio peaks: python3 scripts/generate-waveform.py.
Requires FFmpeg. The source MP3 is left unchanged; playback remains stereo.
"""
from array import array
import hashlib
import json
from pathlib import Path
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
source = root / 'public/audio/win95_startup.mp3'
output = root / 'src/data/win95-waveform.json'
sample_rate = 44100
bins = 1024
result = subprocess.run(
    ['ffmpeg', '-v', 'error', '-i', str(source), '-ac', '1', '-ar', str(sample_rate),
     '-f', 'f32le', 'pipe:1'], capture_output=True, check=True,
)
samples = array('f')
samples.frombytes(result.stdout)
if sys.byteorder != 'little':
    samples.byteswap()
if not samples:
    raise ValueError('The audio contains no decoded samples.')
peak = max(abs(value) for value in samples) or 1
peaks = []
for index in range(bins):
    window = samples[index * len(samples) // bins:(index + 1) * len(samples) // bins]
    peaks.append([round(min(0, min(window)) / peak, 5), round(max(0, max(window)) / peak, 5)])
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps({
    'src': '/audio/win95_startup.mp3',
    'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
    'duration': len(samples) / sample_rate,
    'peaks': peaks,
}, separators=(',', ':')) + '\n')
print(f'Generated {bins} min/max bins from {len(samples)} decoded samples ({len(samples) / sample_rate:.3f}s).')
