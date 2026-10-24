import math
import os
import struct
import wave

out_dir = os.path.join('assets', 'sounds')
os.makedirs(out_dir, exist_ok=True)
sample_rate = 44100


def write_wave(path, generator, duration):
    frames = []
    for i in range(int(sample_rate * duration)):
        t = i / sample_rate
        value = generator(t)
        frames.append(struct.pack('<h', int(max(-1.0, min(1.0, value)) * 32767)))
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        w.writeframes(b''.join(frames))


def button_tap(t):
    env = min(1.0, (t / 0.16) * 18.0) * max(0.0, 1.0 - (t / 0.16) * 1.3)
    signal = math.sin(2 * math.pi * 620 * t) * 0.7 + math.sin(2 * math.pi * 980 * t) * 0.3
    return signal * env * 0.42


def success_chime(t):
    total = 0.0
    notes = [(660, 0.18), (880, 0.2), (1100, 0.22)]
    cumulative = 0.0
    for freq, length in notes:
        local = max(0.0, t - cumulative)
        if local < length:
            env = min(1.0, local * 8.0) * max(0.0, 1.0 - local / length)
            total += math.sin(2 * math.pi * freq * local) * env
        cumulative += length
    env = min(1.0, t * 10.0) * max(0.0, 1.0 - (t / 0.7) * 1.25)
    return total * 0.55 * env

write_wave(os.path.join(out_dir, 'button_tap.wav'), button_tap, 0.16)
write_wave(os.path.join(out_dir, 'success_chime.wav'), success_chime, 0.7)
print('created', os.path.join(out_dir, 'button_tap.wav'))
print('created', os.path.join(out_dir, 'success_chime.wav'))
