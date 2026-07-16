/**
 * 文本解析工具模块
 *
 * 提供文本文件解析的完整能力，包括：
 * - 句子分割：将文本按标点符号拆分为句子数组
 * - 字数统计：统计中文、英文和数字的字/词数
 * - 编码检测：自动识别文件编码（UTF-8 / GBK / UTF-16）
 * - 文本解码：根据检测到的编码将二进制数据转为字符串
 * - PDF 文本提取：使用 unpdf 库提取 PDF 中的文字
 * - MOBI 文本提取：解析 MOBI 格式的 PalmDOC 压缩内容
 */

/** 中英文句子结束标点（含换行） */
const CHINESE_SENTENCE_END = /[。！？…\.!?\n]+/;
const ENGLISH_SENTENCE_END = /[.!?]+/;

/** 句子分隔符，用于按字符逐个扫描判断句子边界 */
const SENTENCE_DELIMITER = /[。！？…\.!?\n]/;

/** 句子数据结构，记录句子文本及其在原文中的字符位置 */
type Sentence = {
  index: number;
  text: string;
  startChar: number;
  endChar: number;
};

/**
 * 将文本按句子分割
 *
 * 先按段落（空行）切分，再在每个段落内按标点符号逐字符扫描切分句子。
 * 空段落会被保留为一个空的句子条目，用于在阅读器中还原段落间距。
 */
export function splitSentences(text: string): Sentence[] {
  if (!text || text.trim().length === 0) return [];

  const sentences: Sentence[] = [];
  let index = 0;

  // 按空行分割段落
  const paragraphs = text.split(/\n+/);

  for (const paragraph of paragraphs) {
    // 空段落保留为一个空句子，维护段落边界
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

    // 逐字符扫描，遇到句子分隔符即切割
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

    // 处理段落末尾可能遗留的最后一句（无结束标点的情况下）
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

/**
 * 统计文本字数
 *
 * 中文每个汉字计为 1 个字，英文每个单词计为 1 个词，数字串计为 1 个。
 */
export function countWords(text: string): number {
  if (!text) return 0;

  // 统计中文汉字（Unicode 范围：基本汉字 + 扩展 A）
  const chineseChars = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
  // 统计英文单词
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  // 统计数字
  const numbers = (text.match(/\d+/g) || []).length;

  return chineseChars + englishWords + numbers;
}

/**
 * 检测文本文件编码
 *
 * 通过 BOM 字节序标记和启发式算法判断编码类型，
 * 支持 UTF-8、UTF-16（BE/LE）和 GBK 编码。
 */
export function detectEncoding(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);

  // 检测 UTF-8 BOM：EF BB BF
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return 'utf-8';
  }

  // 检测 UTF-16 BOM
  if (bytes.length >= 2) {
    if (bytes[0] === 0xfe && bytes[1] === 0xff) return 'utf-16be';
    if (bytes[0] === 0xff && bytes[1] === 0xfe) return 'utf-16le';
  }

  // 无 BOM 时使用启发式算法：统计 GBK 和 UTF-8 特征字节的出现频率
  let gbkScore = 0;
  let utf8Score = 0;

  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];

    // GBK 首个字节范围 0xB0-0xF7，第二个字节范围 0xA1-0xFE
    if (b >= 0xb0 && b <= 0xf7 && i + 1 < bytes.length) {
      const b2 = bytes[i + 1];
      if (b2 >= 0xa1 && b2 <= 0xfe) gbkScore++;
      i++;
      continue;
    }
    // GBK 扩展区首个字节范围 0xA1-0xA9
    if (b >= 0xa1 && b <= 0xa9 && i + 1 < bytes.length) {
      const b2 = bytes[i + 1];
      if (b2 >= 0xa1 && b2 <= 0xfe) gbkScore++;
      i++;
      continue;
    }
    // UTF-8 多字节序列的首字节范围 0xC0-0xFD
    if (b >= 0xc0 && b <= 0xfd) utf8Score++;
  }

  // 得分高者胜出
  return gbkScore > utf8Score ? 'gbk' : 'utf-8';
}

/**
 * 解析文本内容为字符串
 *
 * 根据指定编码解码二进制数据。GBK 编码优先尝试 gbk 解码器，
 * 降级尝试 gb18030，最后回退到传入的 encoding 参数。
 * 统一将换行符转为 \n。
 */
