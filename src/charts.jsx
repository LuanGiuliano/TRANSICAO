import { useState } from 'react'
import { createPortal } from 'react-dom'

export const PALETA = ['#00838a', '#153a4d', '#c4841d', '#7b5ea7', '#2e9e6b', '#c0504d', '#2f6690', '#8a9aa6', '#d1a23a', '#35c0c6']

export const fmt = (n, d = 0) =>
  n == null ? '–' : Number(n).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })

export const fmtMoeda = (n) => {
  if (n == null) return '–'
  const v = Number(n)
  if (Math.abs(v) >= 1e9) return `R$ ${(v / 1e9).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bi`
  if (Math.abs(v) >= 1e6) return `R$ ${(v / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Mi`
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export const fmtBRL = (n) =>
  n == null ? '–' : Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** Formatação inteligente de rótulos para gráficos sem quebrar o nome legal no tooltip */
export function formatarRotuloVisual(r) {
  if (!r) return ''
  let s = String(r).trim()

  // Limpezas de prefixos redundantes
  s = s.replace(/^TEMPORARIOS ATIVOS -\s*/i, '')
  s = s.replace(/^DRE\s+/i, '')

  // Casos específicos de concatenação excessiva na planilha (F-03 / F-01)
  if (/PROFESSOR CLASSE ESPECIAL.*CLASSE I/i.test(s) || /CLASSE ESPECIAL.*CLASSE IV/i.test(s)) {
    return 'Prof. Classe Especial e Classes I a IV'
  }
  if (/ESPECIALISTA EM EDUCA[CÇ][AÃ]O CLASSE I.*CLASSE IV/i.test(s)) {
    return 'Especialista em Educação (Classes I a IV)'
  }
  if (/PROFESSOR ASSISTENTE PA-A/i.test(s)) {
    return 'Professor Assistente (PA-A a PA-D)'
  }
  if (/ASSISTENTE DE GEST[AÃ]O GOVERNAMENTAL E EDUCACIONAL B/i.test(s)) {
    return 'Assist. Gestão Governamental B'
  }
  if (/ASSISTENTE DE GEST[AÃ]O GOVERNAMENTAL E EDUCACIONAL A/i.test(s)) {
    return 'Assist. Gestão Governamental A'
  }
  if (/AUXILIAR OPERACIONAL E EDUCACIONAL B/i.test(s)) {
    return 'Aux. Operacional e Educacional B'
  }
  if (/AUXILIAR OPERACIONAL E EDUCACIONAL A/i.test(s)) {
    return 'Aux. Operacional e Educacional A'
  }
  if (/ESCREVENTE DATILOGRAFO/i.test(s)) {
    return 'Escrevente Datilógrafo Ref. III'
  }
  if (/LGG - APROF DE AREAS DE LINGUAGENS/i.test(s)) {
    return 'LGG - Aprofundamento Linguagens'
  }
  if (/MAT - APROF DE AREAS DE/i.test(s)) {
    return 'MAT - Aprofundamento Matemática'
  }
  if (/CHSA - APROF DE AREAS DE CIENCIAS HUMANAS/i.test(s)) {
    return 'CHSA - Aprofundamento Humanas'
  }
  if (/CHSA - APROF DE AREAS DE LINGUAGENS/i.test(s)) {
    return 'CHSA - Aprofundamento Linguagens'
  }
  if (/EDUCACAO AMBIENTAL, SUSTENTABILIDADE E CLIMA/i.test(s)) {
    return 'Educação Ambiental e Clima'
  }
  if (/READAPT CLASSE NORMAL/i.test(s)) {
    return 'Readaptado Classe Normal'
  }
  if (/AGUARD APOSENT CLASSE ESP/i.test(s)) {
    return 'Aguardando Aposentadoria Cl. Especial'
  }

  // Capitalização suave quando em maiúsculas
  if (s === s.toUpperCase() && s.length > 3) {
    s = s.toLowerCase().replace(/(?:^|\s)\S/g, (a) => a.toUpperCase())
  }

  return s
}

/** Tooltip padronizado do SAGEP renderizado via Portal (sem caixa preta do navegador) */
export function CustomTooltip({ info }) {
  if (!info || typeof document === 'undefined') return null
  return createPortal(
    <div
      className="custom-tooltip"
      style={{
        left: info.x,
        top: info.y,
      }}
    >
      <div className="custom-tooltip__head">
        {info.cor && <span className="custom-tooltip__dot" style={{ background: info.cor }} />}
        <strong className="custom-tooltip__titulo">{info.titulo}</strong>
      </div>
      {info.serie && <div className="custom-tooltip__serie">{info.serie}</div>}
      <div className="custom-tooltip__corpo">
        <span className="custom-tooltip__valor">{info.valor}</span>
        {info.pct && <span className="custom-tooltip__pct">{info.pct}</span>}
      </div>
      {info.extra && <div className="custom-tooltip__extra">{info.extra}</div>}
    </div>,
    document.body
  )
}

export function Kpi({ rotulo, valor, sub, cor = 'var(--teal)' }) {
  return (
    <div className="kpi" style={{ '--c': cor }}>
      <span className="kpi__rotulo">{rotulo}</span>
      <strong className="kpi__valor">{valor}</strong>
      {sub && <span className="kpi__sub">{sub}</span>}
    </div>
  )
}

export function Bloco({ titulo, nota, extra, children, span }) {
  return (
    <section className={`bloco ${span ? 'bloco--' + span : ''}`}>
      <div className="bloco__head">
        <div className="bloco__titulo-linha">
          <h3 className="bloco__titulo">{titulo}</h3>
          {extra && <div className="bloco__extra">{extra}</div>}
        </div>
        {nota && <p className="bloco__nota">{nota}</p>}
      </div>
      {children}
    </section>
  )
}

export function LimiteControle({ total, limite, onChange, opcoes = [15, 50, 'Todos'] }) {
  if (!total || total <= opcoes[0]) return null
  return (
    <div className="limite-ctrl">
      <span className="limite-ctrl__rotulo">Ver:</span>
      <div className="limite-ctrl__botoes">
        {opcoes.map((op) => {
          const ativo = limite === op
          const label = op === 'Todos' ? `Todos (${total})` : op >= total ? `Todos (${total})` : `${op}`
          return (
            <button
              key={String(op)}
              type="button"
              className={`limite-ctrl__btn ${ativo ? 'limite-ctrl__btn--ativo' : ''}`}
              onClick={() => onChange(op)}
              title={undefined}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function aplicarLimite(lista, limite) {
  if (!lista) return []
  if (limite === 'Todos') return lista
  const n = typeof limite === 'number' ? limite : parseInt(limite, 10)
  return n > 0 ? lista.slice(0, n) : lista
}

/** Barras horizontais com tooltip integrado e rótulos otimizados */
export function HBars({ dados, cor = 'var(--teal)', unidade = '', max }) {
  const [tooltip, setTooltip] = useState(null)
  const m = max ?? Math.max(...dados.map((d) => d[1]), 1)
  const longo = dados.length > 16

  const handleEnter = (e, r, v) => {
    setTooltip({
      x: e.clientX,
      y: e.clientY,
      titulo: r,
      valor: `${fmt(v)}${unidade}`,
      cor,
    })
  }

  const handleMove = (e) => {
    setTooltip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : null))
  }

  const handleLeave = () => {
    setTooltip(null)
  }

  return (
    <div className={`hbars-wrap ${longo ? 'hbars-wrap--scroll' : ''}`}>
      <ul className="hbars" onMouseMove={handleMove}>
        {dados.map(([r, v], i) => {
          const rotuloVisual = formatarRotuloVisual(r)
          return (
            <li
              key={r + i}
              onMouseEnter={(e) => handleEnter(e, r, v)}
              onMouseLeave={handleLeave}
            >
              <span className="hbars__r" title={undefined}>{rotuloVisual}</span>
              <span className="hbars__trilho">
                <i style={{ width: `${(v / m) * 100}%`, background: cor, animationDelay: `${Math.min(i, 15) * 30}ms` }} />
              </span>
              <b className="hbars__v">{fmt(v)}{unidade}</b>
            </li>
          )
        })}
      </ul>
      <CustomTooltip info={tooltip} />
    </div>
  )
}

/** Barras horizontais com percentual do total e tooltip */
export function HBarsPct({ dados, cor = 'var(--teal)' }) {
  const [tooltip, setTooltip] = useState(null)
  const total = dados.reduce((s, d) => s + d[1], 0) || 1
  const m = Math.max(...dados.map((d) => d[1]), 1)
  const longo = dados.length > 16

  const handleEnter = (e, r, v) => {
    const pct = `${fmt((v / total) * 100, 1)}%`
    setTooltip({
      x: e.clientX,
      y: e.clientY,
      titulo: r,
      valor: fmt(v),
      pct,
      cor,
    })
  }

  const handleMove = (e) => {
    setTooltip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : null))
  }

  const handleLeave = () => {
    setTooltip(null)
  }

  return (
    <div className={`hbars-wrap ${longo ? 'hbars-wrap--scroll' : ''}`}>
      <ul className="hbars hbars--pct" onMouseMove={handleMove}>
        {dados.map(([r, v], i) => {
          const rotuloVisual = formatarRotuloVisual(r)
          return (
            <li
              key={r + i}
              onMouseEnter={(e) => handleEnter(e, r, v)}
              onMouseLeave={handleLeave}
            >
              <span className="hbars__r">{rotuloVisual}</span>
              <span className="hbars__trilho">
                <i style={{ width: `${(v / m) * 100}%`, background: cor, animationDelay: `${Math.min(i, 15) * 30}ms` }} />
              </span>
              <b className="hbars__v">{fmt(v)} <small>{fmt((v / total) * 100, 1)}%</small></b>
            </li>
          )
        })}
      </ul>
      <CustomTooltip info={tooltip} />
    </div>
  )
}

/** Rosca em SVG com tooltip interativo e sem caixas pretas */
export function Donut({ dados, centro, sub }) {
  const [tooltip, setTooltip] = useState(null)
  const total = dados.reduce((s, d) => s + d[1], 0) || 1
  const R = 15.915
  let acc = 0

  const handleMove = (e) => {
    setTooltip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : null))
  }

  return (
    <div className="donut" onMouseMove={handleMove}>
      <svg viewBox="0 0 42 42" className="donut__svg" role="img">
        <circle cx="21" cy="21" r={R} fill="none" stroke="#e8eef2" strokeWidth="6" />
        {dados.map(([r, v], i) => {
          const pct = (v / total) * 100
          const cor = PALETA[i % PALETA.length]
          const el = (
            <circle
              key={r}
              cx="21"
              cy="21"
              r={R}
              fill="none"
              stroke={cor}
              strokeWidth="6"
              strokeDasharray={`${pct} ${100 - pct}`}
              strokeDashoffset={25 - acc}
              style={{ cursor: 'pointer', transition: 'stroke-width .2s, opacity .2s' }}
              onMouseEnter={(e) => setTooltip({
                x: e.clientX,
                y: e.clientY,
                titulo: r,
                valor: fmt(v),
                pct: `${fmt(pct, 1)}%`,
                cor,
              })}
              onMouseLeave={() => setTooltip(null)}
            />
          )
          acc += pct
          return el
        })}
        <text x="21" y="21.5" textAnchor="middle" className="donut__c">{centro ?? fmt(total)}</text>
        {sub && <text x="21" y="26" textAnchor="middle" className="donut__s">{sub}</text>}
      </svg>
      <ul className="legenda">
        {dados.map(([r, v], i) => {
          const cor = PALETA[i % PALETA.length]
          const pct = `${fmt((v / total) * 100, 1)}%`
          return (
            <li
              key={r}
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => setTooltip({ x: e.clientX, y: e.clientY, titulo: r, valor: fmt(v), pct, cor })}
              onMouseLeave={() => setTooltip(null)}
            >
              <i style={{ background: cor }} />
              <span>{formatarRotuloVisual(r)}</span>
              <b>{fmt(v)} <small>({pct})</small></b>
            </li>
          )
        })}
      </ul>
      <CustomTooltip info={tooltip} />
    </div>
  )
}

