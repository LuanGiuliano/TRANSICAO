import { useState } from 'react'
import dados from './data/planilhas.json'
import { F07 as DF07 } from './data/f07.js'
import agaData from './data/aga_data.json'
import f06Data from './data/f06_data.json'
import {
  Kpi, Bloco, HBars, HBarsPct, Donut, Colunas, ColunasEixo, Linhas, Proporcao, Abas,
  LimiteControle, aplicarLimite, fmt, fmtMoeda, fmtBRL,
} from './charts.jsx'

export const PLANILHA_DE = {
  'F-01': 'DIOP', 'F-02': 'DIOP', 'F-07': 'DIOP',
  'F-03': 'DIPSE',
  'F-04': 'DIFOB', 'F-05': 'DIFOB', 'F-06': 'DIFOB', 'F-08': 'DIFOB',
}

export const temDados = (id) => {
  if (id === 'F-06' || id === 'F-07') return true
  const d = dados[PLANILHA_DE[id]]?.[id]
  return !!d && Object.keys(d).length > 0
}

export const capaDe = (id) => dados[PLANILHA_DE[id]]?.capa || {}

const C = {
  unidade: 'UNIDADE E RESPONSÁVEL PRINCIPAL',
  colab: 'COLABORADORES E RESPECTIVAS FONTES',
}
export function resumoCapa(id) {
  const c = capaDe(id)
  const get = (k) => Object.entries(c).find(([a]) => a.trim() === k)?.[1]
  return { unidade: get(C.unidade), colab: get(C.colab) }
}

/* ---------- Capa de identificação ---------- */
export function Capa({ id }) {
  const c = capaDe(id)
  const itens = Object.entries(c)
    .filter(([, v]) => v && !/^n[aã]o se aplica/i.test(v))
    .map(([k, v]) => {
      if (/AUTORIDADE QUE CONFIRMA/i.test(k) || /saul/i.test(v)) {
        return [k, 'Hellen Nyde da Silva e Souza']
      }
      return [k, v]
    })

  return (
    <Bloco titulo="Capa de identificação (planilha)" span="full">
      {itens.length === 0 ? (
        <p className="vazio-txt">A capa de identificação desta planilha ainda não foi preenchida pela diretoria.</p>
      ) : (
        <dl className="capa">
          {itens.map(([k, v]) => (
            <div key={k}><dt>{k.trim()}</dt><dd>{v}</dd></div>
          ))}
        </dl>
      )}
    </Bloco>
  )
}

function Vazio({ id }) {
  return (
    <Bloco titulo="Painel de dados" span="full">
      <div className="vazio">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)', marginBottom: 8 }}>
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <p><strong>{id}</strong>: a planilha da {PLANILHA_DE[id]} não traz dados preenchidos para este relatório até o momento.</p>
        <p className="muted">Assim que a aba for preenchida, rode <code>python scripts/extract.py</code> para atualizar o painel.</p>
      </div>
    </Bloco>
  )
}

