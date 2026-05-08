import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verificarToken } from '@/lib/auth'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get('auth-token')?.value
  if (!token || !verificarToken(token)) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params
  if (!id) return NextResponse.json({ erro: 'ID obrigatorio' }, { status: 400 })

  await query('DELETE FROM usuarios WHERE id = $1', [id])
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get('auth-token')?.value
  if (!token || !verificarToken(token)) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()

  if (typeof body.ativo === 'boolean') {
    await query('UPDATE usuarios SET ativo = $1 WHERE id = $2', [body.ativo, id])
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ erro: 'Nada a atualizar' }, { status: 400 })
}
