import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verificarToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value
  if (!token || !verificarToken(token)) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }
  const usuarios = await query<any>(`
    SELECT u.id, u.nome, u.nivel, u.ativo, u.email,
      COALESCE(r.resolvidos, 0)::int    AS resolvidos,
      COALESCE(a.em_andamento, 0)::int  AS em_andamento
    FROM usuarios u
    LEFT JOIN (
      SELECT admin_id, COUNT(*)::int AS resolvidos
      FROM chamado_historico WHERE status_novo = 'resolvido'
      GROUP BY admin_id
    ) r ON r.admin_id = u.id
    LEFT JOIN (
      SELECT admin_id, COUNT(*)::int AS em_andamento
      FROM chamado_historico WHERE status_novo = 'em_andamento'
      GROUP BY admin_id
    ) a ON a.admin_id = u.id
    ORDER BY u.nome
  `)
  return NextResponse.json(usuarios)
}
