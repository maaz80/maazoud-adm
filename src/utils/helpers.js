export const ADMIN_EMAIL = 'maazforlap@gmail.com';

export const getOrderTrackingStatusText = (order) => {
  const parts = [order?.status, order?.zipypost_status, order?.shiprocket_status];
  const visit = (value, depth = 0) => {
    if (value == null || depth > 7) return;
    if (typeof value === 'string' || typeof value === 'number') {
      parts.push(String(value));
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(item => visit(item, depth + 1));
      return;
    }
    if (typeof value === 'object') {
      Object.entries(value).forEach(([key, item]) => {
        if (/status|tracking|remark|description|activity|scan|event|rto|delivery|message/i.test(key)) {
          visit(item, depth + 1);
        }
      });
    }
  };
  visit(order?.shipment_details);
  return parts.filter(Boolean).join(' ').toLowerCase().replace(/[_-]+/g, ' ');
};

export const getCurrentCourierStatusText = (order) => {
  const details = order?.shipment_details || {};
  const zipyTracking = details.zipypost_tracking_info || {};
  const usesZipypost = String(details.carrier || '').toLowerCase().includes('zipy') || Boolean(details.zipypost_awb);
  const statuses = usesZipypost
    ? [details.zipypost_status, zipyTracking.current_status, zipyTracking.status, zipyTracking.tracking_status]
    : [details.shiprocket_status, order?.shiprocket_status, details.current_status, details.tracking_status];
  return [...statuses, order?.status]
    .filter(value => typeof value === 'string' || typeof value === 'number')
    .join(' ')
    .toLowerCase()
    .replace(/[_-]+/g, ' ');
};

export const isRtoOrder = (order) => {
  const statusText = getOrderTrackingStatusText(order);
  return /\brto\b|return to origin|returned to origin|return in transit|return initiated|return notified|return delivered/.test(statusText);
};

export const isDeliveryExceptionOrder = (order) => {
  const currentStatus = getCurrentCourierStatusText(order);
  return /\b(exception|delivery attempt|attempted|undelivered|not delivered|failed delivery|ndr)\b/.test(currentStatus);
};

export const getOrderStatus = (order) => {
  const status = String(order?.status || '').toLowerCase();
  if (status === 'cancelled' || status === 'canceled') return 'Cancelled';
  if (isDeliveryExceptionOrder(order)) return 'Exception';
  const currentCourierStatus = getCurrentCourierStatusText(order);
  if (/\brto\b|return to origin|returned to origin|return in transit|return initiated|return notified|return delivered/.test(currentCourierStatus)) return 'RTO';
  if (/\bout for delivery\b/.test(currentCourierStatus)) return 'Shipped';
  if (status === 'delivered') return 'Delivered';
  if (status === 'shipped') return 'Shipped';
  return 'Processing';
};

