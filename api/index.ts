import { createCipheriv, createHash, randomBytes } from 'crypto';
import axios from 'axios';
import { VercelRequest, VercelResponse } from '@vercel/node';

// ============================================================
// CONFIGURAÇÃO DO FIRESTORE (REST API)
// ============================================================

const FIREBASE_PROJECT_ID = 'gen-lang-client-0364203262';
const FIREBASE_DATABASE_ID = 'ai-studio-ee7c5fd5-11f5-4e50-a979-3316fea33a21';
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@gen-lang-client-0364203262.iam.gserviceaccount.com';
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '';

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getFirebaseToken() {
  try {
    if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
    
    console.log('[Firebase] Gerando novo token JWT...');
    
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
  } catch (error: any) {
    console.error('[Firebase] Erro ao obter token:', error.response?.data || error.message);
    throw error;
  }
}

async function fsRequest(method: string, path: string, data?: any) {
  const token = await getFirebaseToken();
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

async function fsList(collection: string) {
  const token = await getFirebaseToken();
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIREBASE_DATABASE_ID}/documents/${collection}`;
  try {
    const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    console.log(`[Firestore] List ${collection}: found ${res.data.documents?.length || 0} docs`);
    return (res.data.documents || []).map((doc: any) => ({
      id: doc.name.split('/').pop(),
      ...decodeFields(doc.fields || {}),
    }));
  } catch (e: any) {
    if (e.response?.status === 404) return [];
    console.error(`[Firestore] List ${collection} error:`, e.response?.data || e.message);
    throw e;
  }
}

async function fsGet(collection: string, id: string) {
  try { 
    return await fsRequest('GET', `${collection}/${id}`);
  } catch (e: any) { 
    if (e.response?.status === 404) return null; 
    throw e;
  }
}

async function fsSet(collection: string, id: string, data: any) {
  return fsRequest('PATCH', `${collection}/${id}`, data);
}

async function fsCreate(collection: string, id: string, data: any) {
  return fsRequest('POST', `${collection}?documentId=${id}`, data);
}

async function fsDelete(collection: string, id: string) {
  const token = await getFirebaseToken();
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIREBASE_DATABASE_ID}/documents/${collection}/${id}`;
  console.log(`[Firestore] Deleting ${collection}/${id}...`);
  try {
    const res = await axios.delete(url, { headers: { Authorization: `Bearer ${token}` } });
    console.log(`[Firestore] Deleted ${collection}/${id} successfully`);
    return res.data;
  } catch (e: any) {
    console.error(`[Firestore] Delete ${collection}/${id} error:`, e.response?.data || e.message);
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
    else if ('integerValue' in v) obj[key] = Number(v.integerValue);
    else if ('booleanValue' in v) obj[key] = v.booleanValue;
    else if ('arrayValue' in v) obj[key] = (v.arrayValue.values || []).map((item: any) => decodeFields({ temp: item }).temp);
    else if ('mapValue' in v) obj[key] = decodeFields(v.mapValue.fields || {});
    else obj[key] = null;
  }
  return obj;
}

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY ausente, e-mail não enviado');
    return;
  }
  try {
    await axios.post('https://api.resend.com/emails', {
      from: 'R3D Pro <contato@r3dprintmanagerpro.com.br>',
      to,
      subject,
      html
    }, { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } });
    console.log(`E-mail enviado para ${to}`);
  } catch (e: any) {
    console.error('Erro Resend:', e.response?.data || e.message);
  }
}

const asaasUrl = () => process.env.ASAAS_ENV === 'production' ? 'https://api.asaas.com/v3' : 'https://sandbox.asaas.com/api/v3';

