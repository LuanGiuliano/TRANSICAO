import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

/**
 * Verifica se as credenciais do Supabase foram preenchidas no .env ou no painel da Vercel
 */
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('seu-projeto')
)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

/**
 * Registra o log de acesso do usuário no banco de dados Supabase (tabela: acessos_painel)
 */
export async function registrarAcesso(user) {
  if (!supabase || !user) return null

  try {
    const registro = {
      user_id: user.id,
      email: user.email,
      nome: user.user_metadata?.nome || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
      data_hora: new Date().toISOString(),
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
    }

    const { data, error } = await supabase
      .from('acessos_painel')
      .insert([registro])

    if (error) {
      console.warn('Aviso: log de acesso não pôde ser gravado na tabela acessos_painel:', error.message)
    }
    return data
  } catch (err) {
    console.warn('Erro ao registrar log de acesso:', err)
    return null
  }
}
