import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { verificarToken, hashSenha } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value
  if (!token || !verificarToken(token)) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { nome, email, senha, nivel } = await req.json()

    if (!nome || !email || !senha || !nivel) {
      return NextResponse.json({ erro: 'Campos obrigatorios faltando' }, { status: 400 })
    }

    const emailCompleto = email + '@' + (process.env.NEXT_PUBLIC_EMAIL_DOMAIN || 'almeidasantos.com')

    const existente = await queryOne<{ id: string }>('SELECT id FROM usuarios WHERE email = $1', [emailCompleto])
    if (existente) {
      return NextResponse.json({ erro: 'Email já cadastrado' }, { status: 400 })
    }

    const senhaHash = await hashSenha(senha)
    await query(
      `INSERT INTO usuarios (nome, email, senha_hash, nivel, ativo) VALUES ($1,$2,$3,$4,true)`,
      [nome, emailCompleto, senhaHash, nivel]
    )

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 })
  }
}
