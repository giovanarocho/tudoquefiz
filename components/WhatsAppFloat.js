import { useState } from 'react';
import { useStore } from '../context/StoreContext';

export default function WhatsAppFloat() {
  const { settings } = useStore();
  const [dismissed, setDismissed] = useState(false);

  return (
    <div className="wa-float">
      {!dismissed && (
        <div className="wa-bubble">
          Saiba mais ou solicite suporte aqui
          <button aria-label="Fechar" onClick={() => setDismissed(true)}>✕</button>
        </div>
      )}
      <a className="wa-btn" href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
        <svg viewBox="0 0 32 32" fill="currentColor"><path d="M16.02 3C9.4 3 4 8.4 4 15.02c0 2.24.62 4.34 1.7 6.14L3.9 29l8-2.02a12.9 12.9 0 0 0 4.12.67C22.6 27.65 28 22.25 28 15.63 28 8.4 22.64 3 16.02 3Zm0 23.14c-1.32 0-2.6-.26-3.78-.78l-.27-.12-4.75 1.2 1.27-4.63-.17-.28a10.7 10.7 0 0 1-1.66-5.7c0-5.9 4.8-10.7 10.7-10.7 5.86 0 10.6 4.76 10.6 10.63 0 5.9-4.8 10.7-10.7 10.7Zm5.86-8.03c-.32-.16-1.9-.94-2.2-1.04-.3-.1-.5-.16-.72.16-.22.32-.83 1.04-1.02 1.26-.19.22-.37.24-.7.08-.32-.16-1.35-.5-2.57-1.6-.95-.85-1.6-1.9-1.78-2.22-.19-.32-.02-.5.14-.66.14-.14.32-.37.48-.55.16-.19.2-.32.32-.54.1-.22.05-.42-.02-.58-.08-.16-.72-1.74-.98-2.38-.26-.62-.53-.54-.72-.55h-.62c-.22 0-.55.08-.85.4-.29.32-1.1 1.08-1.1 2.63 0 1.55 1.13 3.05 1.28 3.26.16.22 2.2 3.36 5.32 4.7.75.32 1.33.51 1.78.66.75.24 1.43.2 1.97.13.6-.09 1.9-.78 2.17-1.53.27-.75.27-1.4.19-1.53-.08-.13-.29-.21-.6-.37Z" /></svg>
      </a>
    </div>
  );
}
