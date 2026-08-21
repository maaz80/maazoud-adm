export const ADMIN_EMAIL = 'maazforlap@gmail.com';
export const COMBO_PRODUCT_MARKER = '<!-- product-type:combo -->';
export const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '' : 'https://maazoud.vercel.app');

export const getWhatsAppLink = (order) => {
  if (!order) return "#";
  const status = order.status;
  const amount = order.total_amount;
  const itemsStr = order.items?.map(i => i.product?.name || "Attar").join(", ");
  
  const orderDate = new Date(order.created_at);
  const deliveryDate = new Date(orderDate);
  deliveryDate.setDate(deliveryDate.getDate() + 7);
  const formattedDeliveryDate = deliveryDate.toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' });

  let text = "";
  if (status === "Placed" || status === "Processing") {
    text = `Hello ${order.customer_name},\n\nCongratulations! Your order for ${itemsStr} (Rs. ${amount}) has been successfully placed. Your approximate delivery date is ${formattedDeliveryDate}.\n\nThank you for shopping with Maaz Oud!`;
  } else if (status === "Shipped") {
    text = `Hello ${order.customer_name},\n\nGreat news! Your order for ${itemsStr} (Rs. ${amount}) has been successfully shipped. Your approximate delivery date is ${formattedDeliveryDate}.\n\nThank you for shopping with Maaz Oud!`;
  } else if (status === "Delivered") {
    text = `Hello ${order.customer_name},\n\nCongratulations! Your order for ${itemsStr} (Rs. ${amount}) has been successfully delivered. We hope you enjoy the fragrance!\n\nIf you loved our attars, we would be incredibly grateful if you could take a moment to leave a review on our website. Your feedback means the world to us!\n\nThank you for shopping with Maaz Oud!`;
  } else if (status === "Cancelled") {
    text = `Hello ${order.customer_name},\n\nWe would like to inform you that your order for ${itemsStr} (Rs. ${amount}) has been cancelled.\n\nIf you have any questions or would like to re-order, feel free to contact us.\n\nThank you,\nMaaz Oud`;
  } else {
    text = `Hello ${order.customer_name},\n\nYour order for ${itemsStr} is currently marked as ${status}.`;
  }

  let phone = (order.phone || '').replace(/[^0-9]/g, '');
  if (phone.length === 10) {
    phone = '91' + phone;
  }
  
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
};

export const isComboProduct = (product) => String(product?.description || '').includes(COMBO_PRODUCT_MARKER);

export const cleanProductDescription = (description = '') => {
  if (!description) return '';
  let str = String(description).replace(/<!-- product-type:combo -->/gi, '');
  str = str.replace(/<p[^>]*>\s*(?:<strong[^>]*>)?\s*Combo includes:[\s\S]*?<\/p>/gi, '');
  str = str.replace(/<div[^>]*>\s*(?:<strong[^>]*>)?\s*Combo includes:[\s\S]*?<\/div>/gi, '');
  str = str.replace(/(?:Combo includes:[^.<>]+(?:\.|\s*))+/gi, '');
  return str.trim();
};

