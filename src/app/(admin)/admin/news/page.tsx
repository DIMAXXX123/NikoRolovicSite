'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, X, ImagePlus, Newspaper } from 'lucide-react'
import type { NewsItem } from '@/lib/types'

export default function AdminNewsPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  async function loadNews() {
    const { data } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setNews(data)
  }

  useEffect(() => {
    async function init() { await loadNews() }
    init()
  }, [])

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  async function createNews(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let imageUrl: string | null = null

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `news-${user.id}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, imageFile)

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(fileName)
        imageUrl = publicUrl
      }
    }

    await supabase.from('news').insert({
      title,
      content,
      image_url: imageUrl,
      author_id: user.id,
    })

    setTitle(''); setContent(''); setImageFile(null); setImagePreview(null)
    setShowForm(false); setLoading(false); loadNews()
  }

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // NOTE: Delete requires RLS policy "Admins/mods delete news" (role IN ('admin', 'moderator'))
  async function deleteNews(id: string) {
    if (!confirm('Obriši ovu novost?')) return
    const { data, error } = await supabase.from('news').delete().eq('id', id).select()
    if (error) {
      console.error('Delete news error:', error)
      showToast(`Greška pri brisanju: ${error.message}`, 'error')
      return
    }
    if (!data || data.length === 0) {
      console.error('Delete news: no rows deleted, check RLS policies')
      showToast('Greška: nema dozvole za brisanje (RLS)', 'error')
      return
    }
    showToast('Obrisano!')
    loadNews()
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-3 rounded-2xl text-[13px] font-extrabold bg-card border-2 animate-slide-down ${
          toast.type === 'success'
            ? 'text-primary-text border-primary-light-border shadow-[0_2px_0_var(--color-primary-light-border)]'
            : 'text-[#EA2B2B] border-[#FFB3B5] shadow-[0_2px_0_#FFB3B5]'
        }`}>
          {toast.message}
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-[26px] leading-[1.2] tracking-[-0.01em] font-extrabold text-heading">Novosti</h1>
        <Button
          size={showForm ? 'icon' : 'default'}
          variant={showForm ? 'outline' : 'default'}
          aria-label={showForm ? 'Zatvori' : undefined}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <X strokeWidth={2.6} /> : <><Plus strokeWidth={2.6} />Nova</>}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-2xl bg-card border-2 border-border shadow-[0_2px_0_var(--color-border)] p-4 animate-slide-up">
          <form onSubmit={createNews} className="space-y-4">
            <div>
              <Label>Naslov</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Sadržaj</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={4}
              />
            </div>
            <div>
              <Label>Slika (opciono)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-xl border-2 border-border" />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null) }}
                    className="absolute top-2 right-2 w-11 h-11 rounded-xl bg-background border-2 border-border shadow-[0_2px_0_var(--color-border)] flex items-center justify-center text-foreground active:translate-y-[2px] active:shadow-none"
                  >
                    <X className="w-5 h-5" strokeWidth={2.6} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-24 rounded-2xl border-2 border-dashed border-border bg-muted flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-secondary hover:text-secondary transition-colors"
                >
                  <ImagePlus className="w-6 h-6" strokeWidth={2.4} />
                  <span className="text-[12px] font-extrabold uppercase tracking-[0.04em]">Izaberi sliku</span>
                </button>
              )}
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Objavljuje se...' : 'Objavi'}
            </Button>
          </form>
        </div>
      )}

      {news.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
            <Newspaper className="w-8 h-8 text-disabled" strokeWidth={2.4} />
          </div>
          <p className="text-[17px] font-extrabold text-foreground">Nema novosti</p>
          <p className="text-[13px] font-bold text-muted-foreground mt-1">Dodaj prvu novost dugmetom „Nova“.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {news.map((item, index) => (
            <div
              key={item.id}
              className="animate-stagger-item rounded-2xl bg-card border-2 border-border shadow-[0_2px_0_var(--color-border)] p-4 flex items-start justify-between gap-3"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="min-w-0 flex-1">
                <h3 className="text-[17px] leading-[1.3] font-extrabold text-heading">{item.title}</h3>
                <p className="text-[15px] font-bold text-foreground line-clamp-2 mt-1">{item.content}</p>
                <p className="text-[13px] font-bold text-muted-foreground mt-2">
                  {new Date(item.created_at).toLocaleDateString('sr-Latn')}
                </p>
              </div>
              <button
                type="button"
                aria-label="Obriši"
                onClick={() => deleteNews(item.id)}
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