/** Colunas agrupadas/empilhadas com tooltip */
export function Colunas({ categorias, series, altura = 190 }) {
  const [tooltip, setTooltip] = useState(null)
  const totais = categorias.map((_, i) => series.reduce((s, x) => s + (x.valores[i] || 0), 0))
  const m = Math.max(...totais, 1)

  const handleMove = (e) => {
    setTooltip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : null))
  }

  return (
    <div className="colunas" style={{ height: altura + 46 }} onMouseMove={handleMove}>
      {categorias.map((c, i) => (
        <div className="colunas__col" key={c}>
          <b className="colunas__tot">{fmt(totais[i])}</b>
          <div className="colunas__pilha" style={{ height: altura }}>
            {series.map((s, j) => {
              const val = s.valores[i] || 0
              const cor = PALETA[j % PALETA.length]
              return (
                <i
                  key={s.nome}
                  style={{
                    height: `${(val / m) * 100}%`,
                    background: cor,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => setTooltip({
                    x: e.clientX,
                    y: e.clientY,
                    titulo: c,
                    serie: s.nome,
                    valor: fmt(val),
                    cor,
                  })}
                  onMouseLeave={() => setTooltip(null)}
                />
              )
            })}
          </div>
          <span className="colunas__r">{formatarRotuloVisual(c)}</span>
        </div>
      ))}
      {series.length > 1 && (
        <ul className="legenda legenda--h">
          {series.map((s, j) => (
            <li key={s.nome}><i style={{ background: PALETA[j % PALETA.length] }} />{s.nome}</li>
          ))}
        </ul>
      )}
      <CustomTooltip info={tooltip} />
    </div>
  )
}

