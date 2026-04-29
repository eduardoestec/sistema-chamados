'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, Plus, X, UserX, UserCheck, Trash2, KeyRound } from 'lucide-react'

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
            className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#604404]'
            placeholder='Nome do usuario' />
        </div>
        <div className='mb-4'>
          <label className='block text-sm font-semibold text-gray-700 mb-1'>Usuario</label>
          <input type='text' value={email} onChange={e => setEmail(e.target.value)}
            className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#604404]'
            placeholder='nome.sobrenome' />
        </div>
        <div className='mb-4'>
          <label className='block text-sm font-semibold text-gray-700 mb-1'>Nivel</label>
          <select value={nivel} onChange={e => setNivel(e.target.value)}
            className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#604404]'>
            <option value='tecnico'>Tecnico</option>
            <option value='gestor'>Gestor</option>
          </select>
        </div>
        <div className='mb-6'>
          <label className='block text-sm font-semibold text-gray-700 mb-1'>Senha</label>
          <input type='password' value={senha} onChange={e => setSenha(e.target.value)}
            className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#604404]'
            placeholder='Minimo 6 caracteres' />
        </div>
        {erro && <p className='text-red-500 text-sm mb-4'>{erro}</p>}
        <button onClick={handleConfirmar} disabled={salvando}
          className='w-full bg-[#604404] hover:bg-[#4a3203] text-white font-bold py-3 rounded-xl transition disabled:opacity-50'>
          {salvando ? 'Criando...' : 'Criar Usuario'}
        </button>
      </div>
    </div>
  )
}

