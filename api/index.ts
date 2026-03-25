import { randomBytes } from 'crypto';
import axios from 'axios';
import { VercelRequest, VercelResponse } from '@vercel/node';

// ============================================================
// CONFIGURAÇÃO DO FIRESTORE (COM DATABASE ID CORRETO)
// ============================================================

const FIREBASE_PROJECT_ID = 'gen-lang-client-0364203262';
const FIREBASE_DATABASE_ID = 'ai-studio-ee7c5fd5-11f5-4e50-a979-3316fea33a21';
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || '';
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '';

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: FIREBASE_CLIENT_EMAIL,
    sub: FIREBASE_CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const sHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const sPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const { sign } = await import('crypto');
  const signature = sign('sha256', Buffer.from(`${sHeader}.${sPayload}`), FIREBASE_PRIVATE_KEY).toString('base64url');

  const res = await axios.post('https://oauth2.googleapis.com/token', {
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: `${sHeader}.${sPayload}.${signature}`,
  });

  cachedToken = res.data.access_token;
  tokenExpiry = Date.now() + 3500 * 1000;
  return cachedToken;
}

async function firestoreRequest(method: string, path: string, data?: any) {
  const token = await getToken();
  let url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIREBASE_DATABASE_ID}/documents/${path}`;
  
  if (method === 'PATCH' && data) {
    const fields = Object.keys(data);
    const mask = fields.map(f => `updateMask.fieldPaths=${f}`).join('&');
    url += `?${mask}`;
  }

  const res = await axios({
    method,
    url,
    data: data ? { fields: encodeFields(data) } : undefined,
    headers: { Authorization: `Bearer ${token}` },
  });
  return decodeFields(res.data.fields || {});
}

async function firestoreList(collection: string) {
  const token = await getToken();
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIREBASE_DATABASE_ID}/documents/${collection}`;
  try {
    const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    return (res.data.documents || []).map((doc: any) => ({
      id: doc.name.split('/').pop(),
      ...decodeFields(doc.fields || {}),
    }));
  } catch (e: any) {
    if (e.response?.status === 404) return [];
    throw e;
  }
}

