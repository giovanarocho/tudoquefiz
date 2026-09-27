import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { createPixPayment, createCardPreference } from '../../lib/mercadopago';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  try {
    const { items, customer, method, customerId } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Carrinho vazio.' });
    }
    if (!customer?.name || !customer?.phone) {
      return res.status(400).json({ error: 'Nome e WhatsApp são obrigatórios.' });
    }
    if (method === 'pix' && !customer?.email) {
      return res.status(400).json({ error: 'E-mail é obrigatório pra gerar o Pix.' });
    }

    // Nunca confia em preço/estoque vindo do navegador: busca de novo no banco.
    const ids = items.map(it => it.productId);
    const { data: products, error: prodErr } = await supabaseAdmin
      .from('products')
      .select('id, name, price_cents, stock, seller_id')
      .in('id', ids);
    if (prodErr) throw prodErr;

    const outOfStock = [];
    const realItems = [];
    for (const it of items) {
      const p = products.find(pr => pr.id === it.productId);
      if (!p) continue;
      if (p.stock < it.qty) { outOfStock.push(p.name); continue; }
      realItems.push({ product_id: p.id, seller_id: p.seller_id, name: p.name, price_cents: p.price_cents, qty: it.qty });
    }
    if (outOfStock.length) {
      return res.status(409).json({ error: `Sem estoque suficiente: ${outOfStock.join(', ')}` });
    }
    if (!realItems.length) {
      return res.status(400).json({ error: 'Nenhum item válido no carrinho.' });
    }

    const totalCents = realItems.reduce((sum, it) => sum + it.price_cents * it.qty, 0);

    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_id: customerId || null,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_address: customer.address || null,
        total_cents: totalCents,
        payment_method: method === 'cartao' ? 'cartao' : 'pix',
        status: 'aguardando_pagamento'
      })
      .select()
      .single();
    if (orderErr) throw orderErr;

    await supabaseAdmin.from('order_items').insert(
      realItems.map(it => ({ ...it, order_id: order.id }))
    );

    // Baixa de estoque (uma a uma; volume baixo, então dá pra fazer simples e claro)
    for (const it of realItems) {
      const p = products.find(pr => pr.id === it.product_id);
      await supabaseAdmin.from('products').update({ stock: p.stock - it.qty }).eq('id', it.product_id);
    }

    let payment = null;
    try {
      if (order.payment_method === 'pix') {
        const pix = await createPixPayment({
          orderId: order.id,
          amountCents: totalCents,
          description: 'Pedido tudo que fiz',
          payerEmail: customer.email,
          payerName: customer.name
        });
        await supabaseAdmin.from('orders').update({ mp_payment_id: pix.mpPaymentId }).eq('id', order.id);
        payment = { type: 'pix', qrCode: pix.qrCode, qrCodeBase64: pix.qrCodeBase64 };
      } else {
        const pref = await createCardPreference({ orderId: order.id, items: realItems.map(it => ({ name: it.name, qty: it.qty, priceCents: it.price_cents })) });
        await supabaseAdmin.from('orders').update({ mp_preference_id: pref.mpPreferenceId }).eq('id', order.id);
        payment = { type: 'cartao', initPoint: pref.initPoint };
      }
    } catch (mpErr) {
      // O pedido já existe; o pagamento automático falhou (token ausente/errado, por ex).
      // Devolve o pedido mesmo assim pra não travar a compra — combine o pagamento por WhatsApp.
      payment = { type: 'erro', message: mpErr.message };
    }

    return res.status(200).json({ orderId: order.id, total_cents: totalCents, payment });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao criar o pedido. Tenta de novo em instantes.' });
  }
}
