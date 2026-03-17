export type UserRole = 'student' | 'moderator' | 'admin' | 'creator'
export type PhotoStatus = 'pending' | 'approved' | 'rejected'

export interface VerifiedStudent {
  id: string
  first_name: string
  last_name: string
  class: number
  section: number
  email: string
  created_at: string
}

export interface Profile {
  id: string
  first_name: string
  last_name: string
  class: number
  section: number
  email: string
  role: UserRole
  avatar_url: string | null
  created_at: string
}

export interface News {
  id: string
  title: string
  content: string
  image_url: string | null
  author_id: string | null
  created_at: string
  updated_at: string
  author?: Profile
  likes_count?: number
  liked_by_user?: boolean
}

export interface NewsLike {
  id: string
  news_id: string
  user_id: string
  created_at: string
}

export interface Event {
  id: string
  title: string
  description: string
  date: string
  end_date: string | null
  location: string
  created_by: string | null
  created_at: string
  creator?: Profile
}

export interface Lecture {
  id: string
  title: string
  subject: string
  content: string
  class: number
  file_url: string | null
  created_by: string | null
  created_at: string
  creator?: Profile
}

export interface Photo {
  id: string
  image_url: string
  caption: string | null
  submitted_by: string
  status: PhotoStatus
  reviewed_by: string | null
  created_at: string
  submitter?: Profile
}
