import { randomBytes } from 'crypto';
import axios from 'axios';
import { VercelRequest, VercelResponse } from '@vercel/node';

// ============================================================
// CONFIGURAÇÃO CORRETA DO FIRESTORE (COM DATABASE ID)
// ============================================================

const FIREBASE_PROJECT_ID = 'gen-lang-client-0364203262';
// Database ID do seu Firebase (NÃO é o padrão "default")
const FIREBASE_DATABASE_ID = 'ai-studio-ee7c5fd5-11f5-4e50-a979-3316fea33a21';
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || '';
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '';

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  
  console.log('[Firebase] Gerando token JWT...');
  
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
  console.log('[Firebase] Token obtido com sucesso');
  return cachedToken;
}

// Função que usa o DATABASE ID CORRETO
async function firestoreRequest(method: string, path: string, data?: any) {
  const token = await getToken();
  // URL com o Database ID específico (NÃO é "default")
  let url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIREBASE_DATABASE_ID}/documents/${path}`;
  
  console.log('[Firestore] URL:', url);
  
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
  console.log('[Firestore] List URL:', url);
  try {
    const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    console.log(`[Firestore] List ${collection}: found ${res.data.documents?.length || 0} docs`);
    return (res.data.documents || []).map((doc: any) => ({
      id: doc.name.split('/').pop(),
      ...decodeFields(doc.fields || {}),
    }));
  } catch (e: any) {
    if (e.response?.status === 404) return [];
    throw e;
  }
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

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    await axios.post('https://api.resend.com/emails', {
      from: 'R3D Pro <contato@r3dprintmanagerpro.com.br>',
      to, subject, html
    }, { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } });
    console.log(`E-mail enviado para ${to}`);
  } catch (e) { console.error('Email error:', e); }
}

const asaasUrl = () => process.env.ASAAS_ENV === 'production' ? 'https://api.asaas.com/v3' : 'https://sandbox.asaas.com/api/v3';

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

    // ── Health Check (agora com Database ID correto) ─────────────────────────
    if (url === '/api/health') {
      try {
        // Testa se consegue ler uma coleção
        const collections = await firestoreList('activations');
        return res.json({ 
          status: 'ok', 
          firebase: true,
          databaseId: FIREBASE_DATABASE_ID,
          collectionsCount: collections.length,
          timestamp: new Date().toISOString()
        });
      } catch (e: any) {
        return res.json({ 
          status: 'degraded', 
          firebase: false, 
          error: e.message,
          databaseId: FIREBASE_DATABASE_ID,
          timestamp: new Date().toISOString()
        });
      }
    }

    // ── Validar cupom ─────────────────────────────────────────────────────────
    if (url.includes('/api/cupom/validar') && method === 'GET') {
      const codigo = req.query?.codigo || url.split('codigo=')[1]?.split('&')[0];
      if (!codigo) return res.status(400).json({ message: 'Código ausente' });
      try {
        const coupon = await firestoreRequest('GET', `cupons/${String(codigo).toUpperCase()}`);
        if (!coupon?.ativo) return res.status(404).json({ message: 'Cupom inválido' });
        return res.json({ id: codigo, ...coupon });
      } catch {
        return res.status(404).json({ message: 'Cupom não encontrado' });
      }
    }

    // ── Admin - Listar cupons ─────────────────────────────────────────────────
    if (url === '/api/admin/cupons' && method === 'GET') {
      if (!isAdmin) return res.status(401).json({ message: 'Não autorizado' });
      try {
        const cupons = await firestoreList('cupons');
        return res.json(cupons);
      } catch (e: any) {
        return res.status(500).json({ error: e.message });
      }
    }

    // ── Admin - Criar cupom ───────────────────────────────────────────────────
    if (url === '/api/admin/cupom/criar' && method === 'POST') {
      if (!isAdmin) return res.status(401).json({ message: 'Não autorizado' });
      try {
        const data = req.body;
        const codigo = String(data.codigo).toUpperCase().trim();
        
        await firestoreRequest('PATCH', `cupons/${codigo}`, {
          codigo,
          tipo: data.tipo || 'PERCENTUAL',
          valor: Number(data.valor) || 0,
          afiliado_nome: data.afiliado_nome || '',
          afiliado_email: data.afiliado_email || '',
          afiliado_telefone: data.afiliado_telefone || '',
          limite_usos: Number(data.limite_usos) || 0,
          validade: data.validade || '',
          ativo: true,
          usos: 0,
          vendas: [],
          criado_em: new Date().toISOString(),
        });
        
        if (data.afiliado_email) {
          await sendEmail(data.afiliado_email, 'Seu cupom de afiliado foi criado!', 
            `<h1>Cupom ${codigo} criado com sucesso!</h1>`);
        }
        return res.json({ success: true });
      } catch (e: any) {
        return res.status(500).json({ error: e.message });
      }
    }

    // ── Asaas - Criar cliente ─────────────────────────────────────────────────
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

    // ── Asaas - Criar pagamento ───────────────────────────────────────────────
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

    // ── Asaas - Webhook ───────────────────────────────────────────────────────
    if (url.includes('/api/asaas/webhook') && method === 'POST') {
      const event = Array.isArray(req.body) ? req.body[0] : req.body;
      const payment = event?.payment;
      
      if (!payment) {
        return res.status(200).send('OK');
      }
      
      res.status(200).send('OK');
      
      (async () => {
        try {
          if (event.event === 'PAYMENT_CONFIRMED' || event.event === 'PAYMENT_RECEIVED') {
            const code = `R3D-ACT-${randomBytes(6).toString('hex').toUpperCase().match(/.{1,4}/g)?.join('-')}`;
            const email = payment.customerEmail || 'cliente@email.com';
            
            await firestoreRequest('PATCH', `activations/${code}`, {
              code, email, status: 'PENDING', createdAt: new Date().toISOString()
            });
            
            await sendEmail(email, 'Seu código de ativação R3D Pro', 
              `<h1 style="color:#C67D3D">${code}</h1><p>Use este código para ativar sua licença.</p>`);
          }
        } catch (e) { console.error('Webhook error:', e); }
      })();
      return;
    }

    // ── Status do usuário ─────────────────────────────────────────────────────
    if (url.includes('/api/user/status/') && method === 'GET') {
      const email = decodeURIComponent(url.split('/api/user/status/')[1]);
      try {
        const user = await firestoreRequest('GET', `users/${email}`);
        return res.json(user || { isPro: false });
      } catch {
        return res.json({ isPro: false });
      }
    }

    // ── Ativar licença ────────────────────────────────────────────────────────
    if (url === '/api/license/activate' && method === 'POST') {
      const { activationCode, hwid } = req.body;
      if (!activationCode || !hwid) {
        return res.status(400).json({ message: 'Código e HWID obrigatórios' });
      }
      
      try {
        const activation = await firestoreRequest('GET', `activations/${activationCode.toUpperCase()}`);
        if (!activation || activation.status === 'USED') {
          return res.status(400).json({ message: 'Código inválido ou já utilizado' });
        }
        
        await firestoreRequest('PATCH', `activations/${activationCode.toUpperCase()}`, {
          status: 'USED', hwid, activatedAt: new Date().toISOString()
        });
        
        await firestoreRequest('PATCH', `licenses/${hwid}`, {
          hwid, plano: activation.plano || 'Mensal', activatedAt: new Date().toISOString()
        });
        
        return res.json({ success: true, message: 'Licença ativada com sucesso!' });
      } catch {
        return res.status(404).json({ message: 'Código não encontrado' });
      }
    }

    // ── Validar licença ───────────────────────────────────────────────────────
    if (url.includes('/api/license/validate') && method === 'GET') {
      const hwid = req.query?.hwid || url.split('hwid=')[1]?.split('&')[0];
      if (!hwid) return res.status(400).json({ message: 'HWID ausente' });
      
      try {
        const license = await firestoreRequest('GET', `licenses/${hwid}`);
        return res.json({ valid: !!license, plano: license?.plano });
      } catch {
        return res.json({ valid: false });
      }
    }

    // ── Download ──────────────────────────────────────────────────────────────
    if (url === '/api/download') {
      return res.redirect(302, 'https://github.com/rovateduino/R3D-PRINT-MANAGER-PRO/releases/download/v2.5.0/Setup_R3D_PrintManager_Pro.exe');
    }

    return res.status(404).json({ message: 'Not found' });
    
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
