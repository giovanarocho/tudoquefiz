import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { supabase } from '../lib/supabaseClient';

export default function WaitlistModal() {
  const { waitlistProduct, setWaitlistProduct, toast } = useStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  if (!waitlistProduct) return null;

  const submit = async () => {
    if (!name || !phone) { toast('Preenche nome e WhatsApp'); return; }
    setSaving(true);
    const { error } = await supabase.from('waitlist').insert({ product_id: waitlistProduct.id, name, phone });
    setSaving(false);
    if (error) { toast('Não deu pra entrar na lista agora, tenta de novo'); return; }
    toast('Você entrou na lista de espera!');
    setWaitlistProduct(null);
    setName(''); setPhone('');
  };

  return (
    <div className="modal-back" onClick={(e) => { if (e.target === e.currentTarget) setWaitlistProduct(null); }}>
      <div className="modal">
        <h3>Lista de espera</h3>
        <p className="small-muted">"{waitlistProduct.name}" já vendeu, mas avisamos assim que sair uma peça nova parecida.</p>
        <div className="field"><label>Nome</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Como te chamam" /></div>
        <div className="field"><label>WhatsApp</label><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" /></div>
        <button className="btn btn-primary btn-block" disabled={saving} onClick={submit}>{saving ? 'Enviando…' : 'Entrar na lista de espera'}</button>
        <button className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={() => setWaitlistProduct(null)}>Fechar</button>
      </div>
    </div>
  );
}
