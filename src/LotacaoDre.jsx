import { useState } from 'react'
import lot from './data/lotacao_dre.json'
import {
  Kpi, Bloco, HBars, Donut, Abas, LimiteControle, aplicarLimite, fmt, formatarRotuloVisual,
} from './charts.jsx'

const VINC = {
  EFETIVO: 'Efetivo',
  'CONTRATO TEMPORARIO': 'Contrato temporário',
  'CONTR TEMP INDIGENA': 'Temporário indígena',
  'NAO ESTAVEL': 'Não estável',
}

const FAIXAS = [
  { rot: 'Todas as faixas', min: 0, max: Infinity },
  { rot: 'Até 25 servidores', min: 0, max: 25 },
  { rot: '26 a 35', min: 26, max: 35 },
  { rot: '36 a 45', min: 36, max: 45 },
  { rot: 'Acima de 45', min: 46, max: Infinity },
]

const nomeDre = (n) => (n === 'SEDUC SEDE' ? 'SEDUC Sede' : formatarRotuloVisual(n))

const somar = (lista, chave) => {
  const acc = {}
  lista.forEach((d) => Object.entries(d[chave]).forEach(([k, v]) => { acc[k] = (acc[k] || 0) + v }))
  return Object.entries(acc).sort((a, b) => b[1] - a[1])
}

const somarAtividades = (lista) => {
  const acc = {}
  lista.forEach((d) => d.atividades.forEach(([k, v]) => { acc[k] = (acc[k] || 0) + v }))
  return Object.entries(acc).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}

