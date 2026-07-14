const CHINESE_SENTENCE_END = /[。！？…\.!?\n]+/;
const ENGLISH_SENTENCE_END = /[.!?]+/;
const SENTENCE_DELIMITER = /[。！？…\.!?\n]/;

type Sentence = {
  index: number;
  text: string;
  startChar: number;
  endChar: number;
};

export function splitSentences(text: string): Sentence[] {
  if (!text || text.trim().length === 0) return [];

  const sentences: Sentence[] = [];
  let index = 0;

  const paragraphs = text.split(/\n+/);

  for (const paragraph of paragraphs) {
    if (paragraph.trim().length === 0) {
      sentences.push({
        index: index++,
        text: '',
        startChar: 0,
        endChar: 0,
      });
      continue;
    }

    let current = '';
    let startChar = 0;
    let charPos = 0;

    for (let i = 0; i < paragraph.length; i++) {
      const char = paragraph[i];
      current += char;

      if (SENTENCE_DELIMITER.test(char)) {
        current = current.trim();
        if (current.length > 0) {
          sentences.push({
            index: index++,
            text: current,
            startChar: startChar,
            endChar: charPos + 1,
          });
        }
        current = '';
        startChar = charPos + 1;
      }
      charPos++;
    }

    current = current.trim();
    if (current.length > 0) {
      sentences.push({
        index: index++,
        text: current,
        startChar: startChar,
        endChar: charPos,
      });
    }
  }

  return sentences;
}

export function countWords(text: string): number {
  if (!text) return 0;

  const chineseChars = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  const numbers = (text.match(/\d+/g) || []).length;

  return chineseChars + englishWords + numbers;
}

export function detectEncoding(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);

  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return 'utf-8';
  }

  if (bytes.length >= 2) {
    if (bytes[0] === 0xfe && bytes[1] === 0xff) return 'utf-16be';
    if (bytes[0] === 0xff && bytes[1] === 0xfe) return 'utf-16le';
  }

  let gbkScore = 0;
  let utf8Score = 0;

  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b >= 0xb0 && b <= 0xf7 && i + 1 < bytes.length) {
      const b2 = bytes[i + 1];
      if (b2 >= 0xa1 && b2 <= 0xfe) gbkScore++;
      i++;
      continue;
    }
    if (b >= 0xa1 && b <= 0xa9 && i + 1 < bytes.length) {
      const b2 = bytes[i + 1];
      if (b2 >= 0xa1 && b2 <= 0xfe) gbkScore++;
      i++;
      continue;
    }
    if (b >= 0xc0 && b <= 0xfd) utf8Score++;
  }

  return gbkScore > utf8Score ? 'gbk' : 'utf-8';
}

export function parseTextContent(buffer: ArrayBuffer, encoding: string): string {
  const decoder = new TextDecoder(encoding);
  let text = decoder.decode(buffer);

  if (encoding === 'gbk') {
    try {
      const gbkDecoder = new TextDecoder('gbk');
      text = gbkDecoder.decode(buffer);
    } catch {
      try {
        const gb18030Decoder = new TextDecoder('gb18030');
        text = gb18030Decoder.decode(buffer);
      } catch {
        text = decoder.decode(buffer);
      }
    }
  }

  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

export async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  const { extractText } = await import('unpdf');

  const result = await extractText(buffer);

  if (!result || !result.text || result.text.length === 0) {
    throw new Error('PDF 中未识别到文字内容');
  }

  const text = result.text.join('\n');

  if (text.trim().length === 0) {
    throw new Error('PDF 中未识别到文字内容');
  }

  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function decompressPalmDoc(data: Uint8Array): Uint8Array {
  const output: number[] = [];
  let i = 0;

  while (i < data.length) {
    const c = data[i++];

    if (c === 0) break;

    if (c >= 0x01 && c <= 0x08) {
      for (let j = 0; j < c && i < data.length; j++) {
        output.push(data[i++]);
      }
    } else if (c >= 0x09 && c <= 0x7F) {
      output.push(c);
    } else if (c >= 0x80 && c <= 0xBF) {
      if (i >= data.length) break;
      const c2 = data[i++];
      const pair = (c << 8) | c2;
      const distance = (pair >> 3) & 0x7FF;
      const length = (c2 & 0x07) + 3;
      for (let j = 0; j < length; j++) {
        const idx = output.length - distance;
        output.push(idx >= 0 && idx < output.length ? output[idx] : 0x20);
      }
    } else {
      output.push(0x20);
      output.push(c ^ 0x80);
    }
  }

  return new Uint8Array(output);
}

function getUint32(view: DataView, offset: number): number {
  return view.getUint32(offset, false);
}

function getUint16(view: DataView, offset: number): number {
  return view.getUint16(offset, false);
}

export function extractMobiText(buffer: ArrayBuffer): string {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  const numRecords = getUint16(view, 76);

  const recordOffsets: number[] = [];
  for (let i = 0; i < numRecords; i++) {
    const offset = 78 + i * 8;
    recordOffsets.push(getUint32(view, offset));
  }

  if (recordOffsets.length < 2) {
    throw new Error('MOBI 文件格式无效');
  }

  let textEncoding = 1252;
  let compressionType = 2;
  const headerStart = recordOffsets[0];

  const nameOffset = getUint32(view, headerStart + 84);
  const nameLength = getUint32(view, headerStart + 88);
  if (nameOffset && nameLength && nameOffset + nameLength <= bytes.length) {
    textEncoding = getUint32(view, headerStart + 28) || textEncoding;
    compressionType = getUint16(view, headerStart + 0) || compressionType;
  }

  let fullText = '';

  for (let i = 1; i < recordOffsets.length; i++) {
    const start = recordOffsets[i];
    const end = i + 1 < recordOffsets.length ? recordOffsets[i + 1] : bytes.length;
    const chunk = bytes.slice(start, end);

    if (compressionType === 2) {
      const decompressed = decompressPalmDoc(chunk);
      fullText += new TextDecoder('utf-8').decode(decompressed);
    } else if (compressionType === 1) {
      fullText += new TextDecoder('windows-' + textEncoding).decode(chunk);
    } else {
      const raw = new TextDecoder('utf-8').decode(chunk);
      const cleaned = raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
      if (cleaned.trim().length > 0) {
        fullText += cleaned;
      }
    }
  }

  const cleaned = fullText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\0/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (cleaned.length === 0) {
    throw new Error('MOBI 文件中未识别到文字内容');
  }

  return cleaned;
}
