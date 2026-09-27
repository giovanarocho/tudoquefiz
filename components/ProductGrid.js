import { useStore } from '../context/StoreContext';
import { Icon } from '../lib/icons';
import { money } from '../lib/money';

export default function ProductGrid({ activeCategory }) {
  const { products, categories, addToCart, setWaitlistProduct } = useStore();
  const list = products.filter(p => activeCategory === 'all' || p.category_id === activeCategory);

  if (!list.length) return <div className="empty-note">Nada nessa categoria ainda — volte em breve.</div>;

  return (
    <div className="grid">
      {list.map(p => {
        const cat = categories.find(c => c.id === p.category_id);
        const soldOut = p.stock <= 0;
        return (
          <div className="card" key={p.id}>
            <div className="card-art">
              {p.image_url ? <img src={p.image_url} alt="" /> : <Icon name={cat?.icon || 'outros'} />}
            </div>
            <div className="card-body">
              <div className="card-cat">
                {cat?.name}{soldOut && <> · <span className="badge-sold">esgotado</span></>}
              </div>
              <h3 className="card-name">{p.name}</h3>
              <div className="card-desc">{p.description}</div>
              <div className="card-foot">
                <span className="price mono">{money(p.price_cents)}</span>
                {soldOut ? (
                  <button className="btn btn-waitlist btn-sm" onClick={() => setWaitlistProduct(p)}>Lista de espera</button>
                ) : (
                  <button className="btn btn-primary btn-sm" onClick={() => addToCart(p.id)}>Adicionar</button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
