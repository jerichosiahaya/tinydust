"""Generate TinyDust's original completion chime. Requires ffmpeg only to rebuild the MP3."""
from array import array
import math
from pathlib import Path
import subprocess
import sys
import tempfile
import wave

ROOT = Path(__file__).resolve().parents[1]
RATE = 44100
DURATION = 1.2
# Soft C-major arpeggio, with a longer final note and no percussive click.
NOTES = [(0.025, 523.251, 0.38), (0.155, 659.255, 0.40),
         (0.295, 783.991, 0.43), (0.435, 1046.502, 0.68)]
samples = [0.0] * round(RATE * DURATION)
for start, frequency, duration in NOTES:
    for i in range(round(duration * RATE)):
        t = i / RATE
        attack = min(1.0, t / 0.012)
        release = min(1.0, (duration - t) / 0.09)
        envelope = attack * release * math.exp(-t / 0.18)
        angle = 2 * math.pi * frequency * t
        tone = math.sin(angle) + 0.12 * math.sin(2 * angle) + 0.025 * math.sin(3 * angle)
        samples[round(start * RATE) + i] += tone * envelope
peak = max(abs(value) for value in samples)
assert peak > 0 and all(math.isfinite(value) for value in samples)
# Conservative digital peak (~-17 dBFS), not a guarantee about speaker volume.
pcm = array('h', (round(value / peak * 0.14 * 32767) for value in samples))
if sys.byteorder != 'little':
    pcm.byteswap()
with tempfile.TemporaryDirectory(prefix='tinydust-chime-') as directory:
    wav = Path(directory) / 'chime.wav'
    with wave.open(str(wav), 'wb') as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(pcm.tobytes())
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(wav),
                    '-map_metadata', '-1', '-codec:a', 'libmp3lame', '-b:a', '96k',
                    str(ROOT / 'mods/tinydust/harvest-complete.mp3')], check=True)
print('Generated harvest-complete.mp3 (1.2-second source, soft C-major chime)')