export const getOrderDeliveryDate = (order) => {
  const shipmentDetails = order?.shipment_details;
  const tracking = shipmentDetails?.zipypost_tracking_info || {};
  const getValidDate = (values) => {
    for (const value of values) {
      if (!value) continue;
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) return date;
    }
    return null;
  };
  const getDeliveredEventDate = (value, depth = 0) => {
    if (!value || depth > 7) return null;
    if (Array.isArray(value)) {
      for (let index = value.length - 1; index >= 0; index--) {
        const found = getDeliveredEventDate(value[index], depth + 1);
        if (found) return found;
      }
      return null;
    }
    if (typeof value !== 'object') return null;

    const eventText = [value.status, value.tracking_status, value.activity, value.description, value.scan, value.remark]
      .filter(Boolean).join(' ').toLowerCase().replace(/[_-]+/g, ' ');
    if (/\bdelivered\b/.test(eventText) && !/not delivered|undelivered|attempt|exception|ndr|out for delivery/.test(eventText)) {
      const eventDate = getValidDate([
        value.delivered_date,
        value.delivery_date,
        value.delivered_at,
        value.date,
        value.event_date,
        value.scan_date,
        value.scan_time,
        value.timestamp,
        value.created_at,
        value.updated_at
      ]);
      if (eventDate) return eventDate;
    }

    for (const [key, nested] of Object.entries(value)) {
      if (/history|events|scans|track|activity|result|data/i.test(key)) {
        const found = getDeliveredEventDate(nested, depth + 1);
        if (found) return found;
      }
    }
    return null;
  };

  const storedDeliveryDateIsConfirmed = ['courier', 'sync_observed'].includes(shipmentDetails?.delivery_date_source);
  const courierDeliveryDate = getValidDate([
    tracking.delivered_date,
    tracking.delivered_at,
    tracking.deliveredAt,
    tracking.delivery_time,
    tracking.delivery_date,
    shipmentDetails?.last_webhook_payload?.delivered_date,
    shipmentDetails?.last_webhook_payload?.delivered_at,
    ...(storedDeliveryDateIsConfirmed ? [shipmentDetails?.delivered_date] : [])
  ]);
  if (courierDeliveryDate) return courierDeliveryDate;
  const eventDeliveryDate = getDeliveredEventDate(tracking)
    || getDeliveredEventDate(shipmentDetails?.last_webhook_payload);
  if (eventDeliveryDate) return eventDeliveryDate;

  const lastSyncTime = shipmentDetails?.last_synced_at ? new Date(shipmentDetails.last_synced_at).getTime() : NaN;
  const ignoredSyncDates = Array.isArray(shipmentDetails?.ignored_sync_delivery_dates) ? shipmentDetails.ignored_sync_delivery_dates : [];
  const isSyncGeneratedDate = (value) => {
    const date = getValidDate([value]);
    if (!date) return false;
    if (ignoredSyncDates.some(ignored => {
      const ignoredDate = new Date(ignored);
      return !Number.isNaN(ignoredDate.getTime()) && Math.abs(date.getTime() - ignoredDate.getTime()) < 1000;
    })) return true;
    return Number.isFinite(lastSyncTime) && Math.abs(date.getTime() - lastSyncTime) < 60000;
  };
  const deliveryDate = getValidDate([
    shipmentDetails?.custom_delivery_date,
    ...(isSyncGeneratedDate(order?.delivery_date) ? [] : [order?.delivery_date]),
    ...(isSyncGeneratedDate(shipmentDetails?.delivered_date) ? [] : [shipmentDetails?.delivered_date]),
    tracking.delivery_date
  ]);
  if (deliveryDate) return deliveryDate;

  if (Array.isArray(shipmentDetails)) {
    for (let i = shipmentDetails.length - 1; i >= 0; i--) {
      const item = shipmentDetails[i];
      const date = getValidDate([item?.custom_delivery_date, item?.last_webhook_payload?.delivered_date, item?.delivered_date, item?.shipment_track?.[0]?.delivered_date, item?.tracking_data?.shipment_track?.[0]?.delivered_date]);
      if (date) return date;
    }
  } else if (shipmentDetails && typeof shipmentDetails === 'object') {
    const date = getValidDate([shipmentDetails.shipment_track?.[0]?.delivered_date, shipmentDetails.tracking_data?.shipment_track?.[0]?.delivered_date]);
    if (date) return date;
  }
  return null;
};

export const filterDeliveredOrdersByDate = (allDeliveredList, filterType, now = new Date()) => {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const last7DaysStart = new Date(todayStart);
  last7DaysStart.setDate(last7DaysStart.getDate() - 7);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  return (allDeliveredList || []).filter(order => {
    if (filterType === 'all') return true;
    const deliveryDate = getOrderDeliveryDate(order);
    if (!deliveryDate) return false;
    if (filterType === 'today') return deliveryDate >= todayStart;
    if (filterType === 'yesterday') return deliveryDate >= yesterdayStart && deliveryDate < todayStart;
    if (filterType === 'last7days') return deliveryDate >= last7DaysStart;
    if (filterType === 'thisMonth') return deliveryDate >= thisMonthStart;
    return false;
  });
};
export const COMBO_PRODUCT_MARKER = '<!-- product-type:combo -->';
const viteEnv = import.meta.env || {};
export const API_BASE = viteEnv.VITE_API_BASE_URL || (viteEnv.DEV ? '' : 'https://maazoud.vercel.app');

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

export const getLeadWhatsAppLink = (lead) => {
  if (!lead) return "#";
  const name = lead.customer_name ? lead.customer_name.trim() : "";
  const greeting = name ? `Hello ${name} brother` : "Hello brother";

  const text = `${greeting}, maine dekha aap Maaz Oud pe attar checkout kar rahe the par aapne order nahi kiya. Kya hua brother, koi issue laga kya?`;

  let phone = (lead.phone || '').replace(/[^0-9]/g, '');
  if (phone.length === 10) {
    phone = '91' + phone;
  }
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
};

