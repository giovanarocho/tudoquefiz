import { useStore } from '../context/StoreContext';
import { Icon } from '../lib/icons';
import { money } from '../lib/money';

export default function CartDrawer() {
  const { cartOpen, setCartOpen, cartItems, cartTotalCents, changeQty, removeFromCart, categories, setCheckoutOpen } = useStore();
  if (!cartOpen) return null;

  return (
    <>
      <div className="overlay" onClick={() => setCartOpen(false)} />
      <div className="drawer">
        <div className="drawer-head">
          <h3>Sua sacola</h3>
          <button className="close-x" onClick={() => setCartOpen(false)}>✕</button>
        </div>
        <div className="drawer-body">
          {cartItems.length === 0 ? (
            <p className="small-muted" style={{ padding: '20px 0' }}>Seu carrinho está vazio. Que tal dar uma olhada no laboratório?</p>
          ) : cartItems.map(({ product: p, qty }) => (
            <div className="cart-item" key={p.id}>
              <div className="cart-thumb">
                {p.image_url ? <img src={p.image_url} alt="" /> : <Icon name={categories.find(c => c.id === p.category_id)?.icon || 'outros'} style={{ width: 28, height: 28 }} />}
              </div>
              <div className="cart-item-info">
                <div className="cart-item-name">{p.name}</div>
                <div className="mono" style={{ fontSize: 13 }}>{money(p.price_cents)}</div>
                <div className="qty-row">
                  <button className="qty-btn" onClick={() => changeQty(p.id, -1)}>−</button>
                  <span className="mono">{qty}</span>
                  <button className="qty-btn" onClick={() => changeQty(p.id, 1)}>+</button>
                </div>
                <button className="remove-link" onClick={() => removeFromCart(p.id)}>remover</button>
              </div>
            </div>
          ))}
        </div>
        <div className="drawer-foot">
          <div className="subtotal-row"><span>Total</span><span className="mono">{money(cartTotalCents)}</span></div>
          <button className="btn btn-primary btn-block" disabled={!cartItems.length} onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>
            Finalizar pedido
          </button>
        </div>
      </div>
    </>
  );
}
