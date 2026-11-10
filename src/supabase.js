import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

/** Verifica se as credenciais do Supabase foram preenchidas no .env ou na Vercel */
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('seu-projeto')
)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null

/** Perfil (status de aprovação e papel) do usuário logado. null se não existir. */
export async function buscarPerfil(userId) {
  if (!supabase || !userId) return null
  const { data, error } = await supabase
    .from('perfis')
    .select('user_id, email, nome, unidade, papel, status')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) {
    console.warn('Não foi possível ler o perfil:', error.message)
    return null
  }
  return data
}

/** Registra o acesso do usuário (só funciona para usuários aprovados) */
export async function registrarAcesso(user, perfil) {
  if (!supabase || !user) return null
  try {
    const { error } = await supabase.from('acessos_painel').insert([{
      user_id: user.id,
      email: user.email,
      nome: perfil?.nome || user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuário',
      data_hora: new Date().toISOString(),
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
    }])
    if (error) console.warn('Log de acesso não gravado:', error.message)
  } catch (err) {
    console.warn('Erro ao registrar log de acesso:', err)
  }
}

/** [Admin] lista todos os perfis */
export async function listarPerfis() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('perfis')
    .select('user_id, email, nome, unidade, papel, status, criado_em, decidido_em, decidido_por')
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data || []
}

/** [Admin] aprova, rejeita ou revoga o acesso de um usuário */
export async function decidirPerfil(userId, status, decididoPor) {
  const { error } = await supabase
    .from('perfis')
    .update({ status, decidido_em: new Date().toISOString(), decidido_por: decididoPor })
    .eq('user_id', userId)
  if (error) throw error
}

/** [Admin] últimos acessos registrados */
export async function listarAcessos(limite = 100) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('acessos_painel')
    .select('id, email, nome, data_hora, user_agent')
    .order('data_hora', { ascending: false })
    .limit(limite)
  if (error) throw error
  return data || []
}
