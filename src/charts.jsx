
export const PALETA = ['#00838a', '#153a4d', '#c4841d', '#7b5ea7', '#2e9e6b', '#c0504d', '#2f6690', '#8a9aa6', '#d1a23a', '#35c0c6']

export const fmt = (n, d = 0) =>
  n == null ? '–' : Number(n).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })

export function Kpi({ rotulo, valor, sub, cor = 'var(--teal)' }) {
  return (
    <div className="kpi" style={{ '--c': cor }}>
      <span className="kpi__rotulo">{rotulo}</span>
      <strong className="kpi__valor">{valor}</strong>
      {sub && <span className="kpi__sub">{sub}</span>}
    </div>
  )
}

export function Bloco({ titulo, nota, children, span }) {
  return (
    <section className={`bloco ${span ? 'bloco--' + span : ''}`}>
      <h3 className="bloco__titulo">{titulo}</h3>
      {nota && <p className="bloco__nota">{nota}</p>}
      {children}
    </section>
  )
}

/** Barras horizontais. dados: [[rótulo, valor], ...] */
export function HBars({ dados, cor = 'var(--teal)', unidade = '', max }) {
  const m = max ?? Math.max(...dados.map((d) => d[1]), 1)
  return (
    <ul className="hbars">
      {dados.map(([r, v], i) => (
        <li key={r + i} title={`${r}: ${fmt(v)}${unidade}`}>
          <span className="hbars__r">{r}</span>
          <span className="hbars__trilho">
            <i style={{ width: `${(v / m) * 100}%`, background: cor, animationDelay: `${i * 40}ms` }} />
          </span>
          <b className="hbars__v">{fmt(v)}{unidade}</b>
        </li>
      ))}
    </ul>
  )
}

