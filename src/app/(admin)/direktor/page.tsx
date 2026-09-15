import { redirect } from 'next/navigation'

/** The old single Direktor panel was split into /skola and /aplikacija. */
export default function DirektorRedirect() {
  redirect('/skola')
}
