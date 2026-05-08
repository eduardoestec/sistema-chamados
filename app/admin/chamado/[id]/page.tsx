'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import EditorFoto from '@/components/EditorFoto'
import { UserCheck, MessageSquare, ArrowRight } from 'lucide-react'

const statusLabel: Record<string, string> = { enviado: 'Enviado', recebido: 'Recebido', em_analise: 'Em Analise', em_andamento: 'Em Andamento', resolvido: 'Resolvido' }
const statusOrdem = ['enviado', 'recebido', 'em_analise', 'em_andamento', 'resolvido']
const urgenciaLabel: Record<string, string> = { baixa: 'Baixa', media: 'Media', alta: 'Alta', muito_alta: 'Muito Alta' }

export default function DetalheChamado({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [chamado, setChamado] = useState<any>(null)
  const [historico, setHistorico] = useState<any[]>([])
  const [anexos, setAnexos] = useState<any[]>([])
  const [novoStatus, setNovoStatus] = useState('')
  const [observacao, setObservacao] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [adicionandoNota, setAdicionandoNota] = useState(false)
  const [adminId, setAdminId] = useState<string | null>(null)
  const [adminNome, setAdminNome] = useState('')
  const [salaNome, setSalaNome] = useState<string | null>(null)
  const [responsavelNome, setResponsavelNome] = useState<string | null>(null)
  const [fotoPreview, setFotoPreview] = useState('')
  const [fotoEditada, setFotoEditada] = useState('')
  const [abrirEditor, setAbrirEditor] = useState(false)
  const [chamadoId, setChamadoId] = useState<string>('')

  useEffect(() => {
    const id = localStorage.getItem('admin_id') || ''
    const nome = localStorage.getItem('admin_nome') || 'Tecnico'
    if (!id) { router.push('/admin/login'); return }
    setAdminId(id)
    setAdminNome(nome)
    params.then(p => {
      setChamadoId(p.id)
      carregarChamado(p.id)
    })
  }, [])

  async function carregarChamado(id: string) {
    const res = await fetch(`/api/chamados/${id}`)
    if (!res.ok) { if (res.status === 401) router.push('/admin/login'); return }
    const { chamado: c, historico: h, anexos: a, responsavel_nome } = await res.json()
    setChamado(c)
    setSalaNome(c?.sala_nome || null)
    setHistorico(h || [])
    setAnexos(a || [])
    setNovoStatus(c.status)
    setResponsavelNome(responsavel_nome)

    if (c?.status === 'enviado') {
      await fetch(`/api/chamados/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auto_receber' })
      })
      const res2 = await fetch(`/api/chamados/${id}`)
      if (res2.ok) {
        const { chamado: c2, historico: h2, responsavel_nome: rn2 } = await res2.json()
        setChamado(c2)
        setHistorico(h2 || [])
        setNovoStatus(c2.status)
        setResponsavelNome(rn2)
      }
    }
  }

  async function pegarChamado() {
    if (!chamadoId) return
    await fetch(`/api/chamados/${chamadoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pegar' })
    })
    setChamado((prev: any) => ({ ...prev, responsavel_id: adminId }))
    setResponsavelNome(adminNome)
  }

  function selecionarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setFotoPreview(reader.result as string)
      setFotoEditada('')
    }
    reader.readAsDataURL(file)
  }

  async function salvar() {
    if (!chamado) return
    setSalvando(true)
    const fotoFinal = fotoEditada || fotoPreview || null
    await fetch(`/api/chamados/${chamado.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'salvar', status: novoStatus, observacao: observacao || null, foto: fotoFinal })
    })
    setObservacao('')
    setFotoPreview('')
    setFotoEditada('')
    await carregarChamado(chamado.id)
    setSalvando(false)
    alert('Atualizado com sucesso!')
  }

  async function adicionarNota() {
    if (!observacao.trim() || !chamado) return
    setAdicionandoNota(true)
    const res = await fetch(`/api/chamados/${chamado.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'nota', observacao: observacao.trim() })
    })
    const data = await res.json()
    if (!res.ok) { alert('Erro ao adicionar nota: ' + data.erro); setAdicionandoNota(false); return }
    setObservacao('')
    await carregarChamado(chamado.id)
    setAdicionandoNota(false)
  }

  if (!chamado) return (
    <div className='flex items-center justify-center min-h-screen bg-[#f8f7f7]'>
      <div className='text-center'>
        <div className='bg-[#604404] rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-4'>
          <span className='text-white font-black text-xl'>AS</span>
        </div>
        <p className='text-[#6b7280]'>Carregando...</p>
      </div>
    </div>
  )

  const isResponsavel = chamado.responsavel_id === adminId

  return (
    <main className='min-h-screen bg-[#f8f7f7]'>
      <div className='max-w-7xl mx-auto p-6'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <button onClick={() => router.push('/admin')} className='flex items-center gap-2 text-[#6b7280] hover:text-[#1a1a1a] transition-all duration-200'>
            <span className='text-sm font-medium'>← Voltar ao painel</span>
          </button>
          <div className='bg-[#604404] rounded-xl w-12 h-12 flex items-center justify-center'>
            <span className='text-white font-black text-lg'>AS</span>
          </div>
        </div>

        {/* Layout em duas colunas */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>

          {/* Coluna Esquerda - Detalhes */}
          <div className='space-y-6'>

            {/* Informações do Chamado */}
            <div className='bg-white rounded-xl shadow-sm p-6'>
              <div className='flex justify-between items-start mb-6'>
                <div>
                  <h1 className='text-2xl font-bold text-[#2c2c2c] tracking-tight mb-2'>{chamado.codigo_unico}</h1>
                  <p className='text-sm text-[#6b7280]'>{chamado.tipo_problema}</p>
                </div>
                <span className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                  chamado.urgencia === 'baixa' ? 'bg-[#16a34a]/10 text-[#16a34a] border border-[#16a34a]/20' :
                  chamado.urgencia === 'media' ? 'bg-[#d97706]/10 text-[#d97706] border border-[#d97706]/20' :
                  'bg-[#dc2626]/10 text-[#dc2626] border border-[#dc2626]/20'
                }`}>
                  {urgenciaLabel[chamado.urgencia]}
                </span>
              </div>

              {salaNome && (
                <div className='flex items-center gap-2 mb-4'>
                  <div className='w-2 h-2 rounded-full bg-[#604404]'></div>
                  <p className='text-sm text-[#6b7280]'>Sala: <span className='font-medium text-[#1a1a1a]'>{salaNome}</span></p>
                </div>
              )}

              <p className='text-sm text-[#6b7280] mb-6 leading-relaxed'>{chamado.descricao}</p>

              <div className='flex items-center justify-between pt-4 border-t border-[#e5e3e3]'>
                <div>
                  <p className='text-xs uppercase tracking-wider text-[#6b7280] mb-1'>Aberto em</p>
                  <p className='text-sm font-medium text-[#1a1a1a]'>{new Date(chamado.criado_em).toLocaleString('pt-BR')}</p>
                </div>
                <div className='text-right'>
                  <p className='text-xs uppercase tracking-wider text-[#6b7280] mb-1'>Responsável</p>
                  <p className='text-sm font-medium text-[#1a1a1a]'>{responsavelNome || 'Não atribuído'}</p>
                </div>
              </div>

              {!isResponsavel && (
                <button
                  onClick={pegarChamado}
                  className='w-full mt-6 bg-[#604404] hover:bg-[#4a3203] text-white font-medium py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2'
                >
                  <UserCheck size={18} />
                  Pegar Chamado
                </button>
              )}
            </div>

            {/* Fotos do Usuário */}
            {anexos.filter(a => a.tipo === 'usuario').length > 0 && (
              <div className='bg-white rounded-xl shadow-sm p-6'>
                <h2 className='text-lg font-semibold text-[#2c2c2c] mb-4'>Fotos do Usuário</h2>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  {anexos.filter(a => a.tipo === 'usuario').map(a => (
                    <img key={a.id} src={a.url} alt='Foto usuário' className='w-full rounded-lg object-cover max-h-48 border border-[#e5e3e3]' />
                  ))}
                </div>
              </div>
            )}

            {/* Fotos da Equipe */}
            {anexos.filter(a => a.tipo === 'equipe').length > 0 && (
              <div className='bg-white rounded-xl shadow-sm p-6'>
                <h2 className='text-lg font-semibold text-[#2c2c2c] mb-4'>Fotos da Equipe</h2>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  {anexos.filter(a => a.tipo === 'equipe').map(a => (
                    <img key={a.id} src={a.url} alt='Foto equipe' className='w-full rounded-lg object-cover max-h-48 border border-[#e5e3e3]' />
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Coluna Direita - Atualização e Histórico */}
          <div className='space-y-6'>

            {/* Atualizar Status */}
            <div className='bg-white rounded-xl shadow-sm p-6'>
              <h2 className='text-lg font-semibold text-[#2c2c2c] mb-6'>Atualizar Status</h2>

              <div className='grid grid-cols-1 gap-3 mb-6'>
                {statusOrdem.map(s => (
                  <button
                    key={s}
                    onClick={() => setNovoStatus(s)}
                    className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all duration-200 ${
                      novoStatus === s
                        ? 'bg-[#604404] border-[#604404] text-white'
                        : 'bg-white border-[#e5e3e3] text-[#1a1a1a] hover:border-[#604404]'
                    }`}
                  >
                    {statusLabel[s]}
                  </button>
                ))}
              </div>

              <div className='mb-6'>
                <label className='block text-xs uppercase tracking-wider text-[#6b7280] mb-2'>Observação (opcional)</label>
                <textarea
                  className='w-full border border-[#e5e3e3] rounded-lg p-4 text-sm text-[#1a1a1a] min-h-24 focus:outline-none focus:border-[#604404] focus:ring-1 focus:ring-[#604404] transition-all duration-200'
                  placeholder='Adicione uma observação...'
                  value={observacao}
                  onChange={e => setObservacao(e.target.value)}
                />
              </div>

              <div className='mb-6'>
                <label className='block text-xs uppercase tracking-wider text-[#6b7280] mb-2'>Adicionar Foto</label>
                <input
                  type='file'
                  accept='image/*'
                  onChange={selecionarFoto}
                  className='w-full border border-[#e5e3e3] rounded-lg p-4 text-sm text-[#6b7280] focus:outline-none focus:border-[#604404] focus:ring-1 focus:ring-[#604404] transition-all duration-200'
                />
                {(fotoEditada || fotoPreview) && (
                  <div className='relative mt-4'>
                    <img src={fotoEditada || fotoPreview} alt='Preview' className='w-full rounded-lg max-h-48 object-cover border border-[#e5e3e3]' />
                    <button
                      onClick={() => setAbrirEditor(true)}
                      className='absolute bottom-3 right-3 bg-[#604404] hover:bg-[#4a3203] text-white text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200'
                    >
                      Editar Foto
                    </button>
                  </div>
                )}
              </div>

              <div className='flex flex-col gap-3'>
                <button
                  onClick={salvar}
                  disabled={salvando || adicionandoNota}
                  className='w-full bg-[#604404] hover:bg-[#4a3203] text-white font-medium py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {salvando ? 'Salvando...' : 'Salvar Status'}
                </button>
                <button
                  onClick={adicionarNota}
                  disabled={adicionandoNota || salvando || !observacao.trim()}
                  className='w-full bg-white border border-[#604404] text-[#604404] hover:bg-[#fdf8f0] font-medium py-3 rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                >
                  <MessageSquare size={16} />
                  {adicionandoNota ? 'Adicionando...' : 'Adicionar Nota'}
                </button>
              </div>
            </div>

            {/* Histórico */}
            <div className='bg-white rounded-xl shadow-sm p-6'>
              <h2 className='text-lg font-semibold text-[#2c2c2c] mb-6'>Histórico</h2>
              <div className='space-y-6'>
                {historico.map((h, index) => {
                  const isLast = index === historico.length - 1
                  const isNota = h.status_anterior === h.status_novo
                  return (
                    <div key={h.id} className='flex items-start gap-4 relative'>
                      {!isLast && (
                        <div className='absolute left-2 top-6 w-0.5 h-full bg-[#e5e3e3]'></div>
                      )}
                      <div className={`w-4 h-4 rounded-full mt-0.5 flex-shrink-0 flex items-center justify-center ${isNota ? 'bg-blue-400' : 'bg-[#604404]'}`}>
                        {isNota && <MessageSquare size={9} className='text-white' />}
                      </div>
                      <div className='flex-1'>
                        <div className='flex justify-between items-start mb-2'>
                          {isNota ? (
                            <p className='text-sm font-medium text-blue-600'>Nota</p>
                          ) : (
                            <p className='text-sm font-medium text-[#1a1a1a] flex items-center gap-1'>
                              {statusLabel[h.status_anterior]}
                              <ArrowRight size={12} className='text-[#6b7280]' />
                              {statusLabel[h.status_novo]}
                            </p>
                          )}
                          <p className='text-xs text-[#6b7280]'>{new Date(h.criado_em).toLocaleString('pt-BR')}</p>
                        </div>
                        {h.observacao && (
                          <p className='text-xs text-[#1a1a1a] bg-[#fdf8f0] rounded-lg p-3 leading-relaxed'>{h.observacao}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </div>

        {abrirEditor && (fotoEditada || fotoPreview) && (
          <EditorFoto
            imagemInicial={fotoEditada || fotoPreview}
            onSalvar={dataUrl => { setFotoEditada(dataUrl); setAbrirEditor(false) }}
            onCancelar={() => setAbrirEditor(false)}
          />
        )}
      </div>
    </main>
  )
}
