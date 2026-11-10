import { useState } from 'react'
import brasao from './assets/brasao.png'
import { supabase, isSupabaseConfigured, registrarAcesso, buscarPerfil } from './supabase.js'

export default function Login({ onLogin, aviso }) {
  const [modo, setModo] = useState('login') // 'login' | 'cadastro'
  const [nome, setNome] = useState('')
  const [unidade, setUnidade] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [pendente, setPendente] = useState('')
  const [sucesso, setSucesso] = useState('')

  const limparMensagens = () => { setErro(''); setPendente(''); setSucesso('') }

  const handleSubmit = async (e) => {
    e.preventDefault()
    limparMensagens()

    if (!email || !senha) {
      setErro('Por favor, informe seu e-mail e sua senha.')
      return
    }

    if (!isSupabaseConfigured) {
      onLogin({
        id: 'demo-user-id',
        email: email.trim(),
        user_metadata: { nome: nome || email.split('@')[0] },
        perfil: { papel: 'usuario', status: 'aprovado' },
      })
      return
    }

    setCarregando(true)
    try {
      if (modo === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha,
        })

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setErro('E-mail ou senha incorretos. Verifique suas credenciais.')
          } else if (error.message.includes('Email not confirmed')) {
            setErro('E-mail ainda não confirmado. Verifique sua caixa de entrada.')
          } else {
            setErro(`Erro ao entrar: ${error.message}`)
          }
          return
        }

        const perfil = await buscarPerfil(data.user.id)

        if (!perfil || perfil.status === 'pendente') {
          await supabase.auth.signOut()
          setPendente('Seu cadastro ainda está aguardando autorização do administrador. Você poderá entrar assim que for aprovado.')
          return
        }
        if (perfil.status === 'rejeitado') {
          await supabase.auth.signOut()
          setErro('Seu acesso não foi autorizado. Em caso de dúvida, procure a coordenação da SAGEP.')
          return
        }

        await registrarAcesso(data.user, perfil)
        onLogin({ ...data.user, perfil })
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
          options: {
            data: {
              nome: nome.trim() || email.split('@')[0],
              unidade: unidade.trim(),
            },
          },
        })

        if (error) {
          setErro(`Não foi possível enviar o cadastro: ${error.message}`)
          return
        }

        // Garante que ninguém fique logado antes da autorização
        if (data?.session) await supabase.auth.signOut()

        setSucesso('Cadastro enviado! Sua solicitação foi encaminhada ao administrador. Você poderá acessar o painel somente após a autorização.')
        setModo('login')
        setSenha('')
      }
    } catch (err) {
      setErro(`Erro inesperado na comunicação com o Supabase: ${err.message}`)
    } finally {
      setCarregando(false)
    }
  }

  const handleEntrarDemo = () => {
    onLogin({
      id: 'acesso-convidado',
      email: 'gestor.sagep@seduc.pa.gov.br',
      user_metadata: { nome: 'Gestor SAGEP (Acesso Local)' },
      perfil: { papel: 'usuario', status: 'aprovado' },
    })
  }

  return (
    <div className="login-tela">
      <div className="login-card">
        <div className="login-card__topo">
          <img className="login-card__brasao" src={brasao} alt="Brasão do Estado do Pará" />
          <div className="login-card__identificacao">
            <span className="login-card__governo">GOVERNO DO ESTADO DO PARÁ</span>
            <span className="login-card__secretaria">SECRETARIA DE ESTADO DE EDUCAÇÃO – SEDUC</span>
            <span className="login-card__sagep">SECRETARIA ADJUNTA DE GESTÃO DE PESSOAS – SAGEP</span>
          </div>
        </div>

        <div className="login-card__titulo-box">
          <h2 className="login-card__titulo">Painel de Transição Governamental</h2>
          <p className="login-card__sub">Acesso restrito – cadastro sujeito à autorização</p>
        </div>

        {!isSupabaseConfigured && (
          <div className="login-aviso-supabase">
            <div className="login-aviso-supabase__head">
              <span className="login-aviso-supabase__badge">SUPABASE</span>
              <strong>Configuração de Chaves Pendente</strong>
            </div>
            <p className="login-aviso-supabase__txt">
              Insira <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> no arquivo <code>.env</code> para conectar ao seu banco real.
            </p>
            <button type="button" className="login-btn-demo" onClick={handleEntrarDemo}>
              Entrar em modo de avaliação rápida ›
            </button>
          </div>
        )}

        <div className="login-abas" role="tablist">
          <button
            type="button"
            className={`login-aba ${modo === 'login' ? 'login-aba--ativa' : ''}`}
            onClick={() => { setModo('login'); limparMensagens() }}
          >
            Entrar
          </button>
          <button
            type="button"
            className={`login-aba ${modo === 'cadastro' ? 'login-aba--ativa' : ''}`}
            onClick={() => { setModo('cadastro'); limparMensagens() }}
          >
            Solicitar Acesso
          </button>
        </div>

        {aviso && !erro && !pendente && <div className="login-msg login-msg--aviso">{aviso}</div>}
        {pendente && <div className="login-msg login-msg--aviso">{pendente}</div>}
        {erro && <div className="login-msg login-msg--erro">{erro}</div>}
        {sucesso && <div className="login-msg login-msg--sucesso">{sucesso}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          {modo === 'cadastro' && (
            <>
              <div className="login-campo">
                <label htmlFor="login-nome">Nome completo</label>
                <input
                  id="login-nome"
                  type="text"
                  placeholder="Ex: Maria Silva"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
              <div className="login-campo">
                <label htmlFor="login-unidade">Unidade / Cargo</label>
                <input
                  id="login-unidade"
                  type="text"
                  placeholder="Ex: DIOP – Assistente de Gestão"
                  value={unidade}
                  onChange={(e) => setUnidade(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div className="login-campo">
            <label htmlFor="login-email">E-mail institucional</label>
            <input
              id="login-email"
              type="email"
              placeholder="exemplo@seduc.pa.gov.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="login-campo">
            <div className="login-campo__linha-rotulo">
              <label htmlFor="login-senha">Senha</label>
              <button type="button" className="login-btn-toggle-senha" onClick={() => setMostrarSenha((v) => !v)}>
                {mostrarSenha ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <input
              id="login-senha"
              type={mostrarSenha ? 'text' : 'password'}
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={6}
              autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          <button type="submit" className="login-btn-submit" disabled={carregando}>
            {carregando ? (
              <span>Aguarde...</span>
            ) : modo === 'login' ? (
              <span>Entrar no Painel ›</span>
            ) : (
              <span>Enviar solicitação de acesso ›</span>
            )}
          </button>
        </form>

        <div className="login-card__rodape">
          <span>PAE 2026/3605765 &bull; Gestão de Pessoas (Bloco F)</span>
          <span className="login-card__creditos">
            Coordenação técnica: Prof. Francisco Paes &bull; Desenvolvedor: Luan Furtado
          </span>
        </div>
      </div>
    </div>
  )
}
