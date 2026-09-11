import { useLocalJson, writeLocalJson } from '@/lib/local-json'

export const LIKED_LECTURES_KEY = 'lecture_likes'

const NO_LIKES: Record<string, boolean> = {}

/** Lecture likes are per-device only — they live in localStorage, not in the DB. */
export function useLikedLectures(): Record<string, boolean> {
  return useLocalJson(LIKED_LECTURES_KEY, NO_LIKES)
}

export function setLectureLiked(current: Record<string, boolean>, lectureId: string, liked: boolean) {
  const next = { ...current }
  if (liked) next[lectureId] = true
  else delete next[lectureId]
  writeLocalJson(LIKED_LECTURES_KEY, next)
}
