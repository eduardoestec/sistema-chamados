import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { verificarToken } from '@/lib/auth'

async function gerarCodigo(): Promise<string> {
  const row = await queryOne<{ codigo_unico: string }>(
    "SELECT codigo_unico FROM chamados WHERE codigo_unico LIKE 'AS-%' ORDER BY criado_em DESC LIMIT 1"
  )
  let proximo = 1
  if (row?.codigo_unico) {
    const num = parseInt(row.codigo_unico.replace('AS-', ''), 10)
    if (!isNaN(num)) proximo = num + 1
  }
  return 'AS-' + String(proximo).padStart(4, '0')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sala_id, tipo_problema, descricao, urgencia, foto } = body

    if (!tipo_problema || !descricao || !urgencia) {
      return NextResponse.json({ erro: 'Campos obrigatorios faltando' }, { status: 400 })
    }

    const codigo_unico = await gerarCodigo()

    const chamado = await queryOne<any>(
      `INSERT INTO chamados (codigo_unico, tipo_problema, descricao, urgencia, status, sala_id)
       VALUES ($1,$2,$3,$4,'enviado',$5) RETURNING *`,
      [codigo_unico, tipo_problema, descricao, urgencia, sala_id || null]
    )

    if (!chamado) {
      return NextResponse.json({ erro: 'Erro ao criar chamado' }, { status: 500 })
    }

    await query(
      `INSERT INTO chamado_historico (chamado_id, status_anterior, status_novo, observacao)
       VALUES ($1,NULL,'enviado','Chamado criado pelo usuario')`,
      [chamado.id]
    )

    if (foto) {
      await query(
        `INSERT INTO anexos (chamado_id, url, tipo) VALUES ($1,$2,'usuario')`,
        [chamado.id, foto]
      )
    }

    return NextResponse.json(chamado)
  } catch {
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value
  if (!token || !verificarToken(token)) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const chamados = await query<any>(`
    SELECT c.*, u.nome AS responsavel_nome
    FROM chamados c
    LEFT JOIN usuarios u ON u.id = c.responsavel_id
    ORDER BY c.criado_em DESC
  `)
  return NextResponse.json(chamados)
}
