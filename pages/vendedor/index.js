import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useStore } from '../../context/StoreContext';
import { supabase } from '../../lib/supabaseClient';
import { money } from '../../lib/money';

const emptyProduct = { id: null, name: '', description: '', category_id: '', price_cents: 0, stock: 1, image_url: '', active: true };

export default function VendedorPage() {
  const { session, profile, categories, toast } = useStore();
  const [checking, setChecking] = useState(true);
  const [seller, setSeller] = useState(null);
  const [application, setApplication] = useState(undefined); // undefined = ainda não carregou
  const [appForm, setAppForm] = useState({ name: '', message: '' });
  const [sending, setSending] = useState(false);

  const [products, setProducts] = useState(null);
  const [productForm, setProductForm] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (session === null) { setChecking(false); return; }
    if (session && profile) setChecking(false);
  }, [session, profile]);

  // já é vendedora aprovada: carrega os dados da loja dela + os produtos dela
  useEffect(() => {
    if (!profile?.seller_id) return;
    supabase.from('sellers').select('*').eq('id', profile.seller_id).single()
      .then(({ data }) => setSeller(data));
    loadMyProducts();
  }, [profile?.seller_id]);

  // ainda não é vendedora: verifica se já existe uma candidatura dela
  useEffect(() => {
    if (!session || profile?.seller_id) return;
    supabase.from('seller_applications').select('*').eq('profile_id', session.user.id).order('created_at', { ascending: false }).limit(1)
      .then(({ data }) => setApplication(data && data[0] ? data[0] : null));
  }, [session, profile]);

  const loadMyProducts = () => {
    supabase.from('products').select('*').eq('seller_id', profile.seller_id).order('created_at', { ascending: false })
      .then(({ data }) => setProducts(data || []));
  };

  const submitApplication = async () => {
    if (!appForm.name) { toast('Conta pra gente o nome da sua marca ou do que você faz'); return; }
    setSending(true);
    const { data, error } = await supabase.from('seller_applications')
      .insert({ profile_id: session.user.id, name: appForm.name, message: appForm.message })
      .select().single();
    setSending(false);
    if (error) { toast('Não deu pra enviar: ' + error.message); return; }
    setApplication(data);
    toast('Pedido enviado! A gente avisa assim que aprovar.');
  };

  const saveProduct = async () => {
    const p = productForm;
    if (!p.name || !p.category_id) { toast('Preenche nome e categoria'); return; }
    const payload = {
      name: p.name, description: p.description, category_id: p.category_id,
      price_cents: Math.round(Number(p.price_cents) || 0), stock: Math.round(Number(p.stock) || 0),
      image_url: p.image_url || null, seller_id: profile.seller_id, active: !!p.active
    };
    let error;
    if (p.id) ({ error } = await supabase.from('products').update(payload).eq('id', p.id));
    else ({ error } = await supabase.from('products').insert(payload));
    if (error) { toast('Erro ao salvar: ' + error.message); return; }
    toast('Produto salvo!');
    setProductForm(null);
    loadMyProducts();
  };
  const deleteProduct = async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { toast('Não deu pra excluir: ' + error.message); return; }
    toast('Produto excluído');
    loadMyProducts();
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

  if (checking) {
    return <div className="wrap" style={{ paddingBlock: 60 }}><p className="small-muted">Carregando…</p></div>;
  }

  if (!session) {
    return (
      <div className="wrap" style={{ paddingBlock: 60, maxWidth: 460 }}>
        <h2 style={{ color: 'var(--fuchsia)' }}>Painel da vendedora</h2>
        <p className="small-muted">Pra vender aqui você primeiro precisa de uma conta. Crie ou entre na sua e volte a esta página.</p>
        <Link href="/conta" className="btn btn-primary" style={{ marginTop: 12, display: 'inline-flex' }}>Criar conta / entrar</Link>
      </div>
    );
  }

  // logada mas ainda não é vendedora aprovada
  if (!profile?.seller_id) {
    return (
      <div className="wrap" style={{ paddingBlock: 60, maxWidth: 460 }}>
        <Head><title>Quero vender — tudo que fiz</title></Head>
        <h2 style={{ color: 'var(--fuchsia)', marginBottom: 4 }}>Quero vender aqui também</h2>
        <p className="small-muted">Conta rapidinho o que você faz. A gente analisa e, aprovando, seu painel abre nesta mesma página — é só voltar aqui e logar.</p>

        {application === undefined && <p className="small-muted" style={{ marginTop: 16 }}>Carregando…</p>}

        {application === null && (
          <div className="admin-panel">
            <div className="field"><label>Nome da sua marca ou do que você cria</label><input value={appForm.name} onChange={e => setAppForm({ ...appForm, name: e.target.value })} placeholder="Ex: Ateliê da Ana — cerâmica" /></div>
            <div className="field"><label>Conta um pouco mais (opcional)</label><textarea value={appForm.message} onChange={e => setAppForm({ ...appForm, message: e.target.value })} placeholder="O que você faz, com que frequência, fotos de exemplo em algum link..." /></div>
            <button className="btn btn-primary btn-block" disabled={sending} onClick={submitApplication}>{sending ? 'Enviando…' : 'Enviar pedido'}</button>
          </div>
        )}

        {application && application.status === 'pendente' && (
          <div className="admin-panel">
            <p style={{ margin: 0 }}><span className="tag-pill aguardando_pagamento">em análise</span></p>
            <p className="small-muted" style={{ marginTop: 10 }}>Seu pedido "{application.name}" está sendo avaliado. Assim que for aprovado, seu painel de vendedora aparece automaticamente aqui.</p>
          </div>
        )}

        {application && application.status === 'recusado' && (
          <div className="admin-panel">
            <p style={{ margin: 0 }}><span className="tag-pill cancelado">não aprovado</span></p>
            <p className="small-muted" style={{ marginTop: 10 }}>Seu pedido anterior não foi aprovado dessa vez. Se quiser, ajuste os detalhes e envie de novo.</p>
            <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={() => setApplication(null)}>Enviar novo pedido</button>
          </div>
        )}
      </div>
    );
  }

  // vendedora aprovada: painel dela
  return (
    <>
      <Head><title>Painel da vendedora — tudo que fiz</title></Head>
      <div className="admin-bar">
        <div className="wrap inner">
          <strong style={{ color: 'var(--fuchsia)' }}>painel de {seller?.name || 'vendedora'}</strong>
          <Link href="/" className="btn btn-ghost btn-sm">Ver loja</Link>
        </div>
      </div>

      <div className="wrap admin-body">
        {seller && seller.status !== 'aprovado' && (
          <p className="proto-note" style={{ marginBottom: 18 }}>Sua conta de vendedora está com status "{seller.status}" no momento — fale com a loja pra entender.</p>
        )}

        <div className="section-head">
          <h2>Meus produtos</h2>
          <button className="btn btn-primary btn-sm" onClick={() => setProductForm({ ...emptyProduct, category_id: categories[0]?.id || '' })}>+ novo produto</button>
        </div>

        {products === null && <p className="small-muted">Carregando…</p>}
        {products && products.length === 0 && <p className="small-muted">Você ainda não cadastrou nenhum produto.</p>}
        <div className="admin-list">
          {products && products.map(p => (
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
        </div>

        {productForm && (
          <div className="admin-panel">
            <h3 style={{ marginTop: 0 }}>{productForm.id ? 'Editar produto' : 'Novo produto'}</h3>
            <div className="field"><label>Nome</label><input value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} /></div>
            <div className="field"><label>Descrição</label><textarea value={productForm.description || ''} onChange={e => setProductForm({ ...productForm, description: e.target.value })} /></div>
            <div className="field"><label>Categoria</label>
              <select value={productForm.category_id} onChange={e => setProductForm({ ...productForm, category_id: e.target.value })}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
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
      </div>
    </>
  );
}
