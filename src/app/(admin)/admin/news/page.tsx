'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, X } from 'lucide-react'
import type { NewsItem } from '@/lib/types'

export default function AdminNewsPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadNews()
  }, [])

  async function loadNews() {
    const { data } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setNews(data)
  }

  async function createNews(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('news').insert({
      title,
      content,
      image_url: imageUrl || null,
      author_id: user.id,
    })

    setTitle('')
    setContent('')
    setImageUrl('')
    setShowForm(false)
    setLoading(false)
    loadNews()
  }

  async function deleteNews(id: string) {
    if (!confirm('Obriši ovu novost?')) return
    await supabase.from('news').delete().eq('id', id)
    loadNews()
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold gradient-text">Novosti</h1>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-purple-600 to-violet-700 rounded-xl"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4 mr-1" />}
          {showForm ? '' : 'Nova'}
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30 bg-card/50 animate-slide-up">
          <CardContent className="p-4">
            <form onSubmit={createNews} className="space-y-3">
              <div className="space-y-2">
                <Label>Naslov</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label>Sadržaj</Label>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} required rows={4} className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label>URL slike (opciono)</Label>
                <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="bg-background/50" placeholder="https://..." />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-violet-700">
                {loading ? 'Objavljuje se...' : 'Objavi'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {news.map((item) => (
        <Card key={item.id} className="border-border/30 bg-card/50">
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <h3 className="font-medium">{item.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{item.content}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(item.created_at).toLocaleDateString('sr-Latn')}
              </p>
            </div>
            <button onClick={() => deleteNews(item.id)} className="text-destructive p-2">
              <Trash2 className="w-4 h-4" />
            </button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
