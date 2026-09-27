const MP_API = 'https://api.mercadopago.com';

function authHeaders() {
  return {
    'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  };
}

// Gera uma cobrança Pix direta (QR code + copia-e-cola), pra pagamento na hora.
export async function createPixPayment({ orderId, amountCents, description, payerEmail, payerName }) {
  const res = await fetch(`${MP_API}/v1/payments`, {
    method: 'POST',
    headers: { ...authHeaders(), 'X-Idempotency-Key': orderId },
    body: JSON.stringify({
      transaction_amount: Math.round(amountCents) / 100,
      description,
      payment_method_id: 'pix',
      payer: { email: payerEmail, first_name: payerName || 'Cliente' },
      external_reference: orderId,
      notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/mp-webhook`
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Falha ao criar cobrança Pix');
  const txData = data.point_of_interaction?.transaction_data || {};
  return {
    mpPaymentId: String(data.id),
    qrCode: txData.qr_code,
    qrCodeBase64: txData.qr_code_base64
  };
}

// Gera um link de checkout (cartão) via Checkout Pro.
export async function createCardPreference({ orderId, items }) {
  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: 'POST',
    headers: { ...authHeaders(), 'X-Idempotency-Key': orderId },
    body: JSON.stringify({
      items: items.map(it => ({
        title: it.name,
        quantity: it.qty,
        unit_price: it.priceCents / 100,
        currency_id: 'BRL'
      })),
      external_reference: orderId,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_SITE_URL}/conta`,
        pending: `${process.env.NEXT_PUBLIC_SITE_URL}/conta`,
        failure: `${process.env.NEXT_PUBLIC_SITE_URL}/`
      },
      auto_return: 'approved',
      notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/mp-webhook`
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Falha ao criar link de pagamento');
  return { mpPreferenceId: data.id, initPoint: data.init_point };
}

// Usado pelo webhook pra confirmar o status real de um pagamento.
export async function fetchPayment(paymentId) {
  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Não consegui consultar o pagamento no Mercado Pago');
  return res.json();
}
