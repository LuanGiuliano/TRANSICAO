export const DIRETORIAS = {
  DIOP: { sigla: 'DIOP', cor: '#0e7c86' },
  DIPSE: { sigla: 'DIPSE', cor: '#7b5ea7' },
  DIFOB: { sigla: 'DIFOB', cor: '#c4841d' },
  GABINETE: { sigla: 'GABINETE', cor: '#2f6690' },
}

export const STATUS = [
  { id: 'nao-iniciado', label: 'Não iniciado', cor: '#8a9aa6' },
  { id: 'em-andamento', label: 'Em andamento', cor: '#2f6690' },
  { id: 'em-revisao', label: 'Em revisão', cor: '#c4841d' },
  { id: 'entregue', label: 'Entregue', cor: '#2e9e6b' },
]

export const PROCESSO = 'PAE 2026/3605765'

export const RELATORIOS = [
  {
    id: 'F-01', titulo: 'Quadro de pessoal', prazo: 'D+10', diretorias: ['DIOP', 'GABINETE'],
    entregar: 'mapa da força de trabalho por vínculo, cargo, carreira, jornada e lotação; quadro docente por escola, componente, etapa e turno.',
    incluir: 'cessões e órgão pagador; vagas, concursos e nomeações pendentes; regência, planejamento e formação.',
    indicadores: 'profissionais por vínculo, vagas e distribuição territorial.',
  },
  {
    id: 'F-02', titulo: 'Cobertura docente em 2027', prazo: 'D+10', diretorias: ['DIOP'],
    entregar: 'mapa da carga horária demandada, preenchida e descoberta; cronograma de lotação e remoção; estimativa de contratações, nomeações e custos.',
    incluir: 'AEE, apoio escolar, dobras e horas adicionais; providências antes da posse e decisões da nova gestão.',
    indicadores: 'déficit de horas/professores e turmas completas.',
    apoio: 'SAEBA e SAGR.',
  },
  {
    id: 'F-03', titulo: 'Seleção e provimento', prazo: 'D+10', diretorias: ['DIPSE'],
    entregar: 'inventário dos PSS e concursos; base dos contratos temporários, com validade, prorrogações e custo mensal com encargos.',
    incluir: 'editais, vagas, resultados, recursos, ações judiciais, nomeações e estágio probatório. Destacar contratos que vencem até 31/03/2027.',
    indicadores: 'vencimentos e vagas não providas.',
  },
  {
    id: 'F-04', titulo: 'Carreira e remuneração', prazo: 'D+10', diretorias: ['DIFOB'],
    entregar: 'PCCR, legislação e tabelas remuneratórias atualizadas; mapa de progressões, promoções, vantagens e requerimentos funcionais.',
    incluir: 'valores reconhecidos não pagos, impactos estimados, atos dos últimos 180 dias e divergências entre norma e prática da jornada.',
    indicadores: 'pendências, tramitação e valores.',
  },
  {
    id: 'F-05', titulo: 'Licenças e saúde ocupacional', prazo: 'D+10', diretorias: ['DIFOB'],
    entregar: 'mapa de licenças e afastamentos por unidade, cargo e componente, com previsão de retorno; quadro de perícias e readaptações pendentes.',
    incluir: 'licença-prêmio acumulada, gozada e saldo; estimativa do passivo; impacto nas aulas e substituições.',
    indicadores: 'afastamentos e aulas descobertas.',
  },
  {
    id: 'F-06', titulo: 'Folha de pagamento', prazo: 'D+5', prioridade: true, diretorias: ['DIFOB'],
    entregar: 'folhas mensais de 2025 e 2026 por vínculo e fonte; dicionário de rubricas com base legal e incidências; segregação Fundeb e elegibilidade aos 70%.',
    incluir: 'calendário dez/2026 e jan/2027, 13º, férias, contingência, encargos, consignações e folhas de pagamento; gestão e acessos do sistema.',
    indicadores: 'despesa e pagamentos pendentes.',
  },
  {
    id: 'F-07', titulo: 'Aposentadorias e benefícios', prazo: 'D+10', diretorias: ['DIOP'],
    entregar: 'carteira de processos de aposentadoria por fase, pendência, tramitação e previsão de conclusão; demonstrativo do abono de permanência.',
    incluir: 'concessão, implantação financeira, registro e revisão; projeção para 24 meses e efeito sobre a cobertura docente.',
    indicadores: 'processos por fase e aposentadorias previstas.',
  },
  {
    id: 'F-08', titulo: 'Passivos e riscos de pessoal', prazo: 'D+10', diretorias: ['DIFOB'],
    entregar: 'matriz de direitos não pagos, demandas judiciais, diferenças remuneratórias e obrigações de temporários; PADs em dados agregados.',
    incluir: 'riscos da folha/sistemas; valores classificados e identificador único, com referências B-05/J-01, sem duplicidade.',
    separar: 'principal, encargos, provisão, exposição e pagamentos.',
    apoio: 'CONJUR.',
  },
]

export const ALEM_BLOCO_F = {
  titulo: 'Além do Bloco F | J-06 e articulação institucional',
  j06: 'fornecer ao Gabinete a relação de atos de pessoal dos últimos 180 dias, com fundamento e efeitos financeiros, incluindo atualizações até a posse. Prazo: D+10; atualizar em D+15 e até a posse.',
  interfaces: 'conciliar F-06 com B-03 (Fundeb) e F-08 com B-05/J-01 (passivos). O despacho atribui à SAGEP o levantamento funcional e da folha; as conciliações financeiras cabem à SAPF.',
}

export const PADRAO_COMUM =
  'PDF assinado + planilha XLSX/CSV editável + evidências. Informar fonte, sistema, período, data-base, responsáveis e versão. Pessoal: apresentar também a posição na data da entrega. Encerrar com pendências, riscos, providências, decisões, responsáveis e prazos. Protocolar no canal institucional; dados nominais somente quando necessários, autorizados e com acesso restrito.'

export const AVISO_PRAZOS = {
  titulo: 'Prazos: prioridade à folha e à resposta institucional',
  quadro: 'F-06 em D+5; outros sete relatórios em D+10. D0: recebimento formal do ofício inicial.',
  atencao: 'o Ofício nº 007/2026 solicita atendimento em 5 dias úteis; o despacho de 26/10/2026 determina cumprimento imediato. Validar o calendário com a coordenação, sem presumir prorrogação.',
}
