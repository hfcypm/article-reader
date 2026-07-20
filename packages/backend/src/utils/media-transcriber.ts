import { writeFile, readFile, unlink } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

const WORK_DIR = join(tmpdir(), 'article-reader-media');

function ensureDir() {
  if (!existsSync(WORK_DIR)) {
    mkdirSync(WORK_DIR, { recursive: true });
  }
}

function spawnAsync(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: 'ignore' });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

async function cleanup(...paths: string[]) {
  for (const p of paths) {
    try { await unlink(p); } catch {}
  }
}

/**
 * 对音频/视频文件进行语音转文字
 *
 * mp4 先用 ffmpeg 提取音频轨道，mp3 直接转 wav，
 * 再通过 whisper (tiny 模型) 进行中文语音识别。
 */
export async function transcribeMedia(buffer: ArrayBuffer, ext: string): Promise<string> {
  ensureDir();

  const id = randomUUID();
  const inputFile = join(WORK_DIR, `${id}.${ext}`);
  const audioFile = join(WORK_DIR, `${id}.wav`);

  await writeFile(inputFile, new Uint8Array(buffer));

  try {
    await spawnAsync('ffmpeg', [
      '-i', inputFile,
      '-vn',
      '-acodec', 'pcm_s16le',
      '-ar', '16000',
      '-ac', '1',
      audioFile,
      '-y',
    ]);
    await cleanup(inputFile);

    await spawnAsync('whisper', [
      audioFile,
      '--model', 'tiny',
      '--language', 'zh',
      '--output_format', 'txt',
      '--output_dir', WORK_DIR,
    ]);

    const base = audioFile.split('/').pop()!.replace(/\.[^.]+$/, '');
    const txtFile = join(WORK_DIR, `${base}.txt`);
    const text = await readFile(txtFile, 'utf-8');

    const jsonFile = join(WORK_DIR, `${base}.json`);
    const vttFile = join(WORK_DIR, `${base}.vtt`);
    const srtFile = join(WORK_DIR, `${base}.srt`);
    await cleanup(audioFile, txtFile, jsonFile, vttFile, srtFile);

    return text;
  } catch (e) {
    await cleanup(inputFile, audioFile);
    throw e;
  }
}
