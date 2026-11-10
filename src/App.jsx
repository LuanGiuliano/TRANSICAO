import { useEffect, useMemo, useState } from 'react'
import brasao from './assets/brasao.png'
import Painel, { resumoCapa, temDados } from './paineis.jsx'
import SagepModal from './SagepModal.jsx'
import Login from './Login.jsx'
import AdminAcessos from './AdminAcessos.jsx'
import { supabase, buscarPerfil } from './supabase.js'
import {
  RELATORIOS, DIRETORIAS, PROCESSO,
} from './data.js'

function Tag({ sigla, onOpenSagep }) {
  const d = DIRETORIAS[sigla] || { sigla, cor: '#07547b' }
  const isSagep = sigla === 'SAGEP'
  return (
    <span
      className={`tag ${isSagep ? 'tag--sagep-clicavel' : ''}`}
      style={{ '--c': d.cor }}
      onClick={(e) => {
        if (isSagep && onOpenSagep) {
          e.stopPropagation()
          onOpenSagep()
        }
      }}
      title={isSagep ? 'Clique para abrir o documento detalhado da SAGEP (PDF / Apresentação)' : undefined}
    >
      {d.sigla}
    </span>
  )
}

function Campo({ rotulo, texto }) {
  if (!texto) return null
  return <p><strong>{rotulo}:</strong> {texto}</p>
}

function CardSagep({ onOpenSagep }) {
  return (
    <button
      id="card-SAGEP"
      type="button"
      className="card card--sagep-destaque"
      onClick={onOpenSagep}
    >
      <div className="card__head">
        <span className="card__id card__id--sagep">SAGEP</span>
        <span className="card__prazo card__prazo--sagep">DOCUMENTO OFICIAL &bull; 11 PÁGINAS</span>
      </div>
      <h3 className="card__titulo">Estrutura organizacional e escopo de atuação</h3>
      <div className="card__texto">
        <Campo rotulo="Gabinete" texto="Estrutura e fluxos de processos, chefia e Núcleos de Conformidade." />
        <Campo rotulo="Diretorias" texto="DIPSE, DIOP e DIFOB com suas respectivas coordenadorias." />
        <Campo rotulo="Coordenadorias" texto="Vinculações, atribuições e eixos operacionais das equipes." />
        <Campo rotulo="Formato" texto="Janela interativa com 11 slides em alta resolução e PDF integrado." />
      </div>
      <div className="card__resp">
        <span className="card__resp-rot">Secretaria Adjunta de Gestão de Pessoas</span>
        <p className="card__resp-txt">Hellen Nyde da Silva e Souza (Secretária Adjunta)</p>
        <p className="card__resp-sub">Documento-base da transição governamental 2026/2027</p>
        <span className="dados-badge dados-badge--sagep">
          ★ Clique para abrir a visão detalhada (PDF / Slides)
        </span>
      </div>
      <div className="card__foot">
        <div className="tags">
          <span className="tag tag--sagep">SAGEP</span>
          <span className="tag tag--diop">DIOP</span>
          <span className="tag tag--dipse">DIPSE</span>
          <span className="tag tag--difob">DIFOB</span>
        </div>
      </div>
      <span className="card__abrir card__abrir--sagep" aria-hidden>Abrir visão detalhada ›</span>
    </button>
  )
}

function Card({ r, onOpen, onOpenSagep }) {
  const { unidade, colab } = resumoCapa(r.id)
  const ok = temDados(r.id)
  return (
    <button
      id={`card-${r.id}`}
      className={`card ${r.prioridade ? 'card--prio' : ''}`}
      onClick={() => onOpen(r.id)}
    >
      <div className="card__head">
        <span className="card__id">{r.id}</span>
        <span className={`card__prazo ${r.prioridade ? 'card__prazo--prio' : ''}`}>{r.prazo}</span>
      </div>
      <h3 className="card__titulo">{r.titulo}</h3>
      <div className="card__texto">
        <Campo rotulo="Entregar" texto={r.entregar} />
        <Campo rotulo="Incluir" texto={r.incluir} />
        <Campo rotulo="Separar" texto={r.separar} />
        <Campo rotulo="Indicadores" texto={r.indicadores} />
        <Campo rotulo="Apoio" texto={r.apoio} />
      </div>
      <div className="card__resp">
        <span className="card__resp-rot">Unidade / coordenação</span>
        <p className="card__resp-txt">{unidade || r.diretorias.join(' / ')}</p>
        {colab && <p className="card__resp-sub">{colab}</p>}
        <span className={`dados-badge ${ok ? 'dados-badge--ok' : ''}`}>
          {ok ? '● Dados da planilha disponíveis' : '○ Aguardando dados da diretoria'}
        </span>
      </div>
      <div className="card__foot">
        <div className="tags">
          {r.diretorias.map((d) => (
            <Tag key={d} sigla={d} onOpenSagep={onOpenSagep} />
          ))}
        </div>
      </div>
      <span className="card__abrir" aria-hidden>Abrir ›</span>
    </button>
  )
}