export const isComboProduct = (product) => String(product?.description || '').includes(COMBO_PRODUCT_MARKER);

export const cleanProductDescription = (description = '') => {
  if (!description) return '';
  let str = String(description).replace(/<!-- product-type:combo -->/gi, '');
  str = str.replace(/\[object Object\]/gi, '');
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

  const isHandDelivered = (o) => {
    const pm = String(o?.payment_method || '').toLowerCase();
    const courier = String(o?.shiprocket_courier_name || '').toLowerCase();
    const id = String(o?.id || '');
    return pm.includes('offline') || pm.includes('cash (offline)') || courier.includes('hand delivered') || courier.includes('direct') || courier.includes('self handover') || id.startsWith('ORD-OFFLINE');
  };

  if (isHandDelivered(order)) {
    hasDeliveryCost = true;
    deliveryCost = 0;
  } else if (order.shiprocket_charge !== null && order.shiprocket_charge !== undefined && !isNaN(Number(order.shiprocket_charge))) {
    const charge = parseFloat(order.shiprocket_charge);
    hasDeliveryCost = true;
    // For ZipyPost shipments, charge already includes taxes
    const isZipy = order.shipment_details?.carrier === 'zipypost' || order.shipment_details?.zipypost_awb;
    deliveryCost = isZipy ? charge : (charge > 0 ? charge + 5.90 : charge);
  } else if (order.shipment_details?.zipypost_charge) {
    const charge = parseFloat(order.shipment_details.zipypost_charge);
    hasDeliveryCost = true;
    deliveryCost = charge;
  } else if (order.shipment_details?.assign_awb_response?.response?.data?.freight_charges) {
    const fc = parseFloat(order.shipment_details.assign_awb_response.response.data.freight_charges);
    const isCod = String(order?.payment_method || '').toLowerCase().includes('cod') || String(order?.payment_method || '').toLowerCase().includes('cash on delivery');
    const codFee = isCod ? 50.00 : 0;
    hasDeliveryCost = true;
    deliveryCost = fc > 0 ? fc + codFee + 5.90 : fc;
  }

  deliveryCost = Number(deliveryCost.toFixed(2));
  const netProfit = hasDeliveryCost ? Number((sellingPrice - (totalBaseCost + deliveryCost)).toFixed(2)) : Number((sellingPrice - totalBaseCost).toFixed(2));

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

export const getDateRangeBounds = (filterType, customStart, customEnd) => {
  const now = new Date();
  if (filterType === 'today') {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0),
      end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    };
  }
  if (filterType === 'yesterday') {
    const yest = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    return {
      start: new Date(yest.getFullYear(), yest.getMonth(), yest.getDate(), 0, 0, 0, 0),
      end: new Date(yest.getFullYear(), yest.getMonth(), yest.getDate(), 23, 59, 59, 999)
    };
  }
  if (filterType === 'this_week' || filterType === 'last7days') {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0),
      end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    };
  }
  if (filterType === 'this_month') {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    };
  }
  if (filterType === 'last_month') {
    return {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0),
      end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    };
  }
  if (filterType === 'custom') {
    return {
      start: customStart ? new Date(`${customStart}T00:00:00`) : null,
      end: customEnd ? new Date(`${customEnd}T23:59:59.999`) : null
    };
  }
  return { start: null, end: null };
};

export const isOrderInDateRange = (order, filterType, customStart, customEnd) => {
  if (!filterType || filterType === 'all') return true;
  const { start, end } = getDateRangeBounds(filterType, customStart, customEnd);
  if (!start && !end) return true;
  const orderDateStr = order?.created_at || order?.order_date || order?.date;
  if (!orderDateStr) return true;
  const orderTime = new Date(orderDateStr).getTime();
  if (isNaN(orderTime)) return true;
  if (start && orderTime < start.getTime()) return false;
  if (end && orderTime > end.getTime()) return false;
  return true;
};

export const isCampaignInDateRange = (campaign, filterType, customStart, customEnd) => {
  if (!filterType || filterType === 'all') return true;
  const { start, end } = getDateRangeBounds(filterType, customStart, customEnd);
  if (!start && !end) return true;

  const rawDate = campaign?.ad_date || campaign?.date || campaign?.created_at;
  if (!rawDate) return false;

  let campTime;
  const str = String(rawDate).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-').map(Number);
    campTime = new Date(y, m - 1, d, 12, 0, 0, 0).getTime();
  } else {
    campTime = new Date(str).getTime();
  }

  if (isNaN(campTime)) return false;
  if (start && campTime < start.getTime()) return false;
  if (end && campTime > end.getTime()) return false;
  return true;
};

