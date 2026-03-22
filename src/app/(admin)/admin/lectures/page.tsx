'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    } catch (err: any) {
      setAiError(err.message || 'Greška pri generisanju')
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
    } catch (err: any) {
      setAiError(err.message || 'Greška pri poboljšanju')
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

  const toolbarBtnClass = "p-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"

  // ========== AI EDITOR VIEW ==========
  if (showAI) {
    if (aiResult) {
      return (
        <div className="space-y-4 animate-fade-in pb-8">
          {toast && (
            <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-2xl text-sm font-medium shadow-lg backdrop-blur-sm animate-slide-down border ${
              toast.type === 'success' ? 'bg-green-500/90 text-white border-green-400/30' : 'bg-red-500/90 text-white border-red-400/30'
            }`}>{toast.message}</div>
          )}

          <button onClick={resetForm} className="text-sm text-purple-400 flex items-center gap-1 hover:gap-2 transition-all">
            <ArrowLeft className="w-4 h-4" /> Nazad
          </button>

          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h1 className="text-xl font-bold text-white">AI Lekcija</h1>
          </div>

          {/* Editable title */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-xl bg-white/[0.06] border-white/[0.1] text-white placeholder:text-white/30 focus:border-purple-500 h-12 text-lg font-bold"
            placeholder="Naslov lekcije"
          />

          {/* Subject & class */}
          <div className="grid grid-cols-2 gap-3">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-white/[0.1] bg-white/[0.06] px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none transition-colors"
            >
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={classNumber}
              onChange={(e) => setClassNumber(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-white/[0.1] bg-white/[0.06] px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none transition-colors"
            >
              {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}. razred</option>)}
            </select>
          </div>

          {/* Sections */}
          <div className="space-y-2.5">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest">Sekcije</h3>
            {aiResult.sections.map((section, i) => (
              <div key={i} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] overflow-hidden">
                <button
                  onClick={() => setExpandedSections(prev => ({ ...prev, [i]: !prev[i] }))}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <div className="w-1 h-8 rounded-full bg-[#7c5cfc] flex-shrink-0" />
                  <span className="flex-1 font-semibold text-sm text-white">{section.heading}</span>
                  <ChevronDown className={`w-4 h-4 text-white/40 transition-transform duration-300 ${expandedSections[i] ? 'rotate-180' : ''}`} />
                </button>
                {expandedSections[i] && (
                  <div className="px-4 pb-4 animate-fade-in">
                    <textarea
                      value={section.content}
                      onChange={(e) => {
                        const updated = { ...aiResult }
                        updated.sections = [...updated.sections]
                        updated.sections[i] = { ...updated.sections[i], content: e.target.value }
                        setAiResult(updated)
                      }}
                      className="w-full min-h-[120px] rounded-xl bg-white/[0.04] border border-white/[0.08] p-3 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 resize-y"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Key Terms */}
          {aiResult.keyTerms.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest">Ključni pojmovi</h3>
              <div className="flex flex-wrap gap-2">
                {aiResult.keyTerms.map((term, i) => (
                  <div key={i} className="group relative">
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#7c5cfc]/15 text-[#7c5cfc] text-xs font-medium border border-[#7c5cfc]/20">
                      {term.term}
                      <button
                        onClick={() => {
                          const updated = { ...aiResult }
                          updated.keyTerms = updated.keyTerms.filter((_, idx) => idx !== i)
                          setAiResult(updated)
                        }}
                        className="ml-1 text-[#7c5cfc]/60 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
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
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest">Rezime</h3>
              <textarea
                value={aiResult.summary}
                onChange={(e) => setAiResult({ ...aiResult, summary: e.target.value })}
                className="w-full min-h-[80px] rounded-xl bg-white/[0.04] border border-white/[0.08] p-3 text-sm text-white/90 focus:outline-none focus:border-purple-500/50 resize-y"
              />
            </div>
          )}

          {/* Quiz editor */}
          {aiResult.quiz.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest">Kviz ({aiResult.quiz.length} pitanja)</h3>
              {aiResult.quiz.map((q, qi) => (
                <div key={qi} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#7c5cfc]/20 text-[#7c5cfc] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
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
                      className="flex-1 bg-transparent border-none text-sm text-white font-medium focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        const updated = { ...aiResult }
                        updated.quiz = updated.quiz.filter((_, idx) => idx !== qi)
                        setAiResult(updated)
                      }}
                      className="text-red-400/60 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1.5 pl-8">
                    {q.options.map((opt, oi) => (
                      <label key={oi} className="flex items-center gap-2 cursor-pointer group">
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
                          className="accent-[#7c5cfc]"
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
                          className={`flex-1 bg-transparent border-none text-xs focus:outline-none ${
                            q.correct === oi ? 'text-green-400 font-medium' : 'text-white/70'
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
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest">Kartice ({aiResult.flashcards.length})</h3>
              {aiResult.flashcards.map((fc, fi) => (
                <div key={fi} className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 flex items-start gap-2">
                  <div className="flex-1 space-y-1">
                    <input
                      value={fc.front}
                      onChange={(e) => {
                        const updated = { ...aiResult }
                        updated.flashcards = [...updated.flashcards]
                        updated.flashcards[fi] = { ...updated.flashcards[fi], front: e.target.value }
                        setAiResult(updated)
                      }}
                      className="w-full bg-transparent border-none text-sm text-white font-medium focus:outline-none"
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
                      className="w-full bg-transparent border-none text-xs text-white/60 focus:outline-none"
                      placeholder="Zadnja strana"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const updated = { ...aiResult }
                      updated.flashcards = updated.flashcards.filter((_, idx) => idx !== fi)
                      setAiResult(updated)
                    }}
                    className="text-red-400/60 hover:text-red-400 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* AI Improve */}
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-purple-300">
              <Wand2 className="w-4 h-4" />
              Poboljšaj sa AI
            </div>
            <div className="flex gap-2">
              <Input
                value={improvePrompt}
                onChange={(e) => setImprovePrompt(e.target.value)}
                placeholder="npr. Dodaj više primjera, objasni detaljnije..."
                className="rounded-xl bg-white/[0.06] border-white/[0.1] text-white text-sm placeholder:text-white/30 focus:border-purple-500"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAIImprove() }}
              />
              <Button
                onClick={handleAIImprove}
                disabled={improving || !improvePrompt.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-4 flex-shrink-0"
              >
                {improving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {aiError && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              {aiError}
            </div>
          )}

          {/* Save button */}
          <Button
            onClick={saveAILecture}
            disabled={loading || !title.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white rounded-xl h-12 text-base font-medium shadow-lg shadow-purple-500/20"
          >
            {loading ? 'Objavljuje se...' : 'Objavi lekciju'}
          </Button>
        </div>
      )
    }

    // AI upload step
    return (
      <div className="space-y-5 animate-fade-in">
        <button onClick={() => setShowAI(false)} className="text-sm text-purple-400 flex items-center gap-1 hover:gap-2 transition-all">
          <ArrowLeft className="w-4 h-4" /> Nazad
        </button>

        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h1 className="text-xl font-bold text-white">AI Generisanje lekcije</h1>
        </div>

        <p className="text-sm text-white/50">
          Uploaduj fotografije sa table ili iz udžbenika, a AI će generisati kompletnu lekciju sa kvizom i karticama.
        </p>

        {/* Subject & class selection */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs">Predmet</Label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-white/[0.1] bg-white/[0.06] px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none transition-colors"
            >
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs">Razred</Label>
            <select
              value={classNumber}
              onChange={(e) => setClassNumber(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-white/[0.1] bg-white/[0.06] px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none transition-colors"
            >
              {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}. razred</option>)}
            </select>
          </div>
        </div>

        {/* Photo upload area */}
        <div
          onClick={() => aiFileInputRef.current?.click()}
          className="rounded-2xl border-2 border-dashed border-white/[0.1] bg-white/[0.02] p-8 text-center cursor-pointer hover:border-purple-500/40 hover:bg-purple-500/5 transition-all"
        >
          <Upload className="w-10 h-10 mx-auto text-white/30 mb-3" />
          <p className="text-sm font-medium text-white/60">Klikni da dodaš fotografije</p>
          <p className="text-xs text-white/30 mt-1">JPG, PNG · Max 10 fotografija</p>
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
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/[0.1]">
                <img src={URL.createObjectURL(photo)} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => setAiPhotos(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {aiError && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            {aiError}
          </div>
        )}

        <Button
          onClick={handleAIGenerate}
          disabled={aiLoading || aiPhotos.length === 0}
          className="w-full bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white rounded-xl h-12 text-base font-medium shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
        >
          {aiLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generisanje... (može potrajati)
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
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
        <div className="flex items-center gap-2 text-blue-400 text-sm">
          <BookOpen className="w-4 h-4" />
          <span>Lekcija sačuvana</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white font-medium">Dodaj provjeru znanja</span>
        </div>

        <h2 className="text-xl font-bold text-white">Dodaj kartice za učenje</h2>
        <p className="text-sm text-slate-400">Kreiraj pitanja i odgovore za provjeru znanja.</p>

        {flashcards.map((card, i) => (
          <div key={i} className="rounded-xl bg-[#1e293b] border border-slate-700/50 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{card.question}</p>
                <p className="text-xs text-slate-400 mt-1">{card.answer}</p>
              </div>
              <button onClick={() => removeFlashcard(i)} className="text-red-400 p-1 hover:text-red-300 flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        <div className="rounded-xl bg-[#1e293b] border border-blue-500/30 p-4 space-y-3">
          <div className="space-y-2">
            <Label className="text-slate-200">Pitanje</Label>
            <Input
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="npr. Šta je sila?"
              className="rounded-xl bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-200">Odgovor</Label>
            <Input
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder="npr. Sila je fizička veličina..."
              className="rounded-xl bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
            />
          </div>
          <Button
            type="button"
            onClick={addFlashcard}
            disabled={!newQuestion.trim() || !newAnswer.trim()}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white rounded-xl"
          >
            <Plus className="w-4 h-4 mr-1" />
            Dodaj karticu
          </Button>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={saveQuiz}
            disabled={flashcards.length === 0 || loading}
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl"
          >
            {loading ? 'Čuvanje...' : `Sačuvaj (${flashcards.length} kartica)`}
          </Button>
          <Button onClick={skipQuiz} className="bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl">
            Preskoči
          </Button>
        </div>
      </div>
    )
  }

  // ========== FULLSCREEN EDITOR ==========
  if (showForm) {
    return (
      <div className="fixed inset-0 z-50 bg-[#f8f9fa] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
          <button onClick={resetForm} className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Nazad</span>
          </button>
          <h2 className="text-sm font-semibold text-gray-800">Nova lekcija</h2>
          <button onClick={() => setPreview(!preview)} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
            {preview ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {preview ? 'Uredi' : 'Pregled'}
          </button>
        </div>

        <div className="px-4 py-3 bg-white border-b border-gray-100 space-y-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="rounded-xl bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 h-11"
            placeholder="Naslov lekcije"
          />
          <div className="grid grid-cols-2 gap-3">
            <select value={subject} onChange={(e) => setSubject(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors">
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={classNumber} onChange={(e) => setClassNumber(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors">
              {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}. razred</option>)}
            </select>
          </div>
        </div>

        {!preview && (
          <div className="flex gap-1.5 px-4 py-2 bg-white border-b border-gray-100 overflow-x-auto">
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
              className="min-h-full px-4 py-4 text-base text-gray-900 focus:outline-none leading-relaxed prose prose-sm max-w-none [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-4 [&_h2]:mb-2 [&_a]:text-blue-600 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_img]:rounded-xl [&_img]:my-3"
              data-placeholder="Piši sadržaj lekcije ovdje..."
              suppressContentEditableWarning
              style={{ minHeight: '300px' }}
            />
          ) : (
            <div className="px-4 py-4">
              {editorHtml ? (
                <div className="prose prose-sm max-w-none text-gray-900 [&_h2]:text-xl [&_h2]:font-bold [&_a]:text-blue-600 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_img]:rounded-xl [&_img]:my-3"
                  dangerouslySetInnerHTML={{ __html: editorHtml }} />
              ) : (
                <p className="text-gray-400 italic">Nema sadržaja za pregled</p>
              )}
            </div>
          )}
        </div>

        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={onImageSelected} />

        <div className="px-4 py-3 bg-white border-t border-gray-200 safe-area-bottom">
          <Button
            onClick={(e) => createLecture(e as any)}
            disabled={loading || !title.trim()}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl h-12 text-base font-medium"
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
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-2xl text-sm font-medium shadow-lg backdrop-blur-sm animate-slide-down border ${
          toast.type === 'success' ? 'bg-green-500/90 text-white border-green-400/30' : 'bg-red-500/90 text-white border-red-400/30'
        }`}>{toast.message}</div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Lekcije</h1>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowAI(true)}
            className="bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all"
          >
            <Sparkles className="w-4 h-4 mr-1" />AI
          </Button>
          <Button
            size="sm"
            onClick={() => { setShowForm(true); setPreview(false) }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4 mr-1" />Nova
          </Button>
        </div>
      </div>

      {lectures.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nema lekcija</p>
        </div>
      ) : (
        lectures.map((lecture, index) => (
          <div
            key={lecture.id}
            className="animate-stagger-item rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] p-4 flex items-start justify-between hover:-translate-y-[2px] hover:shadow-lg hover:shadow-purple-500/10 hover:border-purple-500/20 transition-all duration-300 group"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div>
              <h3 className="font-semibold text-white group-hover:text-purple-200 transition-colors">{lecture.title}</h3>
              <p className="text-xs text-white/40 mt-1">{lecture.subject} · {lecture.class_number}. razred</p>
            </div>
            <button onClick={() => deleteLecture(lecture.id)} className="text-red-400/60 p-2 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))
      )}
    </div>
  )
}
