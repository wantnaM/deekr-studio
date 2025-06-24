export const DEFAULT_TEMPERATURE = 1.0
export const DEFAULT_CONTEXTCOUNT = 5
export const DEFAULT_MAX_TOKENS = 4096
export const DEFAULT_KNOWLEDGE_DOCUMENT_COUNT = 6
export const DEFAULT_KNOWLEDGE_THRESHOLD = 0.0

export const platform = window.electron?.process?.platform
export const isMac = platform === 'darwin'
export const isWindows = platform === 'win32' || platform === 'win64'
export const isLinux = platform === 'linux'

export const SILICON_CLIENT_ID = 'SFaJLLq0y6CAMoyDm81aMu'
export const TOKENFLUX_HOST = 'https://tokenflux.ai'

// Messages loading configuration
export const INITIAL_MESSAGES_COUNT = 20
export const LOAD_MORE_COUNT = 20

export const DEFAULT_COLOR_PRIMARY = '#00b96b'
export const THEME_COLOR_PRESETS = [
  DEFAULT_COLOR_PRIMARY,
  '#FF5470', // Coral Pink
  '#14B8A6', // Teal
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#6D28D9', // Violet
  '#0EA5E9', // Sky Blue
  '#0284C7' // Light Blue
]