/* ---------- F-02: Lotação nas DREs (planilha LOTAÇÃO DREs 2026) ---------- */
export default function LotacaoDre() {
  const [faixaRot, setFaixaRot] = useState(FAIXAS[0].rot)
  const [dreSel, setDreSel] = useState('TODAS')
  const [limiteDre, setLimiteDre] = useState(15)
  const [limiteAtiv, setLimiteAtiv] = useState(15)

  const faixa = FAIXAS.find((f) => f.rot === faixaRot) || FAIXAS[0]
  const filtradas = lot.dres.filter((d) => d.total >= faixa.min && d.total <= faixa.max)
  const sel = filtradas.some((d) => d.dre === dreSel) ? dreSel : 'TODAS'
  const unica = sel !== 'TODAS' ? filtradas.find((d) => d.dre === sel) : null
  const base = unica ? [unica] : filtradas

  const semFaixa = faixa.rot === FAIXAS[0].rot
  const totalBase = unica
    ? unica.total
    : semFaixa ? lot.total_geral : filtradas.reduce((s, d) => s + d.total, 0)
  const vinculos = somar(base, 'vinculo').map(([k, v]) => [VINC[k] || k, v])
  const categorias = somar(base, 'categoria')
  const atividades = somarAtividades(base)

  const ranking = [...lot.dres].sort((a, b) => b.total - a.total)
  const posicao = unica ? ranking.findIndex((d) => d.dre === unica.dre) + 1 : null
  const media = lot.soma_dres / lot.dres.length
  const maior = filtradas.length ? [...filtradas].sort((a, b) => b.total - a.total)[0] : null

  const dresBarras = aplicarLimite(
    [...filtradas].sort((a, b) => b.total - a.total).map((d) => [nomeDre(d.dre), d.total]),
    limiteDre,
  )
  const ativExibidas = aplicarLimite(atividades.map(([n, v]) => [n, v]), limiteAtiv)

  return (
    <>
      <Bloco
        span="full"
        titulo="Lotação nas DREs – quantitativo de servidores"
        nota={`Fonte: ${lot.fonte}. Servidores únicos por matrícula (MATVIN) lotados em cada uma das ${lot.dres.length} DREs (SEDUC Sede não é DRE e não entra na contagem).${
          unica ? '' : ' Selecione uma faixa de quantitativo ou uma DRE para filtrar os gráficos.'}`}
      >
        <div className="lot-filtros">
          <div className="lot-filtros__grupo">
            <span className="lot-filtros__rot">Faixa de quantitativo</span>
            <Abas opcoes={FAIXAS.map((f) => f.rot)} valor={faixaRot} onChange={(v) => { setFaixaRot(v); setDreSel('TODAS') }} />
          </div>
          <label className="lot-filtros__grupo">
            <span className="lot-filtros__rot">DRE</span>
            <select
              className="lot-select"
              value={sel}
              onChange={(e) => setDreSel(e.target.value)}
              aria-label="Filtrar por DRE"
            >
              <option value="TODAS">Todas as DREs ({filtradas.length})</option>
              {[...filtradas].sort((a, b) => a.dre.localeCompare(b.dre, 'pt-BR', { numeric: true })).map((d) => (
                <option key={d.dre} value={d.dre}>{nomeDre(d.dre)} – {fmt(d.total)}</option>
              ))}
            </select>
          </label>
        </div>
      </Bloco>

      {filtradas.length === 0 ? (
        <p className="vazio-txt">Nenhuma DRE nesta faixa de quantitativo.</p>
      ) : (
        <>
          <div className="kpis">
            <Kpi
              rotulo={unica ? `Servidores – ${nomeDre(unica.dre)}` : 'Servidores lotados'}
              valor={fmt(totalBase)}
              sub={unica ? `${fmt((unica.total / lot.total_geral) * 100, 1)}% do total das DREs` : `data-base ${lot.data_base}`}
            />
            {unica ? (
              <>
                <Kpi rotulo="Posição no ranking" valor={`${posicao}º`} sub={`de ${lot.dres.length} unidades`} cor="#c81a38" />
                <Kpi
                  rotulo="Diferença p/ média"
                  valor={`${unica.total - media >= 0 ? '+' : ''}${fmt(unica.total - media, 1)}`}
                  sub={`média: ${fmt(media, 1)} por DRE`}
                  cor="#153a4d"
                />
                <Kpi rotulo="Funções distintas" valor={fmt(unica.atividades.length)} sub="atividades com lotação" cor="#c4841d" />
              </>
            ) : (
              <>
                <Kpi rotulo="DREs na seleção" valor={fmt(filtradas.length)} sub={`${fmt(lot.dres.length)} unidades no total`} cor="#c81a38" />
                <Kpi rotulo="Média por DRE" valor={fmt(filtradas.reduce((s, d) => s + d.total, 0) / filtradas.length, 1)} sub="servidores por unidade" cor="#153a4d" />
                <Kpi rotulo="Maior lotação" valor={fmt(maior.total)} sub={nomeDre(maior.dre)} cor="#c4841d" />
              </>
            )}
          </div>

          <div className="blocos lot-grid">
            {!unica && (
              <Bloco
                span="dre"
                titulo="Servidores por DRE"
                extra={<LimiteControle total={filtradas.length} limite={limiteDre} onChange={setLimiteDre} opcoes={[15, 'Todos']} />}
                nota={`Exibindo ${dresBarras.length} de ${filtradas.length} unidades.`}
              >
                <HBars dados={dresBarras} cor="#07547b" />
              </Bloco>
            )}
            <Bloco titulo="Vínculo dos servidores" nota={unica ? nomeDre(unica.dre) : 'Soma das DREs selecionadas.'}>
              <Donut dados={vinculos} centro={fmt(vinculos.reduce((s, x) => s + x[1], 0))} sub="vínculos" />
            </Bloco>
            <Bloco titulo="Categoria dos servidores" nota={unica ? nomeDre(unica.dre) : 'Soma das DREs selecionadas.'}>
              <Donut dados={categorias} centro={fmt(categorias.reduce((s, x) => s + x[1], 0))} sub="servidores" />
            </Bloco>
            <Bloco
              titulo="Lotação por função / atividade"
              extra={<LimiteControle total={atividades.length} limite={limiteAtiv} onChange={setLimiteAtiv} opcoes={[15, 'Todos']} />}
              nota={`Exibindo ${ativExibidas.length} de ${atividades.length} funções.`}
              span={unica ? 'full' : undefined}
            >
              <HBars dados={ativExibidas} cor="#c81a38" />
            </Bloco>
          </div>

          {!unica && (
            <Bloco titulo="Quantitativo por DRE" span="full" nota="Clique em uma linha para detalhar a DRE.">
              <div className="tabela-wrap lot-tabela">
                <table className="tabela">
                  <thead>
                    <tr>
                      <th>DRE</th>
                      <th className="num">Servidores</th>
                      <th className="num">Efetivos</th>
                      <th className="num">Temporários</th>
                      <th className="num">% do total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...filtradas].sort((a, b) => b.total - a.total).map((d) => {
                      const efet = d.vinculo.EFETIVO || 0
                      const temp = (d.vinculo['CONTRATO TEMPORARIO'] || 0) + (d.vinculo['CONTR TEMP INDIGENA'] || 0)
                      return (
                        <tr key={d.dre} className="lot-linha" onClick={() => setDreSel(d.dre)} title="Ver detalhes desta DRE">
                          <td><strong>{nomeDre(d.dre)}</strong></td>
                          <td className="num">{fmt(d.total)}</td>
                          <td className="num">{fmt(efet)}</td>
                          <td className="num">{fmt(temp)}</td>
                          <td className="num">{fmt((d.total / lot.total_geral) * 100, 1)}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#eef3f6', fontWeight: 800 }}>
                      <td>TOTAL</td>
                      <td className="num">{fmt(totalBase)}</td>
                      <td className="num">{fmt(filtradas.reduce((s, d) => s + (d.vinculo.EFETIVO || 0), 0))}</td>
                      <td className="num">{fmt(filtradas.reduce((s, d) => s + (d.vinculo['CONTRATO TEMPORARIO'] || 0) + (d.vinculo['CONTR TEMP INDIGENA'] || 0), 0))}</td>
                      <td className="num">{semFaixa ? '100%' : `${fmt((totalBase / lot.total_geral) * 100, 1)}%`}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {semFaixa && lot.soma_dres !== lot.total_geral && (
                <p className="bloco__nota">
                  O total geral ({fmt(lot.total_geral)}) conta servidores únicos; a soma por unidade é {fmt(lot.soma_dres)} porque
                  {' '}{fmt(lot.soma_dres - lot.total_geral)} matrícula aparece lotada em mais de uma DRE.
                </p>
              )}
            </Bloco>
          )}
        </>
      )}
    </>
  )
}

