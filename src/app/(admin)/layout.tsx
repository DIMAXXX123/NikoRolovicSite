import { redirect } from 'next/navigation'
import { getCallerProfile, hasRole, STAFF_ROLES } from '@/lib/api-auth'
import { AdminHeader } from './admin-header'

/**
 * Server-side gate for the whole admin area. The role check used to run in a
 * client effect, so the admin screens rendered for everyone for a moment
 * before the redirect fired. Now nothing is sent to the browser unless the
 * session really belongs to a moderator/admin/creator.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // A misconfigured server (no service role key) must not open the panel.
  const profile = await getCallerProfile().catch(() => null)

  if (!profile) redirect('/login')
  if (!hasRole(profile, STAFF_ROLES)) redirect('/news')

  return (
    <div className="min-h-screen bg-[#050508]">
      <div className="max-w-md mx-auto px-4 pt-4 pb-8">
        <AdminHeader />
        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  )
}
