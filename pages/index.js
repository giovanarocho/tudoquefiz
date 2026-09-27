import Head from 'next/head';
import { useState } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import CategoryChips from '../components/CategoryChips';
import ProductGrid from '../components/ProductGrid';
import About from '../components/About';
import Footer from '../components/Footer';
import { useStore } from '../context/StoreContext';

export default function Home() {
  const { products, loading } = useStore();
  const [activeCategory, setActiveCategory] = useState('all');

  return (
    <>
      <Head>
        <title>tudo que fiz</title>
        <meta name="description" content="Trabalhos manuais e artísticos feitos à mão — crochê, cerâmica, encadernação, pintura e muito mais." />
      </Head>
      <Header />
      <Hero />
      <CategoryChips active={activeCategory} onChange={setActiveCategory} />
      <section id="catalogo">
        <div className="wrap">
          <div className="section-head">
            <h2>o laboratório</h2>
            <span className="count-tag">{loading ? 'carregando…' : `${products.length} peças no catálogo`}</span>
          </div>
          {loading ? <p className="small-muted">Carregando o catálogo…</p> : <ProductGrid activeCategory={activeCategory} />}
        </div>
      </section>
      <About />
      <Footer />
    </>
  );
}