/** Rosca em SVG. dados: [[rótulo, valor], ...] */
export function Donut({ dados, centro, sub }) {
  const total = dados.reduce((s, d) => s + d[1], 0) || 1
  const R = 15.915
  let acc = 0
  return (
    <div className="donut">
      <svg viewBox="0 0 42 42" className="donut__svg" role="img">
        <circle cx="21" cy="21" r={R} fill="none" stroke="#e8eef2" strokeWidth="6" />
        {dados.map(([r, v], i) => {
          const pct = (v / total) * 100
          const el = (
            <circle key={r} cx="21" cy="21" r={R} fill="none" stroke={PALETA[i % PALETA.length]}
              strokeWidth="6" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={25 - acc}>
              <title>{`${r}: ${fmt(v)} (${fmt(pct, 1)}%)`}</title>
            </circle>
          )
          acc += pct
          return el
        })}
        <text x="21" y="21.5" textAnchor="middle" className="donut__c">{centro ?? fmt(total)}</text>
        {sub && <text x="21" y="26" textAnchor="middle" className="donut__s">{sub}</text>}
      </svg>
      <ul className="legenda">
        {dados.map(([r, v], i) => (
          <li key={r}>
            <i style={{ background: PALETA[i % PALETA.length] }} />
            <span>{r}</span>
            <b>{fmt(v)} <small>({fmt((v / total) * 100, 1)}%)</small></b>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Colunas agrupadas/empilhadas. categorias: eixo X; series: [{nome, valores[]}] */
export function Colunas({ categorias, series, altura = 190 }) {
  const totais = categorias.map((_, i) => series.reduce((s, x) => s + (x.valores[i] || 0), 0))
  const m = Math.max(...totais, 1)
  return (
    <div className="colunas" style={{ height: altura + 46 }}>
      {categorias.map((c, i) => (
        <div className="colunas__col" key={c}>
          <b className="colunas__tot">{fmt(totais[i])}</b>
          <div className="colunas__pilha" style={{ height: altura }}>
            {series.map((s, j) => (
              <i key={s.nome} title={`${s.nome}: ${fmt(s.valores[i])}`}
                style={{ height: `${((s.valores[i] || 0) / m) * 100}%`, background: PALETA[j % PALETA.length] }} />
            ))}
          </div>
          <span className="colunas__r">{c}</span>
        </div>
      ))}
      {series.length > 1 && (
        <ul className="legenda legenda--h">
          {series.map((s, j) => <li key={s.nome}><i style={{ background: PALETA[j % PALETA.length] }} />{s.nome}</li>)}
        </ul>
      )}
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

/* ---------- Gráficos SVG com eixos ---------- */
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

/** Colunas empilhadas com eixo Y, grade e rótulos. */
export function ColunasEixo({ categorias, series, altura = 280, cores = PALETA, destaque }) {
  const H = altura
  const totais = categorias.map((_, i) => series.reduce((s, x) => s + (x.valores[i] || 0), 0))
  const esc = escala(Math.max(...totais, 1))
  const y = (v) => M.t + (1 - v / esc.topo) * (H - M.t - M.b)
  const banda = (W - M.l - M.r) / categorias.length
  const larg = Math.min(banda * 0.64, 56)
  const iMax = destaque ? totais.indexOf(Math.max(...totais)) : -1
  return (
    <div className="grafico">
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
                return (
                  <g key={s.nome}>
                    <rect x={x} y={y1} width={larg} height={Math.max(h, 0)} rx={j === series.length - 1 ? 4 : 0}
                      fill={destaque && i === iMax ? '#c4841d' : cores[j % cores.length]}>
                      <title>{`${c} · ${s.nome}: ${fmt(v)}`}</title>
                    </rect>
                    {series.length > 1 && h > 17 && larg > 26 && (
                      <text x={x + larg / 2} y={y1 + h / 2 + 3.5} textAnchor="middle" className="ax__in">{fmt(v)}</text>
                    )}
                  </g>
                )
              })}
              <text x={x + larg / 2} y={y(totais[i]) - 6} textAnchor="middle" className="ax__v">{fmt(totais[i])}</text>
              <text x={x + larg / 2} y={H - M.b + 17} textAnchor="middle" className="ax__x">{c}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/** Linhas comparativas com pontos e rótulos. series: [{nome, valores[]}] (valores podem ser null). */
export function Linhas({ categorias, series, altura = 280, cores = ['#8a9aa6', '#00838a', '#c4841d'] }) {
  const H = altura
  const todos = series.flatMap((s) => s.valores.filter((v) => v != null))
  const esc = escala(Math.max(...todos, 1))
  const y = (v) => M.t + (1 - v / esc.topo) * (H - M.t - M.b)
  const banda = (W - M.l - M.r) / categorias.length
  const x = (i) => M.l + banda * i + banda / 2
  return (
    <div className="grafico">
      <LegendaH series={series} cores={cores} />
      <svg viewBox={`0 0 ${W} ${H}`} className="grafico__svg" role="img">
        <Eixos H={H} esc={esc} y={y} />
        {categorias.map((c, i) => <text key={c} x={x(i)} y={H - M.b + 17} textAnchor="middle" className="ax__x">{c}</text>)}
        {series.map((s, j) => {
          const pts = s.valores.map((v, i) => (v == null ? null : [x(i), y(v), v])).filter(Boolean)
          const d = pts.map((p, k) => `${k ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ')
          const area = `${d} L${pts[pts.length - 1][0]},${y(0)} L${pts[0][0]},${y(0)} Z`
          const vmax = Math.max(...pts.map((p) => p[2]))
          return (
            <g key={s.nome}>
              {j === series.length - 1 && <path d={area} fill={cores[j]} opacity=".08" />}
              <path d={d} fill="none" stroke={cores[j]} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
              {pts.map((p, k) => (
                <g key={k}>
                  <circle cx={p[0]} cy={p[1]} r="4" fill="#fff" stroke={cores[j]} strokeWidth="2.4">
                    <title>{`${categorias[s.valores.indexOf(p[2])] ?? ''} · ${s.nome}: ${fmt(p[2])}`}</title>
                  </circle>
                  {p[2] === vmax && <text x={p[0]} y={p[1] - 10} textAnchor="middle" className="ax__v" fill={cores[j]}>{fmt(p[2])}</text>}
                </g>
              ))}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/** Barra única de proporção (100%). dados: [[rótulo, valor]] */
export function Proporcao({ dados, cores = PALETA }) {
  const total = dados.reduce((s, d) => s + d[1], 0) || 1
  return (
    <div className="prop">
      <div className="prop__barra">
        {dados.map(([r, v], i) => (
          <span key={r} style={{ width: `${(v / total) * 100}%`, background: cores[i % cores.length] }} title={`${r}: ${fmt(v)}`}>
            {(v / total) > 0.07 && `${fmt((v / total) * 100, 1)}%`}
          </span>
        ))}
      </div>
      <ul className="legenda legenda--h">
        {dados.map(([r, v], i) => (
          <li key={r}><i style={{ background: cores[i % cores.length] }} />{r} <b>{fmt(v)}</b> <small>({fmt((v / total) * 100, 1)}%)</small></li>
        ))}
      </ul>
    </div>
  )
}

/** Barras horizontais com percentual do total. */
export function HBarsPct({ dados, cor = 'var(--teal)' }) {
  const total = dados.reduce((s, d) => s + d[1], 0) || 1
  const m = Math.max(...dados.map((d) => d[1]), 1)
  return (
    <ul className="hbars hbars--pct">
      {dados.map(([r, v], i) => (
        <li key={r}>
          <span className="hbars__r">{r}</span>
          <span className="hbars__trilho"><i style={{ width: `${(v / m) * 100}%`, background: cor, animationDelay: `${i * 40}ms` }} /></span>
          <b className="hbars__v">{fmt(v)} <small>{fmt((v / total) * 100, 1)}%</small></b>
        </li>
      ))}
    </ul>
  )
}
