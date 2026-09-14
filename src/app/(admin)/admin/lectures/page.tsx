'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus, Trash2, X, Bold, Italic, Heading, List, Link2, FunctionSquare,
  ImagePlus, Eye, Edit3, BookOpen, ChevronRight, ChevronDown, ArrowLeft,
  Sparkles, Loader2, Upload, Wand2
} from 'lucide-react'
import type { Lecture } from '@/lib/types'

const SUPABASE_URL = 'https://ydcbxqrnmnbceyzqgbui.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY2J4cXJubW5iY2V5enFnYnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3Mzg0NjYsImV4cCI6MjA4OTMxNDQ2Nn0.y-lauFU8c9eTP0RJL_zveEF4JE96KiTvJ46FrvYZmfY'

const SUBJECTS = [
  'Fizika', 'Matematika', 'Hemija', 'Biologija', 'Informatika',
  'Engleski jezik', 'Srpski jezik', 'Historija', 'Geografija',
  'Muzička kultura', 'Likovna kultura', 'Tjelesni odgoj', 'Filozofija', 'Drugo'
]

interface Flashcard {
  question: string
  answer: string
}

interface AISection {
  heading: string
  content: string
}

interface AIQuizQuestion {
  question: string
  options: string[]
  correct: number
}

interface AIFlashcard {
  front: string
  back: string
}

interface AIKeyTerm {
  term: string
  definition: string
}

interface AILectureResult {
  title: string
  sections: AISection[]
  quiz: AIQuizQuestion[]
  flashcards: AIFlashcard[]
  keyTerms: AIKeyTerm[]
  summary: string
}