async function firestoreDelete(collection: string, id: string) {
  const token = await getToken();
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIREBASE_DATABASE_ID}/documents/${collection}/${id}`;
  await axios.delete(url, { headers: { Authorization: `Bearer ${token}` } });
}

function encodeFields(obj: any): any {
  const fields: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string') fields[key] = { stringValue: val };
    else if (typeof val === 'number') fields[key] = { doubleValue: val };
    else if (typeof val === 'boolean') fields[key] = { booleanValue: val };
    else if (Array.isArray(val)) fields[key] = { arrayValue: { values: val.map(v => encodeFields({ temp: v }).temp) } };
    else if (val && typeof val === 'object') fields[key] = { mapValue: { fields: encodeFields(val) } };
    else fields[key] = { nullValue: null };
  }
  return fields;
}

function decodeFields(fields: any): any {
  const obj: any = {};
  for (const [key, val] of Object.entries(fields)) {
    const v: any = val;
    if ('stringValue' in v) obj[key] = v.stringValue;
    else if ('doubleValue' in v) obj[key] = Number(v.doubleValue);
    else if ('booleanValue' in v) obj[key] = v.booleanValue;
    else if ('arrayValue' in v) obj[key] = (v.arrayValue.values || []).map((item: any) => decodeFields({ temp: item }).temp);
    else if ('mapValue' in v) obj[key] = decodeFields(v.mapValue.fields || {});
    else obj[key] = null;
  }
  return obj;
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    await axios.post('https://api.resend.com/emails', {
      from: 'R3D Pro <contato@r3dprintmanagerpro.com.br>',
      to, subject, html
    }, { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } });
    return true;
  } catch (e) { return false; }
}

const asaasUrl = () => process.env.ASAAS_ENV === 'production' ? 'https://api.asaas.com/v3' : 'https://sandbox.asaas.com/api/v3';

function generateLicenseKey(payload: any) {
  const secret = process.env.KEYGEN_SECRET || 'R3D_SECRET_KEY_2026_XPTO_MANAGER';
  const crypto = require('crypto');
  const key = crypto.createHash('sha256').update(secret).digest();
  const iv = randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

// ============================================================
// HANDLER PRINCIPAL
// ============================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password, asaas-access-token');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  try {
    const url = req.url || '';
    const method = req.method || 'GET';
    const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'admin123';
    const isAdmin = req.headers['x-admin-password'] === ADMIN_PASS;

    // ──────────────────────────────────────────────────────────────────────────
    // HEALTH CHECK
    // ──────────────────────────────────────────────────────────────────────────
    if (url === '/api/health') {
      try {
        await firestoreList('activations');
        return res.json({ status: 'ok', firebase: true, databaseId: FIREBASE_DATABASE_ID, timestamp: new Date().toISOString() });
      } catch (e: any) {
        return res.json({ status: 'degraded', firebase: false, error: e.message });
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ADMIN: LIMPAR DADOS DE TESTE (inclui cupons)
    // ──────────────────────────────────────────────────────────────────────────
    if (url === '/api/admin/clear-test-data' && method === 'DELETE') {
      if (!isAdmin) return res.status(401).json({ message: 'Não autorizado' });
      const collections = ['activations', 'payments', 'users', 'licenses', 'activations_by_payment', 'cupons'];
      const results: any = {};
      for (const col of collections) {
        const docs = await firestoreList(col);
        for (const doc of docs) {
          await firestoreDelete(col, doc.id);
        }
        results[col] = { deleted: docs.length };
      }
      return res.json({ success: true, message: 'Dados de teste (incluindo cupons) removidos com sucesso.', results });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // CUPONS
    // ──────────────────────────────────────────────────────────────────────────
    
    // Validar cupom
    if (url.includes('/api/cupom/validar') && method === 'GET') {
      const codigo = req.query?.codigo || url.split('codigo=')[1]?.split('&')[0];
      if (!codigo) return res.status(400).json({ message: 'Código ausente' });
      const coupon = await firestoreRequest('GET', `cupons/${String(codigo).toUpperCase()}`).catch(() => null);
      if (!coupon?.ativo) return res.status(404).json({ message: 'Cupom inválido' });
      if (coupon.limite_usos && coupon.usos >= coupon.limite_usos) {
        return res.status(400).json({ message: 'Limite de usos atingido' });
      }
      if (coupon.validade && new Date(coupon.validade) < new Date()) {
        return res.status(400).json({ message: 'Cupom expirado' });
      }
      return res.json({ id: codigo, ...coupon });
    }

    // Admin: Listar cupons
    if (url === '/api/admin/cupons' && method === 'GET') {
      if (!isAdmin) return res.status(401).json({ message: 'Não autorizado' });
      return res.json(await firestoreList('cupons'));
    }

    // Admin: Criar cupom
    if (url === '/api/admin/cupom/criar' && method === 'POST') {
      if (!isAdmin) return res.status(401).json({ message: 'Não autorizado' });
      const data = req.body;
      const codigo = String(data.codigo).toUpperCase().trim();
      await firestoreRequest('PATCH', `cupons/${codigo}`, {
        codigo, tipo: data.tipo || 'PERCENTUAL', valor: Number(data.valor) || 0,
        afiliado_nome: data.afiliado_nome || '', afiliado_email: data.afiliado_email || '',
        afiliado_telefone: data.afiliado_telefone || '', limite_usos: Number(data.limite_usos) || 0,
        validade: data.validade || '', ativo: true, usos: 0, vendas: [], criado_em: new Date().toISOString(),
      });
      return res.json({ success: true });
    }

    // Admin: Atualizar cupom
    if (url.match(/^\/api\/admin\/cupom\/[^\/]+$/) && method === 'PUT') {
      if (!isAdmin) return res.status(401).json({ message: 'Não autorizado' });
      const id = url.split('/').pop() as string;
      if (!id) return res.status(400).json({ error: 'ID ausente' });
      const existing = await firestoreRequest('GET', `cupons/${id}`).catch(() => null);
      if (!existing) return res.status(404).json({ message: 'Cupom não encontrado' });
      await firestoreRequest('PATCH', `cupons/${id}`, { ...existing, ...req.body });
      return res.json({ success: true });
    }

    // Admin: Excluir cupom
    if (url.match(/^\/api\/admin\/cupom\/[^\/]+$/) && method === 'DELETE') {
      if (!isAdmin) return res.status(401).json({ message: 'Não autorizado' });
      const id = url.split('/').pop() as string;
      if (!id) return res.status(400).json({ error: 'ID ausente' });
      await firestoreDelete('cupons', id);
      return res.json({ success: true });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ASAAS
    // ──────────────────────────────────────────────────────────────────────────
    
    if (url === '/api/asaas/customer' && method === 'POST') {
      try {
        const r = await axios.post(`${asaasUrl()}/customers`, req.body, {
          headers: { access_token: process.env.ASAAS_API_KEY || '' }
        });
        return res.json(r.data);
      } catch (e: any) {
        return res.status(500).json({ error: e.response?.data || e.message });
      }
    }

    if (url === '/api/asaas/payment' && method === 'POST') {
      try {
        const r = await axios.post(`${asaasUrl()}/payments`, req.body, {
          headers: { access_token: process.env.ASAAS_API_KEY || '' }
        });
        return res.json(r.data);
      } catch (e: any) {
        return res.status(500).json({ error: e.response?.data || e.message });
      }
    }

    if (url.includes('/api/asaas/pix-qrcode') && method === 'GET') {
      const paymentId = req.query?.paymentId || url.split('paymentId=')[1]?.split('&')[0];
      if (!paymentId) return res.status(400).json({ message: 'paymentId ausente' });
      try {
        const r = await axios.get(`${asaasUrl()}/payments/${paymentId}/pixQrCode`, {
          headers: { access_token: process.env.ASAAS_API_KEY || '' }
        });
        return res.json(r.data);
      } catch (e: any) {
        return res.status(500).json({ error: e.response?.data || e.message });
      }
    }

    // Webhook
    if (url.includes('/api/asaas/webhook') && method === 'POST') {
      const event = Array.isArray(req.body) ? req.body[0] : req.body;
      const payment = event?.payment;
      if (!payment) return res.status(200).send('OK');
      
      res.status(200).send('OK');
      
      (async () => {
        try {
          await firestoreRequest('PATCH', `payments/${payment.id}`, {
            paymentId: payment.id, status: payment.status, event: event.event,
            value: payment.value, customer: payment.customer, processedAt: new Date().toISOString(),
            externalReference: payment.externalReference || '',
          });

          if (event.event === 'PAYMENT_CONFIRMED' || event.event === 'PAYMENT_RECEIVED') {
            const extRef = payment.externalReference || '';
            const parts = extRef.split(':');
            const hasCoupon = parts[0] === 'COUPON';
            const couponCode = hasCoupon ? parts[1] : '';
            const planName = hasCoupon ? parts.slice(2, parts.length - 1).join(' ') : parts.slice(1, parts.length - 1).join(' ');
            const isFirstInstallment = (payment.installmentNumber || 1) === 1;

            let customerEmail = payment.customerEmail || '';
            let customerName = payment.customerName || '';

            if (!customerEmail && payment.customer) {
              try {
                const cr = await axios.get(`${asaasUrl()}/customers/${payment.customer}`, {
                  headers: { access_token: process.env.ASAAS_API_KEY || '' }
                });
                customerEmail = cr.data.email || '';
                customerName = cr.data.name || '';
              } catch (e) {}
            }

            if (customerEmail && isFirstInstallment) {
              const activationCode = `R3D-ACT-${randomBytes(6).toString('hex').toUpperCase().match(/.{1,4}/g)?.join('-')}`;
              const expirationDate = new Date();
              expirationDate.setDate(expirationDate.getDate() + 7);

              await firestoreRequest('PATCH', `activations/${activationCode}`, {
                code: activationCode, paymentId: payment.id, email: customerEmail, name: customerName,
                plano: planName || 'Mensal', status: 'PENDING', createdAt: new Date().toISOString(),
                expiresAt: expirationDate.toISOString(),
              });
              
              await firestoreRequest('PATCH', `activations_by_payment/${payment.id}`, { code: activationCode });
              await firestoreRequest('PATCH', `users/${customerEmail}`, {
                email: customerEmail, isPro: true, subscriptionId: payment.id, plano: planName,
                updatedAt: new Date().toISOString(),
              });

              const emailHtml = `<h1 style="color:#C67D3D">${activationCode}</h1><p>Use este código para ativar sua licença.</p>`;
              await sendEmail(customerEmail, 'Seu código de ativação R3D Pro', emailHtml);
            }

            if (couponCode && isFirstInstallment) {
              const coupon = await firestoreRequest('GET', `cupons/${couponCode.toUpperCase()}`).catch(() => null);
              if (coupon) {
                const vendas = Array.isArray(coupon.vendas) ? coupon.vendas : [];
                const jaProcessado = vendas.some((v: any) => v.paymentId === payment.id);
                if (!jaProcessado) {
                  vendas.push({ paymentId: payment.id, plano: planName, valor: payment.value, cliente: customerName, email: customerEmail, data: new Date().toISOString() });
                  await firestoreRequest('PATCH', `cupons/${couponCode.toUpperCase()}`, {
                    ...coupon, usos: (coupon.usos || 0) + 1, vendas,
                  });
                }
              }
            }
          }
        } catch (e) { console.error('Webhook error:', e); }
      })();
      return;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // LICENÇAS
    // ──────────────────────────────────────────────────────────────────────────
    
    // Status do usuário
    if (url.includes('/api/user/status/') && method === 'GET') {
      const email = decodeURIComponent(url.split('/api/user/status/')[1]);
      const user = await firestoreRequest('GET', `users/${email}`).catch(() => null);
      return res.json(user || { isPro: false });
    }

    // Trial por HWID
    if (url.includes('/api/license/trial-hwid') && method === 'POST') {
      const { hwid, email } = req.body;
      if (!hwid) return res.status(400).json({ message: 'HWID é obrigatório' });
      
      const trialHistory = await firestoreRequest('GET', `trials_hwid/${hwid}`).catch(() => null);
      if (trialHistory) {
        return res.status(400).json({ message: 'Este computador já utilizou o teste gratuito.' });
      }
      
      const expiration = new Date();
      expiration.setDate(expiration.getDate() + 7);
      const licenseKey = generateLicenseKey({ hwid, type: 'Trial', expiration: expiration.toISOString() });
      
      await firestoreRequest('PATCH', `licenses/${hwid}`, {
        hwid, plano: 'Trial', licenseKey, email: email || '', activatedAt: new Date().toISOString(),
        expiration: expiration.toISOString(),
      });
      await firestoreRequest('PATCH', `trials_hwid/${hwid}`, { hwid, email: email || '', usedAt: new Date().toISOString() });
      
      if (email) {
        await firestoreRequest('PATCH', `trials_email/${email.toLowerCase()}`, { hwid, email, usedAt: new Date().toISOString() });
        await sendEmail(email, 'Teste R3D Pro ativado!', `<h1>Seu trial de 7 dias está ativo!</h1><p>HWID: ${hwid}</p>`);
      }
      
      return res.json({ success: true, plano: 'Trial', expiration: expiration.toISOString(), licenseKey, diasRestantes: 7 });
    }

    // Ativar licença
    if (url === '/api/license/activate' && method === 'POST') {
      const { activationCode, hwid } = req.body;
      if (!activationCode || !hwid) return res.status(400).json({ message: 'Código e HWID obrigatórios' });
      
      const activation = await firestoreRequest('GET', `activations/${activationCode.toUpperCase()}`).catch(() => null);
      if (!activation) return res.status(404).json({ message: 'Código não encontrado' });
      if (activation.status === 'USED') return res.status(400).json({ message: 'Código já utilizado' });
      if (activation.expiresAt && new Date(activation.expiresAt) < new Date()) {
        return res.status(400).json({ message: 'Código expirado' });
      }

      const now = new Date();
      let expiration = null;
      const plano = activation.plano || 'Mensal';
      if (plano === 'Trial') { now.setDate(now.getDate() + 7); expiration = now.toISOString(); }
      else if (plano === 'Mensal') { now.setDate(now.getDate() + 30); expiration = now.toISOString(); }
      else if (plano === 'Trimestral') { now.setDate(now.getDate() + 90); expiration = now.toISOString(); }
      else if (plano === 'Semestral') { now.setDate(now.getDate() + 180); expiration = now.toISOString(); }
      else if (plano === 'Anual') { now.setDate(now.getDate() + 365); expiration = now.toISOString(); }

      const licenseKey = generateLicenseKey({ hwid, type: plano, expiration });
      
      await firestoreRequest('PATCH', `activations/${activationCode.toUpperCase()}`, {
        status: 'USED', hwid, licenseKey, activatedAt: new Date().toISOString()
      });
      await firestoreRequest('PATCH', `licenses/${hwid}`, {
        hwid, plano, licenseKey, email: activation.email, activatedAt: new Date().toISOString(), expiration
      });
      
      return res.json({ success: true, licenseKey, plano: activation.plano, expiration });
    }

    // Validar licença
    if (url.includes('/api/license/validate') && method === 'GET') {
      const hwid = req.query?.hwid || url.split('hwid=')[1]?.split('&')[0];
      if (!hwid) return res.status(400).json({ message: 'HWID ausente' });
      
      const license = await firestoreRequest('GET', `licenses/${hwid}`).catch(() => null);
      if (!license) return res.json({ valid: false, message: 'Licença não encontrada' });
      
      const now = new Date();
      const isExpired = license.expiration && new Date(license.expiration) < now;
      if (isExpired) return res.json({ valid: false, message: 'Licença expirada', plano: license.plano });
      
      let diasRestantes = 9999;
      if (license.expiration) {
        diasRestantes = Math.max(0, Math.ceil((new Date(license.expiration).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      }
      return res.json({ valid: true, plano: license.plano, expiration: license.expiration, diasRestantes });
    }

    // Recuperar códigos
    if (url.includes('/api/license/recover') && method === 'GET') {
      const email = req.query?.email || url.split('email=')[1]?.split('&')[0];
      if (!email) return res.status(400).json({ message: 'E-mail obrigatório' });
      
      const allActivations = await firestoreList('activations');
      const userActivations = allActivations.filter((a: any) => a.email?.toLowerCase() === decodeURIComponent(email).toLowerCase());
      if (userActivations.length === 0) return res.status(404).json({ message: 'Nenhum código encontrado' });
      
      return res.json(userActivations.map((a: any) => ({ code: a.code, status: a.status, createdAt: a.createdAt, plano: a.plano })));
    }

    // Trial por e-mail (modal hero)
    if (url === '/api/license/trial' && method === 'POST') {
      const { email, name } = req.body;
      if (!email) return res.status(400).json({ message: 'E-mail obrigatório' });
      
      const allActivations = await firestoreList('activations');
      const hasTrial = allActivations.some((a: any) => a.email === email && a.plano === 'Trial');
      if (hasTrial) return res.status(400).json({ message: 'Você já solicitou um período de teste.' });
      
      const code = `R3D-TRIAL-${randomBytes(4).toString('hex').toUpperCase()}`;
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);
      
      await firestoreRequest('PATCH', `activations/${code}`, {
        code, email, name: name || 'Usuário Trial', plano: 'Trial', status: 'PENDING',
        createdAt: new Date().toISOString(), expiresAt: expirationDate.toISOString(),
      });
      
      await sendEmail(email, 'Seu código TRIAL R3D Pro', `<h1>${code}</h1><p>Use este código para ativar seu trial de 7 dias.</p>`);
      return res.json({ success: true, message: 'Código enviado para seu e-mail!' });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ADMIN: ATIVAÇÕES E LICENÇAS
    // ──────────────────────────────────────────────────────────────────────────
    
    if (url === '/api/admin/activations' && method === 'GET') {
      if (!isAdmin) return res.status(401).json({ message: 'Não autorizado' });
      return res.json(await firestoreList('activations'));
    }
    
    if (url.includes('/api/admin/activation/reset/') && method === 'POST') {
      if (!isAdmin) return res.status(401).json({ message: 'Não autorizado' });
      const code = (url.split('/reset/')[1]?.split('?')[0] || '') as string;
      if (!code) return res.status(400).json({ message: 'Código inválido' });
      const activation = await firestoreRequest('GET', `activations/${code.toUpperCase()}`).catch(() => null);
      if (!activation) return res.status(404).json({ message: 'Ativação não encontrada' });
      await firestoreRequest('PATCH', `activations/${code.toUpperCase()}`, { status: 'AVAILABLE', usedAt: null, hwid: null });
      return res.json({ success: true });
    }
    
    if (url === '/api/admin/licenses' && method === 'GET') {
      if (!isAdmin) return res.status(401).json({ message: 'Não autorizado' });
      return res.json(await firestoreList('licenses'));
    }
    
    if (url.includes('/api/admin/license/delete/') && method === 'DELETE') {
      if (!isAdmin) return res.status(401).json({ message: 'Não autorizado' });
      const hwid = (url.split('/').pop() || '') as string;
      if (!hwid) return res.status(400).json({ message: 'HWID inválido' });
      await firestoreDelete('licenses', hwid);
      return res.json({ success: true });
    }
    
    if (url.includes('/api/admin/activation/delete/') && method === 'DELETE') {
      if (!isAdmin) return res.status(401).json({ message: 'Não autorizado' });
      const code = (url.split('/').pop() || '') as string;
      if (!code) return res.status(400).json({ message: 'Código inválido' });
      await firestoreDelete('activations', code.toUpperCase());
      return res.json({ success: true });
    }
    
    if (url === '/api/admin/backup' && method === 'GET') {
      if (!isAdmin) return res.status(401).json({ message: 'Não autorizado' });
      const backup: any = { timestamp: new Date().toISOString() };
      const collections = ['activations', 'licenses', 'cupons', 'payments', 'trials_hwid', 'trials_email'];
      for (const col of collections) {
        backup[col] = await firestoreList(col);
      }
      return res.json(backup);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // DOWNLOAD
    // ──────────────────────────────────────────────────────────────────────────
    if (url === '/api/download') {
      return res.redirect(302, 'https://github.com/rovateduino/R3D-PRINT-MANAGER-PRO/releases/download/v2.5.0/Setup_R3D_PrintManager_Pro.exe');
    }

    return res.status(404).json({ message: 'Not found' });
    
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