function ModalTrocarSenha({ usuario, onSalvar, onFechar }: {
  usuario: Tecnico
  onSalvar: (id: string, senha: string) => Promise<string | null>
  onFechar: () => void
}) {
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  async function handleSalvar() {
    if (senha.length < 6) { setErro('Senha deve ter no mínimo 6 caracteres'); return }
    if (senha !== confirmar) { setErro('As senhas não coincidem'); return }
    setSalvando(true)
    setErro('')
    const erroMsg = await onSalvar(usuario.id, senha)
    if (erroMsg) { setErro(erroMsg); setSalvando(false) }
    else { setSucesso(true); setTimeout(onFechar, 1500) }
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='font-bold text-gray-800'>Trocar Senha</h2>
          <button onClick={onFechar} className='text-gray-400 hover:text-gray-600'><X size={20} /></button>
        </div>
        <p className='text-sm text-gray-500 mb-4'>Usuário: <span className='font-medium text-gray-700'>{usuario.nome}</span></p>
        {sucesso ? (
          <p className='text-green-600 font-medium text-center py-4'>Senha alterada com sucesso!</p>
        ) : (
          <>
            <div className='mb-4'>
              <label className='block text-sm font-semibold text-gray-700 mb-1'>Nova Senha</label>
              <input type='password' value={senha} onChange={e => setSenha(e.target.value)}
                className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#604404]'
                placeholder='Mínimo 6 caracteres' />
            </div>
            <div className='mb-6'>
              <label className='block text-sm font-semibold text-gray-700 mb-1'>Confirmar Nova Senha</label>
              <input type='password' value={confirmar} onChange={e => setConfirmar(e.target.value)}
                className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#604404]'
                placeholder='Repita a senha' />
            </div>
            {erro && <p className='text-red-500 text-sm mb-4'>{erro}</p>}
            <div className='flex gap-3'>
              <button onClick={onFechar}
                className='flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl transition hover:bg-gray-50'>
                Cancelar
              </button>
              <button onClick={handleSalvar} disabled={salvando}
                className='flex-1 bg-[#604404] hover:bg-[#4a3203] text-white font-bold py-3 rounded-xl transition disabled:opacity-50'>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function UsuariosPage() {
  const router = useRouter()
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modalNovo, setModalNovo] = useState(false)
  const [usuarioParaTrocarSenha, setUsuarioParaTrocarSenha] = useState<Tecnico | null>(null)
  const [adminId, setAdminId] = useState<string | null>(null)
  const [isGestor, setIsGestor] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (localStorage.getItem('admin_nivel') !== 'gestor') { router.push('/admin'); return }
    setIsGestor(true)
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push('/admin/login'); return }
      setAdminId(data.session.user.id)
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

  function mostrarErro(msg: string) {
    setErro(msg)
    setTimeout(() => setErro(''), 5000)
  }

  async function desativarTecnico(id: string, ativo: boolean) {
    if (id === adminId) { mostrarErro('Você não pode desativar sua própria conta.'); return }
    const acao = ativo ? 'desativar' : 'ativar'
    if (!confirm(`Deseja ${acao} este usuário?`)) return
    await supabase.from('profiles').update({ ativo: !ativo }).eq('id', id)
    carregarTecnicos()
  }

  async function trocarSenha(id: string, senha: string): Promise<string | null> {
    const res = await fetch(`/api/admin/usuarios/${id}/senha`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha })
    })
    const data = await res.json()
    if (!res.ok) return data.erro || 'Erro ao trocar senha'
    return null
  }

  async function excluirTecnico(id: string, nome: string) {
    if (id === adminId) { mostrarErro('Você não pode excluir sua própria conta.'); return }
    if (!confirm(`Tem certeza que deseja excluir "${nome}"? Esta ação não pode ser desfeita.`)) return
    const res = await fetch(`/api/admin/usuarios/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { mostrarErro(data.erro || 'Erro ao excluir usuário'); return }
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
          className='flex items-center gap-2 bg-[#604404] hover:bg-[#4a3203] text-white font-bold px-4 py-2 rounded-xl transition'>
          <Plus size={16} /> Novo Usuario
        </button>
      </div>

      {erro && (
        <div className='mb-4 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-xl'>
          {erro}
        </div>
      )}

      {carregando && <p className='text-gray-400 text-sm'>Carregando...</p>}
      <div className='flex flex-col gap-3'>
        {tecnicos.map(t => (
          <div key={t.id} className={`bg-white rounded-2xl shadow p-4 flex items-center justify-between gap-3 flex-wrap transition-opacity ${!t.ativo ? 'opacity-50' : ''}`}>
            <div className='flex-1'>
              <div className='flex items-center gap-2 mb-1 flex-wrap'>
                <p className='font-semibold text-gray-800'>{t.nome}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.nivel === 'gestor' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                  {t.nivel === 'gestor' ? 'Gestor' : 'Tecnico'}
                </span>
                {!t.ativo && (
                  <span className='text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-medium'>Inativo</span>
                )}
              </div>
              <div className='flex gap-4 text-xs text-gray-400'>
                <span>{t.resolvidos} resolvidos</span>
                <span>{t.em_andamento} em andamento</span>
              </div>
            </div>
            <div className='flex items-center gap-2 flex-wrap'>
              {t.ativo ? (
                <button onClick={() => desativarTecnico(t.id, t.ativo)}
                  className='flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3 py-1.5 rounded-lg transition'>
                  <UserX size={13} /> Desativar
                </button>
              ) : (
                <button onClick={() => desativarTecnico(t.id, t.ativo)}
                  className='flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg transition'>
                  <UserCheck size={13} /> Ativar
                </button>
              )}
              {isGestor && (
                <button onClick={() => setUsuarioParaTrocarSenha(t)}
                  className='flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition'>
                  <KeyRound size={13} /> Trocar Senha
                </button>
              )}
              <button onClick={() => excluirTecnico(t.id, t.nome)}
                className='flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition'>
                <Trash2 size={13} /> Excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalNovo && <ModalNovoUsuario onSalvar={criarTecnico} onFechar={() => setModalNovo(false)} />}
      {usuarioParaTrocarSenha && (
        <ModalTrocarSenha
          usuario={usuarioParaTrocarSenha}
          onSalvar={trocarSenha}
          onFechar={() => setUsuarioParaTrocarSenha(null)}
        />
      )}
    </main>
  )
}
