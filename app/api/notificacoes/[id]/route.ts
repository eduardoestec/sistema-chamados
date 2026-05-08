import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verificarToken } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get('auth-token')?.value
  if (!token || !verificarToken(token)) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }
  const { id } = await params
  await query('UPDATE notificacoes SET lido = true WHERE id = $1', [id])
  return NextResponse.json({ ok: true })
}
