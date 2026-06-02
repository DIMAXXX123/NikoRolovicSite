// Creates a test user using only fetch — no npm dependencies needed.
// Usage: SUPABASE_SERVICE_ROLE_KEY="your_key" node create-test-user.mjs

const SUPABASE_URL = 'https://ydcbxqrnmnbceyzqgbui.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_KEY) {
  console.error('\n❌ Нужен service_role ключ!\n')
  console.error('Запусти так:')
  console.error('  SUPABASE_SERVICE_ROLE_KEY="tvoj_kljuc" node create-test-user.mjs\n')
  console.error('Где найти ключ:')
  console.error('  Supabase Dashboard → Settings → API → service_role (secret)\n')
  process.exit(1)
}

const TEST_EMAIL = 'test@nikorolovic.me'
const TEST_PASSWORD = 'test123456'
const TEST_FIRST = 'Test'
const TEST_LAST = 'User'

const headers = {
  'Content-Type': 'application/json',
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
}

async function main() {
  console.log('\n🔧 Создаю тестового юзера...\n')

  // 1. Try to create auth user
  let userId

  // Check if user exists by listing users
  const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=50`, {
    headers,
  })

  if (listRes.ok) {
    const listData = await listRes.json()
    const existing = listData.users?.find(u => u.email === TEST_EMAIL)
    if (existing) {
      console.log('ℹ️  Юзер уже есть, обновляю пароль...')
      const upRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${existing.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ password: TEST_PASSWORD, email_confirm: true }),
      })
      if (!upRes.ok) {
        const err = await upRes.text()
        console.error('❌ Ошибка обновления:', err)
        process.exit(1)
      }
      userId = existing.id
    }
  }

  if (!userId) {
    // Create new user
    const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: {
          first_name: TEST_FIRST,
          last_name: TEST_LAST,
          class_number: 1,
          section_number: 1,
        },
      }),
    })

    if (!createRes.ok) {
      const err = await createRes.text()
      console.error('❌ Ошибка создания юзера:', err)
      process.exit(1)
    }

    const userData = await createRes.json()
    userId = userData.id
    console.log('✅ Auth юзер создан')
  }

  // 2. Upsert profile via REST API
  const profRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      ...headers,
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      id: userId,
      first_name: TEST_FIRST,
      last_name: TEST_LAST,
      email: TEST_EMAIL,
      class_number: 1,
      section_number: 1,
      role: 'student',
    }),
  })

  if (!profRes.ok) {
    const err = await profRes.text()
    console.error('❌ Ошибка профиля:', err)
    process.exit(1)
  }

  console.log('✅ Профиль создан')

  // 3. Also add to verified_students so the account looks legitimate
  await fetch(`${SUPABASE_URL}/rest/v1/verified_students`, {
    method: 'POST',
    headers: {
      ...headers,
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      first_name: TEST_FIRST,
      last_name: TEST_LAST,
      class_number: 1,
      section_number: 1,
      used: true,
    }),
  })

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`   📧 Email:    ${TEST_EMAIL}`)
  console.log(`   🔑 Пароль:   ${TEST_PASSWORD}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\nГотово! Можно заходить на сайт.\n')
}

main().catch(err => {
  console.error('❌ Ошибка:', err.message)
  process.exit(1)
})
