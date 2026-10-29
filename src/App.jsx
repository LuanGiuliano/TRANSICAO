import { useEffect, useMemo, useState } from 'react'
import brasao from './assets/brasao.png'
import Painel, { resumoCapa, temDados } from './paineis.jsx'
import {
  RELATORIOS, DIRETORIAS, PROCESSO,
  ALEM_BLOCO_F, PADRAO_COMUM, AVISO_PRAZOS,
} from './data.js'


function Tag({ sigla }) {
  const d = DIRETORIAS[sigla]
  return <span className="tag" style={{ '--c': d.cor }}>{d.sigla}</span>
}

function Campo({ rotulo, texto }) {
  if (!texto) return null
  return <p><strong>{rotulo}:</strong> {texto}</p>
}

function Card({ r, onOpen }) {
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
        <div className="tags">{r.diretorias.map((d) => <Tag key={d} sigla={d} />)}</div>
      </div>
      <span className="card__abrir" aria-hidden>Abrir ›</span>
    </button>
  )
}

function Detalhe({ r, onBack }) {
  return (
    <main className="container detalhe">
      <button id="btn-voltar" className="voltar" onClick={onBack}>‹ Voltar ao painel</button>
      <section className={`painel ${r.prioridade ? 'painel--prio' : ''}`}>
        <div className="card__head">
          <span className="card__id card__id--lg">{r.id}</span>
          <span className={`card__prazo ${r.prioridade ? 'card__prazo--prio' : ''}`}>{r.prazo}</span>
        </div>
        <h1 className="detalhe__titulo">{r.titulo}</h1>
        <div className="tags" style={{ marginBottom: 18 }}>
          {r.diretorias.map((d) => <Tag key={d} sigla={d} />)}
        </div>
        <div className="card__texto card__texto--lg">
          <Campo rotulo="Entregar" texto={r.entregar} />
          <Campo rotulo="Incluir" texto={r.incluir} />
          <Campo rotulo="Separar" texto={r.separar} />
          <Campo rotulo="Indicadores" texto={r.indicadores} />
          <Campo rotulo="Apoio" texto={r.apoio} />
        </div>
      </section>

      <Painel id={r.id} />

      <section className="painel painel--soft">
        <h2 className="painel__titulo">Padrão comum para todas as entregas</h2>
        <p>{PADRAO_COMUM}</p>
      </section>
    </main>
  )
}

export default function App() {
  const [aberto, setAberto] = useState(() => window.location.hash.replace('#', '') || null)
  const [filtro, setFiltro] = useState('TODAS')

  useEffect(() => {
    const onHash = () => setAberto(window.location.hash.replace('#', '') || null)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const abrir = (id) => { window.location.hash = id; window.scrollTo({ top: 0 }) }
  const voltar = () => { history.pushState('', '', window.location.pathname); setAberto(null) }

  const lista = useMemo(
    () => RELATORIOS.filter((r) => filtro === 'TODAS' || r.diretorias.includes(filtro)),
    [filtro],
  )
  const atual = RELATORIOS.find((r) => r.id === aberto)

  return (
    <>
      <header className="hero">
        <div className="container hero__inner">
          <div className="hero__texto">
          <p className="hero__eyebrow">Transição governamental • Educação / Pará</p>
          <h1 className="hero__titulo">SAGP / SAGEP</h1>
          <h2 className="hero__sub">Mapa de solicitações e entregas</h2>
          <p className="hero__meta">
            {RELATORIOS.length} relatórios principais • Bloco F • {PROCESSO}
          </p>
          </div>
          <img className="hero__brasao" src={brasao} alt="Brasão do Estado do Pará" />
        </div>
      </header>

      {atual ? (
        <Detalhe r={atual} onBack={voltar} />
      ) : (
        <main className="container">
          <section className="aviso">
            <h2>{AVISO_PRAZOS.titulo}</h2>
            <p><strong>Quadro 12:</strong> {AVISO_PRAZOS.quadro}</p>
            <p><strong>Atenção:</strong> {AVISO_PRAZOS.atencao}</p>
          </section>

          <nav className="filtros" aria-label="Filtrar por diretoria">
            {['TODAS', ...Object.keys(DIRETORIAS)].map((f) => (
              <button
                key={f}
                id={`filtro-${f}`}
                className={`filtro ${filtro === f ? 'filtro--on' : ''}`}
                onClick={() => setFiltro(f)}
              >
                {f === 'TODAS' ? 'Todas' : f}
              </button>
            ))}
          </nav>

          <section className="grid" aria-label="Relatórios do Bloco F">
            {lista.map((r) => (
              <Card key={r.id} r={r} onOpen={abrir} />
            ))}
          </section>

          <section className="alem">
            <h2>{ALEM_BLOCO_F.titulo}</h2>
            <p><strong>J-06:</strong> {ALEM_BLOCO_F.j06}</p>
            <p><strong>Interfaces:</strong> {ALEM_BLOCO_F.interfaces}</p>
          </section>

          <section className="padrao">
            <h2>Padrão comum para todas as entregas</h2>
            <p>{PADRAO_COMUM}</p>
          </section>

          <footer className="rodape">
            <p><strong>Fonte:</strong> {PROCESSO}; seq. 03, seção 6.6 / Quadro 12, pp. 36–39; J-06, p. 50; padrões e cronograma, pp. 12–14 e 19–20; seq. 02, p. 2; despacho seq. 05, pp. 2–3.</p>
            <p><strong>Nota:</strong> SAGP é a sigla do plano; SAGEP é a sigla usada no despacho. Os produtos acima são uma síntese operacional dos conteúdos exigidos, sem substituir o detalhamento do processo.</p>
          </footer>
        </main>
      )}
    </>
  )
}