/* ---------- F-01 ---------- */
function F01() {
  const d = dados.DIOP['F-01']
  const [limiteDre, setLimiteDre] = useState(15)
  const [limiteCargo, setLimiteCargo] = useState(15)
  const [limiteComp, setLimiteComp] = useState(15)

  const totalDres = d.por_dre.length
  const totalCargos = d.cargos_top.length
  const totalComps = d.componentes.length

  const dresExibidas = aplicarLimite(d.por_dre, limiteDre).map(([n, v]) => [n.replace(/^DRE /, ''), v])
  const cargosExibidos = aplicarLimite(d.cargos_top, limiteCargo).map(([n, v]) => [n.toLowerCase(), v])
  const compsExibidos = aplicarLimite(d.componentes, limiteComp).map(([n, v]) => [n.toLowerCase(), v])

  return (
    <>
      <div className="kpis">
        <Kpi rotulo="Servidores (total geral)" valor={fmt(d.total)} sub="base SAS de 28/09/2026" />
        <Kpi rotulo="DREs" valor={fmt(d.n_dres)} sub="40 DREs conferidas" cor="#153a4d" />
        <Kpi rotulo="Escolas / unidades" valor={fmt(d.n_escolas)} cor="#c4841d" />
        <Kpi rotulo="Componentes curriculares" valor={fmt(d.n_componentes)} cor="#7b5ea7" />
      </div>
      <div className="blocos">
        <Bloco titulo="Profissionais por vínculo">
          <Donut dados={d.sintese.filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1])} centro={fmt(d.total)} sub="total" />
        </Bloco>
        <Bloco
          titulo="Lotações por DRE"
          extra={<LimiteControle total={totalDres} limite={limiteDre} onChange={setLimiteDre} opcoes={[15, 40, 'Todos']} />}
          nota={`Soma de profissionais por escola/vínculo/cargo nas 40 DREs regionais (SEDUC Sede não entra na conferência de DREs). Exibindo ${dresExibidas.length} de ${totalDres}.`}
        >
          <HBars dados={dresExibidas} />
        </Bloco>
        <Bloco
          titulo="Cargos com mais profissionais"
          extra={<LimiteControle total={totalCargos} limite={limiteCargo} onChange={setLimiteCargo} opcoes={[15, 50, 'Todos']} />}
          nota={`Distribuição por cargo na rede estadual. Exibindo ${cargosExibidos.length} de ${totalCargos}.`}
        >
          <HBars dados={cargosExibidos} cor="#153a4d" />
        </Bloco>
        <Bloco
          titulo="Professores por componente curricular"
          extra={<LimiteControle total={totalComps} limite={limiteComp} onChange={setLimiteComp} opcoes={[15, 50, 'Todos']} />}
          nota={`Carga horária e atuação docente por disciplina. Exibindo ${compsExibidos.length} de ${totalComps}.`}
        >
          <HBars dados={compsExibidos} cor="#7b5ea7" />
        </Bloco>
      </div>
      {d.link && <a className="btn-link" href={d.link} target="_blank" rel="noreferrer">Abrir base de referência SAS ↗</a>}
    </>
  )
}

/* ---------- F-02 ---------- */
function F02() {
  const d = dados.DIOP['F-02']
  const [regiao, setRegiao] = useState('INTERIOR')
  const mods = d[regiao]
  const nomes = Object.keys(mods)
  const [mod, setMod] = useState(null)
  const atual = mods[mod] ? mod : nomes[0]
  const tot = (k) => Object.values(mods).reduce((s, m) => s + m[k], 0)
  const m = mods[atual]

  const [limiteDre, setLimiteDre] = useState(10)
  const [limiteDisc, setLimiteDisc] = useState(10)

  const totalDres = m.dres.length
  const totalDiscs = m.disciplinas.length

  const dresExibidas = aplicarLimite(m.dres, limiteDre).map(([n, v]) => [n.replace(/^DRE /, ''), v])
  const discsExibidas = aplicarLimite(m.disciplinas, limiteDisc).map(([n, v]) => [n.toLowerCase(), v])

  return (
    <>
      <Abas opcoes={['INTERIOR', 'RMB']} valor={regiao} onChange={(r) => { setRegiao(r); setMod(null) }} />
      <div className="kpis">
        <Kpi rotulo="CH DISPONÍVEL" valor={fmt(tot('ch'))} sub="horas-aula/semana" />
        <Kpi rotulo="QUANTITATIVO DE PROFESSORES" valor={fmt(tot('prof'))} cor="#153a4d" />
        <Kpi rotulo="Modalidades" valor={nomes.length} cor="#c4841d" />
      </div>
      <div className="blocos">
        <Bloco titulo={`Carga Horária Disponível por Modalidade – ${regiao}`}>
          <HBars dados={nomes.map((n) => [n, mods[n].ch])} />
        </Bloco>
        <Bloco titulo={`Quantitativo de Professores por Modalidade – ${regiao}`}>
          <Donut dados={nomes.map((n) => [n, mods[n].prof])} centro={fmt(tot('prof'))} sub="professores" />
        </Bloco>
      </div>
      <Abas opcoes={nomes} valor={atual} onChange={setMod} />
      <div className="blocos">
        <Bloco
          titulo="MAIOR CARGA HORÁRIA DISPONÍVEL POR DRE"
          extra={<LimiteControle total={totalDres} limite={limiteDre} onChange={setLimiteDre} opcoes={[10, 50, 'Todos']} />}
          nota={`Modalidade selecionada: ${atual} (${regiao}). Exibindo ${dresExibidas.length} de ${totalDres}.`}
        >
          <HBars dados={dresExibidas} cor="#c4841d" />
        </Bloco>
        <Bloco
          titulo="MAIOR CARGA HORÁRIA DISPONÍVEL POR DISCIPLINA"
          extra={<LimiteControle total={totalDiscs} limite={limiteDisc} onChange={setLimiteDisc} opcoes={[10, 50, 'Todos']} />}
          nota={`Modalidade selecionada: ${atual} (${regiao}). Exibindo ${discsExibidas.length} de ${totalDiscs}.`}
        >
          <HBars dados={discsExibidas} cor="#7b5ea7" />
        </Bloco>
      </div>
    </>
  )
}

