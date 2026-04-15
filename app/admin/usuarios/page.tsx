'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, Plus, X, UserX } from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Tecnico = {
  id: string
  nome: string
  nivel: string
  ativo: boolean
  email?: string
  resolvidos?: number
  em_andamento?: number
}

function ModalNovoUsuario({ onSalvar, onFechar }: {
  onSalvar: (nome: string, email: string, senha: string, nivel: string) => Promise<string | null>
  onFechar: () => void
}) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nivel, setNivel] = useState('tecnico')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function handleConfirmar() {
    if (!nome.trim() || !email.trim() || !senha.trim()) { setErro('Preencha todos os campos'); return }
    setSalvando(true)
    setErro('')
    const erroMsg = await onSalvar(nome.trim(), email.trim(), senha.trim(), nivel)
    if (erroMsg) { setErro(erroMsg); setSalvando(false) }
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='font-bold text-gray-800'>Novo Usuario</h2>
          <button onClick={onFechar} className='text-gray-400 hover:text-gray-600'><X size={20} /></button>
        </div>
        <div className='mb-4'>
          <label className='block text-sm font-semibold text-gray-700 mb-1'>Nome</label>
          <input value={nome} onChange={e => setNome(e.target.value)}
            className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#767171]'
            placeholder='Nome do usuario' />
        </div>
        <div className='mb-4'>
          <label className='block text-sm font-semibold text-gray-700 mb-1'>Usuario</label>
          <input type='text' value={email} onChange={e => setEmail(e.target.value)}
            className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#767171]'
            placeholder='nome.sobrenome' />
        </div>
        <div className='mb-4'>
          <label className='block text-sm font-semibold text-gray-700 mb-1'>Nivel</label>
          <select value={nivel} onChange={e => setNivel(e.target.value)}
            className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#767171]'>
            <option value='tecnico'>Tecnico</option>
            <option value='gestor'>Gestor</option>
          </select>
        </div>
        <div className='mb-6'>
          <label className='block text-sm font-semibold text-gray-700 mb-1'>Senha</label>
          <input type='password' value={senha} onChange={e => setSenha(e.target.value)}
            className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#767171]'
            placeholder='Minimo 6 caracteres' />
        </div>
        {erro && <p className='text-red-500 text-sm mb-4'>{erro}</p>}
        <button onClick={handleConfirmar} disabled={salvando}
          className='w-full bg-[#767171] hover:bg-[#5a5555] text-white font-bold py-3 rounded-xl transition disabled:opacity-50'>
          {salvando ? 'Criando...' : 'Criar Usuario'}
        </button>
      </div>
    </div>
  )
}

export default function UsuariosPage() {
  const router = useRouter()
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modalNovo, setModalNovo] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('admin_nivel') !== 'gestor') { router.push('/admin'); return }
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push('/admin/login'); return }
      carregarTecnicos()
    })
  }, [])

  async function carregarTecnicos() {
    setCarregando(true)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('nome')

    if (!profiles) { setCarregando(false); return }

    // Buscar contagens do historico por admin_id
    const { data: historico } = await supabase
      .from('chamado_historico')
      .select('admin_id, status_novo')
      .not('admin_id', 'is', null)

    const contagemResolvidos: Record<string, number> = {}
    const contagemAndamento: Record<string, number> = {}

    for (const h of historico || []) {
      if (h.status_novo === 'resolvido') {
        contagemResolvidos[h.admin_id] = (contagemResolvidos[h.admin_id] || 0) + 1
      }
      if (h.status_novo === 'em_andamento') {
        contagemAndamento[h.admin_id] = (contagemAndamento[h.admin_id] || 0) + 1
      }
    }

    setTecnicos(profiles.map(p => ({
      ...p,
      resolvidos: contagemResolvidos[p.id] || 0,
      em_andamento: contagemAndamento[p.id] || 0,
    })))
    setCarregando(false)
  }

  async function criarTecnico(nome: string, email: string, senha: string, nivel: string): Promise<string | null> {
    const res = await fetch('/api/admin/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha, nivel })
    })
    const data = await res.json()
    if (!res.ok) return data.erro || 'Erro ao criar usuário'
    setModalNovo(false)
    carregarTecnicos()
    return null
  }

  async function desativarTecnico(id: string, ativo: boolean) {
    const acao = ativo ? 'desativar' : 'reativar'
    if (!confirm(`Deseja ${acao} este usuário?`)) return
    await supabase.from('profiles').update({ ativo: !ativo }).eq('id', id)
    carregarTecnicos()
  }

  return (
    <main className='min-h-screen p-4 sm:p-6 max-w-3xl mx-auto'>
      <button onClick={() => router.push('/admin')} className='flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4'>
        <ArrowLeft size={16} /> Voltar
      </button>
      <div className='flex justify-between items-center mb-6 flex-wrap gap-3'>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>Usuarios</h1>
          <p className='text-sm text-gray-500'>{tecnicos.length} usuarios cadastrados</p>
        </div>
        <button onClick={() => setModalNovo(true)}
          className='flex items-center gap-2 bg-[#767171] hover:bg-[#5a5555] text-white font-bold px-4 py-2 rounded-xl transition'>
          <Plus size={16} /> Novo Usuario
        </button>
      </div>

      {carregando && <p className='text-gray-400 text-sm'>Carregando...</p>}
      <div className='flex flex-col gap-3'>
        {tecnicos.map(t => (
          <div key={t.id} className={`bg-white rounded-2xl shadow p-4 flex items-center justify-between gap-3 flex-wrap ${!t.ativo ? 'opacity-50' : ''}`}>
            <div className='flex-1'>
              <div className='flex items-center gap-2 mb-1'>
                <p className='font-semibold text-gray-800'>{t.nome}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.nivel === 'gestor' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                  {t.nivel === 'gestor' ? 'Gestor' : 'Tecnico'}
                </span>
                {!t.ativo && <span className='text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full'>Inativo</span>}
              </div>
              <div className='flex gap-4 text-xs text-gray-400'>
                <span>{t.resolvidos} resolvidos</span>
                <span>{t.em_andamento} em andamento</span>
              </div>
            </div>
            <button onClick={() => desativarTecnico(t.id, t.ativo)}
              className='flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition'>
              <UserX size={14} /> {t.ativo ? 'Desativar' : 'Reativar'}
            </button>
          </div>
        ))}
      </div>

      {modalNovo && <ModalNovoUsuario onSalvar={criarTecnico} onFechar={() => setModalNovo(false)} />}
    </main>
  )
}
