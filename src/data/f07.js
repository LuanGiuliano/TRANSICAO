// Dados da F-07 (Aposentadorias e benefícios) transcritos manualmente dos painéis
// em imagem da planilha DIOP.xlsx (CAPO – Coordenadoria de Aposentadoria).
// Imagens originais: public/f07/. Se a CAPO mudar os painéis, atualize este arquivo.

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export const F07 = {
  meses: MESES,

  // Publicações de aposentadoria por mês (professor / adm. geral)
  publicacoes: {
    2025: {
      professor: [118, 10, 6, 58, 31, 58, 35, 11, 22, 27, 14],
      adm: [48, 34, 39, 20, 21, 26, 7, 7, 3, 25, 28],
      total: 648,
    },
    2026: {
      professor: [85, 28, 52, 57, 83, 119, 108, 113, 127, 100],
      adm: [42, 5, 23, 23, 30, 18, 36, 25, 39, 44],
      total: 1158,
    },
  },

  // Quantitativo histórico de professores aposentados por ano
  historico: {
    anos: [[2018, 311], [2019, 509], [2020, 635], [2021, 393], [2022, 638], [2023, 283], [2024, 883], [2025, 289]],
    total: 3941, efetivos: 3566, naoEstavel: 375,
  },

  // Projeção anual 2026–2028 (cresc. composto de 5% a.a.; nov/dez 2026 = média mensal)
  projecao: {
    anos: ['2026', '2027', '2028'],
    professor: [1046, 1097, 1154],
    adm: [341, 357, 377],
    total: [1387, 1454, 1531],
    premissa: 'A projeção aplica crescimento composto de 5% ao ano aos valores mensais de 2026. São estimativas de planejamento, não previsão atuarial.',
  },
  cenarios: [
    { nome: 'Conservador (0%)', v: [1387, 1387, 1387] },
    { nome: 'Referência (5%)', v: [1387, 1456, 1529] },
    { nome: 'Expansivo (10%)', v: [1387, 1526, 1679] },
  ],

  // Tramitação dos processos PAE (26/05/2026 a 29/10/2026)
  pae: {
    periodo: '26/05/2026 a 29/10/2026',
    movimentacoes: 4123, processos: 2542, tempoMedioMov: '27,34 dias', tempoRegistro: '15 dias',
    prontos: 1025, prontosPct: 24.8,
    prontosDetalhe: [['Tramitação externa / IGEPPS', 640], ['Tramitação interna / CONJUR', 385]],
    destinos: [
      ['Análise / Parecer', 771], ['Encaminhamento', 680], ['Arquivamento', 507], ['Retorno ao interessado', 446],
      ['Diligência', 353], ['Revisão', 263], ['Outras atividades', 235], ['Demais destinos', 868],
    ],
    periodoMov: { categorias: ['Dia', 'Semana', 'Mês'], registros: [164, 721, 2831], processos: [102, 721, 1637] },
    analistas: [
      ['Analista 01', 758], ['Analista 02', 642], ['Analista 03', 571], ['Analista 04', 487],
      ['Analista 05', 398], ['Demais analistas', 1267],
    ],
    tempoEntre: [
      ['Análise / Parecer', 18.2, 7, 52], ['Encaminhamento', 24.7, 12, 68], ['Arquivamento', 36.5, 20, 102],
      ['Retorno ao interessado', 22.1, 10, 61], ['Diligência', 31.4, 16, 87], ['Revisão', 28.7, 14, 79],
      ['Outras atividades', 25.3, 11, 70], ['Demais destinos', 33.8, 17, 95],
    ],
    qualidade: [['Registro no mesmo dia', 3759], ['Registro posterior', 263], ['Registro anterior (verificar)', 101]],
  },

  // Painel de registros (base PAE, ~últimos 30 dias)
  registros: {
    total: 4111, processosUnicos: 2536,
    passivos: 2293, ativos: 1818, passivosUnicos: 1499, ativosUnicos: 1037,
  },
}
