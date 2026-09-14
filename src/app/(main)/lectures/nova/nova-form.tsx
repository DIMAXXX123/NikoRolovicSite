'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Camera, ChevronLeft, ImagePlus, Loader2, Sparkles, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DEFAULT_SUBJECTS, OPTIONAL_SUBJECTS } from '../subjects'
import { SubjectIcon } from '../subject-icon'

const MAX_PHOTOS = 8
const MAX_SIDE = 1600

type Length = 'kratka' | 'srednja' | 'detaljna'

const CHIP = 'h-11 px-4 rounded-xl border-2 text-[12px] font-extrabold uppercase tracking-[0.04em] flex items-center justify-center gap-2 transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
const CHIP_ON = 'border-secondary-light-border bg-secondary-light text-secondary shadow-[0_2px_0_var(--color-secondary-light-border)]'
const CHIP_OFF = 'border-border bg-card text-muted-foreground shadow-[0_2px_0_var(--color-border)]'

/** Downscale a photo in the browser so uploads stay small and fast. */
async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  return await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b ?? file), 'image/jpeg', 0.85))
}

export function NovaLekcijaForm({ userId, defaultClass }: { userId: string | null; defaultClass: number | null }) {
  const router = useRouter()
  const params = useSearchParams()
  const supabase = useMemo(() => createClient(), [])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const subjects = useMemo(() => [...DEFAULT_SUBJECTS, ...OPTIONAL_SUBJECTS], [])
  const [subject, setSubject] = useState(() => {
    const q = params.get('subject')
    return q && subjects.some((s) => s.name === q) ? q : DEFAULT_SUBJECTS[0].name
  })
  const [classNumber, setClassNumber] = useState<number>(defaultClass && defaultClass >= 1 && defaultClass <= 4 ? defaultClass : 2)
  const [topic, setTopic] = useState('')
  const [notes, setNotes] = useState('')
  const [length, setLength] = useState<Length>('srednja')
  const [wantQuiz, setWantQuiz] = useState(true)
  const [wantFlashcards, setWantFlashcards] = useState(true)
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p.url)), [photos])

  function addFiles(list: FileList | null) {
    if (!list) return
    const incoming = Array.from(list).filter((f) => f.type.startsWith('image/'))
    setPhotos((prev) => [...prev, ...incoming.map((file) => ({ file, url: URL.createObjectURL(file) }))].slice(0, MAX_PHOTOS))
    setError(null)
  }

  function removePhoto(i: number) {
    setPhotos((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function submit() {
    if (submitting) return
    if (photos.length === 0) {
      setError('Dodaj bar jednu fotografiju udžbenika ili table.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const jobId = crypto.randomUUID()
      const paths: string[] = []
      for (let i = 0; i < photos.length; i++) {
        const blob = await compressImage(photos[i].file)
        const path = `jobs/${jobId}/slika-${i + 1}.jpg`
        const { error: upErr } = await supabase.storage.from('lecture-photos').upload(path, blob, { contentType: 'image/jpeg' })
        if (upErr) throw new Error(`Slika ${i + 1}: ${upErr.message}`)
        paths.push(`lecture-photos/${path}`)
      }
      const { error: insErr } = await supabase.from('lecture_jobs').insert({
        id: jobId,
        user_id: userId,
        subject,
        class_number: classNumber,
        topic: topic.trim() || null,
        notes: notes.trim() || null,
        length,
        want_quiz: wantQuiz,
        want_flashcards: wantFlashcards,
        photo_paths: paths,
      })
      if (insErr) throw new Error(insErr.message)
      router.push(`/lectures/nova/${jobId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Slanje nije uspjelo. Pokušaj ponovo.')
      setSubmitting(false)
    }
  }

  const selected = subjects.find((s) => s.name === subject)

  return (
    <div className="space-y-5 animate-fade-in pb-4">
      <Link
        href="/lectures"
        className="inline-flex items-center gap-1 h-11 text-[13px] font-extrabold uppercase tracking-[0.04em] text-secondary w-fit hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-lg"
      >
        <ChevronLeft className="w-5 h-5" strokeWidth={2.6} /> Lekcije
      </Link>

      <div>
        <h1 className="text-[26px] font-extrabold leading-[1.2] tracking-[-0.01em] text-heading flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary-text" strokeWidth={2.6} /> Nova lekcija
        </h1>
        <p className="text-[13px] font-bold text-muted-foreground mt-1">Slikaj stranicu udžbenika ili tablu — AI napiše lekciju sa kvizom i karticama za par minuta.</p>
      </div>

      {/* Photos */}
      <Card className="space-y-3">
        <p className="text-[12px] leading-none text-muted-foreground font-extrabold uppercase tracking-[0.04em]">Fotografije · {photos.length}/{MAX_PHOTOS}</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          className="hidden"
          onChange={(e) => { addFiles(e.target.files); e.target.value = '' }}
        />
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p, i) => (
              <div key={p.url} className="relative aspect-square rounded-xl overflow-hidden border-2 border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={`Slika ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  aria-label={`Ukloni sliku ${i + 1}`}
                  className="absolute top-1 right-1 w-11 h-11 rounded-full bg-card border-2 border-border flex items-center justify-center text-foreground shadow-[0_2px_0_var(--color-border)] active:translate-y-[2px] active:shadow-none"
                >
                  <X className="w-4 h-4" strokeWidth={2.8} />
                </button>
              </div>
            ))}
          </div>
        )}
        {photos.length < MAX_PHOTOS && (
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
              <Camera className="w-5 h-5" strokeWidth={2.6} /> Slikaj
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const input = fileInputRef.current
                if (!input) return
                input.removeAttribute('capture')
                input.click()
                input.setAttribute('capture', 'environment')
              }}
            >
              <ImagePlus className="w-5 h-5" strokeWidth={2.6} /> Iz galerije
            </Button>
          </div>
        )}
      </Card>

      {/* Subject + class */}
      <Card className="space-y-4">
        <div>
          <Label htmlFor="nova-subject">Predmet</Label>
          <div className="flex items-center gap-3 mt-1.5">
            {selected && <SubjectIcon name={selected.name} emoji={selected.emoji} size="sm" />}
            <select
              id="nova-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1 h-[50px] rounded-2xl border-2 border-border bg-muted px-4 text-[15px] font-bold text-foreground focus:border-secondary focus:bg-card focus:outline-none"
            >
              {subjects.map((s) => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <Label>Razred</Label>
          <div className="grid grid-cols-4 gap-2 mt-1.5">
            {[1, 2, 3, 4].map((n) => (
              <button key={n} type="button" onClick={() => setClassNumber(n)} className={`${CHIP} ${classNumber === n ? CHIP_ON : CHIP_OFF}`} aria-pressed={classNumber === n}>
                {n}.
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label htmlFor="nova-topic">Tema (opciono)</Label>
          <Input id="nova-topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="npr. Njutnovi zakoni" className="mt-1.5" maxLength={120} />
        </div>
        <div>
          <Label htmlFor="nova-notes">Napomene (opciono)</Label>
          <Textarea id="nova-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Šta da naglasi, koji dio da preskoči, nivo težine…" className="mt-1.5 min-h-[96px]" maxLength={600} />
        </div>
      </Card>

      {/* Options */}
      <Card className="space-y-4">
        <div>
          <Label>Dužina</Label>
          <div className="grid grid-cols-3 gap-2 mt-1.5">
            {([['kratka', 'Kratka'], ['srednja', 'Srednja'], ['detaljna', 'Detaljna']] as [Length, string][]).map(([v, label]) => (
              <button key={v} type="button" onClick={() => setLength(v)} className={`${CHIP} ${length === v ? CHIP_ON : CHIP_OFF}`} aria-pressed={length === v}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setWantQuiz(!wantQuiz)} className={`${CHIP} ${wantQuiz ? CHIP_ON : CHIP_OFF}`} aria-pressed={wantQuiz}>
            Kviz
          </button>
          <button type="button" onClick={() => setWantFlashcards(!wantFlashcards)} className={`${CHIP} ${wantFlashcards ? CHIP_ON : CHIP_OFF}`} aria-pressed={wantFlashcards}>
            Kartice
          </button>
        </div>
      </Card>

      {error && (
        <p role="alert" className="rounded-2xl border-2 border-[#FFB3B5] bg-[#FFDFE0] px-4 py-3 text-[13px] font-extrabold text-[#EA2B2B]">
          {error}
        </p>
      )}

      <Button type="button" className="w-full" size="lg" onClick={submit} disabled={submitting || photos.length === 0}>
        {submitting ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.6} /> : <Sparkles className="w-5 h-5" strokeWidth={2.6} />}
        {submitting ? 'Šaljem…' : 'Napravi lekciju'}
      </Button>
      <p className="text-center text-[13px] font-bold text-muted-foreground">Generisanje traje 1–3 minuta. Lekcija se pojavljuje svima u predmetu.</p>
    </div>
  )
}