export function Abas({ opcoes, valor, onChange }) {
  return (
    <div className="abas" role="tablist">
      {opcoes.map((o) => (
        <button key={o} role="tab" aria-selected={valor === o}
          className={`aba ${valor === o ? 'aba--on' : ''}`} onClick={() => onChange(o)}>{o}</button>
      ))}
    </div>
  )
}

/* ---------- Gráficos SVG com eixos e tooltips ---------- */
const W = 640, M = { l: 46, r: 14, t: 26, b: 34 }

function escala(max) {
  const bruto = max / 5
  const pot = 10 ** Math.floor(Math.log10(bruto || 1))
  const passo = [1, 2, 2.5, 5, 10].map((f) => f * pot).find((p) => p >= bruto) || pot
  const topo = Math.ceil(max / passo) * passo
  return { passo, topo, ticks: Array.from({ length: Math.round(topo / passo) + 1 }, (_, i) => i * passo) }
}

function Eixos({ H, esc, y }) {
  return (
    <g>
      {esc.ticks.map((t) => (
        <g key={t}>
          <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} stroke={t === 0 ? '#9fb2bd' : '#e3eaee'} strokeWidth="1" />
          <text x={M.l - 8} y={y(t) + 3.5} textAnchor="end" className="ax__t">{fmt(t)}</text>
        </g>
      ))}
    </g>
  )
}

