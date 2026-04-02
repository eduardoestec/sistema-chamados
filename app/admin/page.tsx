"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

type Chamado = {
  id: string
  titulo: string
  descricao: string
  status: string
  prioridade: string
  criado_em: string
  responsavel: string | null
}

export default function RelatoriosPage() {
  const [chamados, setChamados] = useState<Chamado[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    setCarregando(true)

    const { data, error } = await supabase
      .from("chamados")
      .select("*")
      .order("criado_em", { ascending: false })

    if (error) {
      console.error("Erro ao buscar chamados:", error)
      setChamados([])
    } else {
      setChamados(data as Chamado[])
    }

    setCarregando(false)
  }

  if (carregando) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Carregando relatórios...</h1>
      </div>
    )
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Relatórios de Chamados</h1>

      {chamados.length === 0 && <p>Nenhum chamado encontrado.</p>}

      <table border={1} cellPadding={10} style={{ marginTop: 20 }}>
        <thead>
          <tr>
            <th>Título</th>
            <th>Status</th>
            <th>Prioridade</th>
            <th>Responsável</th>
            <th>Data</th>
          </tr>
        </thead>

        <tbody>
          {chamados.map((chamado) => (
            <tr key={chamado.id}>
              <td>{chamado.titulo}</td>
              <td>{chamado.status}</td>
              <td>{chamado.prioridade}</td>
              <td>{chamado.responsavel ?? "-"}</td>
              <td>
                {new Date(chamado.criado_em).toLocaleDateString("pt-BR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