function Detalhe({ r, onBack, onOpenSagep }) {
  const imprimir = () => {
    window.print()
  }

  return (
    <main className="container detalhe">
      <div className="detalhe__barra-topo">
        <button id="btn-voltar" className="voltar" onClick={onBack}>‹ Voltar ao painel</button>
        <button id="btn-imprimir" className="btn-imprimir" onClick={imprimir} title="Imprimir Relatório Oficial em PDF">
          <svg className="btn-imprimir__svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          <span>Imprimir Relatório (PDF)</span>
        </button>
      </div>

      {/* Cabeçalho Oficial de Impressão / PDF */}
      <div className="relatorio-print-header">
        <div className="relatorio-print-header__brand">
          <img className="relatorio-print-header__brasao" src={brasao} alt="Brasão do Estado do Pará" />
          <div className="relatorio-print-header__textos">
            <span className="relatorio-print-header__governo">GOVERNO DO ESTADO DO PARÁ</span>
            <span className="relatorio-print-header__seduc">SECRETARIA DE ESTADO DE EDUCAÇÃO – SEDUC</span>
            <span className="relatorio-print-header__sagep">SAGEP – SECRETARIA ADJUNTA DE GESTÃO DE PESSOAS</span>
            <h2 className="relatorio-print-header__doc">RELATÓRIO DE TRANSIÇÃO GOVERNAMENTAL 2026/2027</h2>
          </div>
        </div>
        <div className="relatorio-print-header__card">
          <div className="relatorio-print-header__id">{r.id}</div>
          <div className="relatorio-print-header__metadados">
            <div><strong>Diretoria:</strong> {r.diretorias.join(' / ')}</div>
            <div><strong>Prazo Oficial:</strong> {r.prazo}</div>
            <div><strong>Data de Emissão:</strong> {new Date().toLocaleDateString('pt-BR')}</div>
          </div>
        </div>
      </div>

      <section className={`painel ${r.prioridade ? 'painel--prio' : ''}`}>
        <div className="card__head">
          <span className="card__id card__id--lg">{r.id}</span>
          <span className={`card__prazo ${r.prioridade ? 'card__prazo--prio' : ''}`}>{r.prazo}</span>
        </div>
        <h1 className="detalhe__titulo">{r.titulo}</h1>
        <div className="tags">
          {r.diretorias.map((d) => <Tag key={d} sigla={d} onOpenSagep={onOpenSagep} />)}
        </div>
      </section>

      <Painel id={r.id} />

      {/* Área de Créditos em Tela */}
      <footer className="rodape rodape--detalhe">
        <div className="rodape__creditos">
          <span><strong>Coordenação técnica:</strong> Prof. Francisco Augusto Lima Paes</span>
          <span><strong>Desenvolvedor:</strong> Luan Giuliano Araújo Furtado</span>
        </div>
      </footer>

      {/* Rodapé Oficial de Impressão */}
      <footer className="relatorio-print-footer">
        <p>Governo do Estado do Pará • Secretaria de Estado de Educação (SEDUC) • Secretaria Adjunta de Gestão de Pessoas (SAGEP)</p>
        <p>Painel de Transição Governamental • {r.id} - {r.titulo} • Emissão: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
        <p className="relatorio-print-footer__dev">Coordenação técnica: Prof. Francisco Augusto Lima Paes &bull; Desenvolvedor: Luan Giuliano Araújo Furtado</p>
      </footer>
    </main>
  )
}