function LegendaH({ series, cores }) {
  if (series.length < 2) return null
  return (
    <ul className="legenda legenda--h" style={{ marginBottom: 6 }}>
      {series.map((s, j) => <li key={s.nome}><i style={{ background: cores[j] }} />{s.nome}</li>)}
    </ul>
  )
}

/** Colunas empilhadas com eixo Y, grade e tooltip padronizado */
export function ColunasEixo({ categorias, series, altura = 280, cores = PALETA, destaque }) {
  const [tooltip, setTooltip] = useState(null)
  const H = altura
  const totais = categorias.map((_, i) => series.reduce((s, x) => s + (x.valores[i] || 0), 0))
  const esc = escala(Math.max(...totais, 1))
  const y = (v) => M.t + (1 - v / esc.topo) * (H - M.t - M.b)
  const banda = (W - M.l - M.r) / categorias.length
  const larg = Math.min(banda * 0.64, 56)
  const iMax = destaque ? totais.indexOf(Math.max(...totais)) : -1

  const handleMove = (e) => {
    setTooltip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : null))
  }

  return (
    <div className="grafico" onMouseMove={handleMove}>
      <LegendaH series={series} cores={cores} />
      <svg viewBox={`0 0 ${W} ${H}`} className="grafico__svg" role="img">
        <Eixos H={H} esc={esc} y={y} />
        {categorias.map((c, i) => {
          const x = M.l + banda * i + (banda - larg) / 2
          let acc = 0
          return (
            <g key={c} className="gcol">
              {series.map((s, j) => {
                const v = s.valores[i] || 0
                const y0 = y(acc), y1 = y(acc + v)
                acc += v
                const h = y0 - y1
                const cor = destaque && i === iMax ? '#c4841d' : cores[j % cores.length]
                return (
                  <g key={s.nome}>
                    <rect
                      x={x}
                      y={y1}
                      width={larg}
                      height={Math.max(h, 0)}
                      rx={j === series.length - 1 ? 4 : 0}
                      fill={cor}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => setTooltip({
                        x: e.clientX,
                        y: e.clientY,
                        titulo: c,
                        serie: s.nome,
                        valor: fmt(v),
                        cor,
                      })}
                      onMouseLeave={() => setTooltip(null)}
                    />
                    {series.length > 1 && h > 17 && larg > 26 && (
                      <text x={x + larg / 2} y={y1 + h / 2 + 3.5} textAnchor="middle" className="ax__in">{fmt(v)}</text>
                    )}
                  </g>
                )
              })}
              <text x={x + larg / 2} y={y(totais[i]) - 6} textAnchor="middle" className="ax__v">{fmt(totais[i])}</text>
              <text x={x + larg / 2} y={H - M.b + 17} textAnchor="middle" className="ax__x">{formatarRotuloVisual(c)}</text>
            </g>
          )
        })}
      </svg>
      <CustomTooltip info={tooltip} />
    </div>
  )
}