export const getCourierTrackingUrl = (courierName = '', awb = '') => {
  if (!awb) return 'https://track.zipypost.com';
  const c = String(courierName || '').toLowerCase().trim();
  const cleanAwb = String(awb).trim();

  // Amazon Shipping
  if (c.includes('amazon') || (/^\d{12}$/.test(cleanAwb) && cleanAwb.startsWith('37'))) {
    return `https://track.amazon.in/tracking/${cleanAwb}`;
  }

  // Delhivery
  if (c.includes('delhivery') || (/^\d{12,15}$/.test(cleanAwb) && cleanAwb.startsWith('109'))) {
    return `https://www.delhivery.com/track/package/${cleanAwb}`;
  }

  // Ekart Logistics
  if (c.includes('ekart') || cleanAwb.toUpperCase().startsWith('SRSC') || cleanAwb.toUpperCase().startsWith('SRSP')) {
    return `https://ekartlogistics.com/shipmenttrack/${cleanAwb}`;
  }

  // Shadowfax
  if (c.includes('shadowfax') || cleanAwb.toUpperCase().startsWith('SF')) {
    return `https://tracker.shadowfax.in/#/track/${cleanAwb}`;
  }

  // Xpressbees
  if (c.includes('xpressbee')) {
    return `https://www.xpressbees.com/track?awb=${cleanAwb}`;
  }

  // Blue Dart
  if (c.includes('bluedart') || c.includes('blue dart')) {
    return `https://www.bluedart.com/tracking?handler=trak&action=custtrack&track_for=0&track_type=1&numbers=${cleanAwb}`;
  }

  // DTDC
  if (c.includes('dtdc')) {
    return `https://www.dtdc.in/`;
  }

  // Shiprocket
  if (c.includes('shiprocket')) {
    return `https://shiprocket.co/tracking/${cleanAwb}`;
  }

  // Default ZipyPost portal
  return `https://track.zipypost.com`;
};

export const normalizePhone = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length < 7) return '';
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

export const normalizeCustomerName = (name) => {
  return String(name || '').toLowerCase().trim().replace(/\s+/g, ' ');
};

export const isZeroPhone = (phone) => {
  if (!phone) return true;
  const digits = String(phone).replace(/\D/g, '');
  return digits.length === 0 || /^0+$/.test(digits);
};

export const getCustomerIdentifier = (order) => {
  const rawPhone = String(order?.phone || '').trim();
  const normPhone = normalizePhone(rawPhone);

  // If phone is missing, invalid, or all zeros ('0000000000' for offline orders), match by customer name
  if (!normPhone || isZeroPhone(rawPhone) || isZeroPhone(normPhone)) {
    const normName = normalizeCustomerName(order?.customer_name);
    if (!normName || normName === 'customer' || normName === 'n/a' || normName === 'offline' || normName === 'self') {
      return null;
    }
    return `name:${normName}`;
  }

  return `phone:${normPhone}`;
};

export const getCustomerOrderStats = (orders = []) => {
  const customerOrdersMap = new Map();

  (orders || []).forEach((order) => {
    const idKey = getCustomerIdentifier(order);
    if (!idKey) return;
    if (!customerOrdersMap.has(idKey)) {
      customerOrdersMap.set(idKey, []);
    }
    customerOrdersMap.get(idKey).push(order);
  });

  const orderRepeatMap = new Map();

  customerOrdersMap.forEach((list) => {
    list.sort((a, b) => {
      const timeA = new Date(a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || 0).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return String(a.id || '').localeCompare(String(b.id || ''));
    });

    list.forEach((order, index) => {
      orderRepeatMap.set(String(order.id), {
        isRepeat: index > 0,
        orderIndex: index + 1,
        totalOrders: list.length,
      });
    });
  });

  return orderRepeatMap;
};

export const getRepeatLabel = (orderIndex) => {
  if (orderIndex === 2) return 'Repeat-2nd';
  if (orderIndex === 3) return 'Repeat-3rd';
  return `Repeat-${orderIndex}th`;
};