/* ---------- F-03 ---------- */
function F03() {
  const d = dados.DIPSE['F-03']
  const [limiteMaisVagos, setLimiteMaisVagos] = useState(8)

  // Estagiário não é temporário: segregação conforme Lei Federal nº 11.788
  const contratosTemporarios = d.contratos.filter((c) => !/ESTAGI/i.test(c.categoria))
  const estagiariosContrato = d.contratos.filter((c) => /ESTAGI/i.test(c.categoria))

  // Total de temporários (Magistério: 8.564 + Adm. Geral: 885 = 9.449)
  const temporariosAtivos = contratosTemporarios.reduce((s, c) => s + (c.total || 0), 0)
  // Total de estagiários (1.600)
  const estagiariosAtivos = estagiariosContrato.reduce((s, c) => s + (c.total || 0), 0)

  // Desligamentos de temporários até mar/2027 (585)
  const desligTemporarios = contratosTemporarios.reduce((s, c) => s + c.desligamentos.slice(0, 4).reduce((a, b) => a + b, 0), 0)
  const criado = d.cargos.reduce((s, c) => s + c.criado, 0)
  const vago = d.cargos.reduce((s, c) => s + c.vago, 0)
  const efetivos = d.cargos.filter((c) => /EFETIVO|Estáveis/i.test(c.natureza || ''))
  const porCat = {}
  efetivos.forEach((c) => {
    const k = c.categoria.trim()
    porCat[k] ||= { o: 0, v: 0 }
    porCat[k].o += c.ocupado; porCat[k].v += c.vago
  })
  const cats = Object.keys(porCat)
  
  const todosMaisVagos = [...efetivos].sort((a, b) => b.vago - a.vago).map((c) => [c.cargo, c.vago])
  const maisVagosExibidos = aplicarLimite(todosMaisVagos, limiteMaisVagos)

  return (
    <>
      <div className="kpis">
        <Kpi rotulo="Temporários ativos" valor={fmt(temporariosAtivos)} sub="magistério básico e adm. geral" cor="#00838a" />
        <Kpi rotulo="Estagiários ativos" valor={fmt(estagiariosAtivos)} sub="programa de estágio SEDUC" cor="#7b5ea7" />
        <Kpi rotulo="Término temporários até mar/2027" valor={fmt(desligTemporarios)} sub="contratos a vencer até 31/03/2027" cor="#c0504d" />
        <Kpi rotulo="Processos seletivos vigentes" valor={d.pss.length} cor="#153a4d" />
        <Kpi rotulo="Cargos efetivos vagos" valor={fmt(efetivos.reduce((s, c) => s + c.vago, 0))} sub="vagas abertas na rede estadual" cor="#c4841d" />
      </div>
      <div className="blocos">
        <Bloco titulo="Temporários ativos por categoria" nota="Estagiários não são temporários e estão segregados por lei.">
          <HBars dados={contratosTemporarios.map((c) => [c.categoria.replace('TEMPORARIOS ATIVOS - ', '').trim(), c.total])} />
        </Bloco>
        <Bloco titulo="Desligamentos previstos de temporários" nota="Término da vigência de contratos temporários por período.">
          <Colunas
            categorias={d.contratos_cab}
            series={contratosTemporarios.map((c) => ({ nome: c.categoria.replace('TEMPORARIOS ATIVOS - ', '').trim(), valores: c.desligamentos }))}
          />
        </Bloco>
        <Bloco titulo="Cargos efetivos: ocupados × vagos">
          <Colunas categorias={cats.map((c) => c.toLowerCase())}
            series={[{ nome: 'Ocupados', valores: cats.map((c) => porCat[c].o) }, { nome: 'Vagos', valores: cats.map((c) => porCat[c].v) }]} />
        </Bloco>
        <Bloco
          titulo="Cargos efetivos com mais vagas"
          extra={<LimiteControle total={todosMaisVagos.length} limite={limiteMaisVagos} onChange={setLimiteMaisVagos} opcoes={[8, 20, 'Todos']} />}
          nota={`Distribuição de vagas em aberto na rede. Exibindo ${maisVagosExibidos.length} de ${todosMaisVagos.length}.`}
        >
          <HBars dados={maisVagosExibidos} cor="#c4841d" />
        </Bloco>
      </div>
      <Bloco titulo="Inventário – Processos seletivos simplificados" span="full">
        <div className="tabela-wrap">
          <table className="tabela">
            <thead><tr><th>Processo</th><th>Vigência até</th><th>Modalidade</th><th>Edital</th></tr></thead>
            <tbody>
              {d.pss.map((p) => (
                <tr key={p.nome}>
                  <td>{p.nome}</td><td>{p.vigencia}</td><td>{p.modalidade}</td>
                  <td>{p.link && <a href={p.link} target="_blank" rel="noreferrer">abrir ↗</a>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Bloco>
      <Bloco titulo="Concurso público" span="full">
        <p><strong>{d.concurso.nome}</strong></p>
        <p className="muted">{d.concurso.obs}</p>
      </Bloco>
    </>
  )
}

/* ---------- F-05 ---------- */
function F05() {
  const d = dados.DIFOB['F-05']
  const val = (l, k) => l[k]
  const [premio] = d.linhas
  const preenchidas = d.linhas.filter((l) => d.colunas.some((c) => typeof l[c] === 'number'))
  const vazias = d.linhas.filter((l) => !preenchidas.includes(l))
  return (
    <>
      <div className="kpis">
        <Kpi rotulo="Licença-prêmio – solicitações" valor={fmt(premio['SOLICITAÇÕES'])} sub="01/01 a 30/09/2026" />
        <Kpi rotulo="Deferidos" valor={fmt(premio['DEFERIDOS'])} cor="#2e9e6b" />
        <Kpi rotulo="Indeferidos" valor={fmt(premio['INDEFERIDOS'])} cor="#c0504d" />
        <Kpi rotulo="Em análise (PAE 3.0 + 4.0)" valor={fmt((premio['EM ANALISE 3.0'] || 0) + (premio['EM ANALISE 4.0'] || 0))} cor="#c4841d" />
      </div>
      <div className="blocos">
        <Bloco titulo="Licença-prêmio por situação">
          <Donut dados={[['Deferidos', premio['DEFERIDOS']], ['Indeferidos', premio['INDEFERIDOS']],
            ['Em análise 3.0', premio['EM ANALISE 3.0']], ['Em análise 4.0', premio['EM ANALISE 4.0']]].filter((x) => x[1])} />
        </Bloco>
        <Bloco titulo="Solicitações por tipo de licença">
          <HBars dados={preenchidas.map((l) => [l.produto.toLowerCase(), l['SOLICITAÇÕES'] || 0])} cor="#153a4d" />
        </Bloco>
      </div>
      <Bloco titulo="Afastamentos de 01/01/2026 a 30/09/2026" span="full">
        <div className="tabela-wrap">
          <table className="tabela">
            <thead><tr><th>Produto</th>{d.colunas.map((c) => <th key={c} className="num">{c.toLowerCase()}</th>)}</tr></thead>
            <tbody>
              {d.linhas.map((l) => (
                <tr key={l.produto}>
                  <td>{l.produto}</td>
                  {d.colunas.map((c) => <td key={c} className="num">{typeof val(l, c) === 'number' ? fmt(val(l, c)) : val(l, c) ?? '–'}</td>)}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#eef3f6', fontWeight: 800 }}>
                <td>TOTAL GERAL (SOMATÓRIA FINAL)</td>
                {d.colunas.map((c) => {
                  const soma = d.linhas.reduce((acc, l) => acc + (typeof val(l, c) === 'number' ? val(l, c) : 0), 0)
                  return <td key={c} className="num" style={{ color: 'var(--teal)', fontWeight: 800 }}>{soma > 0 ? fmt(soma) : '–'}</td>
                })}
              </tr>
            </tfoot>
          </table>
        </div>
        {vazias.length > 0 && <p className="muted" style={{ marginTop: 10 }}>Aguardando preenchimento: {vazias.map((v) => v.produto.toLowerCase()).join(', ')}.</p>}
        {d.nota && <p className="muted" style={{ marginTop: 6 }}>{d.nota}</p>}
        {d.link && <a className="btn-link" href={d.link} target="_blank" rel="noreferrer">Abrir plano de acompanhamento (Data Studio) ↗</a>}
      </Bloco>
    </>
  )
}

/* ---------- F-06 FOLHA DE PAGAMENTO ---------- */
function F06() {
  const f = f06Data
  const [ano, setAno] = useState('2026')
  const tot26 = f.totais_2026
  const tot25 = f.totais_2025

  const dadosAno = ano === '2026' ? f.mensal_2026 : f.mensal_2025
  const linhasAno = ano === '2026' ? f.linhas_2026 : f.linhas_2025
  const totAno = ano === '2026' ? tot26 : tot25

  // Dados para ColunasEixo (em R$ Milhões para escala perfeita)
  const catsMeses = dadosAno.map(m => m.mes)
  const seriesColunas = [
    { nome: 'FUNDEB (R$ Mi)', valores: dadosAno.map(m => Math.round(m.fundeb / 1e6)) },
    { nome: 'Tesouro + Encargos (R$ Mi)', valores: dadosAno.map(m => Math.round((m.tesouro + m.fundeb_tesouro + m.encargos) / 1e6)) }
  ]

  // Proporção de fontes no ano
  const propFontes = [
    ['FUNDEB', totAno.fundeb],
    ['Tesouro Estadual', totAno.tesouro + (totAno.fundeb_tesouro || 0)],
    ['Encargos Patronais', totAno.encargos]
  ]

  return (
    <>
      {/* Alerta de Prioridade D+5 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
        <span className="tag-aga" style={{ background: '#fff3e0', color: '#b78103', borderColor: '#ffe082' }}>
          <strong>ENTREGA PRIORITÁRIA: PRAZO D+5</strong> (Quadro 12 / Despacho 26/10/2026)
        </span>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          Fonte oficial: {f.fonte}
        </span>
      </div>

      {/* KPIs da Folha de Pagamento */}
      <div className="kpis">
        <Kpi rotulo="Despesa Folha 2026 (Total)" valor={fmtMoeda(tot26.total)} sub={`Realizado Jan–Out: ${fmtMoeda(tot26.realizado)}`} cor="#00838a" />
        <Kpi rotulo="Recursos FUNDEB 2026" valor={fmtMoeda(tot26.fundeb)} sub={`${((tot26.fundeb / tot26.total) * 100).toFixed(1)}% da despesa anual`} cor="#153a4d" />
        <Kpi rotulo="Recursos Tesouro 2026" valor={fmtMoeda(tot26.tesouro + tot26.fundeb_tesouro)} sub="Tesouro + Fundeb/Tesouro" cor="#c4841d" />
        <Kpi rotulo="Encargos Patronais 2026" valor={fmtMoeda(tot26.encargos)} sub="Previdência e encargos sociais" cor="#7b5ea7" />
        <Kpi rotulo="Execução Total 2025" valor={fmtMoeda(tot25.total)} sub="12 meses + 13º Salário" cor="#2e9e6b" />
      </div>

      {/* Seletor de Ano */}
      <div style={{ margin: '18px 0 12px' }}>
        <Abas opcoes={['2026', '2025']} valor={ano} onChange={setAno} />
      </div>

      {/* Gráfico de Evolução Mensal da Folha */}
      <Bloco titulo={`Evolução Mensal da Folha de Pagamento – ${ano} (Valores em R$ Milhões)`} span="full"
        nota={`Comparativo mês a mês das dotações FUNDEB vs Recursos do Tesouro e Encargos. ${ano === '2026' ? 'Nov, Dez e 13º representam Projeção CFOP.' : 'Exercício financeiro de 2025 encerrado.'}`}>
        <ColunasEixo categorias={catsMeses} series={seriesColunas} altura={300} cores={['#00838a', '#c4841d']} />
      </Bloco>

      {/* Proporção de Fontes e Tipos de Folha */}
      <div className="blocos">
        <Bloco titulo={`Composição por Fonte de Recursos – ${ano}`}>
          <Proporcao dados={propFontes} cores={['#00838a', '#153a4d', '#c4841d']} />
          <p className="bloco__nota" style={{ marginTop: 12 }}>
            Demonstra a segregação entre recursos do FUNDEB e contrapartidas do Tesouro Estadual e encargos sociais patronais.
          </p>
        </Bloco>

        {ano === '2026' && (
          <Bloco titulo="Distribuição por Tipo de Folha (2026)">
            <Donut dados={f.por_tipo_folha_2026} centro={fmtMoeda(tot26.total)} sub="total 2026" />
            <p className="bloco__nota" style={{ marginTop: 10 }}>
              FOLHA 01 (Normal/Efetivos e Temporários), FOLHA 10 (Suplementar), FOLHA 20 (Rescisões e Ajustes), FOLHA 99 (13º Salário).
            </p>
          </Bloco>
        )}

        {ano === '2025' && (
          <Bloco titulo="Demonstrativo Anual 2025 por Fonte">
            <HBarsPct dados={propFontes} cor="#00838a" />
          </Bloco>
        )}
      </div>

      {/* Tabela Completa de Folhas e Processos PAE */}
      <Bloco titulo={`Detalhamento de Processos e Folhas de Pagamento – ${ano}`} span="full"
        nota="Relação completa de processos administrativos (PAE), segregação de dotações e status da despesa.">
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>Mês</th>
                <th>Tipo de Folha</th>
                <th>Processo PAE</th>
                <th className="num">FUNDEB</th>
                <th className="num">Tesouro / Fundeb</th>
                <th className="num">Encargos</th>
                <th className="num">Total da Folha</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {linhasAno.map((item, idx) => (
                <tr key={idx} style={{ background: item.projetado ? 'rgba(255, 243, 224, 0.4)' : undefined }}>
                  <td><strong>{item.mes_raw}</strong></td>
                  <td>{item.tipo_folha}</td>
                  <td>
                    {item.processo ? (
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--ink)' }}>{item.processo}</span>
                    ) : '–'}
                  </td>
                  <td className="num">{fmtBRL(item.fundeb)}</td>
                  <td className="num">{fmtBRL(item.tesouro + item.fundeb_tesouro)}</td>
                  <td className="num">{fmtBRL(item.encargos)}</td>
                  <td className="num" style={{ fontWeight: 700, color: 'var(--ink)' }}>{fmtBRL(item.total_geral)}</td>
                  <td>
                    {item.projetado ? (
                      <span style={{ fontSize: 11, background: '#fff3e0', color: '#b78103', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                        Projeção CFOP
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, background: '#e8f5e9', color: '#2e7d32', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                        Realizado
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#eef3f6', fontWeight: 800 }}>
                <td colSpan="3">TOTAL GERAL ({ano})</td>
                <td className="num">{fmtBRL(totAno.fundeb)}</td>
                <td className="num">{fmtBRL(totAno.tesouro + (totAno.fundeb_tesouro || 0))}</td>
                <td className="num">{fmtBRL(totAno.encargos)}</td>
                <td className="num" style={{ color: 'var(--teal)', fontSize: 14 }}>{fmtBRL(totAno.total)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Bloco>

      {/* Diretrizes Institucionais da Entrega F-06 */}
      <Bloco titulo="Diretrizes do Bloco F – Folha de Pagamento" span="full">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: 10, borderLeft: '4px solid var(--teal)' }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>Segregação FUNDEB (Mínimo 70%)</h4>
            <p style={{ fontSize: 12.5, color: 'var(--text)' }}>
              Conciliação obrigatória com os relatórios do Bloco B (B-03 FUNDEB), comprovando a correta aplicação e elegibilidade dos 70% na remuneração dos profissionais da educação básica.
            </p>
          </div>
          <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: 10, borderLeft: '4px solid var(--amber)' }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>Interfaces Financeiras (SAPF / SAGEP)</h4>
            <p style={{ fontSize: 12.5, color: 'var(--text)' }}>
              O despacho governamental atribui à SAGEP o levantamento funcional e os dados da folha; as conciliações e disponibilidades financeiras cabem à SAPF.
            </p>
          </div>
        </div>
      </Bloco>
    </>
  )
}

/* ---------- F-07 ---------- */
function F07() {
  const d = dados.DIOP['F-07']
  const x = DF07
  const aga = agaData
  const [limiteCargosAga, setLimiteCargosAga] = useState(10)
  const p26 = x.publicacoes[2026], p25 = x.publicacoes[2025]
  const tot = (p, i) => (p.professor[i] ?? null) == null ? null : p.professor[i] + p.adm[i]
  const comp26 = x.meses.map((_, i) => tot(p26, i))
  const comp25 = x.meses.map((_, i) => tot(p25, i))
  const pae = x.pae

  return (
    <>
      {/* Banner de origem do arquivo AGA Atualizado */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
        <span className="tag-aga">
          Base de Dados Integrada: <strong>AGA ATUALIZADO .xlsx</strong> (Aguardando Aposentadoria)
        </span>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          Posição da carteira: 4.130 vínculos · 4.066 servidores únicos (CPF)
        </span>
      </div>

      {/* Indicadores Principais (KPIs) com a Somatória Final */}
      <div className="kpis">
        <Kpi rotulo="Servidores em AGA (Total)" valor={fmt(aga.total_vinculos)} sub="4.130 vínculos na folha" cor="#00838a" />
        <Kpi rotulo="Docentes / Magistério em AGA" valor={fmt(aga.categorias[0][1])} sub="85,3% da carteira de AGA" cor="#153a4d" />
        <Kpi rotulo="Administrativo / Apoio em AGA" valor={fmt(aga.categorias[1][1])} sub="14,7% da carteira de AGA" cor="#c4841d" />
        <Kpi rotulo="Processos com PAE Identificado" valor={fmt(aga.tem_pae[0][1])} sub="81,2% com número de processo" cor="#2e9e6b" />
        <Kpi rotulo="PROCESSOS TRAMITADOS AO IGEPPS" valor={fmt(aga.igepps_foi[0][1])} sub="2.211 processos remetidos ao órgão" cor="#7b5ea7" />
      </div>

      {/* Seção 1: Diagnóstico da Carteira AGA */}
      <div className="blocos">
        <Bloco titulo="Composição da Carteira AGA por Categoria">
          <Proporcao dados={aga.categorias} cores={['#00838a', '#c4841d']} />
          <p className="bloco__nota" style={{ marginTop: 12 }}>
            A grande maioria da carteira que aguarda aposentadoria pertence ao magistério (3.523 professores), gerando impacto direto no planejamento de cobertura docente.
          </p>
        </Bloco>

        <Bloco titulo="Motivo do Afastamento para Aposentadoria (AGA)">
          <Donut dados={aga.mnemonicos} centro={fmt(aga.total_vinculos)} sub="vínculos" />
        </Bloco>

        <Bloco titulo="Vínculo Funcional dos Servidores em AGA">
          <HBarsPct dados={aga.vinculos} cor="#153a4d" />
        </Bloco>

        <Bloco titulo="Ano de Entrada na Situação de AGA (2017 a 2026)" nota="Ano de início da lotação em afastamento para aposentadoria.">
          <ColunasEixo categorias={aga.anos_inicio_aga.map(a => a[0])} cores={['#00838a']} altura={280} destaque
            series={[{ nome: 'Servidores', valores: aga.anos_inicio_aga.map(a => a[1]) }]} />
        </Bloco>
      </div>

      {/* Seção 2: Cargos com mais servidores em AGA */}
      <Bloco
        titulo="Cargos com Maior Quantitativo em AGA"
        span="full"
        extra={<LimiteControle total={aga.top_cargos.length} limite={limiteCargosAga} onChange={setLimiteCargosAga} opcoes={[10, 50, 'Todos']} />}
        nota={`Distribuição nominal conforme registrado na base da folha e lotação. Exibindo ${aplicarLimite(aga.top_cargos, limiteCargosAga).length} de ${aga.top_cargos.length}.`}
      >
        <HBarsPct dados={aplicarLimite(aga.top_cargos, limiteCargosAga).map(([c, n]) => [c.toLowerCase(), n])} cor="#00838a" />
      </Bloco>

      {/* Seção 3: Tramitação Previdenciária e IGEPPS */}
      <Bloco titulo="Trâmite Previdenciário e Fluxo no IGEPPS" span="full"
        nota="Acompanhamento da remessa e retorno dos processos junto ao Instituto de Gestão Previdenciária do Pará.">
        <div className="blocos">
          <div>
            <h4 className="sub">Processos Encaminhados ao IGEPPS</h4>
            <Proporcao dados={[['Foram ao IGEPPS', aga.igepps_foi[0][1]], ['Ainda não foram ao IGEPPS', aga.igepps_foi[1][1]]]} cores={['#2e9e6b', '#c0504d']} />
            <h4 className="sub" style={{ marginTop: 20 }}>Situação de Retorno dos Processos Remetidos</h4>
            <Donut dados={aga.igepps_retorno} centro={fmt(aga.igepps_foi[0][1])} sub="no IGEPPS" />
          </div>
          <div>
            <h4 className="sub">Localização Atual dos Processos</h4>
            <HBarsPct dados={aga.localizacoes} cor="#7b5ea7" />
          </div>
        </div>
      </Bloco>

      {/* Seção 4: Pendências Mapeadas na Carteira */}
      <div className="blocos">
        <Bloco titulo="Mapeamento de Pendências da Carteira AGA">
          <HBarsPct dados={aga.pendencias} cor="#c4841d" />
        </Bloco>

        <Bloco titulo="Tempo Médio entre Movimentações (Dias)" nota="Média, mediana e P90 por atividade na tramitação PAE.">
          <div className="tabela-wrap">
            <table className="tabela">
              <thead><tr><th>Atividade</th><th className="num">Média</th><th className="num">Mediana</th><th className="num">P90</th></tr></thead>
              <tbody>
                {pae.tempoEntre.map(([a, m, md, p]) => (
                  <tr key={a}><td>{a}</td><td className="num">{fmt(m, 1)}</td><td className="num">{md}</td><td className="num">{p}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Bloco>
      </div>

      {/* Seção 5: Publicações e Projeções Plurianuais */}
      <Bloco titulo="Publicações de Aposentadoria – Comparativo Mensal 2025 × 2026" span="full"
        nota="Concessões publicadas no Diário Oficial (Professor + Adm. Geral).">
        <Linhas categorias={x.meses} altura={300}
          series={[{ nome: '2025', valores: comp25 }, { nome: '2026', valores: comp26 }]} />
      </Bloco>

      <div className="blocos">
        <Bloco titulo="Projeção Plurianual de Aposentadorias (2026–2028)" nota={x.projecao.premissa}>
          <ColunasEixo categorias={x.projecao.anos} cores={['#00838a', '#c4841d']} altura={280}
            series={[{ nome: 'Professor', valores: x.projecao.professor }, { nome: 'Adm. geral', valores: x.projecao.adm }]} />
        </Bloco>

        <Bloco titulo="Cenários de Projeção Anual (Sensibilidade)" nota="Estimativas para planejamento de recomposição do quadro.">
          <div className="tabela-wrap">
            <table className="tabela">
              <thead><tr><th>Cenário</th><th className="num">2026 (base)</th><th className="num">2027</th><th className="num">2028</th></tr></thead>
              <tbody>
                {x.cenarios.map((c) => (
                  <tr key={c.nome}><td>{c.nome}</td>{c.v.map((n, i) => <td key={i} className="num">{fmt(n)}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </Bloco>
      </div>

      {/* Seção 6: Links Institucionais */}
      <Bloco titulo="Links Oficiais de Acompanhamento" span="full">
        <div className="links">
          {d.links.map((l) => (
            <a key={l.url} className="btn-link" href={l.url} target="_blank" rel="noreferrer">{l.titulo.replace(/\s*-\s*ACESSE.*$/i, '')} ↗</a>
          ))}
        </div>
      </Bloco>
    </>
  )
}

const PAINEIS = { 'F-01': F01, 'F-02': F02, 'F-03': F03, 'F-05': F05, 'F-06': F06, 'F-07': F07 }

export default function Painel({ id }) {
  const P = PAINEIS[id]
  return (
    <div className="dados">
      <Capa id={id} />
      {P ? <P /> : <Vazio id={id} />}
    </div>
  )
}
