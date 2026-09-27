import Link from 'next/link';
import { useStore } from '../context/StoreContext';

export default function Footer() {
  const { settings } = useStore();
  return (
    <footer>
      <div className="wrap inner">
        <div className="logo-fallback" style={{ fontSize: 18 }}>tudo que fiz<span className="dot">.</span></div>
        <div><span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--ink-soft)' }}>Instagram {settings.instagram}</span></div>
      </div>
      <div className="wrap copy-tiny" style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span>um laboratório de mãos inquietas</span>
        <Link href="/vendedor" style={{ color: 'inherit' }}>também faz coisas à mão? venda aqui →</Link>
      </div>
    </footer>
  );
}
