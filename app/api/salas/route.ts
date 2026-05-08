import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { verificarToken } from '@/lib/auth'

function getUser(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value
  return token ? verificarToken(token) : null
}

export async function GET(req: NextRequest) {
  if (!getUser(req)) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const order = searchParams.get('order') === 'criado_em' ? 'criado_em DESC' : 'nome ASC'
  const salas = await query<any>(`SELECT * FROM salas ORDER BY ${order}`)
  return NextResponse.json(salas)
}

export async function POST(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  try {
    const { nome, localizacao } = await req.json()
    if (!nome?.trim()) return NextResponse.json({ erro: 'Nome obrigatório' }, { status: 400 })

    const existente = await queryOne(
      'SELECT id FROM salas WHERE LOWER(nome) = LOWER($1) AND LOWER(COALESCE(localizacao,\'\')) = LOWER($2)',
      [nome.trim(), (localizacao || '').trim()]
    )
    if (existente) {
      return NextResponse.json({ erro: 'Já existe uma sala com este nome e localização' }, { status: 409 })
    }

    const token_sala = nome.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now()
    const [sala] = await query<any>(
      'INSERT INTO salas (nome, localizacao, qrcode_token) VALUES ($1,$2,$3) RETURNING *',
      [nome.trim(), localizacao?.trim() || null, token_sala]
    )
    return NextResponse.json(sala)
  } catch {
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 })
  }
}
