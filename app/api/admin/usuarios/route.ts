import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Requer SUPABASE_SERVICE_ROLE_KEY no .env.local para criar usuários via Admin API
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { nome, email, senha, nivel } = await req.json()

    if (!nome || !email || !senha || !nivel) {
      return NextResponse.json({ erro: 'Campos obrigatorios faltando' }, { status: 400 })
    }

    // Criar usuário via Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email + '@as-engenharia.com',
      password: senha,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ erro: authError.message }, { status: 400 })
    }

    // Inserir perfil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({ id: authData.user.id, nome, nivel })

    if (profileError) {
      return NextResponse.json({ erro: profileError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 })
  }
}
