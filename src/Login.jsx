import { useState } from 'react'
import brasao from './assets/brasao.png'
import { supabase, isSupabaseConfigured, registrarAcesso } from './supabase.js'

export default function Login({ onLogin }) {
  const [modo, setModo] = useState('login') // 'login' | 'cadastro'
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    setSucesso('')

    if (!email || !senha) {
      setErro('Por favor, informe seu e-mail e sua senha.')
      return
    }

    if (!isSupabaseConfigured) {
      // Modo de teste / demonstração se as variáveis do Supabase ainda não foram preenchidas no .env
      const demoUser = {
        id: 'demo-user-id',
        email: email.trim(),
        user_metadata: { nome: nome || email.split('@')[0] },
      }
      onLogin(demoUser)
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
            setErro('E-mail cadastrado, mas ainda não confirmado. Verifique sua caixa de entrada.')
          } else {
            setErro(`Erro ao entrar: ${error.message}`)
          }
          setCarregando(false)
          return
        }

        if (data?.user) {
          await registrarAcesso(data.user)
          onLogin(data.user)
        }
      } else {
        // Cadastro de novo usuário
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
          options: {
            data: {
              nome: nome.trim() || email.split('@')[0],
            },
          },
        })

        if (error) {
          setErro(`Não foi possível cadastrar: ${error.message}`)
          setCarregando(false)
          return
        }

        if (data?.session?.user) {
          await registrarAcesso(data.session.user)
          onLogin(data.session.user)
        } else {
          setSucesso('Cadastro realizado com sucesso! Se a confirmação de e-mail estiver ativada no seu Supabase, confirme pelo link enviado ao seu e-mail antes de fazer login.')
          setModo('login')
        }
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
    })
  }

  return (
    <div className="login-tela">
      <div className="login-card">
        {/* Cabeçalho Institucional do Login */}
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
          <p className="login-card__sub">Autenticação de Usuários & Controle de Acessos</p>
        </div>

        {/* Aviso se o Supabase ainda não estiver com chaves preenchidas no .env */}
        {!isSupabaseConfigured && (
          <div className="login-aviso-supabase">
            <div className="login-aviso-supabase__head">
              <span className="login-aviso-supabase__badge">SUPABASE</span>
              <strong>Configuração de Chaves Pendente</strong>
            </div>
            <p className="login-aviso-supabase__txt">
              Insira <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> no arquivo <code>.env</code> para conectar ao seu banco real.
            </p>
            <button
              type="button"
              className="login-btn-demo"
              onClick={handleEntrarDemo}
              title="Entrar imediatamente para testar o sistema"
            >
              Entrar em modo de avaliação rápida ›
            </button>
          </div>
        )}

        {/* Alternância entre Login e Cadastro */}
        <div className="login-abas" role="tablist">
          <button
            type="button"
            className={`login-aba ${modo === 'login' ? 'login-aba--ativa' : ''}`}
            onClick={() => { setModo('login'); setErro(''); setSucesso('') }}
          >
            Acessar com E-mail e Senha
          </button>
          <button
            type="button"
            className={`login-aba ${modo === 'cadastro' ? 'login-aba--ativa' : ''}`}
            onClick={() => { setModo('cadastro'); setErro(''); setSucesso('') }}
          >
            Cadastrar Novo Usuário
          </button>
        </div>

        {/* Mensagens de feedback */}
        {erro && <div className="login-msg login-msg--erro">{erro}</div>}
        {sucesso && <div className="login-msg login-msg--sucesso">{sucesso}</div>}

        {/* Formulário de Acesso */}
        <form className="login-form" onSubmit={handleSubmit}>
          {modo === 'cadastro' && (
            <div className="login-campo">
              <label htmlFor="login-nome">Nome Completo / Cargo</label>
              <input
                id="login-nome"
                type="text"
                placeholder="Ex: Maria Silva - Coordenadoria CPS"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}

          <div className="login-campo">
            <label htmlFor="login-email">E-mail Institucional</label>
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
              <label htmlFor="login-senha">Senha de Acesso</label>
              <button
                type="button"
                className="login-btn-toggle-senha"
                onClick={() => setMostrarSenha((v) => !v)}
              >
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

          <button
            type="submit"
            className="login-btn-submit"
            disabled={carregando}
          >
            {carregando ? (
              <span>Autenticando no Supabase...</span>
            ) : modo === 'login' ? (
              <span>Entrar no Painel ›</span>
            ) : (
              <span>Criar Conta e Registrar ›</span>
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
