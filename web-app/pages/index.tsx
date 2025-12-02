import { GetServerSideProps } from 'next';
import ProductCard from '../components/ProductCard';
import { Product } from '../types';
import { getProducts } from '../services/api';

import styles from '../styles/Home.module.css';

const HIGHLIGHTS = [
  {
    icon: '🌿',
    title: 'Materials that matter',
    description: 'Natural fibers and recycled blends that feel good and do good.'
  },
  {
    icon: '🧵',
    title: 'Tailored for daily life',
    description: 'Considered details and easy care instructions keep every piece in rotation.'
  },
  {
    icon: '🚚',
    title: 'On your doorstep fast',
    description: 'Worldwide shipping with tracked delivery and easy returns inside the box.'
  }
];

interface Props {
  products: Product[];
}

const HomePage: React.FC<Props> = ({ products }) => (
  <div className={styles.page}>
    <main className={styles.main}>
      <section className={styles.hero}>
        <span className={styles.heroBadge}>Winter Capsule · Limited release</span>
        <h1 className={styles.heroTitle}>Discover Your Next Everyday Essential</h1>
        <p className={styles.heroSubtitle}>
          Thoughtfully curated products designed to elevate work, home, and everything in between.
        </p>
        <div className={styles.heroCTA}>
          <a className={styles.heroButton} href="#products">Shop the collection</a>
          <span className={styles.heroNote}>Free carbon-neutral shipping over JOD 75</span>
        </div>
      </section>

      <section className={styles.highlights}>
        {HIGHLIGHTS.map((item) => (
          <article key={item.title} className={styles.highlightCard}>
            <span className={styles.highlightIcon} aria-hidden="true">{item.icon}</span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </section>

      <section id="products" className={styles.catalog}>
        {products.length > 0 ? (
          <div className={styles.grid}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <h2>New arrivals are on the way</h2>
            <p>We are restocking the shelves. Check back shortly to find fresh picks for your cart.</p>
          </div>
        )}
      </section>
    </main>
  </div>
);


export const getServerSideProps: GetServerSideProps = async () => {
  const products: Product[] = await getProducts();
  return { props: { products } };
};

export default HomePage;
