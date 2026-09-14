// Pure helpers for lecture content: math formatting and the inline
// metadata blocks (QUIZ_DATA / KEY_TERMS / SUMMARY / HOMEWORK / LECTURE_DATE)
// that the admin editor embeds into `lectures.content`.

export function formatMath(text: string): string {
  if (!text) return ''
  const superscripts: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', 'n': 'ⁿ', 'x': 'ˣ', '+': '⁺', '-': '⁻' }
  const subscripts: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉', 'n': 'ₙ', 'x': 'ₓ' }
  let result = text.replace(/\^([0-9n\+\-x]+)/g, (_, chars) =>
    chars.split('').map((c: string) => superscripts[c] || c).join('')
  )
  result = result.replace(/_([0-9nx]+)/g, (_, chars) =>
    chars.split('').map((c: string) => subscripts[c] || c).join('')
  )
  return result
}

export interface QuizQuestion {
  question: string
  options: string[]
  correct: number
}

export interface FlashCard {
  question: string
  answer: string
}

export interface KeyTerm {
  term: string
  definition: string
}

export function stripHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

export function parseLectureDate(content: string): string | null {
  const match = content.match(/LECTURE_DATE:(.*?):LECTURE_DATE/)
  return match ? match[1].trim() : null
}

export function parseKeyTerms(content: string): KeyTerm[] {
  const match = content.match(/KEY_TERMS:([\s\S]*?):KEY_TERMS/)
  if (!match) return []
  try {
    return JSON.parse(match[1])
  } catch { return [] }
}

export function parseSummary(content: string): string | null {
  const match = content.match(/SUMMARY:([\s\S]*?):SUMMARY/)
  return match ? match[1].trim() : null
}

export interface HomeworkTask {
  /** "Zadatak 3", "Zadaci 1–4 (str. 57)" */
  label: string
  /** The task in one sentence. */
  what: string
  /** A short method hint — not the solution. */
  how: string
}

export interface Homework {
  /** 1–3 plain sentences: what to do and how. May contain newlines. */
  text: string
  tasks: HomeworkTask[]
  /** Public URLs of textbook-page photos. */
  images: string[]
  /** ISO date or null. */
  due: string | null
}

const HOMEWORK_MAX_TASKS = 8
const HOMEWORK_MAX_IMAGES = 4

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')

/**
 * Reads the `HOMEWORK:<json>:HOMEWORK` block. Anything malformed — bad JSON,
 * wrong shapes, non-http image URLs — degrades to "no homework" rather than
 * throwing; the block sits between SUMMARY and QUIZ_DATA.
 */
export function parseHomework(content: string): Homework | null {
  if (!content) return null
  const match = content.match(/HOMEWORK:([\s\S]*?):HOMEWORK/)
  if (!match) return null
  try {
    const raw: unknown = JSON.parse(match[1])
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null
    const obj = raw as { text?: unknown; tasks?: unknown; images?: unknown; due?: unknown }

    const text = str(obj.text)
    const tasks: HomeworkTask[] = (Array.isArray(obj.tasks) ? obj.tasks : [])
      .map((t: unknown) => {
        if (typeof t !== 'object' || t === null) return null
        const task = t as { label?: unknown; what?: unknown; how?: unknown }
        const item = { label: str(task.label), what: str(task.what), how: str(task.how) }
        return item.label || item.what ? item : null
      })
      .filter((t): t is HomeworkTask => t !== null)
      .slice(0, HOMEWORK_MAX_TASKS)
    const images = (Array.isArray(obj.images) ? obj.images : [])
      .map(str)
      .filter((u) => /^https?:\/\//i.test(u))
      .slice(0, HOMEWORK_MAX_IMAGES)
    const due = str(obj.due) || null

    if (!text && tasks.length === 0 && images.length === 0) return null
    return { text, tasks, images, due }
  } catch {
    return null
  }
}

export function parseSections(content: string): { heading: string; content: string }[] {
  const sections: { heading: string; content: string }[] = []
  const lines = content.split('\n')
  let currentHeading = ''
  let currentContent: string[] = []

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentHeading || currentContent.length > 0) {
        sections.push({ heading: currentHeading, content: currentContent.join('\n').trim() })
      }
      currentHeading = line.replace('## ', '').trim()
      currentContent = []
    } else {
      currentContent.push(line)
    }
  }
  if (currentHeading || currentContent.length > 0) {
    sections.push({ heading: currentHeading, content: currentContent.join('\n').trim() })
  }
  return sections.filter(s => s.heading || s.content)
}

