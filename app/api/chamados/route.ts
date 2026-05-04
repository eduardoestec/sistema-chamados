import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

async function gerarCodigo(): Promise<string> {
  const { data } = await supabase
    .from('chamados')
    .select('codigo_unico')
    .like('codigo_unico', 'AS-%')
    .order('criado_em', { ascending: false })
    .limit(1)
    .single()

  let proximo = 1
  if (data?.codigo_unico) {
    const num = parseInt((data.codigo_unico as string).replace('AS-', ''), 10)
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

    const { data, error } = await supabase
      .from('chamados')
      .insert({
        codigo_unico,
        tipo_problema,
        descricao,
        urgencia,
        status: 'enviado',
        sala_id: sala_id || null
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

    if (foto) {
      await supabase.from('anexos').insert({
        chamado_id: data.id,
        url: foto,
        tipo: 'usuario'
      })
    }

    return NextResponse.json(data)
  } catch {
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