async function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onload = (e) => {
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxWidth = 1024
        let { width, height } = img
        if (width > maxWidth) {
          height = (height / width) * maxWidth
          width = maxWidth
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function buildLectureContent(result: AILectureResult): string {
  let content = ''
  const today = new Date().toISOString().split('T')[0]
  content += `LECTURE_DATE:${today}:LECTURE_DATE\n\n`
  for (const section of result.sections) {
    content += `## ${section.heading}\n\n${section.content}\n\n`
  }
  if (result.keyTerms.length > 0) {
    content += `KEY_TERMS:${JSON.stringify(result.keyTerms)}:KEY_TERMS\n\n`
  }
  if (result.summary) {
    content += `SUMMARY:${result.summary}:SUMMARY\n\n`
  }
  const quizData = {
    questions: result.quiz,
    flashcards: result.flashcards.map(f => ({ question: f.front, answer: f.back })),
  }
  content += `QUIZ_DATA:${JSON.stringify(quizData)}:QUIZ_DATA`
  return content
}

export default function AdminLecturesPage() {
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [classNumber, setClassNumber] = useState('1')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(false)
  const [editorHtml, setEditorHtml] = useState('')

  // Quiz step
  const [showQuizStep, setShowQuizStep] = useState(false)
  const [savedLectureId, setSavedLectureId] = useState<string | null>(null)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [newQuestion, setNewQuestion] = useState('')
  const [newAnswer, setNewAnswer] = useState('')

  // AI generation
  const [showAI, setShowAI] = useState(false)
  const [aiPhotos, setAiPhotos] = useState<File[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<AILectureResult | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({})
  const [improvePrompt, setImprovePrompt] = useState('')
  const [improving, setImproving] = useState(false)

  const editorRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const aiFileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => { loadLectures() }, [])

  useEffect(() => {
    if (!preview && editorRef.current && contentRef.current) {
      editorRef.current.innerHTML = contentRef.current
    }
  }, [preview])

  async function loadLectures() {
    const { data } = await supabase.from('lectures').select('*').order('created_at', { ascending: false })
    if (data) setLectures(data)
  }

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    syncEditor()
  }, [])

  function syncEditor() {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML
      setEditorHtml(html)
      contentRef.current = html
    }
  }

  function handleBold() { execCommand('bold') }
  function handleItalic() { execCommand('italic') }
  function handleHeading() {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      const parentEl = range.startContainer.parentElement
      if (parentEl?.tagName === 'H2') {
        execCommand('formatBlock', 'p')
      } else {
        execCommand('formatBlock', 'h2')
      }
    }
  }
  function handleList() { execCommand('insertUnorderedList') }

  function handleLink() {
    const url = prompt('Unesi URL:')
    if (url) execCommand('createLink', url)
  }

  function handleFormula() {
    const formula = prompt('Unesi formulu:')
    if (formula && editorRef.current) {
      const html = `<span class="inline-block px-2 py-1 mx-1 rounded bg-blue-500/20 font-mono text-blue-600 text-sm" contenteditable="false">${formula}</span>&nbsp;`
      execCommand('insertHTML', html)
    }
  }

  function handleImageUpload() { fileInputRef.current?.click() }

  async function onImageSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const fileExt = file.name.split('.').pop()
    const fileName = `lecture-${user.id}-${Date.now()}.${fileExt}`
    const { error } = await supabase.storage.from('photos').upload(fileName, file)
    if (error) { alert('Greška pri uploadu slike'); return }
    const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName)
    if (editorRef.current) {
      const html = `<img src="${publicUrl}" alt="Slika lekcije" class="w-full rounded-xl my-3 max-h-80 object-contain" />`
      execCommand('insertHTML', html)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ========== AI GENERATION ==========
  async function handleAIGenerate() {
    if (aiPhotos.length === 0) { setAiError('Dodaj barem jednu fotografiju'); return }
    setAiLoading(true)
    setAiError(null)

    try {
      const images: string[] = []
      for (const photo of aiPhotos) {
        const base64 = await resizeImage(photo)
        images.push(base64)
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setAiError('Niste prijavljeni'); setAiLoading(false); return }

      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-lecture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ images, subject }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Greška ${res.status}`)
      }

      const result: AILectureResult = await res.json()
      setAiResult(result)
      setTitle(result.title)
      // Expand all sections by default
      const expanded: Record<number, boolean> = {}
      result.sections.forEach((_, i) => { expanded[i] = true })
      setExpandedSections(expanded)
    } catch (err) {
      setAiError((err as { message?: string }).message || 'Greška pri generisanju')
    } finally {
      setAiLoading(false)
    }
  }

  async function handleAIImprove() {
    if (!aiResult || !improvePrompt.trim()) return
    setImproving(true)
    setAiError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setAiError('Niste prijavljeni'); setImproving(false); return }

      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-lecture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          mode: 'improve',
          lectureText: JSON.stringify(aiResult),
          customPrompt: improvePrompt,
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Greška ${res.status}`)
      }

      const result: AILectureResult = await res.json()
      setAiResult(result)
      setTitle(result.title)
      setImprovePrompt('')
    } catch (err) {
      setAiError((err as { message?: string }).message || 'Greška pri poboljšanju')
    } finally {
      setImproving(false)
    }
  }

  async function saveAILecture() {
    if (!aiResult) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert('Niste prijavljeni'); setLoading(false); return }

    const content = buildLectureContent(aiResult)

    const { error } = await supabase.from('lectures').insert({
      title,
      subject,
      content,
      class_number: parseInt(classNumber),
      author_id: user.id,
    })

    if (error) {
      alert(`Greška: ${error.message}`)
      setLoading(false)
      return
    }

    resetForm()
    loadLectures()
    showToast('Lekcija objavljena!')
  }

  async function createLecture(e: React.FormEvent) {
    e.preventDefault()
    const content = contentRef.current || editorHtml
    if (!content.trim()) { alert('Sadržaj lekcije je obavezan'); return }
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert('Niste prijavljeni'); setLoading(false); return }

    const { data, error } = await supabase.from('lectures').insert({
      title, subject, content,
      class_number: parseInt(classNumber),
      author_id: user.id,
    }).select().single()

    if (error || !data) {
      alert(`Greška pri kreiranju lekcije: ${error?.message || 'Nepoznata greška'}`)
      setLoading(false)
      return
    }

    setSavedLectureId(data.id)
    setShowQuizStep(true)
    setLoading(false)
  }

  function addFlashcard() {
    if (!newQuestion.trim() || !newAnswer.trim()) return
    setFlashcards([...flashcards, { question: newQuestion.trim(), answer: newAnswer.trim() }])
    setNewQuestion('')
    setNewAnswer('')
  }

  function removeFlashcard(index: number) {
    setFlashcards(flashcards.filter((_, i) => i !== index))
  }

  async function saveQuiz() {
    if (!savedLectureId || flashcards.length === 0) return
    setLoading(true)
    const quizJson = JSON.stringify({ flashcards })
    const { data: lecture } = await supabase.from('lectures').select('content').eq('id', savedLectureId).single()
    if (lecture) {
      const updatedContent = lecture.content + `\n<!--QUIZ_DATA:${quizJson}:QUIZ_DATA-->`
      await supabase.from('lectures').update({ content: updatedContent }).eq('id', savedLectureId)
    }
    resetForm()
    loadLectures()
  }

  function skipQuiz() { resetForm(); loadLectures() }

  function resetForm() {
    setTitle(''); setSubject(SUBJECTS[0]); setClassNumber('1')
    setEditorHtml(''); contentRef.current = ''; setShowForm(false); setShowQuizStep(false)
    setSavedLectureId(null); setFlashcards([]); setNewQuestion(''); setNewAnswer('')
    setPreview(false); setLoading(false)
    setShowAI(false); setAiPhotos([]); setAiResult(null); setAiError(null); setImprovePrompt('')
    if (editorRef.current) editorRef.current.innerHTML = ''
  }

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function deleteLecture(id: string) {
    if (!confirm('Obriši ovu lekciju?')) return
    const { data, error } = await supabase.from('lectures').delete().eq('id', id).select()
    if (error) {
      showToast(`Greška pri brisanju: ${error.message}`, 'error')
      return
    }
    if (!data || data.length === 0) {
      showToast('Greška: nema dozvole za brisanje (RLS policy nedostaje)', 'error')
      return
    }
    showToast('Obrisano!')
    loadLectures()
  }

  const toolbarBtnClass = "rounded-xl bg-background border-2 border-border shadow-[0_2px_0_var(--color-border)] text-foreground hover:bg-muted transition-[transform,box-shadow,background-color] duration-[80ms] active:translate-y-[2px] active:shadow-none min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"

  // ========== AI EDITOR VIEW ==========
  if (showAI) {
    if (aiResult) {
      return (
        <div className="space-y-4 animate-fade-in pb-8">
          {toast && (
            <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-3 rounded-2xl text-[13px] font-extrabold bg-card border-2 animate-slide-down ${
              toast.type === 'success' ? 'text-primary-text border-primary-light-border shadow-[0_2px_0_var(--color-primary-light-border)]' : 'text-[#EA2B2B] border-[#FFB3B5] shadow-[0_2px_0_#FFB3B5]'
            }`}>{toast.message}</div>
          )}

          <button onClick={resetForm} className="inline-flex items-center gap-1 min-h-[44px] text-[15px] font-extrabold text-secondary hover:text-secondary-dark transition-colors">
            <ArrowLeft className="w-5 h-5" strokeWidth={2.6} /> Nazad
          </button>

          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent" strokeWidth={2.4} />
            <h1 className="text-[26px] leading-[1.2] tracking-[-0.01em] font-extrabold text-heading">AI Lekcija</h1>
          </div>

          {/* Editable title */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-[17px] font-extrabold"
            placeholder="Naslov lekcije"
          />

          {/* Subject & class */}
          <div className="grid grid-cols-2 gap-3">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex h-[50px] w-full rounded-2xl border-2 border-border bg-muted px-4 text-[15px] font-bold text-foreground focus:border-secondary focus:bg-background focus:outline-none transition-colors"
            >
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={classNumber}
              onChange={(e) => setClassNumber(e.target.value)}
              className="flex h-[50px] w-full rounded-2xl border-2 border-border bg-muted px-4 text-[15px] font-bold text-foreground focus:border-secondary focus:bg-background focus:outline-none transition-colors"
            >
              {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}. razred</option>)}
            </select>
          </div>

          {/* Sections */}
          <div className="space-y-2.5">
            <h3 className="text-[13px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">Sekcije</h3>
            {aiResult.sections.map((section, i) => (
              <div key={i} className="rounded-2xl border-2 border-border bg-card shadow-[0_2px_0_var(--color-border)] overflow-hidden">
                <button
                  onClick={() => setExpandedSections(prev => ({ ...prev, [i]: !prev[i] }))}
                  className="w-full min-h-[64px] flex items-center gap-3 p-4 text-left hover:bg-muted transition-colors"
                >
                  <div className="w-1.5 h-8 rounded-full bg-primary flex-shrink-0" />
                  <span className="flex-1 text-[17px] leading-[1.3] font-extrabold text-heading">{section.heading}</span>
                  <ChevronDown strokeWidth={2.6} className={`w-5 h-5 text-disabled transition-transform duration-300 ${expandedSections[i] ? 'rotate-180' : ''}`} />
                </button>
                {expandedSections[i] && (
                  <div className="px-4 pb-4 animate-fade-in">
                    <Textarea
                      value={section.content}
                      onChange={(e) => {
                        const updated = { ...aiResult }
                        updated.sections = [...updated.sections]
                        updated.sections[i] = { ...updated.sections[i], content: e.target.value }
                        setAiResult(updated)
                      }}
                      className="resize-y"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Key Terms */}
          {aiResult.keyTerms.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[13px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">Ključni pojmovi</h3>
              <div className="flex flex-wrap gap-2">
                {aiResult.keyTerms.map((term, i) => (
                  <div key={i} className="group relative">
                    <span className="inline-flex items-center gap-1 h-10 pl-3.5 pr-1 rounded-xl bg-secondary-light text-secondary text-[12px] font-extrabold uppercase tracking-[0.04em] border-2 border-secondary-light-border shadow-[0_2px_0_var(--color-secondary-light-border)]">
                      {term.term}
                      <button
                        onClick={() => {
                          const updated = { ...aiResult }
                          updated.keyTerms = updated.keyTerms.filter((_, idx) => idx !== i)
                          setAiResult(updated)
                        }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-secondary hover:text-destructive"
                      >
                        <X className="w-4 h-4" strokeWidth={2.6} />
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {aiResult.summary && (
            <div className="space-y-2">
              <h3 className="text-[13px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">Rezime</h3>
              <Textarea
                value={aiResult.summary}
                onChange={(e) => setAiResult({ ...aiResult, summary: e.target.value })}
                className="resize-y"
              />
            </div>
          )}

          {/* Quiz editor */}
          {aiResult.quiz.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-[13px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">Kviz ({aiResult.quiz.length} pitanja)</h3>
              {aiResult.quiz.map((q, qi) => (
                <div key={qi} className="rounded-2xl border-2 border-border bg-card shadow-[0_2px_0_var(--color-border)] p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-primary-light border-2 border-primary-light-border text-primary-text text-[13px] font-black flex items-center justify-center flex-shrink-0">
                      {qi + 1}
                    </span>
                    <input
                      value={q.question}
                      onChange={(e) => {
                        const updated = { ...aiResult }
                        updated.quiz = [...updated.quiz]
                        updated.quiz[qi] = { ...updated.quiz[qi], question: e.target.value }
                        setAiResult(updated)
                      }}
                      className="flex-1 min-w-0 h-11 bg-transparent border-none text-[15px] text-heading font-extrabold placeholder:text-disabled focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        const updated = { ...aiResult }
                        updated.quiz = updated.quiz.filter((_, idx) => idx !== qi)
                        setAiResult(updated)
                      }}
                      className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-destructive hover:bg-[#FFDFE0] transition-colors"
                    >
                      <Trash2 className="w-5 h-5" strokeWidth={2.4} />
                    </button>
                  </div>
                  <div className="space-y-1.5 pl-8">
                    {q.options.map((opt, oi) => (
                      <label key={oi} className="flex items-center gap-2 min-h-[44px] cursor-pointer group">
                        <input
                          type="radio"
                          name={`q-${qi}`}
                          checked={q.correct === oi}
                          onChange={() => {
                            const updated = { ...aiResult }
                            updated.quiz = [...updated.quiz]
                            updated.quiz[qi] = { ...updated.quiz[qi], correct: oi }
                            setAiResult(updated)
                          }}
                          className="w-5 h-5 accent-primary"
                        />
                        <input
                          value={opt}
                          onChange={(e) => {
                            const updated = { ...aiResult }
                            updated.quiz = [...updated.quiz]
                            const opts = [...updated.quiz[qi].options]
                            opts[oi] = e.target.value
                            updated.quiz[qi] = { ...updated.quiz[qi], options: opts }
                            setAiResult(updated)
                          }}
                          className={`flex-1 min-w-0 bg-transparent border-none text-[15px] font-bold focus:outline-none ${
                            q.correct === oi ? 'text-primary-text font-extrabold' : 'text-foreground'
                          }`}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Flashcard editor */}
          {aiResult.flashcards.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-[13px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">Kartice ({aiResult.flashcards.length})</h3>
              {aiResult.flashcards.map((fc, fi) => (
                <div key={fi} className="rounded-2xl border-2 border-border bg-card shadow-[0_2px_0_var(--color-border)] px-4 py-3 min-h-[64px] flex items-center gap-3">
                  <div className="flex-1 space-y-1">
                    <input
                      value={fc.front}
                      onChange={(e) => {
                        const updated = { ...aiResult }
                        updated.flashcards = [...updated.flashcards]
                        updated.flashcards[fi] = { ...updated.flashcards[fi], front: e.target.value }
                        setAiResult(updated)
                      }}
                      className="w-full bg-transparent border-none text-[15px] text-heading font-extrabold placeholder:text-disabled focus:outline-none"
                      placeholder="Prednja strana"
                    />
                    <input
                      value={fc.back}
                      onChange={(e) => {
                        const updated = { ...aiResult }
                        updated.flashcards = [...updated.flashcards]
                        updated.flashcards[fi] = { ...updated.flashcards[fi], back: e.target.value }
                        setAiResult(updated)
                      }}
                      className="w-full bg-transparent border-none text-[13px] text-muted-foreground font-bold placeholder:text-disabled focus:outline-none"
                      placeholder="Zadnja strana"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const updated = { ...aiResult }
                      updated.flashcards = updated.flashcards.filter((_, idx) => idx !== fi)
                      setAiResult(updated)
                    }}
                    className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-destructive hover:bg-[#FFDFE0] transition-colors"
                  >
                    <X className="w-5 h-5" strokeWidth={2.6} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* AI Improve */}
          <div className="rounded-2xl border-2 border-[#E1BDFF] bg-[#F3E3FF] shadow-[0_2px_0_#E1BDFF] p-4 space-y-3">
            <div className="flex items-center gap-2 text-[15px] font-extrabold text-accent-dark">
              <Wand2 className="w-5 h-5" strokeWidth={2.4} />
              Poboljšaj sa AI
            </div>
            <div className="flex gap-2">
              <Input
                value={improvePrompt}
                onChange={(e) => setImprovePrompt(e.target.value)}
                placeholder="npr. Dodaj više primjera, objasni detaljnije..."
                className="bg-background"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAIImprove() }}
              />
              <Button
                onClick={handleAIImprove}
                disabled={improving || !improvePrompt.trim()}
                variant="default"
                size="icon"
                aria-label="Poboljšaj"
                className="size-[50px] rounded-2xl flex-shrink-0 bg-accent text-accent-foreground shadow-[0_4px_0_var(--color-accent-dark)]"
              >
                {improving ? <Loader2 className="animate-spin" strokeWidth={2.6} /> : <Wand2 strokeWidth={2.6} />}
              </Button>
            </div>
          </div>

          {aiError && (
            <div className="text-[13px] font-extrabold text-[#EA2B2B] bg-[#FFDFE0] border-2 border-[#FFB3B5] rounded-2xl p-3">
              {aiError}
            </div>
          )}

          {/* Save button */}
          <Button
            onClick={saveAILecture}
            disabled={loading || !title.trim()}
            className="w-full"
          >
            {loading ? 'Objavljuje se...' : 'Objavi lekciju'}
          </Button>
        </div>
      )
    }

    // AI upload step
    return (
      <div className="space-y-5 animate-fade-in">
        <button onClick={() => setShowAI(false)} className="inline-flex items-center gap-1 min-h-[44px] text-[15px] font-extrabold text-secondary hover:text-secondary-dark transition-colors">
          <ArrowLeft className="w-5 h-5" strokeWidth={2.6} /> Nazad
        </button>

        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-accent" strokeWidth={2.4} />
          <h1 className="text-[26px] leading-[1.2] tracking-[-0.01em] font-extrabold text-heading">AI Generisanje lekcije</h1>
        </div>

        <p className="text-[15px] font-bold text-foreground">
          Uploaduj fotografije sa table ili iz udžbenika, a AI će generisati kompletnu lekciju sa kvizom i karticama.
        </p>

        {/* Subject & class selection */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Predmet</Label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex h-[50px] w-full rounded-2xl border-2 border-border bg-muted px-4 text-[15px] font-bold text-foreground focus:border-secondary focus:bg-background focus:outline-none transition-colors"
            >
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <Label>Razred</Label>
            <select
              value={classNumber}
              onChange={(e) => setClassNumber(e.target.value)}
              className="flex h-[50px] w-full rounded-2xl border-2 border-border bg-muted px-4 text-[15px] font-bold text-foreground focus:border-secondary focus:bg-background focus:outline-none transition-colors"
            >
              {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}. razred</option>)}
            </select>
          </div>
        </div>

        {/* Photo upload area */}
        <div
          onClick={() => aiFileInputRef.current?.click()}
          className="rounded-2xl border-2 border-dashed border-border bg-muted p-8 text-center cursor-pointer hover:border-secondary transition-colors"
        >
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-background border-2 border-border flex items-center justify-center">
            <Upload className="w-8 h-8 text-disabled" strokeWidth={2.4} />
          </div>
          <p className="text-[17px] font-extrabold text-foreground">Klikni da dodaš fotografije</p>
          <p className="text-[13px] font-bold text-muted-foreground mt-1">JPG, PNG · Max 10 fotografija</p>
        </div>

        <input
          ref={aiFileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              setAiPhotos(prev => [...prev, ...Array.from(e.target.files!)])
            }
          }}
        />

        {/* Photo previews */}
        {aiPhotos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {aiPhotos.map((photo, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-border">
                <img src={URL.createObjectURL(photo)} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => setAiPhotos(prev => prev.filter((_, idx) => idx !== i))}
                  type="button"
                  aria-label="Ukloni"
                  className="absolute top-1 right-1 w-8 h-8 rounded-full bg-destructive border-2 border-background flex items-center justify-center text-destructive-foreground hover:bg-destructive-dark transition-colors"
                >
                  <X className="w-4 h-4" strokeWidth={2.6} />
                </button>
              </div>
            ))}
          </div>
        )}

        {aiError && (
          <div className="text-[13px] font-extrabold text-[#EA2B2B] bg-[#FFDFE0] border-2 border-[#FFB3B5] rounded-2xl p-3">
            {aiError}
          </div>
        )}

        <Button
          onClick={handleAIGenerate}
          disabled={aiLoading || aiPhotos.length === 0}
          className="w-full"
        >
          {aiLoading ? (
            <>
              <Loader2 className="animate-spin" strokeWidth={2.6} />
              Generisanje... (može potrajati)
            </>
          ) : (
            <>
              <Sparkles strokeWidth={2.6} />
              Generiši lekciju ({aiPhotos.length} {aiPhotos.length === 1 ? 'foto' : 'fotografija'})
            </>
          )}
        </Button>
      </div>
    )
  }

  // Quiz step UI
  if (showQuizStep) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-2 text-primary-text text-[13px] font-extrabold">
          <BookOpen className="w-4 h-4" strokeWidth={2.6} />
          <span>Lekcija sačuvana</span>
          <ChevronRight className="w-4 h-4 text-disabled" strokeWidth={2.6} />
          <span className="text-foreground">Dodaj provjeru znanja</span>
        </div>

        <h2 className="text-[20px] leading-[1.25] font-extrabold text-heading">Dodaj kartice za učenje</h2>
        <p className="text-[13px] font-bold text-muted-foreground">Kreiraj pitanja i odgovore za provjeru znanja.</p>

        {flashcards.map((card, i) => (
          <div key={i} className="rounded-2xl border-2 border-border bg-card shadow-[0_2px_0_var(--color-border)] px-4 py-3 min-h-[64px]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-extrabold text-heading">{card.question}</p>
                <p className="text-[13px] font-bold text-muted-foreground mt-1">{card.answer}</p>
              </div>
              <button onClick={() => removeFlashcard(i)} className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-destructive hover:bg-[#FFDFE0] transition-colors">
                <Trash2 className="w-5 h-5" strokeWidth={2.4} />
              </button>
            </div>
          </div>
        ))}

        <div className="rounded-2xl border-2 border-border bg-card shadow-[0_2px_0_var(--color-border)] p-4 space-y-3">
          <div>
            <Label>Pitanje</Label>
            <Input
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="npr. Šta je sila?"
            />
          </div>
          <div>
            <Label>Odgovor</Label>
            <Input
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder="npr. Sila je fizička veličina..."
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={addFlashcard}
            disabled={!newQuestion.trim() || !newAnswer.trim()}
            className="w-full"
          >
            <Plus strokeWidth={2.6} />
            Dodaj karticu
          </Button>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={saveQuiz}
            disabled={flashcards.length === 0 || loading}
            className="flex-1"
          >
            {loading ? 'Čuvanje...' : `Sačuvaj (${flashcards.length} kartica)`}
          </Button>
          <Button variant="outline" onClick={skipQuiz}>
            Preskoči
          </Button>
        </div>
      </div>
    )
  }

  // ========== FULLSCREEN EDITOR ==========
  if (showForm) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 bg-background border-b-2 border-border">
          <button onClick={resetForm} className="inline-flex items-center gap-1.5 min-h-[44px] text-[15px] font-extrabold text-secondary hover:text-secondary-dark transition-colors">
            <ArrowLeft className="w-5 h-5" strokeWidth={2.6} />
            <span>Nazad</span>
          </button>
          <h2 className="text-[17px] font-extrabold text-heading">Nova lekcija</h2>
          <button onClick={() => setPreview(!preview)} className="inline-flex items-center gap-1 min-h-[44px] text-[15px] font-extrabold text-secondary hover:text-secondary-dark transition-colors">
            {preview ? <Edit3 className="w-5 h-5" strokeWidth={2.6} /> : <Eye className="w-5 h-5" strokeWidth={2.6} />}
            {preview ? 'Uredi' : 'Pregled'}
          </button>
        </div>

        <div className="px-4 py-3 bg-background border-b-2 border-border space-y-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="text-[17px] font-extrabold"
            placeholder="Naslov lekcije"
          />
          <div className="grid grid-cols-2 gap-3">
            <select value={subject} onChange={(e) => setSubject(e.target.value)}
              className="flex h-[50px] w-full rounded-2xl border-2 border-border bg-muted px-4 text-[15px] font-bold text-foreground focus:border-secondary focus:bg-background focus:outline-none transition-colors">
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={classNumber} onChange={(e) => setClassNumber(e.target.value)}
              className="flex h-[50px] w-full rounded-2xl border-2 border-border bg-muted px-4 text-[15px] font-bold text-foreground focus:border-secondary focus:bg-background focus:outline-none transition-colors">
              {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}. razred</option>)}
            </select>
          </div>
        </div>

        {!preview && (
          <div className="flex gap-2 px-4 py-2 bg-background border-b-2 border-border overflow-x-auto">
            <button type="button" onClick={handleBold} className={toolbarBtnClass} title="Bold"><Bold className="w-4 h-4" /></button>
            <button type="button" onClick={handleItalic} className={toolbarBtnClass} title="Italic"><Italic className="w-4 h-4" /></button>
            <button type="button" onClick={handleHeading} className={toolbarBtnClass} title="Naslov"><Heading className="w-4 h-4" /></button>
            <button type="button" onClick={handleList} className={toolbarBtnClass} title="Lista"><List className="w-4 h-4" /></button>
            <button type="button" onClick={handleLink} className={toolbarBtnClass} title="Link"><Link2 className="w-4 h-4" /></button>
            <button type="button" onClick={handleFormula} className={toolbarBtnClass} title="Formula"><FunctionSquare className="w-4 h-4" /></button>
            <button type="button" onClick={handleImageUpload} className={toolbarBtnClass} title="Slika"><ImagePlus className="w-4 h-4" /></button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {!preview ? (
            <div
              ref={editorRef}
              contentEditable
              onInput={syncEditor}
              onBlur={syncEditor}
              className="min-h-full px-4 py-4 text-[15px] font-bold text-foreground focus:outline-none leading-[1.5] prose prose-sm max-w-none [&_h2]:text-[20px] [&_h2]:font-extrabold [&_h2]:text-heading [&_h2]:mt-4 [&_h2]:mb-2 [&_a]:text-secondary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_img]:rounded-xl [&_img]:my-3"
              data-placeholder="Piši sadržaj lekcije ovdje..."
              suppressContentEditableWarning
              style={{ minHeight: '300px' }}
            />
          ) : (
            <div className="px-4 py-4">
              {editorHtml ? (
                <div className="prose prose-sm max-w-none text-[15px] font-bold text-foreground [&_h2]:text-[20px] [&_h2]:font-extrabold [&_h2]:text-heading [&_a]:text-secondary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_img]:rounded-xl [&_img]:my-3"
                  dangerouslySetInnerHTML={{ __html: editorHtml }} />
              ) : (
                <p className="text-[13px] font-bold text-muted-foreground">Nema sadržaja za pregled</p>
              )}
            </div>
          )}
        </div>

        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={onImageSelected} />

        <div className="px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] bg-background border-t-2 border-border">
          <Button
            onClick={(e) => createLecture(e)}
            disabled={loading || !title.trim()}
            className="w-full"
          >
            {loading ? 'Objavljuje se...' : 'Objavi lekciju'}
          </Button>
        </div>
      </div>
    )
  }

  // ========== MAIN LIST VIEW ==========
  return (
    <div className="space-y-4 animate-fade-in">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-3 rounded-2xl text-[13px] font-extrabold bg-card border-2 animate-slide-down ${
          toast.type === 'success' ? 'text-primary-text border-primary-light-border shadow-[0_2px_0_var(--color-primary-light-border)]' : 'text-[#EA2B2B] border-[#FFB3B5] shadow-[0_2px_0_#FFB3B5]'
        }`}>{toast.message}</div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-[26px] leading-[1.2] tracking-[-0.01em] font-extrabold text-heading">Lekcije</h1>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowAI(true)}
            className="px-4 bg-accent text-accent-foreground shadow-[0_4px_0_var(--color-accent-dark)]"
          >
            <Sparkles strokeWidth={2.6} />AI
          </Button>
          <Button
            variant="secondary"
            className="px-4"
            onClick={() => { setShowForm(true); setPreview(false) }}
          >
            <Plus strokeWidth={2.6} />Nova
          </Button>
        </div>
      </div>

      {lectures.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-disabled" strokeWidth={2.4} />
          </div>
          <p className="text-[17px] font-extrabold text-foreground">Nema lekcija</p>
          <p className="text-[13px] font-bold text-muted-foreground mt-1">Dodaj prvu lekciju dugmetom „Nova“ ili „AI“.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {lectures.map((lecture, index) => (
            <div
              key={lecture.id}
              className="animate-stagger-item rounded-2xl border-2 border-border bg-card shadow-[0_2px_0_var(--color-border)] px-4 py-3 min-h-[64px] flex items-center justify-between gap-3"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="min-w-0 flex-1">
                <h3 className="text-[17px] leading-[1.3] font-extrabold text-heading">{lecture.title}</h3>
                <p className="text-[13px] font-bold text-muted-foreground mt-1">{lecture.subject} · {lecture.class_number}. razred</p>
              </div>
              <button
                type="button"
                aria-label="Obriši"
                onClick={() => deleteLecture(lecture.id)}
                className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-destructive hover:bg-[#FFDFE0] transition-colors"
              >
                <Trash2 className="w-5 h-5" strokeWidth={2.4} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
