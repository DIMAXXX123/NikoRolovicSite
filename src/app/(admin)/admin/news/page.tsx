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

  async function deleteNews(id: string) {
    if (!confirm('Obriši ovu novost?')) return
    await supabase.from('news').delete().eq('id', id)
    loadNews()
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Novosti</h1>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4 mr-1" />}
          {showForm ? '' : 'Nova'}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl bg-[#1e293b] border border-blue-500/30 p-4 animate-slide-up">
          <form onSubmit={createNews} className="space-y-3">
            <div className="space-y-2">
              <Label className="text-slate-200">Naslov</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="rounded-xl bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Sadržaj</Label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={4}
                className="flex min-h-[100px] w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Slika (opciono)</Label>
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
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-24 rounded-xl border-2 border-dashed border-slate-600 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-blue-500 transition-colors"
                >
                  <ImagePlus className="w-6 h-6" />
                  <span className="text-xs">Izaberi sliku</span>
                </button>
              )}
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl"
            >
              {loading ? 'Objavljuje se...' : 'Objavi'}
            </Button>
          </form>
        </div>
      )}

      {news.map((item) => (
        <div key={item.id} className="rounded-xl bg-[#1e293b] border border-slate-700/50 p-4 flex items-start justify-between">
          <div>
            <h3 className="font-medium text-white">{item.title}</h3>
            <p className="text-sm text-slate-400 line-clamp-2">{item.content}</p>
            <p className="text-xs text-slate-500 mt-1">
              {new Date(item.created_at).toLocaleDateString('sr-Latn')}
            </p>
          </div>
          <button onClick={() => deleteNews(item.id)} className="text-red-400 p-2 hover:text-red-300">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