/** Linhas comparativas com pontos e tooltip institucional */
export function Linhas({ categorias, series, altura = 280, cores = ['#8a9aa6', '#00838a', '#c4841d'] }) {
  const [tooltip, setTooltip] = useState(null)
  const H = altura
  const todos = series.flatMap((s) => s.valores.filter((v) => v != null))
  const esc = escala(Math.max(...todos, 1))
  const y = (v) => M.t + (1 - v / esc.topo) * (H - M.t - M.b)
  const banda = (W - M.l - M.r) / categorias.length
  const x = (i) => M.l + banda * i + banda / 2

  const handleMove = (e) => {
    setTooltip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : null))
  }

  return (
    <div className="grafico" onMouseMove={handleMove}>
      <LegendaH series={series} cores={cores} />
      <svg viewBox={`0 0 ${W} ${H}`} className="grafico__svg" role="img">
        <Eixos H={H} esc={esc} y={y} />
        {categorias.map((c, i) => <text key={c} x={x(i)} y={H - M.b + 17} textAnchor="middle" className="ax__x">{formatarRotuloVisual(c)}</text>)}
        {series.map((s, j) => {
          const pts = s.valores.map((v, i) => (v == null ? null : [x(i), y(v), v, categorias[i]])).filter(Boolean)
          const d = pts.map((p, k) => `${k ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ')
          const area = `${d} L${pts[pts.length - 1][0]},${y(0)} L${pts[0][0]},${y(0)} Z`
          const vmax = Math.max(...pts.map((p) => p[2]))
          const cor = cores[j % cores.length]
          return (
            <g key={s.nome}>
              {j === series.length - 1 && <path d={area} fill={cor} opacity=".08" />}
              <path d={d} fill="none" stroke={cor} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
              {pts.map((p, k) => (
                <g key={k}>
                  <circle
                    cx={p[0]}
                    cy={p[1]}
                    r="5"
                    fill="#fff"
                    stroke={cor}
                    strokeWidth="2.6"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={(e) => setTooltip({
                      x: e.clientX,
                      y: e.clientY,
                      titulo: p[3],
                      serie: s.nome,
                      valor: fmt(p[2]),
                      cor,
                    })}
                    onMouseLeave={() => setTooltip(null)}
                  />
                  {p[2] === vmax && <text x={p[0]} y={p[1] - 10} textAnchor="middle" className="ax__v" fill={cor}>{fmt(p[2])}</text>}
                </g>
              ))}
            </g>
          )
        })}
      </svg>
      <CustomTooltip info={tooltip} />
    </div>
  )
}

/** Barra única de proporção (100%) com tooltip */
export function Proporcao({ dados, cores = PALETA }) {
  const [tooltip, setTooltip] = useState(null)
  const total = dados.reduce((s, d) => s + d[1], 0) || 1

  const handleMove = (e) => {
    setTooltip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : null))
  }

  return (
    <div className="prop" onMouseMove={handleMove}>
      <div className="prop__barra">
        {dados.map(([r, v], i) => {
          const cor = cores[i % cores.length]
          const pct = `${fmt((v / total) * 100, 1)}%`
          return (
            <span
              key={r}
              style={{ width: `${(v / total) * 100}%`, background: cor, cursor: 'pointer' }}
              onMouseEnter={(e) => setTooltip({ x: e.clientX, y: e.clientY, titulo: r, valor: fmt(v), pct, cor })}
              onMouseLeave={() => setTooltip(null)}
            >
              {(v / total) > 0.07 && `${fmt((v / total) * 100, 1)}%`}
            </span>
          )
        })}
      </div>
      <ul className="legenda legenda--h">
        {dados.map(([r, v], i) => {
          const cor = cores[i % cores.length]
          const pct = `${fmt((v / total) * 100, 1)}%`
          return (
            <li
              key={r}
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => setTooltip({ x: e.clientX, y: e.clientY, titulo: r, valor: fmt(v), pct, cor })}
              onMouseLeave={() => setTooltip(null)}
            >
              <i style={{ background: cor }} />
              <span>{formatarRotuloVisual(r)}</span>
              <b>{fmt(v)}</b> <small>({pct})</small>
            </li>
          )
        })}
      </ul>
      <CustomTooltip info={tooltip} />
    </div>
  )
}
