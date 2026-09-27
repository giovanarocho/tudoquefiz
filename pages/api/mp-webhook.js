import crypto from 'node:crypto';
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

// Confere a assinatura HMAC-SHA256 que o Mercado Pago manda em x-signature,
// pra ter certeza de que a notificação veio mesmo deles e não de alguém
// tentando forjar um "pagamento aprovado" chamando essa URL na mão.
function isValidSignature(req, dataId) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return false;

  const signature = req.headers['x-signature'] || '';
  const requestId = req.headers['x-request-id'] || '';
  const parts = Object.fromEntries(
    signature.split(',').map((p) => p.split('=').map((s) => s.trim()))
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1 || !dataId || !requestId) return false;

  const canonical = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = crypto.createHmac('sha256', secret).update(canonical).digest('hex');

  if (expected.length !== v1.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
}

export default async function handler(req, res) {
  const paymentId = extractPaymentId(req);

  if (!paymentId || !isValidSignature(req, String(paymentId))) {
    // Assinatura ausente ou inválida: não confia e não processa.
    return res.status(401).json({ error: 'invalid_signature' });
  }

  // Mercado Pago espera uma resposta rápida; confirma logo e processa.
  res.status(200).json({ received: true });

  try {
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
