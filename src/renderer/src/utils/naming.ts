/**
 * 从模型 ID 中提取默认组名。
 * 例如：
 * - 'gpt-3.5-turbo-16k-0613' 转换为 'GPT-3.5-Turbo'
 * - 'qwen2:1.5b' 转换为 'QWEN2'。
 * @param id 模型 ID 字符串
 * @returns string 提取的组名
 */
export const getDefaultGroupName = (id: string) => {
  if (id.includes('/')) {
    return id.split('/')[0]
  }

  if (id.includes(':')) {
    return id.split(':')[0]
  }

  if (id.includes('-')) {
    const parts = id.split('-')
    return parts[0] + '-' + parts[1]
  }

  return id
}

/**
 * 用于获取 avatar 名字的辅助函数，会取出字符串的第一个字符，支持表情符号。
 * @param str 输入字符串
 * @returns string 第一个字符，或者返回空字符串
 */
export function firstLetter(str: string): string {
  const match = str?.match(/\p{L}\p{M}*|\p{Emoji_Presentation}|\p{Emoji}\uFE0F/u)
  return match ? match[0] : ''
}

/**
 * 移除字符串开头的表情符号。
 * @param str 输入字符串
 * @returns string 移除开头表情符号后的字符串
 */
export function removeLeadingEmoji(str: string): string {
  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)+/u
  return str.replace(emojiRegex, '').trim()
}

/**
 * 提取字符串开头的表情符号。
 * @param str 输入字符串
 * @returns string 开头的表情符号，如果没有则返回空字符串
 */
export function getLeadingEmoji(str: string): string {
  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)+/u
  const match = str.match(emojiRegex)
  return match ? match[0] : ''
}

/**
 * 检查字符串是否为纯表情符号。
 * @param str 输入字符串
 * @returns boolean 如果字符串是纯表情符号则返回 true，否则返回 false
 */
export function isEmoji(str: string): boolean {
  if (str.startsWith('data:')) {
    return false
  }
  if (str.startsWith('http')) {
    return false
  }
  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)+$/u
  const match = str.match(emojiRegex)
  return !!match
}

/**
 * 从话题名称中移除特殊字符：
 * - 替换换行符为空格。
 * @param str 输入字符串
 * @returns string 处理后的字符串
 */
export function removeSpecialCharactersForTopicName(str: string) {
  return str.replace(/[\r\n]+/g, ' ').trim()
}

/**
 * 根据字符生成颜色代码，用于 avatar。
 * @param char 输入字符
 * @returns string 十六进制颜色字符串
 */
export function generateColorFromChar(char: string) {
  // 使用字符的Unicode值作为随机种子
  const seed = char.charCodeAt(0)

  // 使用简单的线性同余生成器创建伪随机数
  const a = 1664525
  const c = 1013904223
  const m = Math.pow(2, 32)

  // 生成三个伪随机数作为RGB值
  let r = (a * seed + c) % m
  let g = (a * r + c) % m
  let b = (a * g + c) % m

  // 将伪随机数转换为0-255范围内的整数
  r = Math.floor((r / m) * 256)
  g = Math.floor((g / m) * 256)
  b = Math.floor((b / m) * 256)

  // 返回十六进制颜色字符串
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/**
 * 获取字符串的第一个字符。
 * @param str 输入字符串
 * @returns string 第一个字符，或者空字符串
 */
export function getFirstCharacter(str) {
  if (str.length === 0) return ''

  // 使用 for...of 循环来获取第一个字符
  for (const char of str) {
    return char
  }
}

/**
 * 用于简化文本。按照给定长度限制截断文本，考虑语义边界。
 * @param text 输入文本
 * @param maxLength 最大长度，默认为 50
 * @returns string 处理后的简短文本
 */
export function getBriefInfo(text: string, maxLength: number = 50): string {
  // 去除空行
  const noEmptyLinesText = text.replace(/\n\s*\n/g, '\n')

  // 检查文本是否超过最大长度
  if (noEmptyLinesText.length <= maxLength) {
    return noEmptyLinesText
  }

  // 找到最近的单词边界
  let truncatedText = noEmptyLinesText.slice(0, maxLength)
  const lastSpaceIndex = truncatedText.lastIndexOf(' ')

  if (lastSpaceIndex !== -1) {
    truncatedText = truncatedText.slice(0, lastSpaceIndex)
  }

  // 截取前面的内容，并在末尾添加 "..."
  return truncatedText + '...'
}
