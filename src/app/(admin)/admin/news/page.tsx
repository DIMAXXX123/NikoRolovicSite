'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, X, ImagePlus } from 'lucide-react'
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

  useEffect(() => { loadNews() }, [])

  async function loadNews() {
    const { data } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setNews(data)
  }

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
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-2xl text-sm font-medium shadow-lg backdrop-blur-sm animate-slide-down border ${
          toast.type === 'success'
            ? 'bg-green-500/90 text-white border-green-400/30'
            : 'bg-red-500/90 text-white border-red-400/30'
        }`}>
          {toast.message}
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Novosti</h1>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4 mr-1" />}
          {showForm ? '' : 'Nova'}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-purple-500/20 p-5 animate-slide-up">
          <form onSubmit={createNews} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white/70 text-sm">Naslov</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="rounded-xl bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 focus:border-purple-500 focus:ring-purple-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70 text-sm">Sadržaj</Label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={4}
                className="flex min-h-[100px] w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/20 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70 text-sm">Slika (opciono)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-xl" />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null) }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/10"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-24 rounded-xl border-2 border-dashed border-white/[0.08] flex flex-col items-center justify-center gap-1 text-white/30 hover:border-purple-500/40 hover:text-purple-400 transition-colors"
                >
                  <ImagePlus className="w-6 h-6" />
                  <span className="text-xs">Izaberi sliku</span>
                </button>
              )}
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white rounded-xl shadow-lg shadow-purple-500/20"
            >
              {loading ? 'Objavljuje se...' : 'Objavi'}
            </Button>
          </form>
        </div>
      )}

      {news.map((item, index) => (
        <div
          key={item.id}
          className="animate-stagger-item rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] p-4 flex items-start justify-between hover:-translate-y-[2px] hover:shadow-lg hover:shadow-purple-500/10 hover:border-purple-500/20 transition-all duration-300 group"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-white group-hover:text-purple-200 transition-colors">{item.title}</h3>
            <p className="text-sm text-white/40 line-clamp-2 mt-1">{item.content}</p>
            <p className="text-xs text-white/20 mt-2">
              {new Date(item.created_at).toLocaleDateString('sr-Latn')}
            </p>
          </div>
          <button onClick={() => deleteNews(item.id)} className="text-red-400/60 p-2 hover:text-red-400 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
