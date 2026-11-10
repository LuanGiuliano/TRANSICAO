import { useCallback, useEffect, useState } from 'react'
import { listarPerfis, decidirPerfil, alterarPapelPerfil, listarAcessos } from './supabase.js'

const ROTULO = { pendente: 'Pendente', aprovado: 'Aprovado', rejeitado: 'Rejeitado' }
const fmtData = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '–')

export default function AdminAcessos({ aberto, onClose, adminEmail, onContagem }) {
  const [aba, setAba] = useState('solicitacoes')
  const [filtro, setFiltro] = useState('pendente')
  const [perfis, setPerfis] = useState([])
  const [acessos, setAcessos] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(null)

  const carregar = useCallback(async (ajustarFiltroInicial = false) => {
    setCarregando(true)
    setErro('')
    try {
      const [p, a] = await Promise.all([listarPerfis(), listarAcessos(100)])
      setPerfis(p)
      setAcessos(a)
      const qtdPend = p.filter((x) => x.status === 'pendente').length
      onContagem?.(qtdPend)
      if (ajustarFiltroInicial) {
        setFiltro(qtdPend > 0 ? 'pendente' : 'aprovado')
      }
    } catch (err) {
      setErro(err.message || 'Falha ao carregar dados do Supabase.')
    } finally {
      setCarregando(false)
    }
  }, [onContagem])

  useEffect(() => { if (aberto) carregar(true) }, [aberto, carregar])

  const decidir = async (p, status) => {
    setOcupado(p.user_id)
    setErro('')
    try {
      await decidirPerfil(p.user_id, status, adminEmail)
      await carregar()
    } catch (err) {
      setErro(err.message || 'Não foi possível atualizar o usuário.')
    } finally {
      setOcupado(null)
    }
  }

  const mudarPapel = async (p, novoPapel) => {
    setOcupado(p.user_id)
    setErro('')
    try {
      await alterarPapelPerfil(p.user_id, novoPapel, adminEmail)
      await carregar()
    } catch (err) {
      setErro(err.message || 'Não foi possível alterar o nível de permissão.')
    } finally {
      setOcupado(null)
    }
  }

  if (!aberto) return null

  const contagem = (s) => perfis.filter((p) => p.status === s).length
  const lista = perfis.filter((p) => filtro === 'todos' || p.status === filtro)

  return (
    <div className="adm-overlay" onClick={onClose}>
      <div className="adm-janela" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Gestão de acessos">
        <div className="adm-topo">
          <div>
            <strong className="adm-titulo">Gestão de acessos</strong>
            <span className="adm-sub">Autorize ou bloqueie quem pode ver o painel</span>
          </div>
          <button type="button" className="adm-fechar" onClick={onClose} aria-label="Fechar">×</button>
        </div>

        <div className="adm-abas">
          <button type="button" className={`adm-aba ${aba === 'solicitacoes' ? 'adm-aba--on' : ''}`} onClick={() => setAba('solicitacoes')}>
            Solicitações {contagem('pendente') > 0 && <span className="adm-badge">{contagem('pendente')}</span>}
          </button>
          <button type="button" className={`adm-aba ${aba === 'acessos' ? 'adm-aba--on' : ''}`} onClick={() => setAba('acessos')}>
            Acessos recentes
          </button>
          <button type="button" className="adm-atualizar" onClick={() => carregar()} disabled={carregando}>
            {carregando ? 'Atualizando...' : '↻ Atualizar'}
          </button>
        </div>

        {erro && <div className="login-msg login-msg--erro" style={{ margin: '10px 18px 0' }}>{erro}</div>}

        <div className="adm-corpo">
          {aba === 'solicitacoes' ? (
            <>
              <div className="adm-filtros">
                {['pendente', 'aprovado', 'rejeitado', 'todos'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`adm-filtro ${filtro === f ? 'adm-filtro--on' : ''}`}
                    onClick={() => setFiltro(f)}
                  >
                    {f === 'todos' ? `Todos (${perfis.length})` : `${ROTULO[f]} (${contagem(f)})`}
                  </button>
                ))}
              </div>

              {lista.length === 0 ? (
                <p className="vazio-txt">Nenhum usuário nesta lista.</p>
              ) : (
                <ul className="adm-lista">
                  {lista.map((p) => {
                    const ehProprio = p.email?.toLowerCase() === adminEmail?.toLowerCase()
                    return (
                      <li key={p.user_id} className="adm-item">
                        <div className="adm-item__dados">
                          <strong>
                            {p.nome || p.email}
                            {ehProprio && <span className="adm-voce"> (Você)</span>}
                          </strong>
                          <span>{p.email}</span>
                          {p.unidade && <span className="adm-item__unid">{p.unidade}</span>}
                          <span className="adm-item__data">Solicitado em {fmtData(p.criado_em)}</span>
                        </div>
                        <span className={`adm-status ${p.papel === 'admin' ? 'adm-status--admin' : `adm-status--${p.status}`}`}>
                          {p.papel === 'admin' ? 'Administrador' : ROTULO[p.status]}
                        </span>
                        <div className="adm-item__acoes">
                          {p.status !== 'aprovado' && (
                            <button type="button" className="adm-btn adm-btn--ok" disabled={ocupado === p.user_id} onClick={() => decidir(p, 'aprovado')}>
                              Aprovar
                            </button>
                          )}
                          {p.status === 'pendente' && (
                            <button type="button" className="adm-btn adm-btn--nao" disabled={ocupado === p.user_id} onClick={() => decidir(p, 'rejeitado')}>
                              Rejeitar
                            </button>
                          )}
                          {!ehProprio && p.status === 'aprovado' && p.papel !== 'admin' && (
                            <button type="button" className="adm-btn adm-btn--adm" disabled={ocupado === p.user_id} onClick={() => mudarPapel(p, 'admin')}>
                              Tornar Admin
                            </button>
                          )}
                          {!ehProprio && p.status === 'aprovado' && p.papel === 'admin' && (
                            <button type="button" className="adm-btn adm-btn--neutro" disabled={ocupado === p.user_id} onClick={() => mudarPapel(p, 'usuario')}>
                              Remover Admin
                            </button>
                          )}
                          {!ehProprio && p.status === 'aprovado' && p.papel !== 'admin' && (
                            <button type="button" className="adm-btn adm-btn--nao" disabled={ocupado === p.user_id} onClick={() => decidir(p, 'rejeitado')}>
                              Revogar
                            </button>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </>
          ) : acessos.length === 0 ? (
            <p className="vazio-txt">Nenhum acesso registrado ainda.</p>
          ) : (
            <div className="tabela-wrap">
              <table className="tabela">
                <thead>
                  <tr><th>Data/hora</th><th>Usuário</th><th>E-mail</th></tr>
                </thead>
                <tbody>
                  {acessos.map((a) => (
                    <tr key={a.id}>
                      <td>{fmtData(a.data_hora)}</td>
                      <td>{a.nome || '–'}</td>
                      <td>{a.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

