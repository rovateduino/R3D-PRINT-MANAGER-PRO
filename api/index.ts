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

// ============================================================
// ADMIN - ROTAS DE CUPONS (ORDEM CORRETA)
// ============================================================

// 1. PRIMEIRO: Excluir cupom específico (DELETE /api/admin/cupom/:id)
if (url.match(/^\/api\/admin\/cupom\/[^\/]+$/) && method === 'DELETE') {
  if (!isAdmin) return res.status(401).json({ message: 'Não autorizado' });
  const id = url.split('/').pop();
  if (!id) return res.status(400).json({ error: 'ID ausente' });
  
  try {
    const token = await getToken();
    const deleteUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIREBASE_DATABASE_ID}/documents/cupons/${id}`;
    await axios.delete(deleteUrl, { headers: { Authorization: `Bearer ${token}` } });
    return res.json({ success: true, message: 'Cupom excluído com sucesso' });
  } catch (e: any) {
    return res.status(500).json({ error: e.response?.data?.error?.message || e.message });
  }
}

// 2. SEGUNDO: Listar todos os cupons (GET /api/admin/cupons)
if (url === '/api/admin/cupons' && method === 'GET') {
  if (!isAdmin) return res.status(401).json({ message: 'Não autorizado' });
  try {
    const cupons = await firestoreList('cupons');
    return res.json(cupons);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}

// 3. TERCEIRO: Criar cupom (POST /api/admin/cupom/criar)
if (url === '/api/admin/cupom/criar' && method === 'POST') {
  // ... seu código existente
}

// 4. QUARTO: Atualizar cupom (PUT /api/admin/cupom/:id)
if (url.match(/^\/api\/admin\/cupom\/[^\/]+$/) && method === 'PUT') {
  // ... seu código existente
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

   // ── Asaas: Webhook ─────────────────────────────────────────────────────────
if (url.includes('/api/asaas/webhook') && method === 'POST') {
  const event = Array.isArray(req.body) ? req.body[0] : req.body;
  const payment = event?.payment;
  
  const webhookToken = req.headers['asaas-access-token'];
  const isSimulated = webhookToken === 'SIMULATED_TOKEN';
  const configuredToken = process.env.ASAAS_WEBHOOK_TOKEN;

  console.log('[Webhook] Evento:', event?.event, 'Pagamento:', payment?.id, 'Simulado:', isSimulated);

  if (configuredToken && !isSimulated && webhookToken !== configuredToken) {
    console.warn('[Webhook] Token inválido');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!payment) {
    console.warn('[Webhook] Pagamento ausente');
    return res.status(400).json({ message: 'Missing payment' });
  }

  // Resposta rápida para o Asaas
  res.status(200).send('OK');

  // Processamento assíncrono
  (async () => {
    try {
      // Salva o pagamento
      await firestoreRequest('PATCH', `payments/${payment.id}`, {
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

      // Processa apenas pagamentos confirmados
      if (event.event === 'PAYMENT_CONFIRMED' || event.event === 'PAYMENT_RECEIVED') {
        const extRef = payment.externalReference || '';
        const parts = extRef.split(':');
        const hasCoupon = parts[0] === 'COUPON';
        const couponCode = hasCoupon ? parts[1] : '';
        const planName = hasCoupon
          ? parts.slice(2, parts.length - 1).join(' ')
          : parts.slice(1, parts.length - 1).join(' ');

        const isFirstInstallment = (payment.installmentNumber || 1) === 1;

        // Busca dados do cliente
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

        // Gera código de ativação APENAS no primeiro pagamento
        if (customerEmail && isFirstInstallment) {
          // Verifica se já existe código para este pagamento
          let existingCode = null;
          try {
            const existing = await firestoreRequest('GET', `activations_by_payment/${payment.id}`);
            existingCode = existing?.code;
          } catch (e) { /* não existe ainda */ }

          let activationCode = existingCode;

          if (!activationCode) {
            // Gera código único
            const randomPart = randomBytes(6).toString('hex').toUpperCase();
            const formattedRandom = randomPart.match(/.{1,4}/g)?.join('-') || randomPart;
            activationCode = `R3D-ACT-${formattedRandom}`;
            
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 7);

            // Salva ativação
            await firestoreRequest('PATCH', `activations/${activationCode}`, {
              code: activationCode,
              paymentId: payment.id,
              email: customerEmail,
              name: customerName,
              plano: planName || 'Mensal',
              status: 'PENDING',
              createdAt: new Date().toISOString(),
              expiresAt: expirationDate.toISOString(),
            });
            
            // Marca que este pagamento já gerou código
            await firestoreRequest('PATCH', `activations_by_payment/${payment.id}`, {
              code: activationCode,
              paymentId: payment.id,
            });
            
            console.log(`[Webhook] Código gerado: ${activationCode} para ${customerEmail}`);
          }

          // Atualiza usuário como PRO
          await firestoreRequest('PATCH', `users/${customerEmail}`, {
            email: customerEmail,
            isPro: true,
            subscriptionId: payment.installment || payment.id,
            plano: planName,
            updatedAt: new Date().toISOString(),
          });

          // ENVIA E-MAIL COM O CÓDIGO (com log para debug)
          const emailHtml = `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
              <h2 style="color:#C67D3D">Parabéns pela sua compra! 🎉</h2>
              <p>Olá ${customerName}, seu pagamento foi confirmado.</p>
              <p>Aqui está seu código de ativação para o R3D Print Manager Pro:</p>
              <div style="background:#1a1a1a;color:white;padding:20px;border-radius:12px;text-align:center;margin:20px 0">
                <h1 style="color:#C67D3D;font-size:32px;margin:10px 0">${activationCode}</h1>
                <p style="margin:0;color:#ccc;font-size:12px">Expira em 7 dias</p>
              </div>
              <p><strong>Instruções:</strong></p>
              <ol>
                <li>Baixe o aplicativo: <a href="https://r3dprintmanagerpro.com.br/api/download">Clique aqui para baixar</a></li>
                <li>Abra o aplicativo e copie o Hardware ID (HWID)</li>
                <li>Cole o HWID e este código no site para ativar</li>
              </ol>
              <p style="color:#ff4444"><strong>Atenção:</strong> Este código expira em 7 dias se não for utilizado.</p>
              <p>Dúvidas? Responda este e-mail.</p>
            </div>`;

          const emailSent = await sendEmail(customerEmail, 'Seu código de ativação R3D Print Manager Pro', emailHtml);
          console.log(`[Webhook] E-mail enviado para ${customerEmail}: ${emailSent ? 'sucesso' : 'falhou'}`);
        }

        // Processa cupom de afiliado
        if (couponCode && isFirstInstallment) {
          try {
            const coupon = await firestoreRequest('GET', `cupons/${couponCode.toUpperCase()}`);
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

                await firestoreRequest('PATCH', `cupons/${couponCode.toUpperCase()}`, {
                  ...coupon,
                  usos: novosUsos,
                  vendas: updatedVendas,
                });

                if (coupon.afiliado_email) {
                  await sendEmail(
                    coupon.afiliado_email,
                    `🎉 Nova venda com seu cupom ${coupon.codigo}!`,
                    `<h3>Nova venda!</h3><p>Plano: ${planName}<br>Valor: R$ ${payment.value}<br>Cliente: ${customerEmail}</p>`
                  );
                }
              }
            }
          } catch (e) {
            console.error('Erro ao processar cupom:', e);
          }
        }
      }
    } catch (e: any) {
      console.error('[Webhook] Erro no processamento:', e);
    }
  })();
  
  return;
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


// ── Trial por e-mail (modal hero) ─────────────────────────────────────────
if (url === '/api/license/trial' && method === 'POST') {
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ message: 'E-mail é obrigatório' });

  try {
    // Verifica se já existe trial para este email
    const existingActivations = await firestoreList('activations');
    const hasTrial = existingActivations.some((a: any) => 
      a.email === email && a.plano === 'Trial'
    );
    
    if (hasTrial) {
      return res.status(400).json({ message: 'Você já solicitou um período de teste para este e-mail.' });
    }

    // Gera código de trial
    const code = `R3D-TRIAL-${randomBytes(4).toString('hex').toUpperCase()}`;
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);

    // Salva no Firestore
    await firestoreRequest('PATCH', `activations/${code}`, {
      code,
      email,
      name: name || 'Usuário Trial',
      plano: 'Trial',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      expiresAt: expirationDate.toISOString(),
    });

    // Envia e-mail com o código
    const emailHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#C67D3D">Seu período de teste começou! 🚀</h2>
        <p>Olá ${name || 'usuário'}! Aqui está seu código de ativação TRIAL (7 dias):</p>
        <div style="background:#1a1a1a;color:white;padding:20px;border-radius:12px;text-align:center;margin:20px 0">
          <h1 style="color:#C67D3D;font-size:32px;margin:10px 0">${code}</h1>
        </div>
        <p><strong>Instruções:</strong></p>
        <ul>
          <li>Baixe o aplicativo em: <a href="https://r3dprintmanagerpro.com.br/api/download">Clique aqui</a></li>
          <li>Abra o aplicativo e insira o código acima quando solicitado</li>
          <li>O sistema irá gerar sua licença trial vinculada ao seu computador</li>
        </ul>
        <p style="color:#ff4444"><strong>Atenção:</strong> Este código expira em 7 dias.</p>
        <p>Dúvidas? Responda este e-mail.</p>
      </div>`;

    await sendEmail(email, 'Seu código TRIAL - R3D Print Manager Pro', emailHtml);

    return res.json({ success: true, message: 'Código enviado para seu e-mail!' });
    
  } catch (e: any) {
    console.error('Erro no trial:', e);
    return res.status(500).json({ message: 'Erro ao processar solicitação', error: e.message });
  }
}

