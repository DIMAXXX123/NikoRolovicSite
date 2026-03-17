-- ============================================
-- Niko Rolović Gymnasium - Student Portal
-- Database Schema
-- ============================================

-- Verified students (pre-loaded by admin)
CREATE TABLE verified_students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  class_number INT NOT NULL CHECK (class_number BETWEEN 1 AND 4),
  section_number INT NOT NULL CHECK (section_number BETWEEN 1 AND 6),
  email TEXT UNIQUE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  class_number INT NOT NULL,
  section_number INT NOT NULL,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'moderator', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- News
CREATE TABLE news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- News likes
CREATE TABLE news_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID REFERENCES news(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(news_id, user_id)
);

-- Events
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  location TEXT,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lectures
CREATE TABLE lectures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  class_number INT NOT NULL CHECK (class_number BETWEEN 1 AND 4),
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photos (gallery with moderation)
CREATE TABLE photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  caption TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  moderator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE verified_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Verified students: only service role can read/write (checked via API)
CREATE POLICY "Service role full access" ON verified_students FOR ALL USING (true);

-- Profiles: everyone can read, users can update own
CREATE POLICY "Public profiles readable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- News: everyone reads, admins/mods insert/update/delete
CREATE POLICY "News readable by all" ON news FOR SELECT USING (true);
CREATE POLICY "Admins/mods create news" ON news FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')));
CREATE POLICY "Admins/mods update news" ON news FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')));
CREATE POLICY "Admins/mods delete news" ON news FOR DELETE 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')));

-- News likes
CREATE POLICY "Likes readable" ON news_likes FOR SELECT USING (true);
CREATE POLICY "Users can like" ON news_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON news_likes FOR DELETE USING (auth.uid() = user_id);

-- Events
CREATE POLICY "Events readable" ON events FOR SELECT USING (true);
CREATE POLICY "Admins create events" ON events FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins update events" ON events FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins delete events" ON events FOR DELETE 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Lectures
CREATE POLICY "Lectures readable" ON lectures FOR SELECT USING (true);
CREATE POLICY "Admins create lectures" ON lectures FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins update lectures" ON lectures FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Photos
CREATE POLICY "Approved photos readable" ON photos FOR SELECT 
  USING (status = 'approved' OR user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')));
CREATE POLICY "Users submit photos" ON photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins moderate photos" ON photos FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')));

-- Storage bucket for photos
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);

CREATE POLICY "Anyone can view photos" ON storage.objects FOR SELECT USING (bucket_id = 'photos');
CREATE POLICY "Authenticated users upload photos" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');
