/**
 * Creates the [TEST] roster rows and the QA account this run needs, and writes
 * their ids to qa-auth.json so cleanup.mjs can take them out again.
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */
import { writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { CLASS_NUMBER, PASSWORD, ROSTER, SECTION_NUMBER, STATE_FILE, qaEmail } from './config.mjs'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')

const admin = createClient(url, key, { auth: { persistSession: false } })
const runId = process.env.QA_RUN_ID ?? randomUUID().slice(0, 8)
process.env.QA_RUN_ID = runId

const rows = ROSTER.map((r) => ({
  first_name: r.firstName,
  last_name: r.lastName,
  class_number: CLASS_NUMBER,
  section_number: SECTION_NUMBER,
  used: false,
}))

const { data: roster, error: rosterError } = await admin
  .from('verified_students').insert(rows).select('id, first_name, last_name')
if (rosterError) throw rosterError

// The account the signed-in scenarios use. Confirmed up front so it can log in
// with a password straight away.
const email = qaEmail('account')
const { data: created, error: userError } = await admin.auth.admin.createUser({
  email, password: PASSWORD, email_confirm: true,
})
if (userError) throw userError

const { error: profileError } = await admin.from('profiles').insert({
  id: created.user.id,
  first_name: '[TEST] QA',
  last_name: 'Auth',
  email,
  class_number: CLASS_NUMBER,
  section_number: SECTION_NUMBER,
  role: 'student',
})
if (profileError) throw profileError

const state = {
  runId,
  createdAt: new Date().toISOString(),
  account: { id: created.user.id, email, role: 'student' },
  verifiedStudents: roster.map((r) => r.id),
  // Filled in by cleanup.mjs: registrations the run itself creates.
  registeredUsers: [],
}

await writeFile(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`)
console.log(`Seeded run ${runId}: ${email} + ${roster.length} roster rows.`)
console.log(`Export QA_RUN_ID=${runId} before running run.mjs.`)