function generateLicenseKey(payload: any) {
  const secret = process.env.KEYGEN_SECRET || 'R3D_SECRET_KEY_2026_XPTO_MANAGER';
  const key = createHash('sha256').update(secret).digest();
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

// ============================================================
// HANDLER PRINCIPAL
// ============================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configuração CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password, asaas-access-token');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const url = req.url || '';
    const method = req.method || 'GET';
    console.log(`[API] Request: ${method} ${url}`);
    
    const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'admin123';
    const clientPass = req.headers['x-admin-password'];
    const isAdmin = clientPass === ADMIN_PASS;

    // ── Health Check ──────────────────────────────────────────────────────────
    if (url === '/api/health' || url === '/api/health/') {
      try {
        // Testa conexão com Firestore
        const testData = await fsSet('_health_check', 'test', { 
          timestamp: new Date().toISOString(),
          message: 'R3D Pro API is alive'
        });
        
        // Tenta listar algumas coleções
        const activations = await fsList('activations');
        
        return res.json({ 
          status: 'ok', 
          firebase: true,
          databaseId: FIREBASE_DATABASE_ID,
          projectId: FIREBASE_PROJECT_ID,
          collectionsCount: {
            activations: activations.length
          },
          asaasEnv: process.env.ASAAS_ENV || 'sandbox',
          timestamp: new Date().toISOString()
        });
      } catch (e: any) {
        console.error('[Health] Erro detalhado:', e.response?.data || e.message);
        return res.json({
          status: 'degraded',
          firebase: false,
          error: e.message,
          details: e.response?.data || e.message,
          databaseId: FIREBASE_DATABASE_ID,
          projectId: FIREBASE_PROJECT_ID,
          timestamp: new Date().toISOString()
        });
      }
    }

    // ── Validar cupom ─────────────────────────────────────────────────────────
    if (url.includes('/api/cupom/validar') && method === 'GET') {
      const codigo = req.query?.codigo || url.split('codigo=')[1]?.split('&')[0];
      if (!codigo) return res.status(400).json({ message: 'Código ausente' });
      
      const coupon = await fsGet('cupons', String(codigo).toUpperCase());
      if (!coupon || !coupon.ativo) return res.status(404).json({ message: 'Cupom inválido ou inativo' });
      if (coupon.limite_usos && coupon.usos >= coupon.limite_usos) {
        return res.status(400).json({ message: 'Limite de usos atingido' });
      }
      if (coupon.validade && new Date(coupon.validade) < new Date()) {
        return res.status(400).json({ message: 'Cupom expirado' });
      }
      return res.json({ id: codigo, ...coupon });
    }

    // ── Admin: Listar cupons ───────────────────────────────────────────────────
    if (url.includes('/api/admin/cupons') && method === 'GET') {
      if (!isAdmin) return res.status(401).json({ message: 'Senha incorreta' });
      try { 
        const cupons = await fsList('cupons');
        return res.json(cupons);
      } catch (e: any) { 
        return res.status(500).json({ message: 'Erro ao listar', error: e.message }); 
      }
    }

    // ── Admin: Criar cupom ─────────────────────────────────────────────────────
    if (url.includes('/api/admin/cupom/criar') && method === 'POST') {
      if (!isAdmin) return res.status(401).json({ message: 'Senha incorreta' });
      try {
        const data = req.body;
        const codigo = String(data.codigo).toUpperCase().trim();
        
        await fsSet('cupons', codigo, {
          codigo,
          tipo: data.tipo || 'PERCENTUAL',
          valor: Number(data.valor) || 0,
          afiliado_nome: data.afiliado_nome || '',
          afiliado_email: data.afiliado_email || '',
          afiliado_telefone: data.afiliado_telefone || '',
          limite_usos: Number(data.limite_usos) || 0,
          validade: data.validade || '',
          ativo: data.ativo !== undefined ? data.ativo : true,
          usos: 0,
          vendas: [],
          criado_em: new Date().toISOString(),
        });
        
        if (data.afiliado_email) {
          await sendEmail(data.afiliado_email, 'Seu cupom de afiliado foi criado!',
            `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
              <h2 style="color:#C67D3D">Olá ${data.afiliado_nome}! 🎉</h2>
              <p>Seu cupom foi criado no R3D Print Manager Pro!</p>
              <div style="background:#1a1a1a;color:white;padding:20px;border-radius:12px;text-align:center;margin:20px 0">
                <p style="margin:0;color:#999">Seu código:</p>
                <h1 style="color:#C67D3D;font-size:36px;margin:10px 0">${codigo}</h1>
                <p style="margin:0;color:#ccc">${data.tipo === 'PERCENTUAL' ? `${data.valor}% de desconto` : `R$ ${Number(data.valor).toFixed(2)} de desconto`}</p>
              </div>
              <p>Você receberá um e-mail a cada venda realizada com seu cupom.</p>
            </div>`
          );
        }
        return res.json({ success: true });
      } catch (e: any) { 
        return res.status(500).json({ message: 'Erro ao criar', error: e.message }); 
      }
    }

    // ── Admin: Atualizar cupom ─────────────────────────────────────────────────
    if (url.includes('/api/admin/cupom/') && !url.includes('/criar') && method === 'PUT') {
      if (!isAdmin) return res.status(401).json({ message: 'Senha incorreta' });
      const id = url.split('/api/admin/cupom/')[1]?.split('?')[0];
      try {
        const existing = await fsGet('cupons', id);
        await fsSet('cupons', id, { ...existing, ...req.body });
        return res.json({ success: true });
      } catch (e: any) { 
        return res.status(500).json({ message: 'Erro ao atualizar', error: e.message }); 
      }
    }

    // ── Admin: Excluir cupom ───────────────────────────────────────────────────
    if (url.includes('/api/admin/cupom/') && method === 'DELETE') {
      if (!isAdmin) return res.status(401).json({ message: 'Senha incorreta' });
      const id = url.split('/').pop();
      if (!id) return res.status(400).json({ error: 'ID ausente' });
      await fsDelete('cupons', id);
      return res.json({ success: true });
    }

    // ── Asaas: Criar cliente ───────────────────────────────────────────────────
    if (url.includes('/api/asaas/customer') && method === 'POST') {
      try {
        const r = await axios.post(`${asaasUrl()}/customers`, req.body, {
          headers: { access_token: process.env.ASAAS_API_KEY || '' }
        });
        return res.json(r.data);
      } catch (e: any) {
        return res.status(e.response?.status || 500).json(e.response?.data || { message: 'Erro ao criar cliente' });
      }
    }

    // ── Asaas: Criar pagamento ─────────────────────────────────────────────────
    if (url.includes('/api/asaas/payment') && method === 'POST') {
      try {
        const r = await axios.post(`${asaasUrl()}/payments`, req.body, {
          headers: { access_token: process.env.ASAAS_API_KEY || '' }
        });
        return res.json(r.data);
      } catch (e: any) {
        return res.status(e.response?.status || 500).json(e.response?.data || { message: 'Erro ao processar pagamento' });
      }
    }

    // ── Asaas: PIX QR Code ─────────────────────────────────────────────────────
    if (url.includes('/api/asaas/pix-qrcode') && method === 'GET') {
      const paymentId = req.query?.paymentId || url.split('paymentId=')[1]?.split('&')[0];
      if (!paymentId) return res.status(400).json({ message: 'paymentId ausente' });
      try {
        const r = await axios.get(`${asaasUrl()}/payments/${paymentId}/pixQrCode`, {
          headers: { access_token: process.env.ASAAS_API_KEY || '' }
        });
        return res.json(r.data);
      } catch (e: any) {
        return res.status(e.response?.status || 500).json({ message: 'Erro ao buscar QR Code PIX' });
      }
    }

    // ── Asaas: Webhook ─────────────────────────────────────────────────────────
    if (url.includes('/api/asaas/webhook') && method === 'POST') {
      const body = req.body;
      const event = Array.isArray(body) ? body[0] : body;
      const payment = event?.payment;

      const webhookToken = req.headers['asaas-access-token'];
      const isSimulated = webhookToken === 'SIMULATED_TOKEN';
      const configuredToken = process.env.ASAAS_WEBHOOK_TOKEN;

      console.log(`[Webhook] Evento: ${event?.event}, Pagamento: ${payment?.id}, Simulado: ${isSimulated}`);

      if (configuredToken && !isSimulated && webhookToken !== configuredToken) {
        console.warn('[Webhook] Token inválido');
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!payment) {
        console.warn('[Webhook] Pagamento ausente no corpo');
        return res.status(400).json({ message: 'Missing payment' });
      }

      // Resposta rápida para o Asaas para evitar timeout
      res.status(200).send('OK');

      // Processamento assíncrono
      (async () => {
        try {
          await fsSet('payments', payment.id, {
            paymentId: payment.id,
            status: payment.status,
            event: event.event,
            value: payment.value,
            customer: payment.customer,
            billingType: payment.billingType || '',
            installmentNumber: payment.installmentNumber || 1,
            processedAt: new Date().toISOString(),
            externalReference: payment.externalReference || '',
            isSimulated,
          });

          if (event.event === 'PAYMENT_CONFIRMED' || event.event === 'PAYMENT_RECEIVED') {
            const extRef = payment.externalReference || '';
            const parts = extRef.split(':');
            const hasCoupon = parts[0] === 'COUPON';
            const couponCode = hasCoupon ? parts[1] : '';
            const planName = hasCoupon
              ? parts.slice(2, parts.length - 1).join(' ')
              : parts.slice(1, parts.length - 1).join(' ');

            const installmentNumber = payment.installmentNumber || 1;
            const isFirstInstallment = installmentNumber === 1;

            let customerEmail = '';
            let customerName = '';

            if (isSimulated) {
              customerEmail = payment.customerEmail || 'teste@exemplo.com';
              customerName = payment.customerName || 'Cliente Teste';
            } else {
              try {
                const cr = await axios.get(`${asaasUrl()}/customers/${payment.customer}`, {
                  headers: { access_token: process.env.ASAAS_API_KEY || '' }
                });
                customerEmail = cr.data.email || '';
                customerName = cr.data.name || '';
              } catch (e) {
                console.error('Erro ao buscar cliente:', e);
              }
            }

            if (customerEmail && isFirstInstallment) {
              await fsSet('users', customerEmail, {
                email: customerEmail,
                isPro: true,
                subscriptionId: payment.installment || payment.id,
                plano: planName,
                updatedAt: new Date().toISOString(),
              });

              const actByPay = await fsGet('activations_by_payment', payment.id);
              let generatedCode = null;

              if (actByPay) {
                generatedCode = actByPay.code;
              } else {
                const code = `R3D-ACT-${randomBytes(6).toString('hex').toUpperCase().match(/.{1,4}/g)?.join('-')}`;
                generatedCode = code;
                const expirationDate = new Date();
                expirationDate.setDate(expirationDate.getDate() + 7);

                await fsCreate('activations', code, {
                  code,
                  paymentId: payment.id,
                  email: customerEmail,
                  name: customerName,
                  plano: planName || 'PRO',
                  status: 'PENDING',
                  createdAt: new Date().toISOString(),
                  expiresAt: expirationDate.toISOString(),
                });
                
                await fsSet('activations_by_payment', payment.id, { code });
                console.log(`[Activation] Código gerado: ${code} para ${customerEmail}`);

                try {
                  const emailHtml = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                    <h2 style="color:#C67D3D">Parabéns pela sua compra! 🎉</h2>
                    <p>Olá ${customerName}, seu pagamento foi confirmado.</p>
                    <p>Aqui está seu código de ativação para o R3D Print Manager Pro:</p>
                    <div style="background:#1a1a1a;color:white;padding:20px;border-radius:12px;text-align:center;margin:20px 0">
                      <h1 style="color:#C67D3D;font-size:32px;margin:10px 0">${code}</h1>
                    </div>
                    <p><strong>Instruções:</strong></p>
                    <ol>
                      <li>Baixe o aplicativo: <a href="https://r3dprintmanagerpro.com.br/api/download">Clique aqui para baixar</a></li>
                      <li>Abra o aplicativo e insira o código acima quando solicitado.</li>
                      <li>O sistema irá gerar sua licença final vinculada ao seu computador.</li>
                    </ol>
                    <p style="color:#ff4444"><strong>Atenção:</strong> Este código expira em 7 dias se não for utilizado.</p>
                    <p>Dúvidas? Responda este e-mail.</p>
                  </div>`;

                  await sendEmail(customerEmail, 'Seu código de ativação R3D Print Manager Pro', emailHtml);
                } catch (emailErr) {
                  console.error('Erro ao enviar e-mail de ativação:', emailErr);
                }
              }
            }

            if (couponCode && isFirstInstallment) {
              const coupon = await fsGet('cupons', couponCode.toUpperCase());

              if (coupon) {
                const existingVendas = Array.isArray(coupon.vendas) ? coupon.vendas : [];
                const installmentId = payment.installment || payment.id;
                const jaProcessado = existingVendas.some((v: any) =>
                  v.installmentId === installmentId || v.paymentId === payment.id
                );

                if (!jaProcessado) {
                  const novaVenda = {
                    paymentId: payment.id,
                    installmentId,
                    plano: planName || 'N/A',
                    valor: payment.value,
                    cliente: customerName,
                    email: customerEmail,
                    afiliado: coupon.afiliado_nome || '',
                    data: new Date().toISOString(),
                  };

                  const updatedVendas = [...existingVendas, novaVenda];
                  const novosUsos = (Number(coupon.usos) || 0) + 1;

                  await fsSet('cupons', coupon.codigo || couponCode.toUpperCase(), {
                    ...coupon,
                    usos: novosUsos,
                    vendas: updatedVendas,
                  });

                  if (coupon.afiliado_email) {
                    await sendEmail(
                      coupon.afiliado_email,
                      `🎉 Nova venda com seu cupom ${coupon.codigo}!`,
                      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                        <h2 style="color:#C67D3D">Nova venda realizada! 🚀</h2>
                        <p>Olá ${coupon.afiliado_nome}, seu cupom gerou mais uma venda!</p>
                        <div style="background:#1a1a1a;color:white;padding:20px;border-radius:12px;margin:20px 0">
                          <p><strong style="color:#C67D3D">Cupom:</strong> ${coupon.codigo}</p>
                          <p><strong style="color:#C67D3D">Plano adquirido:</strong> ${planName || 'N/A'}</p>
                          <p><strong style="color:#C67D3D">Cliente:</strong> ${customerName}</p>
                          <p><strong style="color:#C67D3D">Valor:</strong> R$ ${payment.value.toFixed(2)}</p>
                          <p><strong style="color:#C67D3D">Total de usos:</strong> ${novosUsos}</p>
                          <p><strong style="color:#C67D3D">Data:</strong> ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</p>
                        </div>
                      </div>`
                    );
                  }
                }
              }
            }
          }
        } catch (e: any) {
          console.error('[Webhook] Erro no processamento assíncrono:', e);
        }
      })();

      return;
    }

    // ── Status do usuário ─────────────────────────────────────────────────────
    if (url.includes('/api/user/status/') && method === 'GET') {
      const email = decodeURIComponent(url.split('/api/user/status/')[1]);
      const data = await fsGet('users', email);
      return res.json(data || { isPro: false });
    }

    // ── Trial direto por HWID ─────────────────────────────────────────────────
    if (url.includes('/api/license/trial-hwid') && method === 'POST') {
      const { hwid, email } = req.body;

      if (!hwid) return res.status(400).json({ message: 'HWID é obrigatório' });

      const hwidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      if (!hwidRegex.test(hwid)) {
        return res.status(400).json({ message: 'Formato de HWID inválido. Use: 00000000-0000-0000-0000-000000000000' });
      }

      // Verifica histórico permanente de trial
      const trialHistory = await fsGet('trials_hwid', hwid);
      if (trialHistory) {
        return res.status(400).json({
          message: 'Este computador já utilizou o período de teste gratuito. Adquira um plano para continuar.'
        });
      }

      if (email) {
        const emailHistory = await fsGet('trials_email', email.toLowerCase());
        if (emailHistory) {
          return res.status(400).json({
            message: 'Este e-mail já utilizou o período de teste gratuito.'
          });
        }
      }

      // Verifica se já tem licença ativa
      const existingLicense = await fsGet('licenses', hwid);
      if (existingLicense) {
        if (existingLicense.plano === 'Trial') {
          return res.status(400).json({ message: 'Este computador já possui um teste ativo.' });
        }
        return res.status(400).json({ message: 'Este computador já possui uma licença ativa.' });
      }

      // Gera licença trial (7 dias)
      const expiration = new Date();
      expiration.setDate(expiration.getDate() + 7);

      const payload = {
        hwid,
        type: 'Trial',
        issued: new Date().toISOString(),
        expiration: expiration.toISOString(),
        version: 1,
        nonce: randomBytes(8).toString('hex')
      };

      const licenseKey = generateLicenseKey(payload);

      // Salva licença ativa
      await fsSet('licenses', hwid, {
        hwid,
        plano: 'Trial',
        licenseKey,
        email: email || '',
        activatedAt: new Date().toISOString(),
        expiration: expiration.toISOString()
      });

      // Salva histórico permanente
      await fsCreate('trials_hwid', hwid, {
        hwid,
        email: email || '',
        usedAt: new Date().toISOString(),
        expiration: expiration.toISOString()
      });

      if (email) {
        await fsCreate('trials_email', email.toLowerCase(), {
          hwid,
          email: email.toLowerCase(),
          usedAt: new Date().toISOString(),
          expiration: expiration.toISOString()
        });
      }

      console.log(`[Trial-HWID] Trial ativado para HWID: ${hwid}, email: ${email || 'não informado'}`);

      // Envia e-mail de confirmação
      if (email) {
        try {
          await sendEmail(
            email,
            'Seu Teste Gratuito R3D Pro foi ativado! 🚀',
            `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
              <h2 style="color:#C67D3D">Seu teste gratuito está ativo! 🎉</h2>
              <p>Olá! Seu período de teste de <strong>7 dias</strong> do R3D Print Manager Pro foi ativado com sucesso.</p>
              <div style="background:#1a1a1a;color:white;padding:20px;border-radius:12px;margin:20px 0">
                <p style="margin:0 0 8px;color:#999;font-size:12px">HARDWARE ID</p>
                <p style="margin:0;color:#C67D3D;font-family:monospace;font-size:13px;word-break:break-all">${hwid}</p>
                <hr style="border:1px solid #333;margin:16px 0"/>
                <p style="margin:0 0 4px;color:#999;font-size:12px">EXPIRA EM</p>
                <p style="margin:0;color:white;font-size:14px;font-weight:bold">${expiration.toLocaleDateString('pt-BR')} às ${expiration.toLocaleTimeString('pt-BR')}</p>
              </div>
              <p><strong>O que você pode fazer agora:</strong></p>
              <ul>
                <li>Acesse todas as funções do R3D Pro por 7 dias completos.</li>
                <li>Após o prazo, o software será bloqueado automaticamente.</li>
                <li>Para continuar usando, adquira um plano em <a href="https://r3dprintmanagerpro.com.br/#pricing">r3dprintmanagerpro.com.br</a>.</li>
              </ul>
              <p style="color:#999;font-size:12px">⚠️ Cada computador (HWID) pode utilizar o teste gratuito apenas uma única vez.</p>
              <p>Dúvidas? Fale conosco pelo WhatsApp!</p>
            </div>`
          );
        } catch (emailErr) {
          console.error('[Trial-HWID] Erro ao enviar e-mail:', emailErr);
        }
      }

      return res.json({
        success: true,
        plano: 'Trial',
        expiration: expiration.toISOString(),
        licenseKey,
        diasRestantes: 7
      });
    }

    // ── Ativar Licença ─────────────────────────────────────────────────────────
    if (url.includes('/api/license/activate') && method === 'POST') {
      const { code, activationCode, hwid } = req.body;
      const finalCode = code || activationCode;

      if (!finalCode || !hwid) {
        return res.status(400).json({ message: 'Código e HWID são obrigatórios' });
      }

      const hwidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      if (!hwidRegex.test(hwid)) {
        return res.status(400).json({ message: 'Formato de Hardware ID (HWID) inválido.' });
      }

      const activation = await fsGet('activations', String(finalCode).toUpperCase());
      if (!activation) return res.status(404).json({ message: 'Código de ativação não encontrado' });
      if (activation.status === 'USED') return res.status(400).json({ message: 'Este código já foi utilizado' });
      if (activation.expiresAt && new Date(activation.expiresAt) < new Date()) {
        return res.status(400).json({ message: 'Este código expirou' });
      }

      const now = new Date();
      let expiration: string | null = null;
      const plano = activation.plano || 'Mensal';

      if (plano === 'Trial') {
        now.setDate(now.getDate() + 7);
        expiration = now.toISOString();
      } else if (plano === 'Mensal') {
        now.setDate(now.getDate() + 30);
        expiration = now.toISOString();
      } else if (plano === 'Trimestral') {
        now.setDate(now.getDate() + 90);
        expiration = now.toISOString();
      } else if (plano === 'Semestral') {
        now.setDate(now.getDate() + 180);
        expiration = now.toISOString();
      } else if (plano === 'Anual') {
        now.setDate(now.getDate() + 365);
        expiration = now.toISOString();
      } else if (plano === 'Vitalício') {
        expiration = null;
      }

      const payload = {
        hwid,
        type: plano,
        issued: new Date().toISOString(),
        expiration,
        version: 1,
        nonce: randomBytes(8).toString('hex')
      };

      const licenseKey = generateLicenseKey(payload);

      await fsSet('activations', String(finalCode).toUpperCase(), {
        ...activation,
        status: 'USED',
        hwid,
        licenseKey,
        activatedAt: new Date().toISOString()
      });

      await fsSet('licenses', hwid, {
        hwid,
        plano,
        licenseKey,
        email: activation.email,
        activatedAt: new Date().toISOString(),
        expiration
      });

      await fsCreate('logs_activation', `${new Date().getTime()}_${hwid}`, {
        event: 'ACTIVATION_SUCCESS',
        code: finalCode,
        hwid,
        email: activation.email,
        timestamp: new Date().toISOString()
      });

      return res.json({
        success: true,
        licenseKey,
        plano: activation.plano,
        expiration
      });
    }

    // ── Validar Licença ───────────────────────────────────────────────────────
    if (url.includes('/api/license/validate') && method === 'GET') {
      const hwid = req.query?.hwid || url.split('hwid=')[1]?.split('&')[0];
      if (!hwid) return res.status(400).json({ message: 'HWID ausente' });

      const license = await fsGet('licenses', hwid);
      if (!license) return res.status(404).json({ message: 'Licença não encontrada para este HWID', valid: false });

      const now = new Date();
      const isExpired = license.expiration && new Date(license.expiration) < now;

      if (isExpired) {
        return res.json({
          valid: false,
          message: 'Sua licença expirou. Por favor, renove seu plano.',
          plano: license.plano,
          expiration: license.expiration,
          diasRestantes: 0
        });
      }

      let diasRestantes = 9999;
      if (license.expiration) {
        const diffTime = new Date(license.expiration).getTime() - now.getTime();
        diasRestantes = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      }

      return res.json({
        valid: true,
        plano: license.plano,
        expiration: license.expiration || null,
        diasRestantes
      });
    }

    // ── Recuperar Códigos ─────────────────────────────────────────────────────
    if (url.includes('/api/license/recover') && method === 'GET') {
      const email = req.query?.email || url.split('email=')[1]?.split('&')[0];
      if (!email) return res.status(400).json({ message: 'E-mail é obrigatório' });

      try {
        const allActivations = await fsList('activations');
        const userActivations = allActivations.filter((a: any) =>
          a.email?.toLowerCase() === decodeURIComponent(email).toLowerCase()
        );

        if (userActivations.length === 0) {
          return res.status(404).json({ message: 'Nenhuma ativação encontrada para este e-mail' });
        }

        return res.json(userActivations.map((a: any) => ({
          code: a.code,
          status: a.status,
          createdAt: a.createdAt,
          plano: a.plano
        })));
      } catch (e: any) {
        return res.status(500).json({ message: 'Erro ao recuperar códigos' });
      }
    }

    // ── Admin: Listar ativações ────────────────────────────────────────────────
    if (url.includes('/api/admin/activations') && method === 'GET') {
      if (!isAdmin) return res.status(401).json({ message: 'Senha incorreta' });
      try { 
        const activations = await fsList('activations');
        return res.json(activations);
      } catch (e: any) { 
        return res.status(500).json({ message: 'Erro ao listar ativações', error: e.message }); 
      }
    }

    // ── Admin: Resetar ativação ────────────────────────────────────────────────
    if (url.includes('/api/admin/activation/reset/') && method === 'POST') {
      if (!isAdmin) return res.status(401).json({ message: 'Senha incorreta' });
      const code = String(url.split('/reset/')[1]?.split('?')[0]);
      if (!code) return res.status(400).json({ message: 'Código é obrigatório' });
      try {
        const activation = await fsGet('activations', code.toUpperCase());
        if (!activation) return res.status(404).json({ message: 'Ativação não encontrada' });
        await fsSet('activations', code.toUpperCase(), { ...activation, status: 'AVAILABLE', usedAt: null, hwid: null });
        return res.json({ message: 'Ativação resetada com sucesso' });
      } catch (e: any) { 
        return res.status(500).json({ message: 'Erro ao resetar ativação' }); 
      }
    }

    // ── Admin: Listar licenças ─────────────────────────────────────────────────
    if (url.includes('/api/admin/licenses') && method === 'GET') {
      if (!isAdmin) return res.status(401).json({ message: 'Senha incorreta' });
      try { 
        const licenses = await fsList('licenses');
        return res.json(licenses);
      } catch (e: any) { 
        return res.status(500).json({ message: 'Erro ao listar licenças' }); 
      }
    }

    // ── Admin: Excluir licença ─────────────────────────────────────────────────
    if (url.includes('/api/admin/license/delete/') && method === 'DELETE') {
      if (!isAdmin) return res.status(401).json({ message: 'Senha incorreta' });
      const hwid = String(url.split('/').pop());
      await fsDelete('licenses', hwid);
      return res.json({ success: true });
    }

    // ── Admin: Excluir ativação ────────────────────────────────────────────────
    if (url.includes('/api/admin/activation/delete/') && method === 'DELETE') {
      if (!isAdmin) return res.status(401).json({ message: 'Senha incorreta' });
      const code = String(url.split('/').pop());
      if (!code) return res.status(400).json({ error: 'Código é obrigatório' });
      await fsDelete('activations', code.toUpperCase());
      return res.json({ success: true });
    }

    // ── Trial por e-mail (modal hero) ─────────────────────────────────────────
    if (url.includes('/api/license/trial') && !url.includes('/trial-hwid') && method === 'POST') {
      const { email, name } = req.body;
      if (!email) return res.status(400).json({ message: 'E-mail é obrigatório' });

      const allActivations = await fsList('activations');
      const hasTrial = allActivations.some((a: any) => a.email === email && a.plano === 'Trial');
      if (hasTrial) return res.status(400).json({ message: 'Você já solicitou um período de teste para este e-mail.' });

      const code = `R3D-TRIAL-${randomBytes(4).toString('hex').toUpperCase()}`;
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);

      await fsCreate('activations', code, {
        code,
        email,
        name: name || 'Usuário Trial',
        plano: 'Trial',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        expiresAt: expirationDate.toISOString(),
      });

      const emailHtml = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#C67D3D">Seu período de teste começou! 🚀</h2>
        <p>Olá, aqui está seu código de ativação TRIAL (7 dias) para o R3D Print Manager Pro:</p>
        <div style="background:#1a1a1a;color:white;padding:20px;border-radius:12px;text-align:center;margin:20px 0">
          <h1 style="color:#C67D3D;font-size:32px;margin:10px 0">${code}</h1>
        </div>
        <p><strong>Importante:</strong></p>
        <ul>
          <li>Esta licença é válida por 7 dias após a ativação.</li>
          <li>Após o prazo, o sistema será bloqueado até a aquisição de um plano.</li>
          <li>A licença fica vinculada ao seu Hardware ID (HWID).</li>
        </ul>
        <p>Aproveite ao máximo!</p>
      </div>`;

      await sendEmail(email, 'Seu código TRIAL - R3D Print Manager Pro', emailHtml);

      return res.json({ success: true, message: 'Código enviado para seu e-mail!' });
    }

    // ── Admin: Backup Total ────────────────────────────────────────────────────
    if (url.includes('/api/admin/backup') && method === 'GET') {
      if (!isAdmin) return res.status(401).json({ message: 'Senha incorreta' });
      try {
        const activations = await fsList('activations');
        const licenses = await fsList('licenses');
        const cupons = await fsList('cupons');
        const payments = await fsList('payments');
        const trialsHwid = await fsList('trials_hwid');
        const trialsEmail = await fsList('trials_email');
        return res.json({
          timestamp: new Date().toISOString(),
          activations,
          licenses,
          cupons,
          payments,
          trialsHwid,
          trialsEmail
        });
      } catch (e: any) { 
        return res.status(500).json({ message: 'Erro ao gerar backup' }); 
      }
    }

    // ── Download ───────────────────────────────────────────────────────────────
    if (url.includes('/api/download')) {
      return res.redirect(302, 'https://github.com/rovateduino/R3D-PRINT-MANAGER-PRO/releases/download/v2.5.0/Setup_R3D_PrintManager_Pro.exe');
    }

    console.warn(`[API] 404 Not Found: ${method} ${url}`);
    return res.status(404).json({ message: 'Not found', path: url });
    
  } catch (error: any) {
    console.error(`[API] Global Error:`, error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
