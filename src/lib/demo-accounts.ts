/**
 * DEMO MODE — three shared accounts, one per experience. Every visitor is signed
 * into one of them automatically (default: učenik) and can switch on the Još
 * screen. All three are "Dmitrij Ivashchenko"; only the role differs.
 */
export type DemoRole = 'ucenik' | 'nastavnik' | 'direktor'

export const DEMO_ROLE_KEY = 'demo_role'
export const DEMO_PASSWORD = 'Demo-Eo4mqBPYkd8aW8z6TbLOr2Fw'

export const DEMO_ACCOUNTS: Record<DemoRole, { email: string; label: string; home: string; color: string; description: string }> = {
  ucenik: { email: 'demo-ucenik@nikorolovic.app', label: 'Učenik', home: '/lectures', color: '#1CB0F6', description: 'Lekcije, domaći, ocjene, kviz' },
  nastavnik: { email: 'demo-nastavnik@nikorolovic.app', label: 'Profesor', home: '/nastavnik', color: '#58CC02', description: 'Moje lekcije, razredi, domaći' },
  direktor: { email: 'demo-admin@nikorolovic.app', label: 'Direktor', home: '/direktor', color: '#FFC800', description: 'Pregled škole, analitika, AI' },
}

export function readDemoRole(): DemoRole {
  if (typeof window === 'undefined') return 'ucenik'
  try {
    const v = localStorage.getItem(DEMO_ROLE_KEY)
    return v === 'nastavnik' || v === 'direktor' ? v : 'ucenik'
  } catch {
    return 'ucenik'
  }
}

export function roleFromEmail(email: string | null | undefined): DemoRole | null {
  if (!email) return null
  const hit = (Object.keys(DEMO_ACCOUNTS) as DemoRole[]).find((k) => DEMO_ACCOUNTS[k].email === email)
  return hit ?? null
}
