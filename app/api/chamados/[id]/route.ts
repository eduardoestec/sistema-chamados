import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { verificarToken } from '@/lib/auth'

function getUser(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value
  return token ? verificarToken(token) : null
}

// GET: público por codigo_unico (AS-xxxx) ou protegido por UUID
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (/^AS-\d+$/i.test(id)) {
    const chamado = await queryOne<any>('SELECT * FROM chamados WHERE codigo_unico = $1', [id.toUpperCase()])
    if (!chamado) return NextResponse.json({ erro: 'Chamado não encontrado' }, { status: 404 })
    const historico = await query<any>(
      'SELECT * FROM chamado_historico WHERE chamado_id = $1 ORDER BY criado_em ASC', [chamado.id]
    )
    return NextResponse.json({ chamado, historico })
  }

  const user = getUser(req)
  if (!user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const chamado = await queryOne<any>(`
    SELECT c.*, s.nome AS sala_nome
    FROM chamados c LEFT JOIN salas s ON s.id = c.sala_id
    WHERE c.id = $1
  `, [id])
  if (!chamado) return NextResponse.json({ erro: 'Não encontrado' }, { status: 404 })

  const [historico, anexos] = await Promise.all([
    query<any>('SELECT * FROM chamado_historico WHERE chamado_id = $1 ORDER BY criado_em ASC', [id]),
    query<any>('SELECT * FROM anexos WHERE chamado_id = $1 ORDER BY criado_em ASC', [id]),
  ])

  let responsavel_nome: string | null = null
  if (chamado.responsavel_id) {
    const u = await queryOne<{ nome: string }>('SELECT nome FROM usuarios WHERE id = $1', [chamado.responsavel_id])
    responsavel_nome = u?.nome ?? null
  }

  return NextResponse.json({ chamado, historico, anexos, responsavel_nome })
}

// PATCH: atualiza chamado (protegido)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  if (body.action === 'auto_receber') {
    await query(
      'UPDATE chamados SET status = $1, responsavel_id = $2, atualizado_em = NOW() WHERE id = $3',
      ['recebido', user.id, id]
    )
    await query(
      'INSERT INTO chamado_historico (chamado_id, status_anterior, status_novo, observacao, admin_id) VALUES ($1,$2,$3,$4,$5)',
      [id, 'enviado', 'recebido', 'Chamado recebido por ' + user.nome, user.id]
    )
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'pegar') {
    const c = await queryOne<{ status: string }>('SELECT status FROM chamados WHERE id = $1', [id])
    if (!c) return NextResponse.json({ erro: 'Não encontrado' }, { status: 404 })
    await query('UPDATE chamados SET responsavel_id = $1, atualizado_em = NOW() WHERE id = $2', [user.id, id])
    await query(
      'INSERT INTO chamado_historico (chamado_id, status_anterior, status_novo, observacao, admin_id) VALUES ($1,$2,$3,$4,$5)',
      [id, c.status, c.status, 'Chamado assumido por ' + user.nome, user.id]
    )
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'nota') {
    const obs = body.observacao?.trim()
    if (!obs) return NextResponse.json({ erro: 'Observação obrigatória' }, { status: 400 })
    const c = await queryOne<any>('SELECT * FROM chamados WHERE id = $1', [id])
    if (!c) return NextResponse.json({ erro: 'Não encontrado' }, { status: 404 })
    await query(
      'INSERT INTO chamado_historico (chamado_id, status_anterior, status_novo, observacao, admin_id) VALUES ($1,$2,$3,$4,$5)',
      [id, c.status, c.status, obs, user.id]
    )
    await query(
      'INSERT INTO notificacoes (titulo, mensagem, lido, destinatario_nivel) VALUES ($1,$2,$3,$4)',
      [`Nova observação — ${c.codigo_unico}`, `${user.nome} adicionou uma observação no chamado ${c.codigo_unico}: "${obs}"`, false, 'gestor']
    )
    return NextResponse.json({ ok: true })
  }

  // action: 'salvar' (padrão) — atualiza status
  const { status, observacao, foto } = body
  if (!status) return NextResponse.json({ erro: 'Status obrigatório' }, { status: 400 })

  const chamado = await queryOne<any>('SELECT * FROM chamados WHERE id = $1', [id])
  if (!chamado) return NextResponse.json({ erro: 'Não encontrado' }, { status: 404 })

  const statusAnterior = chamado.status
  await query('UPDATE chamados SET status = $1, atualizado_em = NOW() WHERE id = $2', [status, id])
  await query(
    'INSERT INTO chamado_historico (chamado_id, status_anterior, status_novo, observacao, admin_id) VALUES ($1,$2,$3,$4,$5)',
    [id, statusAnterior, status, observacao || null, user.id]
  )

  const sala = chamado.sala_id
    ? await queryOne<{ nome: string }>('SELECT nome FROM salas WHERE id = $1', [chamado.sala_id])
    : null
  const salaNome = sala?.nome || 'N/A'

  if (status === 'resolvido' && statusAnterior !== 'resolvido') {
    await query(
      'INSERT INTO notificacoes (titulo, mensagem, lido, destinatario_nivel) VALUES ($1,$2,$3,$4)',
      [`Chamado resolvido — ${chamado.codigo_unico}`,
       `${user.nome} marcou o chamado ${chamado.codigo_unico} como RESOLVIDO — Sala: ${salaNome}`,
       false, 'gestor']
    )
  } else if (status !== statusAnterior) {
    await query(
      'INSERT INTO notificacoes (titulo, mensagem, lido, destinatario_nivel) VALUES ($1,$2,$3,$4)',
      [`Status atualizado — ${chamado.codigo_unico}`,
       `${user.nome} alterou o status de "${statusAnterior}" para "${status}" no chamado ${chamado.codigo_unico} — Sala: ${salaNome}`,
       false, 'gestor']
    )
  } else if (observacao?.trim()) {
    await query(
      'INSERT INTO notificacoes (titulo, mensagem, lido, destinatario_nivel) VALUES ($1,$2,$3,$4)',
      [`Nova observação — ${chamado.codigo_unico}`,
       `${user.nome} adicionou uma observação no chamado ${chamado.codigo_unico}: "${observacao.trim()}"`,
       false, 'gestor']
    )
  }

  if (foto) {
    await query('INSERT INTO anexos (chamado_id, url, tipo, admin_id) VALUES ($1,$2,$3,$4)', [id, foto, 'equipe', user.id])
  }

  return NextResponse.json({ ok: true })
}
