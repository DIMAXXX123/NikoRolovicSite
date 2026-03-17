'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Plus, Trash2, X, Bold, Italic, Heading, List, Link2, FunctionSquare,
  ImagePlus, Eye, Edit3, BookOpen, ChevronRight, FlipVertical
} from 'lucide-react'
import type { Lecture } from '@/lib/types'

const SUBJECTS = [
  'Fizika', 'Matematika', 'Hemija', 'Biologija', 'Informatika',
  'Engleski jezik', 'Srpski jezik', 'Historija', 'Geografija',
  'Muzička kultura', 'Likovna kultura', 'Tjelesni odgoj', 'Filozofija', 'Drugo'
]

interface Flashcard {
  question: string
  answer: string
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

  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => { loadLectures() }, [])

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
      setEditorHtml(editorRef.current.innerHTML)
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
    if (url) {
      execCommand('createLink', url)
    }
  }

  function handleFormula() {
    const formula = prompt('Unesi formulu:')
    if (formula && editorRef.current) {
      const html = `<span class="inline-block px-2 py-1 mx-1 rounded bg-blue-500/20 font-mono text-blue-300 text-sm" contenteditable="false">${formula}</span>&nbsp;`
      execCommand('insertHTML', html)
    }
  }

  function handleImageUpload() {
    fileInputRef.current?.click()
  }

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

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function createLecture(e: React.FormEvent) {
    e.preventDefault()
    if (!editorHtml.trim()) { alert('Sadržaj lekcije je obavezan'); return }
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data, error } = await supabase.from('lectures').insert({
      title, subject, content: editorHtml,
      class_number: parseInt(classNumber),
      author_id: user.id,
    }).select().single()

    if (error || !data) {
      alert('Greška pri kreiranju lekcije')
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
    // Append quiz data as a JSON block at the end of lecture content
    const { data: lecture } = await supabase.from('lectures').select('content').eq('id', savedLectureId).single()
    if (lecture) {
      const updatedContent = lecture.content + `\n<!--QUIZ_DATA:${quizJson}:QUIZ_DATA-->`
      await supabase.from('lectures').update({ content: updatedContent }).eq('id', savedLectureId)
    }

    // Reset everything
    resetForm()
    loadLectures()
  }

  function skipQuiz() {
    resetForm()
    loadLectures()
  }

  function resetForm() {
    setTitle(''); setSubject(SUBJECTS[0]); setClassNumber('1')
    setEditorHtml(''); setShowForm(false); setShowQuizStep(false)
    setSavedLectureId(null); setFlashcards([]); setNewQuestion(''); setNewAnswer('')
    setPreview(false); setLoading(false)
    if (editorRef.current) editorRef.current.innerHTML = ''
  }

  async function deleteLecture(id: string) {
    if (!confirm('Obriši ovu lekciju?')) return
    await supabase.from('lectures').delete().eq('id', id)
    loadLectures()
  }

  const selectClass = "flex h-11 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"

  const toolbarBtnClass = "p-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"

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

        {/* Existing flashcards */}
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

        {/* Add new flashcard */}
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

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={saveQuiz}
            disabled={flashcards.length === 0 || loading}
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl"
          >
            {loading ? 'Čuvanje...' : `Sačuvaj (${flashcards.length} kartica)`}
          </Button>
          <Button
            onClick={skipQuiz}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl"
          >
            Preskoči
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Lekcije</h1>
        <Button
          size="sm"
          onClick={() => { setShowForm(!showForm); setPreview(false) }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl"
        >
          {showForm ? <X className="w-4 h-4" /> : <><Plus className="w-4 h-4 mr-1" />Nova</>}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl bg-[#1e293b] border border-blue-500/30 p-4 animate-slide-up">
          <form onSubmit={createLecture} className="space-y-3">
            <div className="space-y-2">
              <Label className="text-slate-200">Naslov</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="rounded-xl bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                placeholder="Naslov lekcije"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-200">Predmet</Label>
                <select value={subject} onChange={(e) => setSubject(e.target.value)} className={selectClass}>
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Razred</Label>
                <select value={classNumber} onChange={(e) => setClassNumber(e.target.value)} className={selectClass}>
                  {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}. razred</option>)}
                </select>
              </div>
            </div>

            {/* Rich Text Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-slate-200">Sadržaj lekcije</Label>
                <button
                  type="button"
                  onClick={() => setPreview(!preview)}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                >
                  {preview ? <Edit3 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {preview ? 'Uredi' : 'Pregled'}
                </button>
              </div>

              {!preview && (
                <>
                  {/* Toolbar - scrollable on mobile */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                    <button type="button" onClick={handleBold} className={toolbarBtnClass} title="Bold">
                      <Bold className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={handleItalic} className={toolbarBtnClass} title="Italic">
                      <Italic className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={handleHeading} className={toolbarBtnClass} title="Naslov">
                      <Heading className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={handleList} className={toolbarBtnClass} title="Lista">
                      <List className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={handleLink} className={toolbarBtnClass} title="Link">
                      <Link2 className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={handleFormula} className={toolbarBtnClass} title="Formula">
                      <FunctionSquare className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={handleImageUpload} className={toolbarBtnClass} title="Slika">
                      <ImagePlus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Editor area */}
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={syncEditor}
                    onBlur={syncEditor}
                    className="min-h-[200px] w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors prose prose-invert prose-sm max-w-none [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-blue-300 [&_h2]:mt-3 [&_h2]:mb-1 [&_a]:text-blue-400 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_img]:rounded-xl [&_img]:my-2"
                    data-placeholder="Piši sadržaj lekcije ovdje..."
                    suppressContentEditableWarning
                  />

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onImageSelected}
                  />
                </>
              )}

              {preview && (
                <div className="min-h-[200px] w-full rounded-xl border border-slate-600 bg-slate-900/50 px-4 py-3 text-sm text-white">
                  {editorHtml ? (
                    <div
                      className="prose prose-invert prose-sm max-w-none [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-blue-300 [&_a]:text-blue-400 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_img]:rounded-xl [&_img]:my-2"
                      dangerouslySetInnerHTML={{ __html: editorHtml }}
                    />
                  ) : (
                    <p className="text-slate-500 italic">Nema sadržaja za pregled</p>
                  )}
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl"
            >
              {loading ? 'Objavljuje se...' : 'Objavi lekciju'}
            </Button>
          </form>
        </div>
      )}

      {lectures.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nema lekcija</p>
        </div>
      ) : (
        lectures.map((lecture) => (
          <div key={lecture.id} className="rounded-xl bg-[#1e293b] border border-slate-700/50 p-4 flex items-start justify-between">
            <div>
              <h3 className="font-medium text-white">{lecture.title}</h3>
              <p className="text-xs text-slate-400">{lecture.subject} · {lecture.class_number}. razred</p>
            </div>
            <button onClick={() => deleteLecture(lecture.id)} className="text-red-400 p-2 hover:text-red-300">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))
      )}
    </div>
  )
}
