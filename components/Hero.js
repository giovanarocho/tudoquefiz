import { useStore } from '../context/StoreContext';

export default function Hero() {
  const { settings } = useStore();
  return (
    <section id="hero">
      <div className="wrap inner">
        <div style={{ maxWidth: '56ch' }}>
          <h1>{settings.tagline}</h1>
          <p>{settings.story}</p>
          <a className="btn btn-primary" href="#catalogo">Ver o que já foi feito</a>
        </div>
      </div>
    </section>
  );
}
