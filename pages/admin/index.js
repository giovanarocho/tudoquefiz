import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useStore } from '../../context/StoreContext';
import { supabase } from '../../lib/supabaseClient';
import { money } from '../../lib/money';
import { ICONS } from '../../lib/icons';

const TABS = ['produtos', 'categorias', 'vendedores', 'candidaturas', 'lista-de-espera', 'configuracoes'];
const TAB_LABEL = {
  produtos: 'Produtos',
  categorias: 'Categorias',
  vendedores: 'Vendedores',
  candidaturas: 'Candidaturas',
  'lista-de-espera': 'Lista de espera',
  configuracoes: 'Configurações'
};

const emptyProduct = { id: null, name: '', description: '', category_id: '', price_cents: 0, stock: 1, image_url: '', seller_id: '', active: true };
const emptyCategory = { id: '', name: '', icon: 'outros', sort_order: 0 };
const emptySeller = { id: null, name: '', status: 'aprovado', pix_key: '' };

export default function AdminPage() {
  const router = useRouter();
  const { session, profile, categories, products, sellers, settings, loadCatalog, toast } = useStore();
  const [tab, setTab] = useState('produtos');
  const [checking, setChecking] = useState(true);

  const [productForm, setProductForm] = useState(null);
  const [categoryForm, setCategoryForm] = useState(null);
  const [sellerForm, setSellerForm] = useState(null);
  const [settingsForm, setSettingsForm] = useState(settings);
  const [waitlistRows, setWaitlistRows] = useState(null);
  const [applications, setApplications] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { setSettingsForm(settings); }, [settings]);

  useEffect(() => {
    if (session === null) { setChecking(false); return; }
    if (session && profile) setChecking(false);
  }, [session, profile]);

  useEffect(() => {
    if (tab === 'lista-de-espera' && profile?.is_admin) {
      supabase.from('waitlist').select('*, products(name)').order('created_at', { ascending: false })
        .then(({ data }) => setWaitlistRows(data || []));
    }
  }, [tab, profile]);

  const loadApplications = () => {
    supabase.from('seller_applications').select('*, profiles(full_name, phone)').order('created_at', { ascending: false })
      .then(({ data }) => setApplications(data || []));
  };

  useEffect(() => {
    if (tab === 'candidaturas' && profile?.is_admin) loadApplications();
  }, [tab, profile]);

  if (checking) {
    return <div className="wrap" style={{ paddingBlock: 60 }}><p className="small-muted">Verificando acesso…</p></div>;
  }

  if (!session) {
    return (
      <div className="wrap" style={{ paddingBlock: 60, maxWidth: 420 }}>
        <h2 style={{ color: 'var(--fuchsia)' }}>Painel administrativo</h2>
        <p className="small-muted">Você precisa entrar com uma conta de administrador. Faça login em <a href="/conta">/conta</a> e volte aqui.</p>
      </div>
    );
  }

  if (!profile?.is_admin) {
    return (
      <div className="wrap" style={{ paddingBlock: 60, maxWidth: 420 }}>
        <h2 style={{ color: 'var(--fuchsia)' }}>Acesso restrito</h2>
        <p className="small-muted">Essa conta não tem permissão de administrador.</p>
      </div>
    );
  }

  const isOwnerAdmin = true; // já confirmado is_admin acima

  // ---------- PRODUTOS ----------
  const saveProduct = async () => {
    const p = productForm;
    if (!p.name || !p.category_id || !p.seller_id) { toast('Preenche nome, categoria e vendedor'); return; }
    const payload = {
      name: p.name, description: p.description, category_id: p.category_id,
      price_cents: Math.round(Number(p.price_cents) || 0), stock: Math.round(Number(p.stock) || 0),
      image_url: p.image_url || null, seller_id: p.seller_id, active: !!p.active
    };
    let error;
    if (p.id) {
      ({ error } = await supabase.from('products').update(payload).eq('id', p.id));
    } else {
      ({ error } = await supabase.from('products').insert(payload));
    }
    if (error) { toast('Erro ao salvar produto: ' + error.message); return; }
    toast('Produto salvo!');
    setProductForm(null);
    loadCatalog();
  };
  const deleteProduct = async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { toast('Não deu pra excluir: ' + error.message); return; }
    toast('Produto excluído');
    loadCatalog();
  };
  const uploadProductImage = async (file, setter) => {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('product-images').upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      setter(data.publicUrl);
      toast('Foto enviada!');
    } catch (e) {
      toast('Não deu pra enviar a foto: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  // ---------- CATEGORIAS ----------
  const saveCategory = async () => {
    const c = categoryForm;
    if (!c.name || !c.id) { toast('Preenche id e nome da categoria'); return; }
    const payload = { id: c.id, name: c.name, icon: c.icon, sort_order: Number(c.sort_order) || 0 };
    const { error } = await supabase.from('categories').upsert(payload);
    if (error) { toast('Erro ao salvar categoria: ' + error.message); return; }
    toast('Categoria salva!');
    setCategoryForm(null);
    loadCatalog();
  };
  const deleteCategory = async (id) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) { toast('Não deu pra excluir (talvez tenha produtos nela ainda)'); return; }
    toast('Categoria excluída');
    loadCatalog();
  };

  // ---------- VENDEDORES ----------
  const saveSeller = async () => {
    const s = sellerForm;
    if (!s.name) { toast('Preenche o nome do vendedor'); return; }
    const payload = { name: s.name, status: s.status, pix_key: s.pix_key || null };
    let error;
    if (s.id) {
      ({ error } = await supabase.from('sellers').update(payload).eq('id', s.id));
    } else {
      ({ error } = await supabase.from('sellers').insert(payload));
    }
    if (error) { toast('Erro ao salvar vendedor: ' + error.message); return; }
    toast('Vendedor salvo!');
    setSellerForm(null);
    loadCatalog();
  };
  const setSellerStatus = async (id, status) => {
    const { error } = await supabase.from('sellers').update({ status }).eq('id', id);
    if (error) { toast('Erro: ' + error.message); return; }
    loadCatalog();
  };

  // ---------- CANDIDATURAS DE VENDEDORAS ----------
  const approveApplication = async (app) => {
    // cria (ou reaproveita) o vendedor e libera o acesso da pessoa ao painel dela
    const { data: newSeller, error: sellerErr } = await supabase
      .from('sellers')
      .insert({ name: app.name, owner_profile_id: app.profile_id, status: 'aprovado' })
      .select()
      .single();
    if (sellerErr) { toast('Erro ao criar vendedora: ' + sellerErr.message); return; }

    const { error: profErr } = await supabase.from('profiles').update({ seller_id: newSeller.id }).eq('id', app.profile_id);
    if (profErr) { toast('Vendedora criada, mas não deu pra ligar ao perfil: ' + profErr.message); return; }

    await supabase.from('seller_applications').update({ status: 'aprovado' }).eq('id', app.id);
    toast('Aprovada! Ela já acessa o painel dela em /vendedor.');
    loadApplications();
    loadCatalog();
  };
  const rejectApplication = async (app) => {
    const { error } = await supabase.from('seller_applications').update({ status: 'recusado' }).eq('id', app.id);
    if (error) { toast('Erro: ' + error.message); return; }
    toast('Candidatura recusada');
    loadApplications();
  };

  // ---------- CONFIGURAÇÕES ----------
  const saveSettings = async () => {
    setSavingSettings(true);
    const { error } = await supabase.from('settings').update({
      whatsapp: settingsForm.whatsapp, instagram: settingsForm.instagram,
      tagline: settingsForm.tagline, story: settingsForm.story
    }).eq('id', 1);
    setSavingSettings(false);
    if (error) { toast('Erro ao salvar: ' + error.message); return; }
    toast('Configurações salvas!');
    loadCatalog();
  };

  return (
    <>
      <Head><title>Painel — tudo que fiz</title></Head>
      <div className="admin-bar">
        <div className="wrap inner">
          <strong style={{ color: 'var(--fuchsia)' }}>painel · tudo que fiz</strong>
          <div className="tabs">
            {TABS.map(t => (
              <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{TAB_LABEL[t]}</button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => router.push('/')}>Ver loja</button>
        </div>
      </div>

      <div className="wrap admin-body">
        {tab === 'produtos' && (
          <>
            <div className="section-head">
              <h2>Produtos</h2>
              <button className="btn btn-primary btn-sm" onClick={() => setProductForm({ ...emptyProduct, seller_id: sellers.find(s => s.is_store_owner)?.id || '', category_id: categories[0]?.id || '' })}>+ novo produto</button>
            </div>
            <div className="admin-list">
              {products.map(p => (
                <div className="admin-row" key={p.id}>
                  <div className="grow">
                    <div className="name">{p.name} {!p.active && <span className="tag-pill cancelado">inativo</span>}</div>
                    <div className="meta">{money(p.price_cents)} · estoque: {p.stock} · {categories.find(c => c.id === p.category_id)?.name || p.category_id}</div>
                  </div>
                  <div className="row-actions">
                    <button className="icon-sm" onClick={() => setProductForm({ ...p })}>✎</button>
                    <button className="icon-sm" onClick={() => deleteProduct(p.id)}>🗑</button>
                  </div>
                </div>
              ))}
              {products.length === 0 && <p className="small-muted">Nenhum produto cadastrado ainda.</p>}
            </div>

            {productForm && (
              <div className="admin-panel">
                <h3 style={{ marginTop: 0 }}>{productForm.id ? 'Editar produto' : 'Novo produto'}</h3>
                <div className="field"><label>Nome</label><input value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} /></div>
                <div className="field"><label>Descrição</label><textarea value={productForm.description || ''} onChange={e => setProductForm({ ...productForm, description: e.target.value })} /></div>
                <div className="two-col">
                  <div className="field"><label>Categoria</label>
                    <select value={productForm.category_id} onChange={e => setProductForm({ ...productForm, category_id: e.target.value })}>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="field"><label>Vendedor</label>
                    <select value={productForm.seller_id} onChange={e => setProductForm({ ...productForm, seller_id: e.target.value })}>
                      {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="two-col">
                  <div className="field"><label>Preço (R$)</label><input type="number" step="0.01" value={productForm.price_cents / 100} onChange={e => setProductForm({ ...productForm, price_cents: Math.round(Number(e.target.value) * 100) })} /></div>
                  <div className="field"><label>Estoque</label><input type="number" value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: e.target.value })} /></div>
                </div>
                <div className="field">
                  <label>Foto</label>
                  {productForm.image_url && <img src={productForm.image_url} alt="" style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 10, marginBottom: 8 }} />}
                  <input type="file" accept="image/*" disabled={uploading} onChange={e => e.target.files[0] && uploadProductImage(e.target.files[0], (url) => setProductForm(f => ({ ...f, image_url: url })))} />
                  {uploading && <span className="small-muted">Enviando…</span>}
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, marginBottom: 14 }}>
                  <input type="checkbox" checked={productForm.active} onChange={e => setProductForm({ ...productForm, active: e.target.checked })} /> Ativo na loja
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" onClick={saveProduct}>Salvar</button>
                  <button className="btn btn-ghost" onClick={() => setProductForm(null)}>Cancelar</button>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'categorias' && (
          <>
            <div className="section-head">
              <h2>Categorias</h2>
              <button className="btn btn-primary btn-sm" onClick={() => setCategoryForm({ ...emptyCategory })}>+ nova categoria</button>
            </div>
            <div className="admin-list">
              {categories.map(c => (
                <div className="admin-row" key={c.id}>
                  <span className="icon-sm" style={{ display: 'grid', placeItems: 'center' }} dangerouslySetInnerHTML={{ __html: ICONS[c.icon] || ICONS.outros }} />
                  <div className="grow">
                    <div className="name">{c.name}</div>
                    <div className="meta">id: {c.id} · ordem: {c.sort_order}</div>
                  </div>
                  <div className="row-actions">
                    <button className="icon-sm" onClick={() => setCategoryForm({ ...c })}>✎</button>
                    <button className="icon-sm" onClick={() => deleteCategory(c.id)}>🗑</button>
                  </div>
                </div>
              ))}
            </div>

            {categoryForm && (
              <div className="admin-panel">
                <h3 style={{ marginTop: 0 }}>{categories.find(c => c.id === categoryForm.id) ? 'Editar categoria' : 'Nova categoria'}</h3>
                <div className="field"><label>Id (sem espaços, ex: ceramica)</label><input value={categoryForm.id} disabled={!!categories.find(c => c.id === categoryForm.id)} onChange={e => setCategoryForm({ ...categoryForm, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })} /></div>
                <div className="field"><label>Nome</label><input value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} /></div>
                <div className="field"><label>Ícone</label>
                  <select value={categoryForm.icon} onChange={e => setCategoryForm({ ...categoryForm, icon: e.target.value })}>
                    {Object.keys(ICONS).map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div className="field"><label>Ordem</label><input type="number" value={categoryForm.sort_order} onChange={e => setCategoryForm({ ...categoryForm, sort_order: e.target.value })} /></div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" onClick={saveCategory}>Salvar</button>
                  <button className="btn btn-ghost" onClick={() => setCategoryForm(null)}>Cancelar</button>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'vendedores' && (
          <>
            <div className="section-head">
              <h2>Vendedores</h2>
              <button className="btn btn-primary btn-sm" onClick={() => setSellerForm({ ...emptySeller })}>+ novo vendedor</button>
            </div>
            <p className="proto-note">O jeito mais simples de aprovar uma vendedora nova é pela aba <strong>Candidaturas</strong> — ela mesma pede pelo site e você aprova com um clique. Esta lista aqui é útil pra editar dados de uma vendedora já existente, bloquear alguém, ou cadastrar uma vendedora manualmente sem ela precisar pedir.</p>
            <div className="admin-list">
              {sellers.map(s => (
                <div className="admin-row" key={s.id}>
                  <div className="grow">
                    <div className="name">{s.name} {s.is_store_owner && <span className="tag-pill pago">loja própria</span>}</div>
                    <div className="meta">status: {s.status}{s.pix_key ? ` · pix: ${s.pix_key}` : ''}</div>
                  </div>
                  <div className="row-actions">
                    {!s.is_store_owner && s.status !== 'aprovado' && <button className="icon-sm" title="aprovar" onClick={() => setSellerStatus(s.id, 'aprovado')}>✔</button>}
                    {!s.is_store_owner && s.status !== 'bloqueado' && <button className="icon-sm" title="bloquear" onClick={() => setSellerStatus(s.id, 'bloqueado')}>⛔</button>}
                    {!s.is_store_owner && <button className="icon-sm" onClick={() => setSellerForm({ ...s })}>✎</button>}
                  </div>
                </div>
              ))}
            </div>

            {sellerForm && (
              <div className="admin-panel">
                <h3 style={{ marginTop: 0 }}>{sellerForm.id ? 'Editar vendedor' : 'Novo vendedor'}</h3>
                <div className="field"><label>Nome</label><input value={sellerForm.name} onChange={e => setSellerForm({ ...sellerForm, name: e.target.value })} /></div>
                <div className="field"><label>Status</label>
                  <select value={sellerForm.status} onChange={e => setSellerForm({ ...sellerForm, status: e.target.value })}>
                    <option value="pendente">pendente</option>
                    <option value="aprovado">aprovado</option>
                    <option value="bloqueado">bloqueado</option>
                  </select>
                </div>
                <div className="field"><label>Chave Pix (opcional, se receber direto)</label><input value={sellerForm.pix_key || ''} onChange={e => setSellerForm({ ...sellerForm, pix_key: e.target.value })} /></div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" onClick={saveSeller}>Salvar</button>
                  <button className="btn btn-ghost" onClick={() => setSellerForm(null)}>Cancelar</button>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'candidaturas' && (
          <>
            <div className="section-head"><h2>Candidaturas de vendedoras</h2></div>
            <p className="proto-note">Quando alguém cria conta no site e pede pra vender (em <code>/vendedor</code>), a candidatura cai aqui. Aprovando, a pessoa já acessa o painel dela sozinha, sem precisar de SQL.</p>
            {applications === null && <p className="small-muted">Carregando…</p>}
            {applications && applications.length === 0 && <p className="small-muted">Nenhuma candidatura ainda.</p>}
            <div className="admin-list">
              {applications && applications.map(a => (
                <div className="admin-row" key={a.id} style={{ alignItems: 'flex-start' }}>
                  <div className="grow">
                    <div className="name">{a.name} <span className={`tag-pill ${a.status === 'aprovado' ? 'pago' : a.status === 'recusado' ? 'cancelado' : 'aguardando_pagamento'}`}>{a.status}</span></div>
                    <div className="meta">{a.profiles?.full_name} · {a.profiles?.phone} · {new Date(a.created_at).toLocaleDateString('pt-BR')}</div>
                    {a.message && <div className="meta" style={{ marginTop: 4 }}>"{a.message}"</div>}
                  </div>
                  {a.status === 'pendente' && (
                    <div className="row-actions">
                      <button className="icon-sm" title="aprovar" onClick={() => approveApplication(a)}>✔</button>
                      <button className="icon-sm" title="recusar" onClick={() => rejectApplication(a)}>✕</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'lista-de-espera' && (
          <>
            <div className="section-head"><h2>Lista de espera</h2></div>
            {waitlistRows === null && <p className="small-muted">Carregando…</p>}
            {waitlistRows && waitlistRows.length === 0 && <p className="small-muted">Ninguém entrou na lista de espera ainda.</p>}
            <div className="admin-list">
              {waitlistRows && waitlistRows.map(w => (
                <div className="admin-row" key={w.id}>
                  <div className="grow">
                    <div className="name">{w.name} — {w.phone}</div>
                    <div className="meta">produto: {w.products?.name || w.product_id} · {new Date(w.created_at).toLocaleDateString('pt-BR')}</div>
                  </div>
                  <a className="btn btn-ghost btn-sm" target="_blank" rel="noreferrer" href={`https://wa.me/55${w.phone.replace(/\D/g, '')}`}>Chamar no WhatsApp</a>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'configuracoes' && (
          <>
            <div className="section-head"><h2>Configurações</h2></div>
            <div className="admin-panel">
              <div className="two-col">
                <div className="field"><label>WhatsApp (só números, com DDI+DDD)</label><input value={settingsForm.whatsapp || ''} onChange={e => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })} /></div>
                <div className="field"><label>Instagram</label><input value={settingsForm.instagram || ''} onChange={e => setSettingsForm({ ...settingsForm, instagram: e.target.value })} /></div>
              </div>
              <div className="field"><label>Tagline (hero)</label><input value={settingsForm.tagline || ''} onChange={e => setSettingsForm({ ...settingsForm, tagline: e.target.value })} /></div>
              <div className="field"><label>História (seção "quem faz")</label><textarea value={settingsForm.story || ''} onChange={e => setSettingsForm({ ...settingsForm, story: e.target.value })} /></div>
              <button className="btn btn-primary" disabled={savingSettings} onClick={saveSettings}>{savingSettings ? 'Salvando…' : 'Salvar configurações'}</button>
              <hr className="sep" />
              <p className="small-muted">Chave Pix e credenciais de pagamento ficam nas variáveis de ambiente do servidor (<code>MP_ACCESS_TOKEN</code>), não aqui — por segurança elas não passam pelo navegador.</p>
            </div>
          </>
        )}
      </div>
    </>
  );
}