export default function App() {
  const [usuario, setUsuario] = useState(null)
  const [verificandoSessao, setVerificandoSessao] = useState(true)
  const [avisoLogin, setAvisoLogin] = useState('')
  const [adminAberto, setAdminAberto] = useState(false)
  const [pendentes, setPendentes] = useState(0)
  const [aberto, setAberto] = useState(() => window.location.hash.replace('#', '') || null)
  const [filtro, setFiltro] = useState('TODAS')
  const [sagepModalAberto, setSagepModalAberto] = useState(false)

  useEffect(() => {
    if (supabase) {
      // Sessão salva só vale se o perfil estiver aprovado pelo administrador
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          const perfil = await buscarPerfil(session.user.id)
          if (perfil?.status === 'aprovado') {
            setUsuario({ ...session.user, perfil })
          } else {
            await supabase.auth.signOut()
            setAvisoLogin('Seu acesso ainda não está autorizado pelo administrador.')
          }
        }
        setVerificandoSessao(false)
      }).catch(() => {
        setVerificandoSessao(false)
      })

      const { data: { subscription } } = supabase.auth.onAuthStateChange((evento) => {
        if (evento === 'SIGNED_OUT') setUsuario(null)
      })

      return () => subscription?.unsubscribe()
    } else {
      try {
        const demo = localStorage.getItem('sagep_usuario_logado')
        if (demo) setUsuario(JSON.parse(demo))
      } catch {}
      setVerificandoSessao(false)
    }
  }, [])

  useEffect(() => {
    const onHash = () => setAberto(window.location.hash.replace('#', '') || null)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    if (usuario?.perfil?.papel === 'admin' && supabase) {
      supabase.from('perfis').select('user_id', { count: 'exact', head: true }).eq('status', 'pendente')
        .then(({ count }) => setPendentes(count || 0))
    }
  }, [usuario])

  // Atualiza papel/status ao voltar para a aba (ex: após aprovar ou promover admin no Supabase)
  useEffect(() => {
    if (!supabase || !usuario?.id) return
    const sync = async () => {
      const perfil = await buscarPerfil(usuario.id)
      if (!perfil || perfil.status !== 'aprovado') {
        await supabase.auth.signOut()
        setUsuario(null)
        return
      }
      if (perfil.papel !== usuario.perfil?.papel || perfil.status !== usuario.perfil?.status) {
        setUsuario((u) => (u ? { ...u, perfil } : u))
      }
    }
    window.addEventListener('focus', sync)
    return () => window.removeEventListener('focus', sync)
  }, [usuario?.id, usuario?.perfil?.papel, usuario?.perfil?.status])

  const handleLogin = (user) => {
    setUsuario(user)
    if (!supabase) {
      localStorage.setItem('sagep_usuario_logado', JSON.stringify(user))
    }
  }

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    localStorage.removeItem('sagep_usuario_logado')
    setUsuario(null)
    setAberto(null)
  }

  const abrir = (id) => { window.location.hash = id; window.scrollTo({ top: 0 }) }
  const voltar = () => { history.pushState('', '', window.location.pathname); setAberto(null) }

  const lista = useMemo(
    () => RELATORIOS.filter((r) => filtro === 'TODAS' || r.diretorias.includes(filtro)),
    [filtro],
  )
  const atual = RELATORIOS.find((r) => r.id === aberto)

  if (verificandoSessao) {
    return (
      <div className="sessao-loading">
        <div className="sessao-loading__spinner" />
        <span className="sessao-loading__txt">Verificando autenticação no SAGEP...</span>
      </div>
    )
  }

  if (!usuario) {
    return <Login onLogin={handleLogin} aviso={avisoLogin} />
  }

  return (
    <>
      {/* Barra Superior do Usuário Conectado */}
      <div className="barra-usuario-topo">
        <div className="container barra-usuario-topo__inner">
          <div className="barra-usuario-topo__info">
            <span className="barra-usuario-topo__dot" title="Sessão ativa" />
            <span className="barra-usuario-topo__email">{usuario.email}</span>
            {usuario.user_metadata?.nome && (
              <span className="barra-usuario-topo__nome">({usuario.user_metadata.nome})</span>
            )}
            {!supabase && (
              <span className="barra-usuario-topo__modo-local" title="Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY na Vercel e faça Redeploy">
                Modo local (sem Supabase)
              </span>
            )}
          </div>
          <div className="barra-usuario-topo__acoes">
            {usuario.perfil?.papel === 'admin' && (
              <button type="button" className="barra-usuario-topo__btn-adm" onClick={() => setAdminAberto(true)}>
                Gestão de acessos
                {pendentes > 0 && <span className="adm-badge">{pendentes}</span>}
              </button>
            )}
            <button
              type="button"
              className="barra-usuario-topo__btn-sair"
              onClick={handleLogout}
              title="Encerrar sessão no sistema"
            >
              Sair / Logout
            </button>
          </div>
        </div>
      </div>

      {usuario.perfil?.papel === 'admin' && (
        <AdminAcessos
          aberto={adminAberto}
          onClose={() => setAdminAberto(false)}
          adminEmail={usuario.email}
          onContagem={setPendentes}
        />
      )}

      <header className="hero">
        <div className="container hero__inner">
          <div className="hero__texto">
            <p className="hero__eyebrow">Secretaria de Estado de Educação do Pará</p>
            <h1 className="hero__titulo">SAGEP &bull; SECRETARIA ADJUNTA DE GESTÃO DE PESSOAS</h1>
            <div className="hero__red-bar" aria-hidden="true" />
            <p className="hero__sub">Estrutura Organizacional, Escopo de Atuação e Relatórios de Transição</p>
            <div className="hero__meta">
              <span className="hero__badge-pae">{PROCESSO}</span>
              <span>{RELATORIOS.length} relatórios principais</span>
              <span>&bull;</span>
              <span>Bloco F &bull; Gestão de Pessoas</span>
            </div>
          </div>
          <img className="hero__brasao" src={brasao} alt="Brasão do Estado do Pará" />
        </div>
      </header>

      {atual ? (
        <Detalhe r={atual} onBack={voltar} onOpenSagep={() => setSagepModalAberto(true)} />
      ) : (
        <main className="container">
          <nav className="filtros" aria-label="Filtrar por diretoria">
            {['TODAS', ...Object.keys(DIRETORIAS)].map((f) => {
              const isSagep = f === 'SAGEP'
              return (
                <button
                  key={f}
                  id={`filtro-${f}`}
                  className={`filtro ${filtro === f ? 'filtro--on' : ''} ${isSagep ? 'filtro--sagep' : ''}`}
                  onClick={() => {
                    if (isSagep) {
                      setSagepModalAberto(true)
                    } else {
                      setFiltro(f)
                    }
                  }}
                  title={isSagep ? 'Abrir Estrutura e Escopo da SAGEP (PDF e Apresentação)' : `Filtrar por ${f}`}
                >
                  {isSagep ? (
                    <>
                      <span className="filtro__dot-sagep">●</span>
                      <span>SAGEP</span>
                      <span className="filtro__tag-doc">Visão PDF</span>
                    </>
                  ) : (
                    f === 'TODAS' ? 'Todas as Diretorias' : f
                  )}
                </button>
              )
            })}
          </nav>

          <section className="grid" aria-label="Relatórios do Bloco F">
            {(filtro === 'TODAS' || filtro === 'SAGEP') && (
              <CardSagep onOpenSagep={() => setSagepModalAberto(true)} />
            )}
            {lista.map((r) => (
              <Card key={r.id} r={r} onOpen={abrir} onOpenSagep={() => setSagepModalAberto(true)} />
            ))}
          </section>

          <footer className="rodape">
            <div className="rodape__creditos">
              <span><strong>Coordenação técnica:</strong> Prof. Francisco Augusto Lima Paes</span>
              <span><strong>Desenvolvedor:</strong> Luan Giuliano Araújo Furtado</span>
            </div>
            <p><strong>Fonte:</strong> {PROCESSO}; seq. 03, seção 6.6 / Quadro 12, pp. 36–39; J-06, p. 50; padrões e cronograma, pp. 12–14 e 19–20; seq. 02, p. 2; despacho seq. 05, pp. 2–3.</p>
            <p><strong>Nota:</strong> SAGP é a sigla do plano; SAGEP é a sigla usada no despacho. Os produtos acima são uma síntese operacional dos conteúdos exigidos, sem substituir o detalhamento do processo.</p>
          </footer>
        </main>
      )}

      {/* Janela Modal do PDF / Apresentação da SAGEP */}
      <SagepModal aberto={sagepModalAberto} onClose={() => setSagepModalAberto(false)} />
    </>
  )
}
