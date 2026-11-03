import { useState, useEffect } from 'react'

export const SAGEP_SLIDES = [
  { pag: 1, titulo: 'Visão Geral', sub: 'Estrutura organizacional e escopo de atuação' },
  { pag: 2, titulo: 'Identificação Institucional', sub: 'Autoridades, dirigentes e assessoria' },
  { pag: 3, titulo: 'Estrutura Geral SAGEP', sub: 'Diretorias (DIPSE, DIFOB, DIOP) e coordenadorias' },
  { pag: 4, titulo: 'Gabinete da SAGEP', sub: 'Estrutura organizacional e núcleos de conformidade' },
  { pag: 5, titulo: 'Fluxos de Processos', sub: 'Encaminhamentos, interlocução e tramitação no gabinete' },
  { pag: 6, titulo: 'DIPSE', sub: 'Estrutura organizacional e fluxo operacional' },
  { pag: 7, titulo: 'DIOP', sub: 'Estrutura organizacional e atribuições das coordenadorias' },
  { pag: 8, titulo: 'DIOP: Escopo de Atuação', sub: 'Seis eixos funcionais e de atendimento à rede' },
  { pag: 9, titulo: 'DIFOB', sub: 'Estrutura organizacional e eixos de atuação' },
  { pag: 10, titulo: 'CFOP: Eixos de Pagamento', sub: 'Folha, remunerações, encargos e benefícios' },
  { pag: 11, titulo: 'CVAS: Eixos de Valorização', sub: 'Saúde ocupacional, evolução e assistência ao servidor' },
]

export default function SagepModal({ aberto, onClose }) {
  const [pagina, setPagina] = useState(1)
  const [modo, setModo] = useState('slides') // 'slides' | 'pdf'
  const [mostrarThumbs, setMostrarThumbs] = useState(true)

  const total = SAGEP_SLIDES.length
  const slideAtual = SAGEP_SLIDES[pagina - 1]

  const voltar = () => setPagina((p) => Math.max(1, p - 1))
  const avancar = () => setPagina((p) => Math.min(total, p + 1))

  useEffect(() => {
    if (!aberto) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') voltar()
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') avancar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aberto, pagina])

  // Prevenir rolagem do body quando a janela estiver aberta
  useEffect(() => {
    if (aberto) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [aberto])

  if (!aberto) return null

  return (
    <div className="sagep-janela-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Estrutura SAGEP">
      <div className="sagep-janela" onClick={(e) => e.stopPropagation()}>
        {/* Barra de Título da Janela */}
        <header className="sagep-janela__topo">
          <div className="sagep-janela__marca">
            <span className="sagep-badge-red">SAGEP</span>
            <div className="sagep-janela__titulos">
              <h2 className="sagep-janela__titulo">Estrutura Organizacional e Escopo de Atuação</h2>
              <p className="sagep-janela__sub">
                Secretaria Adjunta de Gestão de Pessoas • SEDUC-PA &bull; Visão detalhada oficial ({total} páginas)
              </p>
            </div>
          </div>

          <div className="sagep-janela__controles">
            {/* Seletor de visualização */}
            <div className="sagep-modo-switch">
              <button
                type="button"
                className={`sagep-modo-btn ${modo === 'slides' ? 'sagep-modo-btn--ativo' : ''}`}
                onClick={() => setModo('slides')}
                title="Modo Apresentação (Slides Interativos)"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                <span>Apresentação</span>
              </button>
              <button
                type="button"
                className={`sagep-modo-btn ${modo === 'pdf' ? 'sagep-modo-btn--ativo' : ''}`}
                onClick={() => setModo('pdf')}
                title="Visualizador PDF Integrado"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <span>Documento PDF</span>
              </button>
            </div>

            {/* Ações */}
            <a
              href="/sagep-estrutura.pdf"
              download="SAGEP_Estrutura_Organizacional.pdf"
              className="sagep-btn-download"
              title="Baixar arquivo PDF original"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Baixar PDF</span>
            </a>

            <button
              type="button"
              className="sagep-btn-fechar"
              onClick={onClose}
              title="Fechar janela (Esc)"
              aria-label="Fechar"
            >
              &times;
            </button>
          </div>
        </header>

        {/* Corpo da Janela */}
        <div className="sagep-janela__corpo">
          {modo === 'slides' ? (
            <div className="sagep-slides-view">
              {/* Área do Slide Principal */}
              <div className="sagep-slide-palco">
                <button
                  type="button"
                  className="sagep-nav-seta sagep-nav-seta--esq"
                  onClick={voltar}
                  disabled={pagina === 1}
                  aria-label="Slide anterior"
                  title="Anterior (←)"
                >
                  &#8249;
                </button>

                <div className="sagep-slide-moldura">
                  <img
                    src={`/sagep/page-${pagina}.png`}
                    alt={`Página ${pagina}: ${slideAtual.titulo}`}
                    className="sagep-slide-img"
                    loading="eager"
                  />
                </div>

                <button
                  type="button"
                  className="sagep-nav-seta sagep-nav-seta--dir"
                  onClick={avancar}
                  disabled={pagina === total}
                  aria-label="Próximo slide"
                  title="Próximo (→)"
                >
                  &#8250;
                </button>
              </div>

              {/* Barra Inferior com Indicadores e Thumbnails */}
              <footer className="sagep-slides-rodape">
                <div className="sagep-slides-info">
                  <div className="sagep-slides-paginacao">
                    <button
                      type="button"
                      className="sagep-btn-nav-mini"
                      onClick={voltar}
                      disabled={pagina === 1}
                    >
                      &lsaquo; Anterior
                    </button>
                    <span className="sagep-slides-badge">
                      Slide <strong>{pagina}</strong> de {total}
                    </span>
                    <button
                      type="button"
                      className="sagep-btn-nav-mini"
                      onClick={avancar}
                      disabled={pagina === total}
                    >
                      Próximo &rsaquo;
                    </button>
                  </div>

                  <div className="sagep-slides-legenda">
                    <strong>{slideAtual.titulo}</strong> &bull; {slideAtual.sub}
                  </div>

                  <button
                    type="button"
                    className="sagep-btn-thumbs-toggle"
                    onClick={() => setMostrarThumbs(!mostrarThumbs)}
                  >
                    {mostrarThumbs ? 'Ocultar miniaturas' : 'Ver todas as 11 páginas'}
                  </button>
                </div>

                {mostrarThumbs && (
                  <div className="sagep-thumbs-drawer">
                    {SAGEP_SLIDES.map((s) => (
                      <button
                        key={s.pag}
                        type="button"
                        className={`sagep-thumb-card ${pagina === s.pag ? 'sagep-thumb-card--ativo' : ''}`}
                        onClick={() => setPagina(s.pag)}
                        title={`Página ${s.pag}: ${s.titulo}`}
                      >
                        <div className="sagep-thumb-img-wrap">
                          <img
                            src={`/sagep/page-${s.pag}.png`}
                            alt={s.titulo}
                            className="sagep-thumb-img"
                            loading="lazy"
                          />
                          <span className="sagep-thumb-numero">{s.pag}</span>
                        </div>
                        <span className="sagep-thumb-rotulo">{s.titulo}</span>
                      </button>
                    ))}
                  </div>
                )}
              </footer>
            </div>
          ) : (
            <div className="sagep-pdf-view">
              <iframe
                src="/sagep-estrutura.pdf#view=FitH"
                title="SAGEP Estrutura e Escopo PDF"
                className="sagep-pdf-frame"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
