import bento from './themes/bento.json' with { type: 'json' }

export type ThemeClasses = typeof bento.classes

export const theme = bento

export const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ')
