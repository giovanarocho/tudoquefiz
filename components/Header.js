import { useStore } from '../context/StoreContext';

export default function Header() {
  const { cartCount, setCartOpen, setAuthOpen, session } = useStore();
  return (
    <header id="topbar">
      <div className="wrap inner">
        <a className="logo-mark" href="#home">
          <img src="/assets/logo.png" alt="tudo que fiz" />
        </a>
        <div className="nav-actions">
          <a href="/conta" className="icon-btn" aria-label="Minha conta" style={{ textDecoration: 'none' }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c1.8-4 5-6 8-6s6.2 2 8 6" /></svg>
          </a>
          <button className="icon-btn" onClick={() => setCartOpen(true)} aria-label="Carrinho">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L21 8H6" /><circle cx="9" cy="21" r="1.2" /><circle cx="18" cy="21" r="1.2" /></svg>
            {cartCount > 0 && <span className="badge">{cartCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}
