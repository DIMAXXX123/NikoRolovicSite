/**
 * Removes everything the QA run put into the shared production database:
 * the seeded roster rows, the QA account, and any account the registration
 * scenarios created (they all use qa-auth-<runId>-*@example.com).
 *
 * Never touches a row it did not create.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'
import { STATE_FILE } from './config.mjs'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')

const admin = createClient(url, key, { auth: { persistSession: false } })
const state = JSON.parse(await readFile(STATE_FILE, 'utf8'))

const prefix = `qa-auth-${state.runId}-`
const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 })
const mine = (users?.users ?? []).filter((u) => u.email?.startsWith(prefix))

for (const user of mine) {
  await admin.from('profiles').delete().eq('id', user.id)
  await admin.auth.admin.deleteUser(user.id)
  console.log(`removed account ${user.email}`)
}

if (state.verifiedStudents?.length) {
  const { error } = await admin.from('verified_students').delete().in('id', state.verifiedStudents)
  if (error) throw error
  console.log(`removed ${state.verifiedStudents.length} roster rows`)
}

await writeFile(STATE_FILE, `${JSON.stringify({ ...state, cleanedAt: new Date().toISOString(), account: null, verifiedStudents: [] }, null, 2)}\n`)
console.log('cleanup done')
