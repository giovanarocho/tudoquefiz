import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { money } from '../lib/money';

export default function CheckoutModal() {
  const { checkoutOpen, setCheckoutOpen, cartItems, cartTotalCents, clearCart, session, toast } = useStore();
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState('pix');
  const [customer, setCustomer] = useState({ name: '', phone: '', email: session?.user?.email || '', address: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!checkoutOpen) return null;

  const close = () => { setCheckoutOpen(false); setStep(1); setResult(null); setError(null); };

  const submit = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map(it => ({ productId: it.product.id, qty: it.qty })),
          customer,
          method,
          customerId: session?.user?.id || null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não deu pra fechar o pedido.');
      setResult(data);
      clearCart();
      setStep(3);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const copyPix = async () => {
    try { await navigator.clipboard.writeText(result.payment.qrCode); toast('Código Pix copiado'); }
    catch (e) { toast('Não consegui copiar automaticamente — selecione o código manualmente'); }
  };

  return (
    <div className="modal-back" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="modal">
        {step === 1 && (
          <>
            <h3>Seus dados</h3>
            <p className="small-muted">Pra combinar entrega e emitir o pagamento.</p>
            <div className="field"><label>Nome</label><input value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} placeholder="Como te chamam" /></div>
            <div className="field"><label>WhatsApp</label><input value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} placeholder="(00) 00000-0000" /></div>
            <div className="field"><label>E-mail (pra gerar o Pix)</label><input type="email" value={customer.email} onChange={e => setCustomer({ ...customer, email: e.target.value })} placeholder="voce@email.com" /></div>
            <div className="field"><label>Endereço ou combinação de retirada</label><textarea value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} placeholder="Endereço completo, ou como prefere retirar/combinar" /></div>
            <button className="btn btn-primary btn-block" onClick={() => {
              if (!customer.name || !customer.phone) { toast('Preenche nome e WhatsApp'); return; }
              setStep(2);
            }}>Continuar</button>
            <button className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={close}>Voltar pra sacola</button>
          </>
        )}

        {step === 2 && (
          <>
            <h3>Pagamento</h3>
            <div className={'pay-option' + (method === 'pix' ? ' sel' : '')} onClick={() => setMethod('pix')}>
              <input type="radio" readOnly checked={method === 'pix'} />
              <div><strong>Pix</strong><div className="small-muted">QR code gerado na hora, confirmação automática</div></div>
            </div>
            <div className={'pay-option' + (method === 'cartao' ? ' sel' : '')} onClick={() => setMethod('cartao')}>
              <input type="radio" readOnly checked={method === 'cartao'} />
              <div><strong>Cartão</strong><div className="small-muted">Você é redirecionada pro checkout seguro do Mercado Pago</div></div>
            </div>
            <div className="order-summary">
              {cartItems.map(it => (
                <div className="row" key={it.product.id}><span>{it.qty}x {it.product.name}</span><span className="mono">{money(it.product.price_cents * it.qty)}</span></div>
              ))}
              <hr className="sep" style={{ margin: '8px 0' }} />
              <div className="row" style={{ fontWeight: 800 }}><span>Total</span><span className="mono">{money(cartTotalCents)}</span></div>
            </div>
            {error && <p className="small-muted" style={{ color: 'var(--fuchsia-ink)' }}>{error}</p>}
            <button className="btn btn-primary btn-block" disabled={loading} onClick={submit}>
              {loading ? 'Gerando pagamento…' : 'Confirmar e pagar'}
            </button>
            <button className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={() => setStep(1)}>Voltar</button>
          </>
        )}

        {step === 3 && result && (
          <>
            <h3>Pedido feito!</h3>
            {result.payment?.type === 'pix' && (
              <>
                <p className="small-muted">Escaneie o QR code ou copie o código Pix abaixo. Assim que cair, seu pedido muda pra "pago" sozinho.</p>
                <div className="pay-key">
                  {result.payment.qrCodeBase64 && <img src={`data:image/png;base64,${result.payment.qrCodeBase64}`} alt="QR Code Pix" style={{ width: 200, height: 200 }} />}
                  <code>{result.payment.qrCode}</code>
                  <button className="btn btn-ghost btn-sm" onClick={copyPix}>Copiar código</button>
                </div>
              </>
            )}
            {result.payment?.type === 'cartao' && (
              <>
                <p className="small-muted">Clique abaixo pra pagar com cartão no checkout seguro do Mercado Pago.</p>
                <a className="btn btn-primary btn-block" href={result.payment.initPoint} target="_blank" rel="noopener noreferrer">Pagar com cartão</a>
              </>
            )}
            {result.payment?.type === 'erro' && (
              <p className="small-muted">Seu pedido #{result.orderId.slice(0, 8)} foi registrado, mas o pagamento automático falhou agora ({result.payment.message}). Combine o pagamento pelo WhatsApp.</p>
            )}
            <button className="btn btn-ghost btn-block" style={{ marginTop: 12 }} onClick={close}>Fechar</button>
          </>
        )}
      </div>
    </div>
  );
}
