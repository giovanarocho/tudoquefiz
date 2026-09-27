import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';
import { useStore } from '../context/StoreContext';
import { supabase } from '../lib/supabaseClient';
import { money } from '../lib/money';

const STATUS_LABEL = {
  aguardando_pagamento: 'aguardando pagamento',
  pago: 'pago',
  cancelado: 'cancelado'
};

export default function Conta() {
  const { session, toast } = useStore();
  const [mode, setMode] = useState('login'); // login | signup
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    if (!session) return;
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
      .then(({ data }) => setOrders(data || []));
  }, [session]);

  const submit = async () => {
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { full_name: form.name, phone: form.phone } }
        });
        if (error) throw error;
        toast('Conta criada! Confira seu e-mail se pedirmos confirmação.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) throw error;
      }
    } catch (e) {
      toast(e.message);
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => { await supabase.auth.signOut(); };

  return (
    <>
      <Head><title>Minha conta — tudo que fiz</title></Head>
      <Header />
      <div className="wrap" style={{ paddingBlock: 40, maxWidth: 560 }}>
        {!session ? (
          <div className="admin-panel">
            <h2 style={{ marginTop: 0, color: 'var(--fuchsia)' }}>{mode === 'signup' ? 'Criar conta' : 'Entrar'}</h2>
            {mode === 'signup' && (
              <>
                <div className="field"><label>Nome</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="field"><label>WhatsApp</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              </>
            )}
            <div className="field"><label>E-mail</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="field"><label>Senha</label><input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
            <button className="btn btn-primary btn-block" disabled={busy} onClick={submit}>
              {busy ? 'Só um instante…' : mode === 'signup' ? 'Criar conta' : 'Entrar'}
            </button>
            <button className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}>
              {mode === 'signup' ? 'Já tenho conta' : 'Criar conta nova'}
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ margin: 0, color: 'var(--fuchsia)' }}>Meus pedidos</h2>
              <button className="btn btn-ghost btn-sm" onClick={logout}>Sair</button>
            </div>
            {orders === null && <p className="small-muted">Carregando…</p>}
            {orders && orders.length === 0 && <p className="small-muted">Você ainda não fez nenhum pedido.</p>}
            <div className="admin-list">
              {orders && orders.map(o => (
                <div className="admin-row" key={o.id} style={{ alignItems: 'flex-start' }}>
                  <div className="grow">
                    <div className="name">{new Date(o.created_at).toLocaleDateString('pt-BR')} · {money(o.total_cents)}</div>
                    <div className="meta">{o.order_items.map(it => `${it.qty}x ${it.name}`).join(', ')}</div>
                    <div className="meta">Pagamento: {o.payment_method === 'pix' ? 'Pix' : 'Cartão'} · <span className={`tag-pill ${o.status}`}>{STATUS_LABEL[o.status] || o.status}</span></div>
                  </div>
                </div>
              ))}
            </div>

            <hr className="sep" />
            <p className="small-muted">Faz coisas com as mãos e quer vender aqui também?</p>
            <Link href="/vendedor" className="btn btn-ghost btn-block">Painel da vendedora</Link>
          </>
        )}
      </div>
    </>
  );
}
