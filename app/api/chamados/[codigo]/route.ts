import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(req: NextRequest, { params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params

  const { data: chamado, error } = await supabase
    .from('chamados')
    .select('*')
    .eq('codigo_unico', codigo)
    .single()

  if (error || !chamado) {
    return NextResponse.json({ erro: 'Chamado nao encontrado' }, { status: 404 })
  }

  const { data: historico } = await supabase
    .from('chamado_historico')
    .select('*')
    .eq('chamado_id', chamado.id)
    .order('criado_em', { ascending: true })

  return NextResponse.json({ chamado, historico: historico || [] })
}