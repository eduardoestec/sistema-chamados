import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { verificarSenha, gerarToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { usuario, senha } = await req.json()
    if (!usuario || !senha) {
      return NextResponse.json({ erro: 'Campos obrigatórios' }, { status: 400 })
    }

    const dominio = process.env.NEXT_PUBLIC_EMAIL_DOMAIN || 'almeidasantos.com'
    const email = usuario.includes('@') ? usuario : `${usuario}@${dominio}`

    const user = await queryOne<{
      id: string; email: string; senha_hash: string
      nome: string; nivel: string; ativo: boolean
    }>('SELECT * FROM usuarios WHERE email = $1', [email])

    if (!user || !user.ativo) {
      return NextResponse.json({ erro: 'Usuário ou senha incorretos' }, { status: 401 })
    }

    const ok = await verificarSenha(senha, user.senha_hash)
    if (!ok) {
      return NextResponse.json({ erro: 'Usuário ou senha incorretos' }, { status: 401 })
    }

    const token = gerarToken({ id: user.id, nivel: user.nivel, nome: user.nome })

    const res = NextResponse.json({ ok: true, nome: user.nome, nivel: user.nivel, id: user.id })
    res.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60,
      path: '/',
    })
    return res
  } catch {
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 })
  }
}
