import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { verificarToken } from '@/lib/auth'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get('auth-token')?.value
  if (!token || !verificarToken(token)) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }
  try {
    const { id } = await params
    const row = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM chamados WHERE sala_id = $1', [id]
    )
    const count = parseInt(row?.count || '0', 10)
    if (count > 0) {
      return NextResponse.json({
        erro: `Não é possível excluir esta sala. Existem ${count} chamado${count > 1 ? 's' : ''} vinculado${count > 1 ? 's' : ''} a ela.`
      }, { status: 409 })
    }
    await query('DELETE FROM salas WHERE id = $1', [id])
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 })
  }
}