// ── Admin: Limpar dados de teste ──────────────────────────────────────────────
if (url === '/api/admin/clear-test-data' && method === 'DELETE') {
  if (!isAdmin) return res.status(401).json({ message: 'Não autorizado' });
  
  try {
    const collections = ['activations', 'payments', 'users', 'licenses', 'activations_by_payment'];
    const token = await getToken();
    const results: any = {};
    
    for (const col of collections) {
      try {
        const listUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIREBASE_DATABASE_ID}/documents/${col}`;
        const response = await axios.get(listUrl, { headers: { Authorization: `Bearer ${token}` } });
        
        const documents = response.data.documents || [];
        let deletedCount = 0;
        
        for (const doc of documents) {
          const docId = doc.name.split('/').pop();
          const deleteUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIREBASE_DATABASE_ID}/documents/${col}/${docId}`;
          await axios.delete(deleteUrl, { headers: { Authorization: `Bearer ${token}` } });
          deletedCount++;
        }
        
        results[col] = { deleted: deletedCount };
        console.log(`[Admin] Limpou ${deletedCount} documentos da coleção ${col}`);
        
      } catch (e: any) {
        if (e.response?.status === 404) {
          results[col] = { error: 'Coleção não existe', deleted: 0 };
        } else {
          results[col] = { error: e.message, deleted: 0 };
        }
      }
    }
    
    return res.json({ 
      success: true, 
      message: 'Dados de teste removidos com sucesso',
      results 
    });
    
  } catch (e: any) {
    console.error('Erro ao limpar dados:', e);
    return res.status(500).json({ error: e.message });
  }
}

// ── Download ──────────────────────────────────────────────────────────────
if (url === '/api/download') {
  return res.redirect(302, 'https://github.com/rovateduino/R3D-PRINT-MANAGER-PRO/releases/download/v2.5.0/Setup_R3D_PrintManager_Pro.exe');
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
