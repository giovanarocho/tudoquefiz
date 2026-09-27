import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { fetchPayment } from '../../lib/mercadopago';

// Mercado Pago manda a notificação com formatos ligeiramente diferentes
// dependendo do fluxo (Pix direto vs Checkout Pro), então checamos os dois.
function extractPaymentId(req) {
  const q = req.query || {};
  const b = req.body || {};
  return (
    b?.data?.id ||
    q['data.id'] ||
    q.id ||
    (b?.type === 'payment' ? b?.id : null)
  );
}

export default async function handler(req, res) {
  // Mercado Pago espera uma resposta rápida; confirma logo e processa.
  res.status(200).json({ received: true });

  try {
    const paymentId = extractPaymentId(req);
    if (!paymentId) return;

    const payment = await fetchPayment(paymentId);
    const orderId = payment.external_reference;
    if (!orderId) return;

    if (payment.status === 'approved') {
      await supabaseAdmin
        .from('orders')
        .update({ status: 'pago', mp_payment_id: String(payment.id) })
        .eq('id', orderId);
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      await supabaseAdmin
        .from('orders')
        .update({ status: 'cancelado' })
        .eq('id', orderId);
    }
    // 'in_process' / 'pending' — deixa como aguardando_pagamento mesmo.
  } catch (err) {
    console.error('Erro no webhook do Mercado Pago:', err);
  }
}