export function parseTextContent(buffer: ArrayBuffer, encoding: string): string {
  const decoder = new TextDecoder(encoding);
  let text = decoder.decode(buffer);

  if (encoding === 'gbk') {
    try {
      const gbkDecoder = new TextDecoder('gbk');
      text = gbkDecoder.decode(buffer);
    } catch {
      try {
        // gb18030 是 GBK 的超集，兼容性更好
        const gb18030Decoder = new TextDecoder('gb18030');
        text = gb18030Decoder.decode(buffer);
      } catch {
        text = decoder.decode(buffer);
      }
    }
  }

  // 统一换行符为 Unix 格式
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/**
 * 提取 PDF 文件中的文本
 *
 * 使用 unpdf 库解析 PDF，提取所有文本并拼接。
 * 若 PDF 中无文字内容（纯图片 PDF）则抛出错误。
 */
export async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  // 动态导入 unpdf，避免非 PDF 场景下的不必要的加载
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

/**
 * 解压 PalmDOC 格式数据
 *
 * PalmDOC 是 MOBI 格式中常见的压缩算法，
 * 支持直接复制、字节对压缩和简单字节处理三种模式。
 */
function decompressPalmDoc(data: Uint8Array): Uint8Array {
  const output: number[] = [];
  let i = 0;

  while (i < data.length) {
    const c = data[i++];

    // 0：数据结束
    if (c === 0) break;

    if (c >= 0x01 && c <= 0x08) {
      // 模式 1：直接复制接下来的 c 个字节
      for (let j = 0; j < c && i < data.length; j++) {
        output.push(data[i++]);
      }
    } else if (c >= 0x09 && c <= 0x7F) {
      // 模式 2：该字节本身就是原始数据
      output.push(c);
    } else if (c >= 0x80 && c <= 0xBF) {
      // 模式 3：字节对压缩 —— 从已输出数据中复制一段
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
      // 模式 4：输出空格 + 当前字节 XOR 0x80
      output.push(0x20);
      output.push(c ^ 0x80);
    }
  }

  return new Uint8Array(output);
}

/** 从 DataView 中读取无符号 32 位大端整数 */
function getUint32(view: DataView, offset: number): number {
  return view.getUint32(offset, false);
}

/** 从 DataView 中读取无符号 16 位大端整数 */
function getUint16(view: DataView, offset: number): number {
  return view.getUint16(offset, false);
}

/**
 * 提取 MOBI 文件中的文本
 *
 * 解析 MOBI 的 PDB 容器结构和 PalmDOC 记录头，
 * 根据压缩类型解压每个记录块，拼接后清洗文本。
 */
export function extractMobiText(buffer: ArrayBuffer): string {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // 记录总数位于偏移量 76 处（PDB 文件头格式）
  const numRecords = getUint16(view, 76);

  // 读取所有记录的偏移量
  const recordOffsets: number[] = [];
  for (let i = 0; i < numRecords; i++) {
    const offset = 78 + i * 8;
    recordOffsets.push(getUint32(view, offset));
  }

  if (recordOffsets.length < 2) {
    throw new Error('MOBI 文件格式无效');
  }

  // 第一段记录通常为 MOBI 头部，包含编码和压缩信息
  let textEncoding = 1252;
  let compressionType = 2;
  const headerStart = recordOffsets[0];

  // 从 MOBI 头部读取编码和压缩类型
  const nameOffset = getUint32(view, headerStart + 84);
  const nameLength = getUint32(view, headerStart + 88);
  if (nameOffset && nameLength && nameOffset + nameLength <= bytes.length) {
    textEncoding = getUint32(view, headerStart + 28) || textEncoding;
    compressionType = getUint16(view, headerStart + 0) || compressionType;
  }

  let fullText = '';

  // 从第二条记录开始循环处理正文内容
  for (let i = 1; i < recordOffsets.length; i++) {
    const start = recordOffsets[i];
    const end = i + 1 < recordOffsets.length ? recordOffsets[i + 1] : bytes.length;
    const chunk = bytes.slice(start, end);

    if (compressionType === 2) {
      // PalmDOC 压缩，需要先解压
      const decompressed = decompressPalmDoc(chunk);
      fullText += new TextDecoder('utf-8').decode(decompressed);
    } else if (compressionType === 1) {
      // 无压缩，直接按指定编码解码
      fullText += new TextDecoder('windows-' + textEncoding).decode(chunk);
    } else {
      // 其他情况：尝试 UTF-8 解码并清理控制字符
      const raw = new TextDecoder('utf-8').decode(chunk);
      const cleaned = raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
      if (cleaned.trim().length > 0) {
        fullText += cleaned;
      }
    }
  }

  // 清洗文本：统一换行符、移除空字符、合并连续空行
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
