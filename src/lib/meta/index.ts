export const getMetaConfig = () => {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const verifyToken = process.env.META_VERIFY_TOKEN;
  const systemUserToken = process.env.META_SYSTEM_USER_TOKEN;
  const wabaId = process.env.META_WABA_ID;
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;

  // Log existence (not values) to help debug Vercel environment
  console.log('[Meta Config Check]', {
    appId: !!appId,
    appSecret: !!appSecret,
    verifyToken: !!verifyToken,
    systemUserToken: !!systemUserToken ? `Present (len: ${systemUserToken.length})` : 'Missing',
    wabaId: !!wabaId,
    phoneNumberId: !!phoneNumberId,
  });

  return { appId, appSecret, verifyToken, systemUserToken, wabaId, phoneNumberId };
};

export async function sendWhatsAppMessage(to: string, type: 'text' | 'template', content: any) {
  const { phoneNumberId, systemUserToken } = getMetaConfig();
  if (!phoneNumberId || !systemUserToken) {
    console.error('[Meta API] Send failed: Missing Config', { phoneNumberId: !!phoneNumberId, token: !!systemUserToken });
    throw new Error('Meta API configuration is missing.');
  }

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
  
  const payload: any = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type,
  };

  if (type === 'text') {
    payload.text = content;
  } else if (type === 'template') {
    payload.template = content;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${systemUserToken}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('[Meta API] Send Error Payload:', JSON.stringify(data, null, 2));
    throw new Error(data.error?.message || 'Meta API generated an error');
  }

  return data;
}

export async function fetchTemplates() {
  const { wabaId, systemUserToken } = getMetaConfig();
  if (!wabaId || !systemUserToken) {
    console.error('[Meta API] Fetch Templates failed: Missing Config', { wabaId: !!wabaId, token: !!systemUserToken });
    throw new Error('Meta API configuration (WABA ID or Token) is missing.');
  }

  const url = `https://graph.facebook.com/v19.0/${wabaId}/message_templates?limit=100`;
  console.log('[Meta API] Fetching templates from:', url);

  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${systemUserToken}` },
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('[Meta API] Fetch Error Payload:', JSON.stringify(data, null, 2));
    throw new Error(data.error?.message || 'Meta API generated an error');
  }

  return data.data || [];
}

