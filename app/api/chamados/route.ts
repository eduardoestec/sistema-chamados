import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function gerarCodigo() {
  const num = Math.floor(Math.random() * 9000) + 1000
  return 'MAT-' + num
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sala, tipo_problema, descricao, urgencia } = body

    if (!tipo_problema || !descricao || !urgencia) {
      return NextResponse.json({ erro: 'Campos obrigatorios faltando' }, { status: 400 })
    }

    const codigo_unico = gerarCodigo()

    const { data, error } = await supabase
      .from('chamados')
      .insert({
        codigo_unico,
        tipo_problema,
        descricao,
        urgencia,
        status: 'enviado',
        sala_id: null
      })
      .select()
      .single()

    if (error) {
      console.error(error)
      return NextResponse.json({ erro: 'Erro ao criar chamado' }, { status: 500 })
    }

    await supabase.from('chamado_historico').insert({
      chamado_id: data.id,
      status_anterior: null,
      status_novo: 'enviado',
      observacao: 'Chamado criado pelo usuario'
    })

    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 })
  }
}

export async function GET() {
  const { data, error } = await supabase
    .from('chamados')
    .select('*')
    .order('criado_em', { ascending: false })

  if (error) {
    return NextResponse.json({ erro: 'Erro ao buscar chamados' }, { status: 500 })
  }

  return NextResponse.json(data)
}
