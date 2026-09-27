import '../styles/globals.css';
import { StoreProvider } from '../context/StoreContext';
import CartDrawer from '../components/CartDrawer';
import CheckoutModal from '../components/CheckoutModal';
import WaitlistModal from '../components/WaitlistModal';
import Toast from '../components/Toast';
import WhatsAppFloat from '../components/WhatsAppFloat';

export default function App({ Component, pageProps }) {
  return (
    <StoreProvider>
      <Component {...pageProps} />
      <CartDrawer />
      <CheckoutModal />
      <WaitlistModal />
      <Toast />
      <WhatsAppFloat />
    </StoreProvider>
  );
}