export const extractComboItems = (description = '') => {
  const text = String(description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const match = text.match(/Combo includes:\s*(.*?)(?:Combo includes:|$)/i);
  if (!match || !match[1]) return ['', '', ''];
  const itemsStr = match[1].trim().replace(/\.$/, '');
  const items = itemsStr.split(',').map((item) => item.trim()).filter(Boolean);
  return items.slice(0, 3).concat(['', '', '']).slice(0, 3);
};

export const withProductTypeMarker = (description = '', productType = 'regular') => {
  const cleanDescription = cleanProductDescription(description || '<p>Premium pure attar formulation.</p>');
  return productType === 'combo' ? `${COMBO_PRODUCT_MARKER}${cleanDescription}` : cleanDescription;
};

export const buildProductDescription = (description = '', productType = 'regular', comboItems = []) => {
  const cleanDescription = cleanProductDescription(description || '<p>Premium pure attar formulation.</p>');
  if (productType !== 'combo') return cleanDescription;
  const normalizedItems = (comboItems || []).filter(Boolean);
  const comboText = normalizedItems.length > 0 ? normalizedItems.join(', ') : '3 unique attars';
  const comboHtml = `<p><strong>Combo includes:</strong> ${comboText}</p>`;
  const body = `${cleanDescription}${cleanDescription ? ' ' : ''}${comboHtml}`.trim();
  return `${COMBO_PRODUCT_MARKER}${body}`;
};

export const calculateOrderProfit = (order, productsList) => {
  const isCombo = (prodId, prodName) => {
    const prod = (productsList || []).find(p => p.id === prodId);
    if (prod && String(prod.description || '').includes('<!-- product-type:combo -->')) {
      return true;
    }
    return String(prodName || '').toLowerCase().includes('combo') || String(prodId || '').toLowerCase().includes('combo');
  };

  let totalBaseCost = 0;
  const itemsProfit = (order.items || []).map(item => {
    const prodId = item.product?.id;
    const prodName = item.product?.name;
    const qty = parseInt(item.quantity) || 1;
    const size = String(item.selectedSize || '3ml').toLowerCase();
    
    let unitCost = 100;
    if (isCombo(prodId, prodName)) {
      unitCost = 177;
    } else if (size === '6ml') {
      unitCost = 156;
    } else {
      unitCost = 100;
    }

    const itemBaseCost = unitCost * qty;
    totalBaseCost += itemBaseCost;

    return {
      name: prodName,
      size: size,
      quantity: qty,
      sellingPrice: (item.price || 0) * qty,
      baseCost: itemBaseCost,
      profit: ((item.price || 0) * qty) - itemBaseCost
    };
  });

  if (order.manual_base_cost !== undefined && order.manual_base_cost !== null && !isNaN(Number(order.manual_base_cost))) {
    totalBaseCost = parseFloat(order.manual_base_cost);
  }

  const sellingPrice = (order.manual_selling_price !== undefined && order.manual_selling_price !== null && !isNaN(Number(order.manual_selling_price)))
    ? parseFloat(order.manual_selling_price)
    : (parseFloat(order.total_amount) || 0);

  let hasDeliveryCost = false;
  let deliveryCost = 0;

  if (order.shiprocket_charge !== null && order.shiprocket_charge !== undefined && !isNaN(Number(order.shiprocket_charge))) {
    const charge = parseFloat(order.shiprocket_charge);
    hasDeliveryCost = true;
    deliveryCost = charge > 0 ? charge + 5.90 : charge;
  } else if (order.shipment_details?.assign_awb_response?.response?.data?.freight_charges) {
    const fc = parseFloat(order.shipment_details.assign_awb_response.response.data.freight_charges);
    const isCod = String(order?.payment_method || '').toLowerCase().includes('cod') || String(order?.payment_method || '').toLowerCase().includes('cash on delivery');
    const codFee = isCod ? 50.00 : 0;
    hasDeliveryCost = true;
    deliveryCost = fc > 0 ? fc + codFee + 5.90 : fc;
  }

  deliveryCost = Number(deliveryCost.toFixed(2));
  const netProfit = hasDeliveryCost ? Number((sellingPrice - (totalBaseCost + deliveryCost)).toFixed(2)) : 0;

  return {
    baseCost: Number(totalBaseCost.toFixed(2)),
    deliveryCost: hasDeliveryCost ? Number(deliveryCost.toFixed(2)) : 0,
    hasDeliveryCost,
    sellingPrice: Number(sellingPrice.toFixed(2)),
    profit: netProfit,
    itemsProfit
  };
};

export const formatDeliveryEstimate = (status, orderDateStr) => {
  if (!orderDateStr) return '';
  const orderDate = new Date(orderDateStr);
  if (isNaN(orderDate.getTime())) return '';
  const deliveryDate = new Date(orderDate);
  deliveryDate.setDate(deliveryDate.getDate() + 7);
  const formatted = deliveryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (status === 'Delivered') return `Delivered ~ ${formatted}`;
  if (status === 'Cancelled') return `Cancelled`;
  return `Est. Delivery: ${formatted}`;
};
