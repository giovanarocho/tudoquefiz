import { useStore } from '../context/StoreContext';

export default function About() {
  const { settings } = useStore();
  return (
    <section id="about">
      <div className="wrap inner">
        <div>
          <h2>quem faz</h2>
          <p>{settings.story}</p>
          <p>Sem escolher uma técnica só: o que sair da cabeça naquela semana é o que entra na loja.</p>
          <p style={{ marginTop: 14, fontWeight: 700, fontSize: 13.5 }}>📦 só o que já está pronto e no catálogo, envio combinado direto com você</p>
        </div>
        <div className="about-photo">
          <img src="/assets/sobre-foto.png" alt="Quem faz a tudo que fiz" />
        </div>
      </div>
    </section>
  );
}
