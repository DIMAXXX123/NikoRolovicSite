import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ydcbxqrnmnbceyzqgbui.supabase.co'

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SERVICE_KEY) {
  console.error('❌ Нужен ключ! Запусти так:')
  console.error('   SUPABASE_SERVICE_ROLE_KEY="твой_ключ" node create-test-user.mjs')
  console.error('')
  console.error('Ключ найти: Supabase Dashboard → Settings → API → service_role')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const TEST_EMAIL = 'test@nikorolovic.me'
const TEST_PASSWORD = 'test123456'
const TEST_FIRST = 'Test'
const TEST_LAST = 'User'
const TEST_CLASS = 1
const TEST_SECTION = 1

async function main() {
  console.log('🔧 Создаю тестового юзера...\n')

  // 1. Add to verified_students (so registration check passes if needed later)
  const { error: vsErr } = await supabase
    .from('verified_students')
    .upsert({
      first_name: TEST_FIRST,
      last_name: TEST_LAST,
      class_number: TEST_CLASS,
      section_number: TEST_SECTION,
      used: true,
    }, { onConflict: 'first_name,last_name,class_number,section_number' })

  if (vsErr) {
    console.log('⚠️  verified_students insert (ok if already exists):', vsErr.message)
  }

  // 2. Check if auth user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existing = existingUsers?.users?.find(u => u.email === TEST_EMAIL)

  let userId
  if (existing) {
    console.log('ℹ️  Юзер уже существует, обновляю пароль...')
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: TEST_PASSWORD,
      email_confirm: true,
    })
    if (error) {
      console.error('❌ Ошибка обновления:', error.message)
      process.exit(1)
    }
    userId = existing.id
  } else {
    // 3. Create auth user
    const { data, error } = await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: {
        first_name: TEST_FIRST,
        last_name: TEST_LAST,
        class_number: TEST_CLASS,
        section_number: TEST_SECTION,
      },
    })
    if (error) {
      console.error('❌ Ошибка создания юзера:', error.message)
      process.exit(1)
    }
    userId = data.user.id
  }

  // 4. Upsert profile
  const { error: profErr } = await supabase.from('profiles').upsert({
    id: userId,
    first_name: TEST_FIRST,
    last_name: TEST_LAST,
    email: TEST_EMAIL,
    class_number: TEST_CLASS,
    section_number: TEST_SECTION,
    role: 'student',
  }, { onConflict: 'id' })

  if (profErr) {
    console.error('❌ Ошибка профиля:', profErr.message)
    process.exit(1)
  }

  console.log('✅ Готово!\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`   📧 Email:    ${TEST_EMAIL}`)
  console.log(`   🔑 Пароль:   ${TEST_PASSWORD}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\nМожно заходить!\n')
}

main()
