import { createServer } from 'node:http';

const PORT = Number(process.env.NOTIFICATION_GATEWAY_PORT || 8787);
const ALLOWED_ORIGIN = process.env.NOTIFICATION_GATEWAY_ALLOWED_ORIGIN || '*';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || '';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_SMS_FROM = process.env.TWILIO_SMS_FROM || '';
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    ...corsHeaders,
    'Content-Type': 'application/json',
  });
  res.end(JSON.stringify(payload));
};

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(new Error(`Invalid JSON body: ${error instanceof Error ? error.message : 'parse error'}`));
      }
    });
    req.on('error', reject);
  });

const normalizePhone = (phone) => {
  const trimmed = String(phone || '').trim();
  if (!trimmed) return '';
  const compact = trimmed.replace(/[^\d+]/g, '');
  if (!compact) return '';
  if (compact.startsWith('+')) return compact;
  return `+${compact}`;
};

const normalizeWhatsAppFrom = (value) => {
  if (!value) return '';
  return value.startsWith('whatsapp:') ? value : `whatsapp:${value}`;
};

const normalizeWhatsAppTo = (phone) => {
  const normalized = normalizePhone(phone);
  if (!normalized) return '';
  return normalized.startsWith('whatsapp:') ? normalized : `whatsapp:${normalized}`;
};

const sendResendEmail = async ({ to, subject, message }) => {
  if (!to) {
    return {
      status: 'skipped',
      detail: 'Customer email missing; email skipped.',
    };
  }

  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    return {
      status: 'queued',
      detail: 'Resend credentials missing; set RESEND_API_KEY and RESEND_FROM_EMAIL.',
    };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: [to],
      subject,
      text: message,
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    return {
      status: 'failed',
      detail: `Resend error HTTP ${response.status}: ${text}`,
    };
  }

  let resendId = '';
  try {
    const parsed = JSON.parse(text);
    resendId = parsed.id || '';
  } catch {
    // no-op
  }

  return {
    status: 'sent',
    detail: resendId ? `Resend accepted message (${resendId}).` : 'Resend accepted message.',
  };
};

const sendTwilioMessage = async ({ to, from, body, channelLabel }) => {
  if (!to) {
    return {
      status: 'skipped',
      detail: `${channelLabel} skipped due to missing phone.`,
    };
  }

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !from) {
    return {
      status: 'queued',
      detail: `Twilio ${channelLabel} credentials missing; configure Twilio env vars.`,
    };
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
  const bodyParams = new URLSearchParams({
    To: to,
    From: from,
    Body: body,
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: bodyParams.toString(),
  });

  const text = await response.text();
  if (!response.ok) {
    return {
      status: 'failed',
      detail: `Twilio ${channelLabel} error HTTP ${response.status}: ${text}`,
    };
  }

  let sid = '';
  try {
    const parsed = JSON.parse(text);
    sid = parsed.sid || '';
  } catch {
    // no-op
  }

  return {
    status: 'sent',
    detail: sid ? `Twilio ${channelLabel} accepted (${sid}).` : `Twilio ${channelLabel} accepted.`,
  };
};

const overallStatusFromResults = (results) => {
  const statuses = Object.values(results).map((r) => r.status);
  if (statuses.includes('failed')) return 'failed';
  if (statuses.every((status) => status === 'sent')) return 'sent';
  if (statuses.includes('queued')) return 'queued';
  if (statuses.includes('sent')) return 'sent';
  return 'skipped';
};

const buildStatusDetail = (results) =>
  Object.entries(results)
    .map(([channel, result]) => `${channel}: ${result.status} (${result.detail})`)
    .join(' | ');

const server = createServer(async (req, res) => {
  if (!req.url) {
    sendJson(res, 404, { status: 'failed', detail: 'Missing URL.' });
    return;
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    sendJson(res, 200, {
      ok: true,
      service: 'notification-gateway',
      providers: {
        resendConfigured: Boolean(RESEND_API_KEY && RESEND_FROM_EMAIL),
        twilioSmsConfigured: Boolean(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_SMS_FROM),
        twilioWhatsAppConfigured: Boolean(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_FROM),
      },
    });
    return;
  }

  if (req.method !== 'POST' || req.url !== '/notify') {
    sendJson(res, 404, { status: 'failed', detail: 'Route not found.' });
    return;
  }

  try {
    const payload = await readJsonBody(req);
    const channels = Array.isArray(payload.channels) ? payload.channels : [];
    const customer = payload.customer || {};
    const message = String(payload.message || '');
    const subject = String(payload.subject || 'Delivery update');
    const customerPhone = normalizePhone(customer.phone);

    const channelResults = {};

    for (const channel of channels) {
      if (channel === 'email') {
        channelResults.email = await sendResendEmail({
          to: String(customer.email || ''),
          subject,
          message,
        });
      }

      if (channel === 'sms') {
        channelResults.sms = await sendTwilioMessage({
          to: customerPhone,
          from: TWILIO_SMS_FROM,
          body: message,
          channelLabel: 'SMS',
        });
      }

      if (channel === 'whatsapp') {
        channelResults.whatsapp = await sendTwilioMessage({
          to: normalizeWhatsAppTo(customer.phone),
          from: normalizeWhatsAppFrom(TWILIO_WHATSAPP_FROM),
          body: message,
          channelLabel: 'WhatsApp',
        });
      }
    }

    const status = overallStatusFromResults(channelResults);
    const detail = buildStatusDetail(channelResults);
    const statusCode = status === 'failed' ? 502 : 200;

    sendJson(res, statusCode, {
      status,
      detail,
      channels: channelResults,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    sendJson(res, 500, {
      status: 'failed',
      detail: error instanceof Error ? error.message : 'Unexpected gateway error.',
    });
  }
});

server.listen(PORT, () => {
  console.log(`Notification gateway listening on http://localhost:${PORT}`);
  console.log(`Allowed origin: ${ALLOWED_ORIGIN}`);
  console.log(`Resend configured: ${Boolean(RESEND_API_KEY && RESEND_FROM_EMAIL)}`);
  console.log(`Twilio SMS configured: ${Boolean(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_SMS_FROM)}`);
  console.log(`Twilio WhatsApp configured: ${Boolean(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_FROM)}`);
});
