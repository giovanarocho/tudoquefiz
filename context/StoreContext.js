import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [settings, setSettings] = useState({ whatsapp: '5548999936071', instagram: '@tudoquefiz', tagline: '', story: '' });
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(true);

  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [waitlistProduct, setWaitlistProduct] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const toast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  }, []);

  const loadCatalog = useCallback(async () => {
    const [{ data: cats }, { data: prods }, { data: sellerRows }, { data: settingsRow }] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('products').select('*').eq('active', true).order('created_at', { ascending: false }),
      supabase.from('sellers').select('*'),
      supabase.from('settings').select('*').eq('id', 1).single()
    ]);
    setCategories(cats || []);
    setProducts(prods || []);
    setSellers(sellerRows || []);
    if (settingsRow) setSettings(settingsRow);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCatalog();
    try { setCart(JSON.parse(localStorage.getItem('tqf_cart') || '{}')); } catch (e) {}

    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => sub.subscription.unsubscribe();
  }, [loadCatalog]);

  useEffect(() => {
    if (!session) { setProfile(null); return; }
    supabase.from('profiles').select('*').eq('id', session.user.id).single()
      .then(({ data }) => setProfile(data));
  }, [session]);

  useEffect(() => {
    try { localStorage.setItem('tqf_cart', JSON.stringify(cart)); } catch (e) {}
  }, [cart]);

  const addToCart = (productId) => {
    setCart(c => ({ ...c, [productId]: (c[productId] || 0) + 1 }));
    toast('Adicionado à sacola');
  };
  const changeQty = (productId, delta) => {
    setCart(c => {
      const next = { ...c, [productId]: Math.max(0, (c[productId] || 0) + delta) };
      if (next[productId] === 0) delete next[productId];
      return next;
    });
  };
  const removeFromCart = (productId) => setCart(c => { const n = { ...c }; delete n[productId]; return n; });
  const clearCart = () => setCart({});

  const cartItems = Object.entries(cart)
    .map(([id, qty]) => ({ product: products.find(p => p.id === id), qty }))
    .filter(it => it.product && it.qty > 0);
  const cartTotalCents = cartItems.reduce((sum, it) => sum + it.product.price_cents * it.qty, 0);
  const cartCount = cartItems.reduce((sum, it) => sum + it.qty, 0);

  const value = {
    session, profile, isAdmin: !!profile?.is_admin,
    categories, products, sellers, settings, loading, loadCatalog,
    cart, cartItems, cartTotalCents, cartCount, addToCart, changeQty, removeFromCart, clearCart,
    cartOpen, setCartOpen, checkoutOpen, setCheckoutOpen, authOpen, setAuthOpen,
    waitlistProduct, setWaitlistProduct,
    toast, toastMsg
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore precisa estar dentro de <StoreProvider>');
  return ctx;
}
