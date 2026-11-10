// Edge Function: envia um e-mail ao administrador quando alguém solicita acesso ao painel.
// Disparada por um Database Webhook (INSERT na tabela public.perfis).
//
// Secrets necessários (supabase secrets set ...):
//   RESEND_API_KEY  chave da conta gratuita em https://resend.com
//   ADMIN_EMAIL     e-mail que receberá os avisos (use o e-mail da sua conta Resend)
//   PAINEL_URL      endereço do painel, ex.: https://transicaosagep.vercel.app

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    const novo = payload?.record
    if (!novo || novo.status !== 'pendente') {
      return new Response('ignorado', { status: 200 })
    }

    const painel = Deno.env.get('PAINEL_URL') ?? ''
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:520px">
        <h2 style="color:#07547b">Nova solicitação de acesso – Painel de Transição</h2>
        <p><b>Nome:</b> ${novo.nome ?? '-'}<br>
           <b>E-mail:</b> ${novo.email}<br>
           <b>Unidade/Cargo:</b> ${novo.unidade ?? '-'}</p>
        <p>Para autorizar ou rejeitar, entre no painel e abra <b>Gestão de acessos</b>.</p>
        ${painel ? `<p><a href="${painel}" style="background:#07547b;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Abrir o painel</a></p>` : ''}
      </div>`

    const resposta = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: 'Painel SAGEP <onboarding@resend.dev>',
        to: [Deno.env.get('ADMIN_EMAIL')],
        subject: `Solicitação de acesso: ${novo.nome ?? novo.email}`,
        html,
      }),
    })

    return new Response(await resposta.text(), { status: resposta.status })
  } catch (err) {
    return new Response(String(err), { status: 500 })
  }
})
