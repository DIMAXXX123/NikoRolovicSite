// DB CHECK constraint should include: 'student', 'moderator', 'admin', 'creator'
// ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
// ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('student', 'moderator', 'admin', 'creator'));
export type UserRole = 'student' | 'moderator' | 'admin' | 'creator'

export interface Profile {
  id: string
  first_name: string
  last_name: string
  email: string
  class_number: number
  section_number: number
  role: UserRole
  avatar_url: string | null
  created_at: string
}

export interface NewsItem {
  id: string
  title: string
  content: string
  image_url: string | null
  author_id: string | null
  created_at: string
  updated_at: string
  author?: Profile
  likes_count?: number
  user_liked?: boolean
}

export type EventType = 'test' | 'ispit' | 'dogadjaj' | 'drugo' | 'domaci' | 'pismeni'

export interface Event {
  id: string
  title: string
  description: string | null
  event_date: string
  event_time: string | null
  location: string | null
  event_type?: EventType | null
  author_id: string | null
  created_at: string
}

export interface Lecture {
  id: string
  title: string
  subject: string
  content: string
  class_number: number
  video_url?: string | null
  author_id: string | null
  created_at: string
  updated_at: string
}

export interface Photo {
  id: string
  image_url: string
  caption: string | null
  user_id: string
  status: 'pending' | 'approved' | 'rejected'
  moderator_id: string | null
  created_at: string
  user?: Profile
}
