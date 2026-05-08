import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { verificarToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value
  if (!token || !verificarToken(token)) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const countOnly = searchParams.get('count') === 'true'
  const unreadOnly = searchParams.get('unread') === 'true'

  if (countOnly && unreadOnly) {
    const row = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM notificacoes WHERE lido = false AND destinatario_nivel = 'gestor'"
    )
    return NextResponse.json({ count: parseInt(row?.count || '0', 10) })
  }

  const sql = unreadOnly
    ? "SELECT * FROM notificacoes WHERE destinatario_nivel = 'gestor' AND lido = false ORDER BY criado_em DESC"
    : "SELECT * FROM notificacoes WHERE destinatario_nivel = 'gestor' ORDER BY criado_em DESC"

  const notificacoes = await query<any>(sql)
  return NextResponse.json(notificacoes)
}