interface RawQuestion {
  question?: string
  options?: string[]
  correct?: number
}

interface RawFlashcard {
  question?: string
  answer?: string
  front?: string
  back?: string
}

function toQuestion(raw: RawQuestion): QuizQuestion {
  return {
    question: formatMath(stripHtml(raw.question ?? '')),
    options: (raw.options ?? []).map((o) => formatMath(stripHtml(o))),
    correct: raw.correct ?? 0,
  }
}

function toFlashcard(raw: RawFlashcard): FlashCard {
  return {
    question: formatMath(stripHtml(raw.question ?? raw.front ?? '')),
    answer: formatMath(stripHtml(raw.answer ?? raw.back ?? '')),
  }
}

/**
 * Reads the QUIZ_DATA block out of a lecture body. Three historical shapes are
 * supported: `{questions, flashcards}`, a bare array of MCQs, and `{flashcards}`.
 */
export function parseQuizData(
  content: string
): { questions: QuizQuestion[]; flashcards: FlashCard[] } | null {
  const quizMatch = content.match(/(?:<!--\s*)?QUIZ_DATA:([\s\S]*?):QUIZ_DATA(?:\s*-->)?/)
  if (!quizMatch) return null
  try {
    const parsed: unknown = JSON.parse(quizMatch[1])

    // Old format: array of MCQ questions
    if (Array.isArray(parsed)) {
      const raw = parsed as RawQuestion[]
      if (raw.length > 0 && raw[0].options) {
        return { questions: raw.map(toQuestion), flashcards: [] }
      }
      return null
    }

    if (typeof parsed !== 'object' || parsed === null) return null
    const obj = parsed as { questions?: RawQuestion[]; flashcards?: RawFlashcard[] }

    // New format: { questions: [...], flashcards: [...] }
    if (Array.isArray(obj.questions)) {
      return {
        questions: obj.questions.map(toQuestion),
        flashcards: (obj.flashcards ?? []).map(toFlashcard),
      }
    }

    // Old format: { flashcards: [...] }
    if (Array.isArray(obj.flashcards)) {
      return { questions: [], flashcards: obj.flashcards.map(toFlashcard) }
    }
  } catch {
    // Malformed metadata — treat the lecture as having no quiz.
  }
  return null
}

export function stripMetadata(html: string): string {
  let result = html
  result = result.replace(/\n*(?:<!--\s*)?QUIZ_DATA:[\s\S]*?:QUIZ_DATA(?:\s*-->)?\n*/g, '')
  result = result.replace(/\n*KEY_TERMS:[\s\S]*?:KEY_TERMS\n*/g, '')
  result = result.replace(/\n*SUMMARY:[\s\S]*?:SUMMARY\n*/g, '')
  result = result.replace(/\n*HOMEWORK:[\s\S]*?:HOMEWORK\n*/g, '')
  result = result.replace(/\n*LECTURE_DATE:[\s\S]*?:LECTURE_DATE\n*/g, '')
  result = result.replace('<!-- CURRENT -->', '')
  // Fallback cleanup
  const idx = result.indexOf('QUIZ_DATA:')
  if (idx !== -1) result = result.substring(0, idx).trim()
  const idx2 = result.indexOf('<!--QUIZ_DATA')
  if (idx2 !== -1) result = result.substring(0, idx2).trim()
  return result.trim()
}

export function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}
