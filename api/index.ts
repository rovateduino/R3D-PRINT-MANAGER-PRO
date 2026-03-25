import { createCipheriv, createHash, randomBytes } from 'crypto';
import axios from 'axios';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ============================================================
// CONFIGURAÇÃO DO DATABASE ID (IMPORTANTE!)
// ============================================================
// Seu Database ID do Firebase - pego do firebase-applet-config.json
const FIREBASE_DATABASE_ID = 'ai-studio-ee7c5fd5-11f5-4e50-a979-3316fea33a21';

// ============================================================
// INICIALIZAÇÃO DO FIREBASE ADMIN SDK (CORRIGIDA)
// ============================================================

let db: FirebaseFirestore.Firestore;

try {
  // Carrega a conta de serviço do ambiente
  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (!saJson) {
    console.error('ERRO: FIREBASE_SERVICE_ACCOUNT não configurada no ambiente');
    console.error('Por favor, configure esta variável no painel da Vercel');
    throw new Error('FIREBASE_SERVICE_ACCOUNT não configurada');
  }
  
  const serviceAccount: ServiceAccount = JSON.parse(saJson);
  
  if (!getApps().length) {
    console.log('Inicializando Firebase Admin SDK...');
    console.log('Project ID:', serviceAccount.projectId);
    console.log('Database ID:', FIREBASE_DATABASE_ID);
    
    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId,
    });
    
    console.log('Firebase Admin SDK inicializado com sucesso');
  }
  
  // IMPORTANTE: Usar o Database ID específico
  db = getFirestore().settings({
    databaseId: FIREBASE_DATABASE_ID
  }) as any;
  
  // Teste de conexão
  console.log('Firestore conectado com Database ID:', FIREBASE_DATABASE_ID);
  
  // Teste rápido para verificar se consegue ler
  const testDoc = await db.collection('_health_check').doc('test').get();
  console.log('Teste de leitura Firestore:', testDoc.exists ? 'sucesso' : 'coleção vazia');
  
} catch (error: any) {
  console.error('Erro fatal ao inicializar Firebase:', error.message);
  console.error('Stack:', error.stack);
  
  // Em desenvolvimento, podemos criar um fallback, mas em produção isso falha
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️ Modo desenvolvimento: usando fallback');
    if (!getApps().length) {
      initializeApp({
        projectId: 'gen-lang-client-0364203262',
      });
    }
    db = getFirestore();
  } else {
    throw error;
  }
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

    // ── Health Check (CORRIGIDO) ──────────────────────────────────────────────
    if (url === '/api/health' || url === '/api/health/') {
      try {
        // Testa conexão com Firestore usando o Database ID correto
        const testRef = db.collection('_health_check').doc('test');
        await testRef.set({ 
          timestamp: new Date().toISOString(),
          message: 'R3D Pro API is alive'
        });
        
        // Tenta listar algumas coleções para verificar permissões
        const collections = await db.listCollections();
        const collectionNames: string[] = [];
        for (const col of collections) {
          collectionNames.push(col.id);
        }
        
        return res.json({ 
          status: 'ok', 
          firebase: true,
          databaseId: FIREBASE_DATABASE_ID,
          projectId: process.env.FIREBASE_SERVICE_ACCOUNT ? 
            JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}').projectId : 
            'unknown',
          collections: collectionNames.slice(0, 10), // primeiras 10 coleções
          asaasEnv: process.env.ASAAS_ENV || 'sandbox',
          timestamp: new Date().toISOString()
        });
      } catch (e: any) {
        console.error('[Health] Erro detalhado:', e);
        return res.json({
          status: 'degraded',
          firebase: false,
          error: e.message,
          code: e.code,
          databaseId: FIREBASE_DATABASE_ID,
          timestamp: new Date().toISOString()
        });
      }
    }

    // ── Validar cupom ─────────────────────────────────────────────────────────
    if (url.includes('/api/cupom/validar') && method === 'GET') {
      const codigo = req.query?.codigo || url.split('codigo=')[1]?.split('&')[0];
      if (!codigo) return res.status(400).json({ message: 'Código ausente' });
      
      const couponDoc = await db.collection('cupons').doc(String(codigo).toUpperCase()).get();
      if (!couponDoc.exists) return res.status(404).json({ message: 'Cupom inválido ou inativo' });
      
      const coupon = couponDoc.data();
      if (!coupon?.ativo) return res.status(404).json({ message: 'Cupom inválido ou inativo' });
      if (coupon.limite_usos && coupon.usos >= coupon.limite_usos) {
        return res.status(400).json({ message: 'Limite de usos atingido' });
      }
      if (coupon.validade && new Date(coupon.validade) < new Date()) {
        return res.status(400).json({ message: 'Cupom expirado' });
      }
      return res.json({ id: couponDoc.id, ...coupon });
    }

    // ── Admin: Listar cupons ───────────────────────────────────────────────────
    if (url.includes('/api/admin/cupons') && method === 'GET') {
      if (!isAdmin) return res.status(401).json({ message: 'Senha incorreta' });
      const snapshot = await db.collection('cupons').get();
      const cupons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json(cupons);
    }

    // ── Admin: Criar cupom ─────────────────────────────────────────────────────
    if (url.includes('/api/admin/cupom/criar') && method === 'POST') {
      if (!isAdmin) return res.status(401).json({ message: 'Senha incorreta' });
      try {
        const data = req.body;
        const codigo = String(data.codigo).toUpperCase().trim();
        
        await db.collection('cupons').doc(codigo).set({
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
        await db.collection('cupons').doc(id).update(req.body);
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
      await db.collection('cupons').doc(id).delete();
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
          await db.collection('payments').doc(payment.id).set({
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
          }, { merge: true });

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
              await db.collection('users').doc(customerEmail).set({
                email: customerEmail,
                isPro: true,
                subscriptionId: payment.installment || payment.id,
                plano: planName,
                updatedAt: new Date().toISOString(),
              }, { merge: true });

              const actByPaySnap = await db.collection('activations_by_payment').doc(payment.id).get();
              let generatedCode = null;

              if (actByPaySnap.exists) {
                generatedCode = actByPaySnap.data()?.code;
              } else {
                const code = `R3D-ACT-${randomBytes(6).toString('hex').toUpperCase().match(/.{1,4}/g)?.join('-')}`;
                generatedCode = code;
                const expirationDate = new Date();
                expirationDate.setDate(expirationDate.getDate() + 7);

                const activationData = {
                  code,
                  paymentId: payment.id,
                  email: customerEmail,
                  name: customerName,
                  plano: planName || 'PRO',
                  status: 'PENDING',
                  createdAt: new Date().toISOString(),
                  expiresAt: expirationDate.toISOString(),
                };

                await db.collection('activations').doc(code).set(activationData);
                await db.collection('activations_by_payment').doc(payment.id).set({ code });
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
              const couponSnap = await db.collection('cupons').doc(couponCode.toUpperCase()).get();

              if (couponSnap.exists) {
                const coupon = couponSnap.data()!;
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

                  await db.collection('cupons').doc(coupon.codigo || couponCode.toUpperCase()).set({
                    ...coupon,
                    usos: novosUsos,
                    vendas: updatedVendas,
                  }, { merge: true });

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
      const userDoc = await db.collection('users').doc(email).get();
      return res.json(userDoc.exists ? userDoc.data() : { isPro: false });
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
      const trialHistory = await db.collection('trials_hwid').doc(hwid).get();
      if (trialHistory.exists) {
        return res.status(400).json({
          message: 'Este computador já utilizou o período de teste gratuito. Adquira um plano para continuar.'
        });
      }

      if (email) {
        const emailHistory = await db.collection('trials_email').doc(email.toLowerCase()).get();
        if (emailHistory.exists) {
          return res.status(400).json({
            message: 'Este e-mail já utilizou o período de teste gratuito.'
          });
        }
      }

      // Verifica se já tem licença ativa
      const existingLicense = await db.collection('licenses').doc(hwid).get();
      if (existingLicense.exists) {
        const lic = existingLicense.data();
        if (lic?.plano === 'Trial') {
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
      await db.collection('licenses').doc(hwid).set({
        hwid,
        plano: 'Trial',
        licenseKey,
        email: email || '',
        activatedAt: new Date().toISOString(),
        expiration: expiration.toISOString()
      });

      // Salva histórico permanente
      await db.collection('trials_hwid').doc(hwid).set({
        hwid,
        email: email || '',
        usedAt: new Date().toISOString(),
        expiration: expiration.toISOString()
      });

      if (email) {
        await db.collection('trials_email').doc(email.toLowerCase()).set({
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

      const activationDoc = await db.collection('activations').doc(String(finalCode).toUpperCase()).get();
      if (!activationDoc.exists) {
        return res.status(404).json({ message: 'Código de ativação não encontrado' });
      }
      
      const activation = activationDoc.data();
      if (activation?.status === 'USED') {
        return res.status(400).json({ message: 'Este código já foi utilizado' });
      }
      if (activation?.expiresAt && new Date(activation.expiresAt) < new Date()) {
        return res.status(400).json({ message: 'Este código expirou' });
      }

      const now = new Date();
      let expiration: string | null = null;
      const plano = activation?.plano || 'Mensal';

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

      await db.collection('activations').doc(String(finalCode).toUpperCase()).update({
        status: 'USED',
        hwid,
        licenseKey,
        activatedAt: new Date().toISOString()
      });

      await db.collection('licenses').doc(hwid).set({
        hwid,
        plano,
        licenseKey,
        email: activation?.email,
        activatedAt: new Date().toISOString(),
        expiration
      });

      await db.collection('logs_activation').doc(`${new Date().getTime()}_${hwid}`).set({
        event: 'ACTIVATION_SUCCESS',
        code: finalCode,
        hwid,
        email: activation?.email,
        timestamp: new Date().toISOString()
      });

      return res.json({
        success: true,
        licenseKey,
        plano: activation?.plano,
        expiration
      });
    }

    // ── Validar Licença ───────────────────────────────────────────────────────
    if (url.includes('/api/license/validate') && method === 'GET') {
      const hwid = req.query?.hwid || url.split('hwid=')[1]?.split('&')[0];
      if (!hwid) return res.status(400).json({ message: 'HWID ausente' });

      const licenseDoc = await db.collection('licenses').doc(hwid).get();
      if (!licenseDoc.exists) {
        return res.status(404).json({ message: 'Licença não encontrada para este HWID', valid: false });
      }

      const license = licenseDoc.data();
      const now = new Date();
      const isExpired = license?.expiration && new Date(license.expiration) < now;

      if (isExpired) {
        return res.json({
          valid: false,
          message: 'Sua licença expirou. Por favor, renove seu plano.',
          plano: license?.plano,
          expiration: license?.expiration,
          diasRestantes: 0
        });
      }

      let diasRestantes = 9999;
      if (license?.expiration) {
        const diffTime = new Date(license.expiration).getTime() - now.getTime();
        diasRestantes = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      }

      return res.json({
        valid: true,
        plano: license?.plano,
        expiration: license?.expiration || null,
        diasRestantes
      });
    }

    // ── Recuperar Códigos ─────────────────────────────────────────────────────
    if (url.includes('/api/license/recover') && method === 'GET') {
      const email = req.query?.email || url.split('email=')[1]?.split('&')[0];
      if (!email) return res.status(400).json({ message: 'E-mail é obrigatório' });

      const snapshot = await db.collection('activations')
        .where('email', '==', decodeURIComponent(email).toLowerCase())
        .get();
      
      const userActivations = snapshot.docs.map(doc => ({
        code: doc.id,
        ...doc.data()
      }));

      if (userActivations.length === 0) {
        return res.status(404).json({ message: 'Nenhuma ativação encontrada para este e-mail' });
      }

      return res.json(userActivations.map((a: any) => ({
        code: a.code,
        status: a.status,
        createdAt: a.createdAt,
        plano: a.plano
      })));
    }

    // ── Admin: Listar ativações ────────────────────────────────────────────────
    if (url.includes('/api/admin/activations') && method === 'GET') {
      if (!isAdmin) return res.status(401).json({ message: 'Senha incorreta' });
      const snapshot = await db.collection('activations').get();
      const activations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json(activations);
    }

    // ── Admin: Resetar ativação ────────────────────────────────────────────────
    if (url.includes('/api/admin/activation/reset/') && method === 'POST') {
      if (!isAdmin) return res.status(401).json({ message: 'Senha incorreta' });
      const code = String(url.split('/reset/')[1]?.split('?')[0]);
      if (!code) return res.status(400).json({ message: 'Código é obrigatório' });
      
      const activationDoc = await db.collection('activations').doc(code.toUpperCase()).get();
      if (!activationDoc.exists) {
        return res.status(404).json({ message: 'Ativação não encontrada' });
      }
      
      await db.collection('activations').doc(code.toUpperCase()).update({
        status: 'AVAILABLE',
        usedAt: null,
        hwid: null
      });
      
      return res.json({ message: 'Ativação resetada com sucesso' });
    }

    // ── Admin: Listar licenças ─────────────────────────────────────────────────
    if (url.includes('/api/admin/licenses') && method === 'GET') {
      if (!isAdmin) return res.status(401).json({ message: 'Senha incorreta' });
      const snapshot = await db.collection('licenses').get();
      const licenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json(licenses);
    }

    // ── Admin: Excluir licença ─────────────────────────────────────────────────
    if (url.includes('/api/admin/license/delete/') && method === 'DELETE') {
      if (!isAdmin) return res.status(401).json({ message: 'Senha incorreta' });
      const hwid = String(url.split('/').pop());
      await db.collection('licenses').doc(hwid).delete();
      return res.json({ success: true });
    }

    // ── Admin: Excluir ativação ────────────────────────────────────────────────
    if (url.includes('/api/admin/activation/delete/') && method === 'DELETE') {
      if (!isAdmin) return res.status(401).json({ message: 'Senha incorreta' });
      const code = String(url.split('/').pop());
      if (!code) return res.status(400).json({ error: 'Código é obrigatório' });
      await db.collection('activations').doc(code.toUpperCase()).delete();
      return res.json({ success: true });
    }

    // ── Trial por e-mail (modal hero) ─────────────────────────────────────────
    if (url.includes('/api/license/trial') && !url.includes('/trial-hwid') && method === 'POST') {
      const { email, name } = req.body;
      if (!email) return res.status(400).json({ message: 'E-mail é obrigatório' });

      const snapshot = await db.collection('activations')
        .where('email', '==', email)
        .where('plano', '==', 'Trial')
        .get();
      
      if (!snapshot.empty) {
        return res.status(400).json({ message: 'Você já solicitou um período de teste para este e-mail.' });
      }

      const code = `R3D-TRIAL-${randomBytes(4).toString('hex').toUpperCase()}`;
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);

      await db.collection('activations').doc(code).set({
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
      
      const collections = ['activations', 'licenses', 'cupons', 'payments', 'trials_hwid', 'trials_email'];
      const backup: any = { timestamp: new Date().toISOString() };
      
      for (const col of collections) {
        const snapshot = await db.collection(col).get();
        backup[col] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      
      return res.json(backup);
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
