/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, BookOpen, FileText, Settings, TrendingUp, BarChart3,
  ShieldCheck, Download, CheckCircle2, ChevronDown, Menu, X, Clock,
  DollarSign, Database, Lock, Cpu, Star, Quote, CreditCard, User, Mail,
  MapPin, Phone, Calendar, Loader2, MessageCircle, Tag, Trash2, Edit,
  Plus, Power, PowerOff, ArrowLeft, QrCode, FileBarChart, Search,
  Copy, Zap, ExternalLink, RefreshCcw, DownloadCloud, History, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import logoR3D from './assets/logo_r3d.png';

// ─── Parcelamento ─────────────────────────────────────────────────────────────
const TAXA_JUROS_MENSAL = 0.0299;
function calcularParcelamento(valor: number, parcelas: number) {
  if (parcelas <= 6) return { valorParcela: valor / parcelas, totalComJuros: valor, temJuros: false };
  const r = TAXA_JUROS_MENSAL;
  const valorParcela = valor * (r * Math.pow(1 + r, parcelas)) / (Math.pow(1 + r, parcelas) - 1);
  return { valorParcela, totalComJuros: valorParcela * parcelas, temJuros: true };
}
const formatBRL = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = ({ onOpenGuide }: { onOpenGuide: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);
  const navLinks = [
    { name: 'Funcionalidades', href: '#features' },
    { name: 'Como Funciona', href: '#how-it-works' },
    { name: 'Guia de Uso', onClick: onOpenGuide },
    { name: 'Segurança', href: '#security' },
    { name: 'Preço', href: '#pricing' },
    { name: 'FAQ', href: '#faq' },
  ];
  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#0f0f0f]/95 backdrop-blur-md border-b border-white/5 py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 overflow-hidden">
            <img src={logoR3D} className="w-full h-full object-contain scale-110" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} alt="R3D Pro" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">R3D <span className="text-[#C67D3D]">Pro</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(link => link.onClick
            ? <button key={link.name} onClick={link.onClick} className="text-sm font-medium text-gray-400 hover:text-[#C67D3D] transition-colors">{link.name}</button>
            : <a key={link.name} href={link.href} className="text-sm font-medium text-gray-400 hover:text-[#C67D3D] transition-colors">{link.name}</a>
          )}
          <a href="/api/download" download className="bg-gradient-to-r from-[#C67D3D] to-[#EA580C] hover:brightness-110 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all">Download</a>
        </div>
        <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>{isOpen ? <X /> : <Menu />}</button>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden bg-[#1a1a1a] border-b border-white/10">
            <div className="flex flex-col p-6 gap-4">
              {navLinks.map(link => link.onClick
                ? <button key={link.name} onClick={() => { link.onClick!(); setIsOpen(false); }} className="text-left text-gray-400 hover:text-[#C67D3D] font-medium">{link.name}</button>
                : <a key={link.name} href={link.href} onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-[#C67D3D] font-medium">{link.name}</a>
              )}
              <a href="/api/download" download onClick={() => setIsOpen(false)} className="bg-gradient-to-r from-[#C67D3D] to-[#EA580C] text-white text-center py-3 rounded-xl font-bold">Baixar Agora</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <motion.div whileHover={{ y: -5 }} className="bg-[#1a1a1a] p-8 rounded-3xl border border-white/5 hover:border-[#C67D3D]/30 transition-all group">
    <div className="w-14 h-14 bg-[#C67D3D]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#C67D3D]/20 transition-colors"><Icon className="text-[#C67D3D] w-7 h-7" /></div>
    <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
    <p className="text-gray-400 leading-relaxed text-sm">{description}</p>
  </motion.div>
);

const Step = ({ number, title, description }: { number: string, title: string, description: string }) => (
  <div className="flex flex-col items-center text-center max-w-xs">
    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C67D3D] to-[#EA580C] flex items-center justify-center text-2xl font-black text-white mb-6 shadow-[0_0_30px_rgba(198,125,61,0.4)]">{number}</div>
    <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
    <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
  </div>
);

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/5">
      <button className="w-full py-6 flex justify-between items-center text-left group" onClick={() => setIsOpen(!isOpen)}>
        <span className="text-lg font-medium text-white group-hover:text-[#C67D3D] transition-colors">{question}</span>
        <ChevronDown className={`text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <p className="pb-6 text-gray-400 leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TestimonialCard = ({ name, role, content, rating }: { name: string, role: string, content: string, rating: number }) => (
  <motion.div whileHover={{ y: -5 }} className="bg-[#1a1a1a] p-8 rounded-3xl border border-white/5 hover:border-[#C67D3D]/30 transition-all flex flex-col">
    <div className="flex gap-1 mb-4">{[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < rating ? 'text-[#C67D3D] fill-[#C67D3D]' : 'text-gray-600'}`} />)}</div>
    <Quote className="text-[#C67D3D]/20 w-10 h-10 mb-4" />
    <p className="text-gray-300 italic mb-6 flex-grow leading-relaxed">"{content}"</p>
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C67D3D] to-[#8B4513] flex items-center justify-center font-bold text-white text-xs">{name.charAt(0)}</div>
      <div><h4 className="text-white font-bold text-sm">{name}</h4><p className="text-[#C67D3D] text-[10px] uppercase tracking-widest font-bold">{role}</p></div>
    </div>
  </motion.div>
);

// ─── Checkout Modal ───────────────────────────────────────────────────────────
type PaymentMethod = 'CREDIT_CARD' | 'PIX' | 'BOLETO';

const CheckoutModal = ({ onClose, plan }: { onClose: () => void, plan: { name: string, price: string } }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CREDIT_CARD');
  const [installments, setInstallments] = useState(1);
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState<any>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [userStatus, setUserStatus] = useState<{ isPro: boolean } | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [pixData, setPixData] = useState<{ qrCode: string, qrCodeImage: string } | null>(null);
  const [boletoUrl, setBoletoUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', cpfCnpj: '', phone: '', postalCode: '', addressNumber: '', cardNumber: '', cardHolder: '', cardExpiry: '', cardCcv: '' });
  const [realCode, setRealCode] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [pixExpired, setPixExpired] = useState(false);
  const [fetchingPix, setFetchingPix] = useState(false);
  const [checkingManual, setCheckingManual] = useState(false);
  const [pixTimeRemaining, setPixTimeRemaining] = useState<number | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Timer de expiração do PIX (5 minutos para Sandbox)
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (pixData && !success && !pixExpired) {
      if (pixTimeRemaining === null) setPixTimeRemaining(300); // 5 minutos (300s)
      
      timer = setInterval(() => {
        setPixTimeRemaining(prev => {
          if (prev === null) return 300;
          if (prev <= 1) {
            console.warn('[PIX Timer] Tempo esgotado. Marcando como expirado para renovação.');
            setPixExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setPixTimeRemaining(null);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [pixData, success, pixExpired]);

  // Renovação automática quando expira
  useEffect(() => {
    if (pixExpired && !success && pixData) {
      console.log('[PIX Debug] Renovando QR Code expirado automaticamente...');
      // Pequeno delay para UX
      const timeout = setTimeout(() => {
        if (isMounted.current) {
          // Dispara o handleSubmit novamente para gerar novo pagamento
          const form = document.getElementById('checkout-form') as HTMLFormElement;
          if (form) form.requestSubmit();
        }
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [pixExpired, success]);

  // Polling para verificar pagamento automaticamente
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (polling && formData.email && !success) {
      console.log(`[PIX Debug] Iniciando polling para ${formData.email}`);
      interval = setInterval(async () => {
        if (!isMounted.current) return;
        try {
          const res = await fetch(`/api/user/status/${formData.email}`);
          const data = await res.json();
          if (!isMounted.current) return;
          if (data.isPro) {
            console.log(`[PIX Debug] Pagamento confirmado via polling!`);
            setPolling(false);
            // Busca o código gerado
            const checkRes = await fetch(`/api/license/recover?email=${encodeURIComponent(formData.email)}`);
            const codes = await checkRes.json();
            if (!isMounted.current) return;
            if (Array.isArray(codes) && codes.length > 0) {
              setRealCode(codes[codes.length - 1].code);
              setSuccess(true);
            }
          } else {
            console.log(`[PIX Debug] Pagamento ainda pendente...`);
          }
        } catch (e) {
          console.error(`[PIX Debug] Erro no polling:`, e);
        }
      }, 5000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [polling, formData.email, success]);

  const checkPaymentStatus = async () => {
    if (!formData.email) return;
    setCheckingManual(true);
    console.log(`[PIX Debug] Verificação manual solicitada para ${formData.email}`);
    try {
      const res = await fetch(`/api/user/status/${formData.email}`);
      const data = await res.json();
      if (!isMounted.current) return;
      if (data.isPro) {
        console.log(`[PIX Debug] Pagamento confirmado manualmente!`);
        setPolling(false);
        const checkRes = await fetch(`/api/license/recover?email=${encodeURIComponent(formData.email)}`);
        const codes = await checkRes.json();
        if (!isMounted.current) return;
        if (Array.isArray(codes) && codes.length > 0) {
          setRealCode(codes[codes.length - 1].code);
          setSuccess(true);
        }
      } else {
        console.log(`[PIX Debug] Pagamento ainda não detectado na verificação manual.`);
        // Feedback visual rápido se não confirmado
        const btn = document.getElementById('manual-check-btn');
        if (btn) {
          const originalText = btn.innerText;
          btn.innerText = 'AINDA PENDENTE...';
          setTimeout(() => { if (isMounted.current && btn) btn.innerText = originalText; }, 2000);
        }
      }
    } catch (e) {
      console.error(`[PIX Debug] Erro na verificação manual:`, e);
    } finally {
      if (isMounted.current) setCheckingManual(false);
    }
  };

  const simulateWebhook = async () => {
    if (!formData.email) {
      setError('Preencha o e-mail antes de simular.');
      return;
    }
    setSimulating(true);
    try {
      const extRef = couponData ? `COUPON:${couponData.codigo}:${plan.name}:${Date.now()}` : `REF:${plan.name}:${Date.now()}`;
      const res = await fetch('/api/asaas/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'asaas-access-token': 'SIMULATED_TOKEN' },
        body: JSON.stringify({
          event: 'PAYMENT_CONFIRMED',
          payment: {
            id: `pay_sim_${Date.now()}`,
            customer: 'cus_simulated',
            value: getDiscountedPrice(),
            externalReference: extRef,
            status: 'CONFIRMED',
            customerEmail: formData.email,
            customerName: formData.name
          }
        })
      });
      
      if (res.ok) {
        // Aguarda processamento
        await new Promise(r => setTimeout(r, 2000));
        const checkRes = await fetch(`/api/license/recover?email=${encodeURIComponent(formData.email)}`);
        const codes = await checkRes.json();
        if (Array.isArray(codes) && codes.length > 0) {
          setRealCode(codes[codes.length - 1].code);
          setSuccess(true);
        } else {
          setSuccess(true);
        }
      } else {
        setError('Erro ao processar simulação no servidor.');
      }
    } catch (err) {
      setError('Erro de conexão ao simular webhook.');
    } finally {
      setSimulating(false);
    }
  };

  const simulateActivation = async () => {
    if (!formData.email) {
      setError('Preencha o e-mail antes de simular o pagamento.');
      setStep(1);
      return;
    }
    setSimulating(true);
    setError(null);
    try {
      const extRef = couponData
        ? `COUPON:${couponData.codigo}:${plan.name}:${Date.now()}`
        : `REF:${plan.name}:${Date.now()}`;

      const response = await fetch('/api/simulate-activation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-simulate-token': 'SIMULATED_TOKEN',
        },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          plano: plan.name,
          couponCode: couponData?.codigo,
          paymentId: extRef,
        }),
      });
      const data = await response.json();
      if (response.ok && data.code) {
        setSimulatedCode(data.code);
        setSuccess(true);
        setPixData(null);
        setBoletoUrl(null);
      } else {
        setError(data.message || 'Erro na simulação');
      }
    } catch (err) {
      setError('Erro de conexão na simulação');
    } finally {
      setSimulating(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => { setFormData({ ...formData, [e.target.name]: e.target.value }); if (error) setError(null); };
  const getBasePrice = () => parseFloat(plan.price.replace('R$ ', '').replace(/\./g, '').replace(',', '.'));
  const getDiscountedPrice = () => {
    const base = getBasePrice();
    if (!couponData) return base;
    return couponData.tipo === 'PERCENTUAL' ? base * (1 - couponData.valor / 100) : Math.max(0, base - couponData.valor);
  };
  const getParcelamento = () => calcularParcelamento(getDiscountedPrice(), installments);

  const validateCoupon = async () => {
    if (!couponCode) return;
    setValidatingCoupon(true); setCouponError(null); setCouponData(null);
    try {
      const res = await fetch(`/api/cupom/validar?codigo=${couponCode.toUpperCase()}`);
      const data = await res.json();
      if (res.ok) setCouponData(data); else setCouponError(data.message || 'Cupom inválido');
    } catch { setCouponError('Erro ao validar'); } finally { setValidatingCoupon(false); }
  };

  const checkStatus = async () => {
    if (!formData.email) return;
    setCheckingStatus(true);
    try { setUserStatus(await (await fetch(`/api/user/status/${formData.email}`)).json()); }
    catch {} finally { setCheckingStatus(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      const custRes = await fetch('/api/asaas/customer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email, cpfCnpj: formData.cpfCnpj, mobilePhone: formData.phone, postalCode: formData.postalCode, addressNumber: formData.addressNumber })
      });
      let customer: any;
      try { customer = await custRes.json(); } catch { throw new Error('Erro no servidor ao processar cliente.'); }
      if (!custRes.ok) throw new Error(customer.errors?.[0]?.description || customer.message || 'Erro ao criar cliente');

      const finalValue = getDiscountedPrice();
      const { valorParcela } = getParcelamento();
      const extRef = couponData ? `COUPON:${couponData.codigo}:${plan.name}:${Date.now()}` : `REF:${plan.name}:${Date.now()}`;

      // Define a data de vencimento (dueDate) para +7 dias para garantir validade no Sandbox
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      const payloadBase: any = {
        customer: customer.id, billingType: paymentMethod,
        dueDate: dueDate.toISOString().split('T')[0],
        description: `Assinatura R3D Pro - ${plan.name}${couponData ? ` (Cupom: ${couponData.codigo})` : ''}${installments > 1 ? ` - ${installments}x` : ''}`,
        externalReference: extRef,
        // Cancelamento automático após o vencimento (importante para PIX no Asaas)
        daysAfterDueDateToRegistrationCancellation: 7
      };

      if (paymentMethod === 'CREDIT_CARD') {
        const [expiryMonth, expiryYear] = formData.cardExpiry.split('/');
        payloadBase.creditCard = { holderName: formData.cardHolder, number: formData.cardNumber.replace(/\s/g, ''), expiryMonth, expiryYear: `20${expiryYear}`, ccv: formData.cardCcv };
        payloadBase.creditCardHolderInfo = { name: formData.name, email: formData.email, cpfCnpj: formData.cpfCnpj, postalCode: formData.postalCode, addressNumber: formData.addressNumber, phone: formData.phone };
        if (installments > 1) { payloadBase.installmentCount = installments; payloadBase.installmentValue = parseFloat(valorParcela.toFixed(2)); }
        else { payloadBase.value = parseFloat(finalValue.toFixed(2)); }
      } else {
        payloadBase.value = parseFloat(finalValue.toFixed(2));
      }

      const payRes = await fetch('/api/asaas/payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadBase) });
      let payment: any;
      try { payment = await payRes.json(); } catch { throw new Error('Erro no servidor ao processar pagamento.'); }
      if (!payRes.ok) throw new Error(payment.errors?.[0]?.description || payment.message || 'Erro no pagamento');

      console.log(`[PIX Debug] Pagamento criado: ${payment.id}, Billing: ${payment.billingType}`);

      if (paymentMethod === 'PIX') {
        const pixTx = payment.pixTransaction;
        if (pixTx?.qrCode?.payload) {
          console.log('[PIX Debug] QR Code recebido na resposta inicial');
          if (isMounted.current) {
            setPixData({ qrCode: pixTx.qrCode.payload, qrCodeImage: pixTx.qrCode.encodedImage || '' });
            setPolling(true);
          }
        } else if (payment.id) {
          if (isMounted.current) setFetchingPix(true);
          try {
            console.log(`[PIX Debug] Buscando QR Code para ID: ${payment.id} após delay...`);
            // Aguarda 1.5s para o Asaas processar a cobrança recém-criada
            await new Promise(r => setTimeout(r, 1500));
            
            if (!isMounted.current) return;
            const pixRes = await fetch(`/api/asaas/pix-qrcode?paymentId=${payment.id}`);
            if (pixRes.status === 410) {
              console.warn('[PIX Debug] QR Code expirado (410). Regenerando...');
              if (isMounted.current) {
                setPixExpired(true);
                setPolling(false);
                // Tenta regenerar automaticamente chamando handleSubmit novamente
                setTimeout(() => { if (isMounted.current) handleSubmit(e); }, 2000);
              }
              return;
            }
            const pixJson = await pixRes.json();
            if (!isMounted.current) return;
            if (pixJson?.payload) {
              console.log('[PIX Debug] QR Code obtido com sucesso via rota secundária');
              setPixData({ qrCode: pixJson.payload, qrCodeImage: pixJson.encodedImage || '' });
              setPolling(true);
            } else {
              console.error('[PIX Debug] Rota pix-qrcode retornou sucesso mas sem payload');
              setSuccess(true);
            }
          } catch (pixErr) {
            console.error('[PIX Debug] Erro ao buscar QR Code:', pixErr);
            if (isMounted.current) setSuccess(true);
          } finally {
            if (isMounted.current) setFetchingPix(false);
          }
        } else {
          console.warn('[PIX Debug] Pagamento criado sem ID e sem pixTransaction');
          if (isMounted.current) setSuccess(true);
        }
      } else if (paymentMethod === 'BOLETO') {
        if (payment.bankSlipUrl) {
          if (isMounted.current) {
            setBoletoUrl(payment.bankSlipUrl);
            setPolling(true);
          }
        }
        else if (isMounted.current) setSuccess(true);
      } else {
        if (isMounted.current) setSuccess(true);
      }
    } catch (err: any) {
      if (isMounted.current) {
        setError(err.message || 'Erro inesperado durante o checkout.');
      }
      console.error('[Checkout Error]', err);
    } finally { if (isMounted.current) setLoading(false); }
  };

  const ic = "w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-[#C67D3D] outline-none text-white placeholder-gray-600";
  const ici = "w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-[#C67D3D] outline-none text-white placeholder-gray-600";
  const lc = "text-[10px] uppercase font-bold text-gray-500 ml-2 block mb-1";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-[#1a1a1a] border border-white/10 w-full max-w-lg rounded-[2.5rem] p-8 relative z-10 overflow-y-auto max-h-[95vh]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#C67D3D]/10 blur-3xl rounded-full pointer-events-none" />

        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 overflow-hidden shrink-0">
              <img src={logoR3D} alt="Logo" className="w-full h-full object-contain" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Checkout Seguro</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-gray-400 text-xs">Plano: <span className="text-[#C67D3D] font-bold">{plan.name}</span></p>
                {import.meta.env.VITE_ASAAS_ENV !== 'production' && (
                  <div className="flex items-center gap-1">
                    <span className="bg-yellow-500/10 text-yellow-500 text-[9px] px-2 py-0.5 rounded-full font-bold border border-yellow-500/20">TESTE</span>
                    <button type="button" onClick={simulateActivation} disabled={simulating} className="bg-blue-500/10 text-blue-400 text-[9px] px-2 py-0.5 rounded-full font-bold border border-blue-500/20 flex items-center gap-1">
                      {simulating ? <Loader2 className="w-2 h-2 animate-spin" /> : null}SIM. ATIVAÇÃO DIRETA
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-2 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        {success && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-10 h-10 text-green-500" /></div>
            <h2 className="text-2xl font-black text-white mb-2">Pagamento Confirmado!</h2>
            <p className="text-gray-400 mb-6 text-sm">Sua assinatura foi processada com sucesso.</p>
            {(simulatedCode || realCode) && (
              <div className="bg-[#C67D3D]/10 border border-[#C67D3D]/20 rounded-2xl p-6 mb-6 text-center animate-in fade-in zoom-in duration-500">
                <p className="text-[10px] text-[#C67D3D] uppercase font-bold mb-2">Seu Código de Ativação {realCode ? '' : '(SIMULAÇÃO)'}</p>
                <h3 className="text-3xl font-black text-white font-mono tracking-wider mb-2">{realCode || simulatedCode}</h3>
                <p className="text-[10px] text-gray-500">Copie este código e use no Testador de Licença abaixo.</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText((realCode || simulatedCode) as string);
                    const btn = document.getElementById('copy-success-btn');
                    if (btn) btn.innerText = 'COPIADO!';
                    setTimeout(() => { if (btn) btn.innerText = 'COPIAR CÓDIGO'; }, 2000);
                  }}
                  id="copy-success-btn"
                  className="mt-3 text-[10px] text-[#C67D3D] font-bold hover:underline"
                >
                  COPIAR CÓDIGO
                </button>
              </div>
            )}
            <div className="space-y-3">
              <a href="https://api.whatsapp.com/send?phone=5511951161563&text=Ol%C3%A1+Acabei+de+assinar+um+plano%2C+como+proceder+agora%3F" target="_blank" rel="noopener noreferrer" className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-3 rounded-2xl font-black transition-all flex items-center justify-center gap-2"><MessageCircle className="w-5 h-5" />FALAR NO WHATSAPP</a>
              <button onClick={onClose} className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-2xl font-black transition-all">FECHAR</button>
            </div>
          </div>
        )}

        {pixData && !success && (
          <div className="text-center py-4">
            <QrCode className="w-10 h-10 text-[#C67D3D] mx-auto mb-3" />
            <h2 className="text-xl font-black text-white mb-1">Pague via PIX</h2>
            
            {pixExpired ? (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl mb-6">
                <div className="flex items-center gap-2 justify-center text-red-400 mb-2">
                  <Clock className="w-5 h-5 animate-pulse" />
                  <p className="text-sm font-bold">QR Code Expirado!</p>
                </div>
                <p className="text-gray-400 text-xs mb-4 italic">Gerando um novo pagamento automaticamente para você em segundos...</p>
                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mb-4">
                  <motion.div 
                    initial={{ width: "0%" }} 
                    animate={{ width: "100%" }} 
                    transition={{ duration: 3, ease: "linear" }}
                    className="bg-red-500 h-full" 
                  />
                </div>
                <button 
                  onClick={() => {
                    setPixData(null);
                    setPixExpired(false);
                    setStep(3); // Volta para a revisão/confirmação
                  }} 
                  className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold text-sm transition-all"
                >
                  TENTAR MANUALMENTE
                </button>
              </div>
            ) : fetchingPix ? (
              <div className="py-8 space-y-4">
                <Loader2 className="w-12 h-12 text-[#C67D3D] animate-spin mx-auto" />
                <p className="text-gray-400 text-sm animate-pulse italic">Gerando seu QR Code PIX seguro...</p>
              </div>
            ) : (
              <>
                <p className="text-gray-400 text-sm mb-4">Escaneie o QR Code ou copie o código abaixo</p>
                {pixData.qrCodeImage && (
                  <div className="bg-white p-4 rounded-2xl inline-block mb-4 relative">
                    <img src={`data:image/png;base64,${pixData.qrCodeImage}`} alt="QR Code PIX" className="w-48 h-48 mx-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    {pixTimeRemaining !== null && (
                      <div className={`absolute bottom-2 right-2 px-2 py-1 rounded-md text-[9px] font-bold ${pixTimeRemaining < 60 ? 'bg-red-500 text-white animate-pulse' : 'bg-black/80 text-[#C67D3D]'}`}>
                        EXPIRA EM {Math.floor(pixTimeRemaining / 60)}:{(pixTimeRemaining % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                  </div>
                )}
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4 text-left">
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Código PIX Copia e Cola</p>
                  <p className="text-xs text-gray-300 break-all font-mono">{pixData.qrCode}</p>
                </div>
                <div className="space-y-3">
                  <button onClick={() => { navigator.clipboard.writeText(pixData.qrCode); }} className="w-full bg-[#C67D3D] hover:bg-[#EA580C] text-white py-3 rounded-xl font-black transition-all text-sm flex items-center justify-center gap-2">
                    <Copy className="w-4 h-4" />COPIAR CÓDIGO PIX
                  </button>
                  <button 
                    id="manual-check-btn"
                    onClick={checkPaymentStatus} 
                    disabled={checkingManual}
                    className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border border-white/10"
                  >
                    {checkingManual ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                    JÁ PAGUEI? VERIFICAR STATUS
                  </button>
                  {import.meta.env.VITE_ASAAS_ENV !== 'production' && (
                    <button onClick={simulateWebhook} disabled={simulating} className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-3 rounded-xl font-black border border-blue-500/30 transition-all flex items-center justify-center gap-2 text-sm">
                      {simulating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}SIMULAR PAGAMENTO (TESTE)
                    </button>
                  )}
                </div>
                {pixTimeRemaining !== null && pixTimeRemaining < 60 && (
                  <div className="mt-4 p-2 bg-red-500/10 border border-red-500/20 rounded-xl animate-bounce">
                    <p className="text-[9px] text-red-400 font-bold text-center">
                      ⚠️ O tempo está acabando! Pague agora ou um novo QR Code será gerado.
                    </p>
                  </div>
                )}
                <div className="mt-4 p-3 bg-[#C67D3D]/5 border border-[#C67D3D]/10 rounded-xl">
                  <p className="text-[10px] text-[#C67D3D] font-bold uppercase mb-1 flex items-center gap-1 justify-center">
                    <Loader2 className="w-3 h-3 animate-spin" /> Aguardando Pagamento...
                  </p>
                  <p className="text-[9px] text-gray-500 text-center leading-tight">
                    O QR Code permanecerá na tela até a confirmação automática do banco.
                  </p>
                </div>
              </>
            )}
            <button onClick={onClose} className="w-full mt-4 bg-white/5 text-white py-3 rounded-xl font-bold text-sm">CANCELAR E FECHAR</button>
          </div>
        )}

        {boletoUrl && !success && (
          <div className="text-center py-4">
            <FileBarChart className="w-10 h-10 text-[#C67D3D] mx-auto mb-3" />
            <h2 className="text-xl font-black text-white mb-1">Boleto Gerado!</h2>
            <p className="text-gray-400 text-sm mb-6">Clique abaixo para abrir e pagar o boleto.</p>
            <div className="space-y-3">
              <a href={boletoUrl} target="_blank" rel="noopener noreferrer" className="w-full bg-[#C67D3D] hover:bg-[#EA580C] text-white py-3 rounded-xl font-black transition-all flex items-center justify-center gap-2 text-sm">
                <ExternalLink className="w-4 h-4" />ABRIR BOLETO
              </a>
              {import.meta.env.VITE_ASAAS_ENV !== 'production' && (
                <button onClick={simulateWebhook} disabled={simulating} className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-3 rounded-xl font-black border border-blue-500/30 transition-all flex items-center justify-center gap-2 text-sm">
                  {simulating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}SIMULAR PAGAMENTO (TESTE)
                </button>
              )}
            </div>
            <p className="text-[10px] text-gray-500 my-4">Vencimento em 1 dia útil. Acesso liberado após compensação.</p>
            <button onClick={onClose} className="w-full bg-white/5 text-white py-3 rounded-xl font-bold text-sm">FECHAR</button>
          </div>
        )}

        {!success && !pixData && !boletoUrl && (
          <>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs mb-4 flex items-center gap-2">
                <X className="w-4 h-4 shrink-0" /><span>{error}</span>
              </div>
            )}
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
              {step === 1 && (
                <div className="space-y-4">
                  <div><label className={lc}>Nome Completo</label><div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" /><input required name="name" value={formData.name} onChange={handleInput} className={ici} placeholder="Seu nome completo" /></div></div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className={lc}>E-mail</label>
                      {checkingStatus ? <span className="text-[10px] text-gray-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />checando...</span>
                        : userStatus?.isPro ? <span className="text-[10px] text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />PRO ATIVO</span>
                        : formData.email ? <span className="text-[10px] text-gray-500">FREE</span> : null}
                    </div>
                    <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" /><input required type="email" name="email" value={formData.email} onChange={handleInput} onBlur={checkStatus} className={ici} placeholder="email@exemplo.com" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={lc}>CPF / CNPJ</label><input required name="cpfCnpj" value={formData.cpfCnpj} onChange={handleInput} className={ic} placeholder="000.000.000-00" /></div>
                    <div><label className={lc}>Telefone</label><div className="relative"><Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" /><input required name="phone" value={formData.phone} onChange={handleInput} className={ici} placeholder="(00) 00000-0000" /></div></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={lc}>CEP</label><div className="relative"><MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" /><input required name="postalCode" value={formData.postalCode} onChange={handleInput} className={ici} placeholder="00000-000" /></div></div>
                    <div><label className={lc}>Número</label><input required name="addressNumber" value={formData.addressNumber} onChange={handleInput} className={ic} placeholder="123" /></div>
                  </div>
                  <div>
                    <label className={lc}>Cupom de Desconto (Opcional)</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1"><Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" /><input name="coupon" value={couponCode} onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(null); setCouponData(null); }} className={ici} placeholder="CÓDIGO" /></div>
                      <button type="button" onClick={validateCoupon} disabled={validatingCoupon || !couponCode} className="bg-white/5 hover:bg-white/10 text-white px-5 rounded-xl text-xs font-bold disabled:opacity-50">
                        {validatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "APLICAR"}
                      </button>
                    </div>
                    {couponError && <p className="text-red-400 text-[10px] ml-2 mt-1">{couponError}</p>}
                    {couponData && <p className="text-green-400 text-[10px] ml-2 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Cupom aplicado: {couponData.tipo === 'PERCENTUAL' ? `${couponData.valor}%` : `R$ ${formatBRL(couponData.valor)}`} de desconto!</p>}
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="flex justify-between text-sm mb-1"><span className="text-gray-400">Subtotal</span><span className="text-white">{plan.price}</span></div>
                    {couponData && <div className="flex justify-between text-sm mb-1 text-green-400"><span>Desconto ({couponData.codigo})</span><span>- R$ {formatBRL(getBasePrice() - getDiscountedPrice())}</span></div>}
                    <div className="flex justify-between font-black border-t border-white/10 pt-2 mt-2">
                      <span className="text-white">Total à vista</span>
                      <span className="text-[#C67D3D] text-lg">R$ {formatBRL(getDiscountedPrice())}</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => setStep(2)} className="w-full bg-[#C67D3D] hover:bg-[#EA580C] text-white py-4 rounded-2xl font-black transition-all">ESCOLHER FORMA DE PAGAMENTO →</button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Total</span>
                    <span className="text-[#C67D3D] font-black text-lg">R$ {formatBRL(getDiscountedPrice())}</span>
                  </div>
                  <p className="text-[10px] uppercase font-bold text-gray-500 ml-1">Escolha a forma de pagamento</p>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { method: 'CREDIT_CARD' as PaymentMethod, icon: CreditCard, label: 'Cartão de Crédito', sub: 'Até 12x' },
                      { method: 'PIX' as PaymentMethod, icon: QrCode, label: 'PIX', sub: 'Imediato' },
                      { method: 'BOLETO' as PaymentMethod, icon: FileBarChart, label: 'Boleto', sub: '1 dia útil' },
                    ]).map(({ method, icon: Icon, label, sub }) => (
                      <button key={method} type="button" onClick={() => setPaymentMethod(method)} className={`p-4 rounded-2xl border-2 transition-all text-left ${paymentMethod === method ? 'border-[#C67D3D] bg-[#C67D3D]/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                        <Icon className={`w-5 h-5 mb-2 ${paymentMethod === method ? 'text-[#C67D3D]' : 'text-gray-400'}`} />
                        <p className={`text-xs font-bold ${paymentMethod === method ? 'text-white' : 'text-gray-300'}`}>{label}</p>
                        <p className="text-[10px] text-gray-500">{sub}</p>
                      </button>
                    ))}
                  </div>
                  {paymentMethod === 'CREDIT_CARD' && (
                    <div className="bg-[#C67D3D]/5 border border-[#C67D3D]/20 p-3 rounded-xl text-xs text-gray-300">
                      <p className="font-bold text-[#C67D3D] mb-1">💳 Parcelamento:</p>
                      <p>• 1 a 6x <span className="text-green-400 font-bold">sem juros</span></p>
                      <p>• 7 a 12x <span className="text-yellow-400 font-bold">com juros</span> de 2,99% a.m.</p>
                    </div>
                  )}
                  {paymentMethod === 'PIX' && (
                    <div className="bg-green-500/5 border border-green-500/20 p-3 rounded-xl text-xs text-gray-300">
                      <p className="font-bold text-green-400 mb-1">⚡ PIX — Aprovação imediata</p>
                      <p>Você receberá um QR Code. Acesso liberado em segundos após o pagamento.</p>
                    </div>
                  )}
                  {paymentMethod === 'BOLETO' && (
                    <div className="bg-blue-500/5 border border-blue-500/20 p-3 rounded-xl text-xs text-gray-300">
                      <p className="font-bold text-blue-400 mb-1">📄 Boleto Bancário</p>
                      <p>Vencimento em 1 dia útil. Acesso liberado após compensação bancária.</p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(1)} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-2xl font-bold text-sm">← VOLTAR</button>
                    <button type="button" onClick={() => setStep(3)} className="flex-[2] bg-[#C67D3D] hover:bg-[#EA580C] text-white py-3 rounded-2xl font-black text-sm">CONTINUAR →</button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Plano {plan.name}</p>
                      <p className="text-xs text-gray-400">{paymentMethod === 'CREDIT_CARD' ? 'Cartão de Crédito' : paymentMethod === 'PIX' ? 'PIX' : 'Boleto'}</p>
                    </div>
                    <span className="text-[#C67D3D] font-black">R$ {formatBRL(getDiscountedPrice())}</span>
                  </div>

                  {paymentMethod === 'CREDIT_CARD' && (
                    <>
                      <div><label className={lc}>Número do Cartão</label><div className="relative"><CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" /><input required name="cardNumber" value={formData.cardNumber} onChange={handleInput} className={ici} placeholder="0000 0000 0000 0000" /></div></div>
                      <div><label className={lc}>Nome no Cartão</label><input required name="cardHolder" value={formData.cardHolder} onChange={handleInput} className={ic} placeholder="COMO ESTÁ NO CARTÃO" /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className={lc}>Validade</label><div className="relative"><Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" /><input required name="cardExpiry" value={formData.cardExpiry} onChange={handleInput} className={ici} placeholder="MM/AA" /></div></div>
                        <div><label className={lc}>CVV</label><input required name="cardCcv" value={formData.cardCcv} onChange={handleInput} className={ic} placeholder="123" /></div>
                      </div>
                      <div>
                        <label className={lc}>Parcelamento</label>
                        <select value={installments} onChange={e => setInstallments(parseInt(e.target.value))} className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-[#C67D3D] outline-none text-white">
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(n => {
                            const { valorParcela, totalComJuros, temJuros } = calcularParcelamento(getDiscountedPrice(), n);
                            const label = n === 1 ? `1x de R$ ${formatBRL(getDiscountedPrice())} — à vista`
                              : !temJuros ? `${n}x de R$ ${formatBRL(valorParcela)} — sem juros`
                              : `${n}x de R$ ${formatBRL(valorParcela)} — total R$ ${formatBRL(totalComJuros)} (juros 2,99% a.m.)`;
                            return <option key={n} value={n}>{label}</option>;
                          })}
                        </select>
                      </div>
                      <div className={`p-4 rounded-2xl border ${installments > 6 ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-[#C67D3D]/5 border-[#C67D3D]/20'}`}>
                        {installments === 1
                          ? <div className="flex justify-between items-center"><span className="text-gray-300 font-bold text-sm">Total à vista</span><span className="text-[#C67D3D] font-black text-xl">R$ {formatBRL(getDiscountedPrice())}</span></div>
                          : <>
                            <div className="flex justify-between items-center mb-1"><span className="text-gray-300 font-bold text-sm">{installments}x de</span><span className="text-[#C67D3D] font-black text-xl">R$ {formatBRL(getParcelamento().valorParcela)}</span></div>
                            {installments > 6 && <>
                              <div className="flex justify-between"><span className="text-gray-500 text-xs">Total com juros</span><span className="text-gray-400 text-xs font-bold">R$ {formatBRL(getParcelamento().totalComJuros)}</span></div>
                              <p className="text-[10px] text-yellow-400/80 mt-1">⚠️ Juros de 2,99% a.m. para 7-12x</p>
                            </>}
                            {installments <= 6 && <p className="text-[10px] text-green-400 mt-1">✅ Sem juros</p>}
                          </>}
                      </div>
                    </>
                  )}

                  {paymentMethod === 'PIX' && (
                    <div className="text-center py-4">
                      <QrCode className="w-16 h-16 text-[#C67D3D] mx-auto mb-3 opacity-50" />
                      <p className="text-gray-300 text-sm">Clique em "Gerar QR Code" para receber o código PIX.</p>
                      <p className="text-gray-500 text-xs mt-1">Total: <span className="text-[#C67D3D] font-bold">R$ {formatBRL(getDiscountedPrice())}</span></p>
                    </div>
                  )}

                  {paymentMethod === 'BOLETO' && (
                    <div className="text-center py-4">
                      <FileBarChart className="w-16 h-16 text-[#C67D3D] mx-auto mb-3 opacity-50" />
                      <p className="text-gray-300 text-sm">Clique em "Gerar Boleto" para receber o link.</p>
                      <p className="text-gray-500 text-xs mt-1">Total: <span className="text-[#C67D3D] font-bold">R$ {formatBRL(getDiscountedPrice())}</span> • Vence em 1 dia útil</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setStep(2)} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-2xl font-bold text-sm">← VOLTAR</button>
                    <button type="submit" disabled={loading} className="flex-[2] bg-gradient-to-r from-[#C67D3D] to-[#EA580C] text-white py-3 rounded-2xl font-black transition-all flex items-center justify-center gap-2 text-sm">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      {loading ? 'PROCESSANDO...' : paymentMethod === 'PIX' ? 'GERAR QR CODE' : paymentMethod === 'BOLETO' ? 'GERAR BOLETO' : installments > 1 ? `PAGAR ${installments}x R$ ${formatBRL(getParcelamento().valorParcela)}` : `PAGAR R$ ${formatBRL(getDiscountedPrice())}`}
                    </button>
                  </div>
                </div>
              )}
            </form>
            <div className="mt-4 flex flex-col items-center justify-center gap-3">
              <div className="flex items-center gap-3 opacity-30 grayscale">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" className="h-3" alt="Visa" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" className="h-5" alt="Mastercard" />
                <span className="text-gray-600 text-xs font-bold">PIX</span>
                <span className="text-gray-600 text-xs font-bold">BOLETO</span>
              </div>
              <p className="text-center text-[10px] text-gray-500 mt-2">
                Já realizou o pagamento? <button onClick={() => { onClose(); const el = document.getElementById('license-activation'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }} className="text-[#C67D3D] font-bold hover:underline">Recupere seu código aqui</button>
              </p>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

// ─── Trial Modal ──────────────────────────────────────────────────────────────
const TrialModal = ({ onClose }: { onClose: () => void }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/license/trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name })
      });
      const data = await res.json();
      if (res.ok) setSuccess(true);
      else alert(data.message || 'Erro ao solicitar trial');
    } catch { alert('Erro de conexão'); }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="relative w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C67D3D] to-[#EA580C]" />
        {!success ? (
          <>
            <h2 className="text-2xl font-black text-white mb-2">Testar 7 Dias Grátis</h2>
            <p className="text-gray-400 text-sm mb-6">Experimente todas as funções do R3D Pro sem compromisso. O código será enviado para seu e-mail.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Seu Nome</label>
                <input required value={name} onChange={e => setName(e.target.value)} type="text" placeholder="Como quer ser chamado?" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#C67D3D] outline-none transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Seu Melhor E-mail</label>
                <input required value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="exemplo@email.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#C67D3D] outline-none transition-all" />
              </div>
              <button disabled={loading} type="submit" className="w-full bg-[#C67D3D] hover:bg-[#EA580C] text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2">
                {loading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : 'SOLICITAR ACESSO GRÁTIS'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Código Enviado!</h2>
            <p className="text-gray-400 text-sm mb-8">Verifique sua caixa de entrada (e o spam). Seu período de 7 dias começa agora!</p>
            <button onClick={onClose} className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl transition-all">FECHAR</button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// ─── Guide Modal ──────────────────────────────────────────────────────────────
const GuideModal = ({ onClose }: { onClose: () => void }) => {
  const steps = [
    { title: "1. O que é o R3D Pro?", content: "Um software desktop de alta precisão para gestão de impressão 3D. Ele calcula custos reais, ROI e gerencia sua produção sem depender de internet constante." },
    { title: "2. Como Ativar sua Licença", content: "Após a compra ou solicitação de Trial, você receberá um código (Ex: R3D-ACT-XXXX). Abra o software no seu computador, copie o 'Hardware ID' exibido lá e cole no site junto com seu código para gerar sua Chave de Licença final." },
    { title: "3. Trava de Segurança (HWID)", content: "Cada licença é vinculada permanentemente ao seu computador (Hardware ID). Isso impede pirataria e garante que seus dados de custo e precificação fiquem seguros na sua máquina." },
    { title: "4. Período Trial (7 Dias)", content: "Oferecemos 7 dias para você testar todas as funções. Após esse prazo, o software será bloqueado. Para continuar usando, basta adquirir um plano e inserir o novo código de ativação." },
    { title: "5. Configuração Inicial", content: "Dentro do app, cadastre o valor do seu KWh e o custo dos seus filamentos. Sem isso, os cálculos de lucro não serão precisos." },
    { title: "6. Suporte e Travas", content: "Se formatar o PC ou trocar de máquina, entre em contato com o suporte para resetar seu HWID. Tentativas de uso simultâneo em várias máquinas podem bloquear a licença." }
  ];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-[#1a1a1a] border border-white/10 w-full max-w-2xl rounded-[2.5rem] p-8 relative z-10 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-8 shrink-0">
          <h2 className="text-2xl font-black text-white">Guia de Uso R3D Pro</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-2"><X className="w-6 h-6" /></button>
        </div>
        <div className="overflow-y-auto space-y-4">
          {steps.map((s, i) => <div key={i} className="bg-white/5 p-6 rounded-2xl border border-white/5"><h3 className="text-[#C67D3D] font-black text-lg mb-2">{s.title}</h3><p className="text-gray-400 text-sm leading-relaxed">{s.content}</p></div>)}
        </div>
        <div className="mt-6 shrink-0"><button onClick={onClose} className="w-full bg-gradient-to-r from-[#C67D3D] to-[#EA580C] text-white py-4 rounded-2xl font-black">ENTENDI, VAMOS COMEÇAR!</button></div>
      </motion.div>
    </motion.div>
  );
};

// ── Confirm Modal ────────────────────────────────────────────────────────────
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, loading }: { isOpen: boolean, title: string, message: string, onConfirm: () => void, onCancel: () => void, loading?: boolean }) => {
  if (!isOpen) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <div onClick={onCancel} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-[#1a1a1a] border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 relative z-10 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          {loading ? <Loader2 className="text-red-500 w-8 h-8 animate-spin" /> : <AlertTriangle className="text-red-500 w-8 h-8" />}
        </div>
        <h3 className="text-xl font-black text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm mb-8">{message}</p>
        <div className="flex gap-4">
          <button disabled={loading} onClick={onCancel} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-black transition-all disabled:opacity-50">CANCELAR</button>
          <button disabled={loading} onClick={onConfirm} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-black transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'PROCESSANDO...' : 'CONFIRMAR'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Admin Panel ──────────────────────────────────────────────────────────────
const AdminPanel = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'cupons' | 'activations' | 'licenses'>('cupons');
  const [cupons, setCupons] = useState<any[]>([]);
  const [activations, setActivations] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCupom, setEditingCupom] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedCupomId, setSelectedCupomId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ codigo: '', tipo: 'PERCENTUAL', valor: 0, afiliado_nome: '', afiliado_email: '', afiliado_telefone: '', limite_usos: 0, validade: '', ativo: true });

  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => Promise<void> } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const showConfirm = (title: string, message: string, onConfirm: () => Promise<void>) => {
    setConfirmConfig({ isOpen: true, title, message, onConfirm });
  };

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const headers = { 'x-admin-password': password };
      if (activeTab === 'cupons') {
        const res = await fetch('/api/admin/cupons', { headers });
        if (res.ok) { setCupons(await res.json()); setIsAuthenticated(true); }
        else {
          const data = await res.json().catch(() => ({}));
          setError(data.message || 'Senha incorreta ou erro ao carregar cupons');
        }
      } else if (activeTab === 'activations') {
        const res = await fetch('/api/admin/activations', { headers });
        if (res.ok) { setActivations(await res.json()); setIsAuthenticated(true); }
        else {
          const data = await res.json().catch(() => ({}));
          setError(data.message || 'Erro ao carregar ativações');
        }
      } else if (activeTab === 'licenses') {
        const res = await fetch('/api/admin/licenses', { headers });
        if (res.ok) { setLicenses(await res.json()); setIsAuthenticated(true); }
        else {
          const data = await res.json().catch(() => ({}));
          setError(data.message || 'Erro ao carregar licenças');
        }
      }
    } catch { setError('Erro de conexão com o servidor'); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [activeTab, isAuthenticated]);

  const handleBackup = async () => {
    try {
      const res = await fetch('/api/admin/backup', { headers: { 'x-admin-password': password } });
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_r3d_pro_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
      } else {
        alert('Erro ao gerar backup');
      }
    } catch { alert('Erro de conexão'); }
  };

  // ── Handlers com lógica limpa: apenas lançam exceção em erro ─────────────
  const handleDeleteActivation = (code: string) => {
    showConfirm(
      'Excluir Ativação',
      `Deseja excluir permanentemente o código ${code}? Esta ação não pode ser desfeita.`,
      async () => {
        const res = await fetch(`/api/admin/activation/delete/${code}`, {
          method: 'DELETE',
          headers: { 'x-admin-password': password }
        });
        if (!res.ok) throw new Error('Erro ao deletar ativação');
      }
    );
  };

  const handleResetActivation = (code: string) => {
    showConfirm(
      'Resetar HWID',
      `Deseja resetar o código ${code}? Isso permitirá que ele seja usado novamente em outro HWID.`,
      async () => {
        const res = await fetch(`/api/admin/activation/reset/${code}`, {
          method: 'POST',
          headers: { 'x-admin-password': password }
        });
        if (!res.ok) throw new Error('Erro ao resetar ativação');
      }
    );
  };

  const handleDeleteLicense = (hwid: string) => {
    showConfirm(
      'Remover Licença',
      `Deseja remover a licença do HWID ${hwid}? O cliente perderá o acesso PRO imediatamente.`,
      async () => {
        const res = await fetch(`/api/admin/license/delete/${hwid}`, {
          method: 'DELETE',
          headers: { 'x-admin-password': password }
        });
        if (!res.ok) throw new Error('Erro ao deletar licença');
      }
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const url = editingCupom ? `/api/admin/cupom/${editingCupom.id}` : '/api/admin/cupom/criar';
      const method = editingCupom ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'x-admin-password': password }, body: JSON.stringify(formData) });
      if (res.ok) { setShowForm(false); setEditingCupom(null); setFormData({ codigo: '', tipo: 'PERCENTUAL', valor: 0, afiliado_nome: '', afiliado_email: '', afiliado_telefone: '', limite_usos: 0, validade: '', ativo: true }); fetchData(); }
      else { const d = await res.json(); alert(d.message || 'Erro ao salvar'); }
    } catch { alert('Erro de conexão'); } finally { setLoading(false); }
  };

  const handleDeleteCupom = (id: string) => {
    showConfirm(
      'Excluir Cupom',
      'Tem certeza que deseja excluir este cupom permanentemente?',
      async () => {
        const res = await fetch(`/api/admin/cupom/${id}`, {
          method: 'DELETE',
          headers: { 'x-admin-password': password }
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.message || 'Erro ao excluir cupom');
        }
      }
    );
  };

  const toggleCupomStatus = async (cupom: any) => {
    try { await fetch(`/api/admin/cupom/${cupom.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-admin-password': password }, body: JSON.stringify({ ...cupom, ativo: !cupom.ativo }) }); fetchData(); }
    catch { alert('Erro'); }
  };

  const navigateHome = () => { window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); };
  const totalVendas = (c: any) => Array.isArray(c.vendas) ? c.vendas.reduce((a: number, v: any) => a + (Number(v.valor) || 0), 0) : 0;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-6">
        <div className="bg-[#1a1a1a] border border-white/10 p-8 rounded-[2.5rem] w-full max-w-md text-center">
          <Lock className="w-12 h-12 text-[#C67D3D] mx-auto mb-6" />
          <h2 className="text-2xl font-black text-white mb-2">Painel Administrativo</h2>
          <p className="text-gray-400 mb-8 text-sm">Insira a senha mestra para acessar</p>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-center text-lg outline-none focus:border-[#C67D3D] mb-4 text-white" placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && fetchData()} />
          <button onClick={fetchData} disabled={loading} className="w-full bg-[#C67D3D] hover:bg-[#EA580C] text-white py-4 rounded-xl font-black flex items-center justify-center gap-2">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ACESSAR PAINEL'}</button>
          {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <div className="flex items-center gap-4">
              <button onClick={navigateHome} className="text-gray-500 hover:text-white"><ArrowLeft className="w-6 h-6" /></button>
              <h1 className="text-3xl font-black text-white flex items-center gap-3"><ShieldCheck className="text-[#C67D3D]" />Painel Administrativo</h1>
            </div>
            <p className="text-gray-500 mt-1 ml-10 text-sm">Gestão centralizada • Firestore Database</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleBackup} className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 text-sm border border-white/5">
              <DownloadCloud className="w-5 h-5" />BACKUP JSON
            </button>
            {activeTab === 'cupons' && (
              <button onClick={() => { setEditingCupom(null); setFormData({ codigo: '', tipo: 'PERCENTUAL', valor: 0, afiliado_nome: '', afiliado_email: '', afiliado_telefone: '', limite_usos: 0, validade: '', ativo: true }); setShowForm(true); }} className="bg-[#C67D3D] hover:bg-[#EA580C] text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 text-sm">
                <Plus className="w-5 h-5" />NOVO CUPOM
              </button>
            )}
            <button
              onClick={async () => {
                if (confirm('⚠️ ATENÇÃO: Isso irá apagar TODOS os dados de teste (ativações, pagamentos, licenças, usuários, cupons). Esta ação é irreversível. Deseja continuar?')) {
                  try {
                    const res = await fetch('/api/admin/clear-test-data', {
                      method: 'DELETE',
                      headers: { 'x-admin-password': password }
                    });
                    const data = await res.json();
                    if (res.ok) {
                      alert(`Sweep results:\n${Object.entries(data.results).map(([col, details]: [string, any]) => `${col}: ${details.deleted} docs`).join('\n')}`);
                      fetchData();
                    } else {
                      alert('Error: ' + (data.message || 'Unknown error'));
                    }
                  } catch (err) {
                    alert('Connection error');
                  }
                }
              }}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-6 py-3 rounded-2xl font-black flex items-center gap-2 text-sm border border-red-500/20"
            >
              <Trash2 className="w-5 h-5" /> LIMPAR TESTES
            </button>
          </div>
        </div>
        <div className="flex gap-2 mb-8 bg-[#1a1a1a] p-1.5 rounded-2xl border border-white/5 w-fit">
          <button onClick={() => setActiveTab('cupons')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'cupons' ? 'bg-[#C67D3D] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}><Tag className="w-4 h-4" />CUPONS</button>
          <button onClick={() => setActiveTab('activations')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'activations' ? 'bg-[#C67D3D] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}><Zap className="w-4 h-4" />ATIVAÇÕES</button>
          <button onClick={() => setActiveTab('licenses')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'licenses' ? 'bg-[#C67D3D] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}><Database className="w-4 h-4" />LICENÇAS</button>
        </div>

        {loading && <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-[#C67D3D] animate-spin" /></div>}

        {!loading && activeTab === 'cupons' && (
          <div className="grid grid-cols-1 gap-4">
            {cupons.length === 0 ? (
              <div className="bg-[#1a1a1a] border border-dashed border-white/10 p-20 rounded-[2.5rem] text-center">
                <Tag className="w-12 h-12 text-gray-600 mx-auto mb-4" /><p className="text-gray-500">Nenhum cupom cadastrado ainda.</p>
              </div>
            ) : cupons.map(cupom => (
              <div key={cupom.id}>
                <div className="bg-[#1a1a1a] border border-white/5 p-6 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-6 hover:border-[#C67D3D]/20 transition-all cursor-pointer" onClick={() => setSelectedCupomId(selectedCupomId === cupom.id ? null : cupom.id)}>
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${cupom.ativo ? 'bg-[#C67D3D]/10 text-[#C67D3D]' : 'bg-gray-800 text-gray-500'}`}><Tag className="w-7 h-7" /></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-white">{cupom.codigo}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cupom.ativo ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>{cupom.ativo ? 'ATIVO' : 'INATIVO'}</span>
                      </div>
                      <p className="text-gray-400 text-sm">{cupom.tipo === 'PERCENTUAL' ? `${cupom.valor}% OFF` : `R$ ${Number(cupom.valor).toFixed(2)} OFF`} • <span className="text-white">{cupom.afiliado_nome}</span></p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 md:flex items-center gap-6 w-full md:w-auto">
                    <div className="text-center">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Usos</p>
                      <p className="text-lg font-black text-white">{cupom.usos || 0}<span className="text-gray-600 text-xs"> / {cupom.limite_usos || '∞'}</span></p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Vendas</p>
                      <p className="text-lg font-black text-[#C67D3D]">R$ {formatBRL(totalVendas(cupom))}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto justify-end" onClick={e => e.stopPropagation()}>
                    <button onClick={() => toggleCupomStatus(cupom)} className={`p-3 rounded-xl transition-all ${cupom.ativo ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'}`}>{cupom.ativo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}</button>
                    <button onClick={() => { setEditingCupom(cupom); setFormData({ codigo: cupom.codigo, tipo: cupom.tipo, valor: cupom.valor, afiliado_nome: cupom.afiliado_nome, afiliado_email: cupom.afiliado_email, afiliado_telefone: cupom.afiliado_telefone, limite_usos: cupom.limite_usos, validade: cupom.validade, ativo: cupom.ativo }); setShowForm(true); }} className="p-3 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteCupom(cupom.id)} className="p-3 bg-white/5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                {selectedCupomId === cupom.id && (
                  <div className="bg-[#111] border border-white/5 border-t-0 rounded-b-[2rem] p-6">
                    <p className="text-[10px] uppercase font-bold text-gray-500 mb-4">Detalhamento das Vendas</p>
                    {Array.isArray(cupom.vendas) && cupom.vendas.length > 0 ? (
                      <div className="space-y-3">
                        {cupom.vendas.map((venda: any, i: number) => (
                          <div key={i} className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/5 p-4 rounded-xl gap-3">
                            <div><p className="text-white text-sm font-bold">{venda.cliente || 'Cliente'}</p><p className="text-gray-500 text-xs">{venda.email}</p></div>
                            <div className="text-center"><p className="text-[10px] text-gray-500 uppercase font-bold">Plano</p><span className="text-[10px] font-bold text-[#C67D3D] bg-[#C67D3D]/10 px-2 py-0.5 rounded-full border border-[#C67D3D]/20">{venda.plano || 'N/A'}</span></div>
                            <div className="text-center"><p className="text-[10px] text-gray-500 uppercase font-bold">Valor</p><p className="text-white text-sm font-bold">R$ {formatBRL(Number(venda.valor) || 0)}</p></div>
                            <div className="text-center"><p className="text-[10px] text-gray-500 uppercase font-bold">Data</p><p className="text-gray-400 text-xs">{venda.data ? new Date(venda.data).toLocaleDateString('pt-BR') : '—'}</p></div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-gray-600 text-sm text-center py-4">Nenhuma venda registrada ainda.</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && activeTab === 'activations' && (
          <div className="grid grid-cols-1 gap-4">
            {activations.length === 0 ? (
              <div className="bg-[#1a1a1a] border border-dashed border-white/10 p-20 rounded-[2.5rem] text-center">
                <Zap className="w-12 h-12 text-gray-600 mx-auto mb-4" /><p className="text-gray-500">Nenhuma ativação encontrada.</p>
              </div>
            ) : activations.map(act => (
              <div key={act.id} className="bg-[#1a1a1a] border border-white/5 p-6 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${act.status === 'USED' ? 'bg-green-500/10 text-green-500' : 'bg-[#C67D3D]/10 text-[#C67D3D]'}`}><Zap className="w-7 h-7" /></div>
                  <div>
                    <h3 className="text-xl font-black text-white font-mono">{act.code}</h3>
                    <p className="text-gray-400 text-sm">{act.plano} • <span className="text-white">{act.email}</span></p>
                    <p className="text-gray-600 text-xs">Criado em: {new Date(act.createdAt).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 w-full md:w-auto">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Status</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${act.status === 'USED' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-[#C67D3D]/10 text-[#C67D3D] border-[#C67D3D]/20'}`}>{act.status}</span>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    {act.status === 'USED' && (
                      <button onClick={() => handleResetActivation(act.code)} className="bg-[#C67D3D]/10 text-[#C67D3D] hover:bg-[#C67D3D]/20 px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 transition-all">
                        <RefreshCcw className="w-3 h-3" />RESETAR HWID
                      </button>
                    )}
                    <button onClick={() => handleDeleteActivation(act.code)} className="p-3 bg-white/5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && activeTab === 'licenses' && (
          <div className="grid grid-cols-1 gap-4">
            {licenses.length === 0 ? (
              <div className="bg-[#1a1a1a] border border-dashed border-white/10 p-20 rounded-[2.5rem] text-center">
                <Database className="w-12 h-12 text-gray-600 mx-auto mb-4" /><p className="text-gray-500">Nenhuma licença ativa encontrada.</p>
              </div>
            ) : licenses.map(lic => (
              <div key={lic.id} className="bg-[#1a1a1a] border border-white/5 p-6 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0"><Cpu className="w-7 h-7" /></div>
                  <div>
                    <h3 className="text-sm font-black text-white font-mono">{lic.id}</h3>
                    <p className="text-gray-400 text-sm">{lic.plano} • <span className="text-white">{lic.email || 'N/A'}</span></p>
                    <p className="text-gray-600 text-xs">Expira em: {lic.expiration ? new Date(lic.expiration).toLocaleDateString('pt-BR') : 'Vitalício'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  <button onClick={() => handleDeleteLicense(lic.id)} className="p-3 bg-white/5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div onClick={() => setShowForm(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-[#1a1a1a] border border-white/10 w-full max-w-2xl rounded-[2.5rem] p-8 relative z-10 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-white">{editingCupom ? 'Editar Cupom' : 'Novo Cupom'}</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSave} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className="text-[10px] uppercase font-bold text-gray-500 ml-2 block mb-1">Código do Cupom</label><input required value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value.toUpperCase()})} disabled={!!editingCupom} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-[#C67D3D] outline-none text-white disabled:opacity-50" placeholder="EX: JOAO10" /></div>
                  <div><label className="text-[10px] uppercase font-bold text-gray-500 ml-2 block mb-1">Tipo de Desconto</label><select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-[#C67D3D] outline-none text-white"><option value="PERCENTUAL">Percentual (%)</option><option value="FIXO">Valor Fixo (R$)</option></select></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className="text-[10px] uppercase font-bold text-gray-500 ml-2 block mb-1">Valor do Desconto</label><input required type="number" step="0.01" min="0" value={formData.valor} onChange={e => setFormData({...formData, valor: parseFloat(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-[#C67D3D] outline-none text-white" /></div>
                  <div><label className="text-[10px] uppercase font-bold text-gray-500 ml-2 block mb-1">Limite de Usos (0 = ilimitado)</label><input type="number" min="0" value={formData.limite_usos} onChange={e => setFormData({...formData, limite_usos: parseInt(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-[#C67D3D] outline-none text-white" /></div>
                </div>
                <div><label className="text-[10px] uppercase font-bold text-gray-500 ml-2 block mb-1">Nome do Afiliado</label><input required value={formData.afiliado_nome} onChange={e => setFormData({...formData, afiliado_nome: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-[#C67D3D] outline-none text-white" placeholder="Nome completo" /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className="text-[10px] uppercase font-bold text-gray-500 ml-2 block mb-1">Email do Afiliado</label><input required type="email" value={formData.afiliado_email} onChange={e => setFormData({...formData, afiliado_email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-[#C67D3D] outline-none text-white" placeholder="email@afiliado.com" /></div>
                  <div><label className="text-[10px] uppercase font-bold text-gray-500 ml-2 block mb-1">Telefone do Afiliado</label><input required value={formData.afiliado_telefone} onChange={e => setFormData({...formData, afiliado_telefone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-[#C67D3D] outline-none text-white" placeholder="(00) 00000-0000" /></div>
                </div>
                <div><label className="text-[10px] uppercase font-bold text-gray-500 ml-2 block mb-1">Validade (Opcional)</label><input type="date" value={formData.validade} onChange={e => setFormData({...formData, validade: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-[#C67D3D] outline-none text-white" /></div>
                <button type="submit" disabled={loading} className="w-full bg-[#C67D3D] hover:bg-[#EA580C] text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}SALVAR CUPOM
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── ConfirmModal com fluxo corrigido ── */}
      <AnimatePresence>
        {confirmConfig && (
          <ConfirmModal
            isOpen={confirmConfig.isOpen}
            title={confirmConfig.title}
            message={confirmConfig.message}
            loading={confirmLoading}
            onCancel={() => { if (!confirmLoading) setConfirmConfig(null); }}
            onConfirm={async () => {
              setConfirmLoading(true);
              try {
                await confirmConfig.onConfirm();
                setConfirmConfig(null);
                // Aguarda propagação do Firestore antes de refazer fetch
                await new Promise(r => setTimeout(r, 600));
                await fetchData();
              } catch (e: any) {
                alert(e.message || 'Erro ao executar ação');
              } finally {
                setConfirmLoading(false);
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── License Activation ───────────────────────────────────────────────────────
const LicenseActivation = () => {
  const [hwid, setHwid] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [trialEmail, setTrialEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryData, setRecoveryData] = useState<any[] | null>(null);
  const [showRecovery, setShowRecovery] = useState(false);
  const [showTrialForm, setShowTrialForm] = useState(false);

  const hwidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

  const validateHwid = (): boolean => {
    if (!hwid) { setError('Preencha o Hardware ID (HWID)'); return false; }
    if (!hwidRegex.test(hwid)) { setError('Formato de HWID inválido. Use o formato: 00000000-0000-0000-0000-000000000000'); return false; }
    return true;
  };

  const handleActivate = async () => {
    if (!validateHwid()) return;
    if (!activationCode) { setError('Preencha o Código de Ativação'); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch('/api/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hwid, activationCode })
      });
      const data = await res.json();
      if (res.ok) setResult(data);
      else setError(data.message || 'Erro ao ativar licença');
    } catch { setError('Erro de conexão'); } finally { setLoading(false); }
  };

  const handleValidate = async () => {
    if (!validateHwid()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch(`/api/license/validate?hwid=${hwid}`);
      const data = await res.json();
      if (res.ok) setResult(data);
      else setError(data.message || 'Erro ao validar licença');
    } catch { setError('Erro de conexão'); } finally { setLoading(false); }
  };

  const handleTrial = async () => {
    if (!validateHwid()) return;
    if (!trialEmail) { setError('Preencha seu e-mail para receber a confirmação do teste gratuito'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trialEmail)) { setError('E-mail inválido'); return; }

    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch('/api/license/trial-hwid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hwid, email: trialEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ ...data, isTrial: true });
        setShowTrialForm(false);
      } else {
        setError(data.message || 'Erro ao ativar teste gratuito');
      }
    } catch { setError('Erro de conexão'); } finally { setLoading(false); }
  };

  const handleRecover = async () => {
    if (!recoveryEmail) return setError('E-mail é obrigatório para recuperar');
    setLoading(true); setError(null); setRecoveryData(null);
    try {
      const res = await fetch(`/api/license/recover?email=${encodeURIComponent(recoveryEmail)}`);
      const data = await res.json();
      if (res.ok) setRecoveryData(data);
      else setError(data.message || 'Erro ao recuperar códigos');
    } catch { setError('Erro de conexão'); } finally { setLoading(false); }
  };

  return (
    <section id="license-activation" className="py-24 bg-[#0a0a0a] border-t border-white/5">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-[#1a1a1a] p-10 rounded-[3rem] border border-[#C67D3D]/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#C67D3D]/5 blur-[80px] rounded-full" />

          <div className="text-center mb-10 relative z-10">
            <h2 className="text-3xl font-black text-white mb-4">Ativação de Licença</h2>
            <p className="text-gray-400 text-sm">Ative seu software, valide sua licença ou inicie seu teste gratuito de 7 dias.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 relative z-10 mb-8">
            <div className="space-y-4">
              {/* HWID */}
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 ml-2 block mb-1">Hardware ID (HWID)</label>
                <div className="relative">
                  <Cpu className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    value={hwid}
                    onChange={e => { setHwid(e.target.value); setError(null); }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-[#C67D3D] outline-none text-white placeholder-gray-600"
                    placeholder="Ex: 03000200-0400-0500-0006-000700080009"
                  />
                </div>
              </div>

              {/* Código de Ativação — oculto quando trial form está aberto */}
              {!showTrialForm && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 ml-2 block mb-1">Código de Ativação</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      value={activationCode}
                      onChange={e => { setActivationCode(e.target.value.toUpperCase()); setError(null); }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-[#C67D3D] outline-none text-white placeholder-gray-600"
                      placeholder="Ex: R3D-ACT-XXXX-XXXX"
                    />
                  </div>
                </div>
              )}

              {/* Formulário de e-mail para trial — aparece ao clicar em "7 DIAS GRÁTIS" */}
              <AnimatePresence>
                {showTrialForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-yellow-400" />
                        <p className="text-yellow-400 text-xs font-black uppercase tracking-widest">Teste Gratuito — 7 Dias</p>
                      </div>
                      <p className="text-gray-400 text-[11px] leading-relaxed">
                        Informe seu e-mail para receber a confirmação. Cada Hardware ID só pode usar o teste uma única vez.
                      </p>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          value={trialEmail}
                          onChange={e => { setTrialEmail(e.target.value); setError(null); }}
                          type="email"
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-yellow-400 outline-none text-white placeholder-gray-600"
                          placeholder="seu@email.com"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setShowTrialForm(false); setTrialEmail(''); setError(null); }}
                          className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 py-2.5 rounded-xl font-bold text-xs transition-all"
                        >
                          CANCELAR
                        </button>
                        <button
                          onClick={handleTrial}
                          disabled={loading}
                          className="flex-[2] bg-yellow-500 hover:bg-yellow-400 text-black py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2"
                        >
                          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                          ATIVAR TESTE GRÁTIS
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botões principais */}
              {!showTrialForm && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleActivate}
                    disabled={loading}
                    className="bg-[#C67D3D] hover:bg-[#EA580C] text-white py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                    ATIVAR
                  </button>
                  <button
                    onClick={handleValidate}
                    disabled={loading}
                    className="bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    VALIDAR
                  </button>
                  <button
                    onClick={() => { setShowTrialForm(true); setError(null); setResult(null); }}
                    disabled={loading}
                    className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 border border-yellow-500/20"
                  >
                    <Clock className="w-4 h-4" />
                    7 DIAS GRÁTIS
                  </button>
                  <button
                    onClick={() => { setShowRecovery(!showRecovery); setError(null); }}
                    disabled={loading}
                    className="bg-white/5 hover:bg-white/10 text-blue-400 py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <Search className="w-3 h-3" />
                    RECUPERAR
                  </button>
                </div>
              )}

              {/* Recuperação por e-mail */}
              <AnimatePresence>
                {showRecovery && !showTrialForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-blue-400 ml-2 block">Recuperar por E-mail</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input
                            value={recoveryEmail}
                            onChange={e => setRecoveryEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs focus:border-blue-400 outline-none text-white placeholder-gray-600"
                            placeholder="Seu e-mail de compra"
                          />
                        </div>
                        <button onClick={handleRecover} className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded-xl font-bold text-[10px] transition-all">BUSCAR</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Painel de resultado */}
            <div className="bg-black/40 rounded-2xl border border-white/5 p-6 min-h-[200px] flex flex-col">
              <p className="text-[10px] uppercase font-bold text-gray-500 mb-4">Status da Licença</p>

              {loading && (
                <div className="flex-grow flex flex-col items-center justify-center text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  <p className="text-xs">Processando...</p>
                </div>
              )}

              {error && !loading && (
                <div className="flex-grow flex flex-col items-center justify-center text-red-400 text-center p-4">
                  <X className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-sm font-bold">{error}</p>
                </div>
              )}

              {recoveryData && !loading && !error && (
                <div className="flex-grow space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  <p className="text-[10px] text-blue-400 font-bold uppercase mb-2">Códigos Encontrados:</p>
                  {recoveryData.map((act, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-3 text-[10px]">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[#C67D3D] font-mono font-bold">{act.code}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { navigator.clipboard.writeText(act.code); setActivationCode(act.code); }}
                            className="text-blue-400 hover:underline text-[8px] font-bold"
                          >
                            COPIAR
                          </button>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${act.status === 'USED' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {act.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-400 truncate">Plano: {act.plano}</p>
                      <p className="text-gray-500 text-[8px]">{new Date(act.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                  {recoveryData.length === 0 && <p className="text-xs text-gray-600 italic">Nenhum código encontrado para este e-mail.</p>}
                </div>
              )}

              {result && !loading && !error && (
                <div className="flex-grow space-y-4">
                  {/* Trial ativado com sucesso */}
                  {result.isTrial ? (
                    <>
                      <div className="flex items-center gap-3 text-yellow-400">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-bold text-sm">Teste Gratuito Ativado!</span>
                      </div>
                      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
                        <p className="text-[10px] text-yellow-400 uppercase font-bold mb-3">Informações do Teste</p>
                        <div className="space-y-2 text-[11px]">
                          <p className="text-gray-400">Plano: <span className="text-white font-bold">Trial — 7 Dias</span></p>
                          <p className="text-gray-400">Expira em: <span className="text-white font-bold">{result.expiration ? new Date(result.expiration).toLocaleDateString('pt-BR') : '—'}</span></p>
                          <p className="text-gray-400">Dias restantes: <span className="text-yellow-400 font-bold">7 dias</span></p>
                          <p className="text-gray-400">Status: <span className="text-yellow-400 font-bold">Ativo</span></p>
                        </div>
                      </div>
                      {result.licenseKey && (
                        <div className="bg-[#C67D3D]/10 border border-[#C67D3D]/20 rounded-xl p-3">
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-[10px] text-[#C67D3D] uppercase font-bold">Chave de Licença</p>
                            <button
                              onClick={() => navigator.clipboard.writeText(result.licenseKey)}
                              className="text-[9px] text-[#C67D3D] hover:underline font-bold flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" />COPIAR
                            </button>
                          </div>
                          <p className="text-[9px] text-white font-mono break-all leading-relaxed">{result.licenseKey}</p>
                        </div>
                      )}
                      <p className="text-[10px] text-gray-500 text-center">Uma confirmação foi enviada para seu e-mail.</p>
                    </>
                  ) : (
                    /* Ativação / Validação normal */
                    <>
                      <div className="flex items-center gap-3 text-green-400">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-bold text-sm">{result.valid === false ? 'Licença Expirada' : 'Licença Ativa!'}</span>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4 overflow-hidden">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Informações da Licença</p>
                        <div className="space-y-2 text-[11px]">
                          <p className="text-gray-400">Plano: <span className="text-white font-bold">{result.plano}</span></p>
                          <p className="text-gray-400">Expiração: <span className="text-white font-bold">{result.expiration ? new Date(result.expiration).toLocaleDateString('pt-BR') : 'Vitalícia'}</span></p>
                          {result.diasRestantes !== undefined && (
                            <p className="text-gray-400">Dias restantes: <span className={`font-bold ${result.diasRestantes <= 7 ? 'text-yellow-400' : 'text-green-400'}`}>{result.diasRestantes === 9999 ? '∞' : result.diasRestantes}</span></p>
                          )}
                          <p className="text-gray-400">Status: <span className={`font-bold ${result.valid === false ? 'text-red-400' : 'text-green-400'}`}>{result.valid === false ? 'Expirada' : 'Ativa'}</span></p>
                        </div>
                      </div>
                      {result.licenseKey && (
                        <div className="bg-[#C67D3D]/10 border border-[#C67D3D]/20 rounded-xl p-3">
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-[10px] text-[#C67D3D] uppercase font-bold">Chave de Licença</p>
                            <button
                              onClick={() => navigator.clipboard.writeText(result.licenseKey)}
                              className="text-[9px] text-[#C67D3D] hover:underline font-bold flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" />COPIAR
                            </button>
                          </div>
                          <p className="text-[9px] text-white font-mono break-all leading-relaxed">{result.licenseKey}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {!loading && !error && !result && !recoveryData && (
                <div className="flex-grow flex flex-col items-center justify-center text-gray-600 text-center">
                  <ShieldCheck className="w-10 h-10 mb-2 opacity-20" />
                  <p className="text-xs italic">Insira seus dados para começar...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Terms Modal ─────────────────────────────────────────────────────────────
const TermsModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
    >
      <div onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-[#1a1a1a] border border-white/10 w-full max-w-4xl rounded-[2.5rem] p-8 relative z-10 max-h-[85vh] flex flex-col"
      >
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-2xl font-black text-white">Termos de Uso e Política de Licenciamento</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-2">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="overflow-y-auto pr-4 space-y-6 text-gray-300 text-sm leading-relaxed">
          <p className="text-[#C67D3D] font-bold text-base">Última atualização: 26 de março de 2026</p>

          <section>
            <h3 className="text-lg font-bold text-white mt-4 mb-2">1. CONCESSÃO DE LICENÇA</h3>
            <p>O Licenciante concede ao Licenciado uma licença pessoal, intransferível, não exclusiva e limitada para utilizar o Software R3D Print Manager Pro, em regime de uso perpétuo ou por período determinado, conforme o plano adquirido.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mt-4 mb-2">2. ATIVAÇÃO E VINCULAÇÃO (HWID)</h3>
            <p>A ativação do Software ocorre mediante a inserção de uma chave de ativação vinculada permanentemente ao identificador único do seu computador (Hardware ID). A mesma chave não poderá ser utilizada em outro computador.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mt-4 mb-2">3. TESTE GRATUITO (TRIAL)</h3>
            <p>Oferecemos um período de teste de 7 dias, limitado a um uso por Hardware ID e por endereço de e-mail. Após este período, o software será bloqueado até a aquisição de um plano.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mt-4 mb-2">4. PRIVACIDADE E DADOS</h3>
            <p>O R3D Pro opera prioritariamente em modo offline. Seus dados de produção, custos e clientes são armazenados localmente em sua máquina e não são transmitidos para nossos servidores.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mt-4 mb-2">5. REEMBOLSO E CANCELAMENTO</h3>
            <p>Devido à disponibilização do período de teste gratuito, reembolsos após a ativação da licença definitiva serão analisados individualmente conforme o Código de Defesa do Consumidor.</p>
          </section>

          <div className="bg-white/5 p-4 rounded-xl border border-white/10 mt-6">
            <p className="text-xs text-gray-400 leading-relaxed">
              Para ler o termo completo com todos os detalhes jurídicos, você pode acessar nossa página dedicada em: 
              <a href="/termos.html" target="_blank" className="text-[#C67D3D] hover:underline ml-1 font-bold">r3dprintmanagerpro.com.br/termos-de-uso</a>
            </p>
          </div>

          <p className="mt-6 text-xs text-gray-500 italic">
            Ao prosseguir com a instalação e ativação do Software, o Licenciado confirma estar ciente e de acordo com todas as condições estabelecidas neste Termo de Uso.
          </p>
        </div>
        <div className="mt-6 shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-[#C67D3D] to-[#EA580C] text-white py-4 rounded-2xl font-black hover:brightness-110 transition-all shadow-lg shadow-[#C67D3D]/20"
          >
            ENTENDI E ACEITO OS TERMOS
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── App Principal ────────────────────────────────────────────────────────────
export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState(window.location.pathname === '/admin/cupons' || window.location.pathname === '/admin');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isTrialOpen, setIsTrialOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState({ name: '', price: '' });

  useEffect(() => {
    const h = () => setIsAdminRoute(window.location.pathname === '/admin/cupons' || window.location.pathname === '/admin');
    window.addEventListener('popstate', h);
    return () => window.removeEventListener('popstate', h);
  }, []);

  const openCheckout = (name: string, price: string) => { setSelectedPlan({ name, price }); setIsCheckoutOpen(true); };
  if (isAdminRoute) return <AdminPanel />;

  return (
    <div className="bg-[#0f0f0f] min-h-screen text-white font-sans selection:bg-[#C67D3D]/30 selection:text-[#C67D3D]">
      <Navbar onOpenGuide={() => setIsGuideOpen(true)} />
      <AnimatePresence>
        {isCheckoutOpen && <CheckoutModal onClose={() => setIsCheckoutOpen(false)} plan={selectedPlan} />}
        {isGuideOpen && <GuideModal onClose={() => setIsGuideOpen(false)} />}
        {isTrialOpen && <TrialModal onClose={() => setIsTrialOpen(false)} />}
        {isTermsOpen && <TermsModal onClose={() => setIsTermsOpen(false)} />}
      </AnimatePresence>

      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[#C67D3D]/5 blur-[120px] rounded-full -z-10" />
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-[#C67D3D]/10 border border-[#C67D3D]/20 px-4 py-1.5 rounded-full mb-6">
              <Cpu className="w-4 h-4 text-[#C67D3D]" /><span className="text-[#C67D3D] text-xs font-bold uppercase tracking-widest">Tecnologia Industrial 3D</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-[1.1] mb-6 tracking-tight">Pare de <span className="text-[#C67D3D]">Chutar Preços</span> e Profissionalize sua Impressão 3D</h1>
            <p className="text-xl text-gray-400 mb-10 leading-relaxed max-w-lg">O R3D Pro é o cérebro da sua produção. Orçamentos precisos, gestão de ROI e BI industrial em um software desktop leve, seguro e 100% offline.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="/api/download" download className="bg-gradient-to-r from-[#C67D3D] to-[#EA580C] hover:brightness-110 text-white px-8 py-4 rounded-2xl font-black text-lg transition-all shadow-xl shadow-[#C67D3D]/30 flex items-center justify-center gap-2 group"><Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />Baixar Agora</a>
              <button onClick={() => setIsTrialOpen(true)} className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center">Testar 7 Dias Grátis</button>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2"><CheckCircle2 className="text-[#C67D3D] w-4 h-4" /><span>Dados 100% Locais</span></div>
              <div className="w-1 h-1 bg-gray-700 rounded-full" />
              <div className="flex items-center gap-2"><CheckCircle2 className="text-[#C67D3D] w-4 h-4" /><span>PIX · Boleto · Cartão até 12x</span></div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }} className="relative flex items-center justify-center">
            <div className="absolute w-[500px] h-[500px] bg-[#C67D3D]/20 rounded-full blur-[100px] -z-10 animate-pulse" />
            <div className="absolute w-[420px] h-[420px] border border-[#C67D3D]/15 rounded-full animate-[spin_25s_linear_infinite]" />
            <div className="absolute w-[480px] h-[480px] border border-[#C67D3D]/8 rounded-full animate-[spin_35s_linear_infinite_reverse]" />
            {[0, 60, 120, 180, 240, 300].map((deg, i) => (
              <div key={i} className="absolute w-[420px] h-[420px] animate-[spin_20s_linear_infinite]" style={{ animationDelay: `${-i * 3}s` }}>
                <div className="absolute w-2 h-2 bg-[#C67D3D] rounded-full shadow-[0_0_8px_rgba(198,125,61,0.8)]" style={{ top: '50%', left: '50%', transform: `rotate(${deg}deg) translateX(210px) translateY(-50%)` }} />
              </div>
            ))}
            <motion.div animate={{ y: [0, -12, 0], filter: ['drop-shadow(0 0 20px rgba(198,125,61,0.3))', 'drop-shadow(0 0 40px rgba(198,125,61,0.5))', 'drop-shadow(0 0 20px rgba(198,125,61,0.3))'] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="relative z-10 w-72 h-72 md:w-80 md:h-80">
              <img src={logoR3D} alt="R3D Print Manager Pro" className="w-full h-full object-contain" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 }} className="absolute -right-4 top-12 bg-[#1a1a1a]/90 backdrop-blur border border-[#C67D3D]/30 px-4 py-3 rounded-2xl shadow-xl z-20">
              <p className="text-[#C67D3D] font-black text-xs uppercase tracking-widest">v2.5 Stable</p>
              <p className="text-white text-sm font-bold">100% Offline</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }} className="absolute -left-4 bottom-16 bg-[#1a1a1a]/90 backdrop-blur border border-[#C67D3D]/30 px-4 py-3 rounded-2xl shadow-xl z-20">
              <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">Aceita</p>
              <p className="text-white text-sm font-bold">PIX · Boleto · 12x</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="py-24 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20"><h2 className="text-4xl md:text-5xl font-black mb-6">A Força da <span className="text-[#C67D3D]">Engenharia</span> na sua Gestão</h2><p className="text-gray-400 max-w-2xl mx-auto text-lg">Ferramentas robustas para transformar sua operação em uma indústria de alta performance.</p></div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard icon={LayoutDashboard} title="Dashboard de Comando" description="Visão analítica completa do seu faturamento e produção. Alertas de saúde da operação em tempo real." />
            <FeatureCard icon={BookOpen} title="Catálogo Técnico" description="Gestão de insumos e produtos com fotos. Cálculo de custos de energia e filamento com precisão cirúrgica." />
            <FeatureCard icon={FileText} title="Propostas Premium" description="Envie orçamentos em PDF que transmitem autoridade. Design limpo, profissional e focado em conversão." />
            <FeatureCard icon={Settings} title="Controle de Impressão" description="Gerencie múltiplas impressoras. Monitore o status de cada máquina e agende manutenções preventivas." />
            <FeatureCard icon={TrendingUp} title="ROI e Lucratividade" description="Saiba exatamente quanto cada peça lucra. Identifique o ponto de equilíbrio do seu negócio mensalmente." />
            <FeatureCard icon={BarChart3} title="BI e Relatórios" description="Rankings de melhores clientes e produtos. Relatórios detalhados para tomadas de decisão baseadas em dados." />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-[3rem] p-12 md:p-20 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#C67D3D]/5 blur-[100px] rounded-full" />
            <div className="text-center mb-16 relative z-10"><h2 className="text-4xl font-black mb-4">Fluxo de Trabalho Otimizado</h2><p className="text-gray-400">Do download ao primeiro orçamento em menos de 5 minutos.</p></div>
            <div className="grid md:grid-cols-3 gap-12 relative z-10">
              <Step number="1" title="Instalação Local" description="Software leve e potente. Instale no Windows e tenha um ERP industrial rodando na sua máquina." />
              <Step number="2" title="Setup de Custos" description="Insira seus custos de energia e materiais. O R3D Pro calibra os cálculos para sua realidade." />
              <Step number="3" title="Produção em Escala" description="Gere pedidos, monitore impressões e veja seu negócio crescer com organização total." />
            </div>
          </div>
        </div>
      </section>

      <section id="security" className="py-24 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="w-16 h-16 bg-[#C67D3D]/10 rounded-2xl flex items-center justify-center mb-8"><ShieldCheck className="text-[#C67D3D] w-8 h-8" /></div>
            <h2 className="text-4xl font-black mb-6">Segurança de Nível <span className="text-[#C67D3D]">Empresarial</span></h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">Seus segredos industriais, lista de clientes e margens de lucro são sagrados. O R3D Pro mantém tudo localmente.</p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-white font-medium"><CheckCircle2 className="text-[#C67D3D] w-5 h-5" />Banco de dados SQLite criptografado localmente</li>
              <li className="flex items-center gap-3 text-white font-medium"><CheckCircle2 className="text-[#C67D3D] w-5 h-5" />Backup manual e automático para sua segurança</li>
              <li className="flex items-center gap-3 text-white font-medium"><CheckCircle2 className="text-[#C67D3D] w-5 h-5" />Zero dependência de servidores externos</li>
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-white/5 flex flex-col items-center text-center"><Database className="text-[#C67D3D] w-10 h-10 mb-4" /><h4 className="font-bold mb-2 text-sm">Privacidade</h4><p className="text-[10px] text-gray-500 uppercase tracking-widest">Offline First</p></div>
            <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-white/5 flex flex-col items-center text-center mt-8"><Lock className="text-[#C67D3D] w-10 h-10 mb-4" /><h4 className="font-bold mb-2 text-sm">Proteção</h4><p className="text-[10px] text-gray-500 uppercase tracking-widest">Criptografia</p></div>
            <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-white/5 flex flex-col items-center text-center"><Clock className="text-[#C67D3D] w-10 h-10 mb-4" /><h4 className="font-bold mb-2 text-sm">Agilidade</h4><p className="text-[10px] text-gray-500 uppercase tracking-widest">Zero Latência</p></div>
            <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-white/5 flex flex-col items-center text-center mt-8"><DollarSign className="text-[#C67D3D] w-10 h-10 mb-4" /><h4 className="font-bold mb-2 text-sm">Pagamento</h4><p className="text-[10px] text-gray-500 uppercase tracking-widest">PIX · Boleto · 12x</p></div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16"><h2 className="text-4xl md:text-5xl font-black mb-6">Quem <span className="text-[#C67D3D]">Confia</span> no R3D Pro</h2></div>
          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard name="Ricardo Silva" role="Dono de Bureau 3D" rating={5} content="Antes do R3D Pro, eu perdia dinheiro em 30% dos orçamentos. Hoje minha margem é real e meu lucro dobrou." />
            <TestimonialCard name="Amanda Costa" role="Designer de Colecionáveis" rating={5} content="Envio orçamentos profissionais em segundos e os clientes sentem muito mais confiança." />
            <TestimonialCard name="Marcos Oliveira" role="Engenheiro de Prototipagem" rating={5} content="A segurança de ter os dados offline é o que me ganhou. O R3D Pro respeita minha privacidade." />
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#C67D3D]/5 to-transparent -z-10" />
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16"><h2 className="text-4xl md:text-6xl font-black mb-6">O Investimento que se <span className="text-[#C67D3D]">Paga Sozinho</span></h2><p className="text-gray-400 max-w-2xl mx-auto text-lg">PIX, Boleto ou Cartão em até 12x.</p></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 items-stretch">
            {/* Plano Semanal - R$ 5,00 */}
            <div className="bg-[#1a1a1a] border border-white/5 p-8 rounded-[2.5rem] flex flex-col transition-all hover:border-[#C67D3D]/20">
              <h3 className="text-lg font-bold mb-2">Plano Semanal</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-black text-white">R$ 5,00</span>
                <span className="text-gray-500 text-xs">/semana</span>
              </div>
              <div className="mb-6" /> {/* espaço vazio para alinhar com os outros */}
              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-center gap-3 text-xs text-gray-400">
                  <CheckCircle2 className="text-[#C67D3D] w-4 h-4 shrink-0" />
                  Todas as funções Pro
                </li>
                <li className="flex items-center gap-3 text-xs text-gray-400">
                  <CheckCircle2 className="text-[#C67D3D] w-4 h-4 shrink-0" />
                  Suporte WhatsApp
                </li>
                <li className="flex items-center gap-3 text-xs text-gray-400">
                  <CheckCircle2 className="text-[#C67D3D] w-4 h-4 shrink-0" />
                  1 Licença HWID
                </li>
              </ul>
              <button
                onClick={() => openCheckout('Semanal', 'R$ 5,00')}
                className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-bold text-sm"
              >
                Assinar Agora
              </button>
            </div>
            {[
              { name: 'Mensal', price: 'R$ 59,90', sub: '/mês', features: ['Todas as funções', 'Suporte WhatsApp', '1 Licença HWID'] },
              { name: 'Trimestral', price: 'R$ 159,90', sub: '/trim', monthly: 'R$ 53,30 por mês', features: ['Economia de R$ 19,80', 'Todas as funções', 'Suporte WhatsApp'] },
              { name: 'Semestral', price: 'R$ 289,90', sub: '/sem', monthly: 'R$ 48,31 por mês', features: ['Economia de R$ 69,50', 'Todas as funções', 'Suporte Prioritário'] },
            ].map(p => (
              <div key={p.name} className="bg-[#1a1a1a] border border-white/5 p-8 rounded-[2.5rem] flex flex-col transition-all hover:border-[#C67D3D]/20">
                <h3 className="text-lg font-bold mb-2">{p.name}</h3>
                <div className="flex items-baseline gap-1 mb-1"><span className="text-3xl font-black text-white">{p.price}</span><span className="text-gray-500 text-xs">{p.sub}</span></div>
                {p.monthly ? <p className="text-[#C67D3D] text-[10px] font-bold mb-6">{p.monthly}</p> : <div className="mb-6" />}
                <ul className="space-y-3 mb-8 flex-grow">{p.features.map(f => <li key={f} className="flex items-center gap-3 text-xs text-gray-400"><CheckCircle2 className="text-[#C67D3D] w-4 h-4 shrink-0" />{f}</li>)}</ul>
                <button onClick={() => openCheckout(p.name, p.price)} className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-bold text-sm">Assinar Agora</button>
              </div>
            ))}
            <div className="bg-[#1a1a1a] border-2 border-[#C67D3D] p-8 rounded-[2.5rem] flex flex-col relative transform xl:scale-105 shadow-2xl shadow-[#C67D3D]/10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#C67D3D] to-[#EA580C] text-white px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest whitespace-nowrap">Melhor Custo-Benefício</div>
              <h3 className="text-lg font-bold mb-2">Plano Anual</h3>
              <div className="flex items-baseline gap-1 mb-1"><span className="text-4xl font-black text-white">R$ 497,00</span><span className="text-gray-500 text-xs">/ano</span></div>
              <p className="text-[#C67D3D] text-[10px] font-bold mb-6">R$ 41,40 por mês</p>
              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-center gap-3 text-xs text-white font-medium"><CheckCircle2 className="text-[#C67D3D] w-4 h-4 shrink-0" />Economia R$ 221,00</li>
                {['Funções Pro', 'Suporte Prioritário', 'Atualizações'].map(f => <li key={f} className="flex items-center gap-3 text-xs text-gray-400"><CheckCircle2 className="text-[#C67D3D] w-4 h-4 shrink-0" />{f}</li>)}
              </ul>
              <button onClick={() => openCheckout('Anual', 'R$ 497,00')} className="w-full bg-gradient-to-r from-[#C67D3D] to-[#EA580C] hover:brightness-110 text-white py-3 rounded-xl font-black text-sm">ASSINAR AGORA</button>
            </div>
            <div className="bg-[#1a1a1a] border border-white/5 p-8 rounded-[2.5rem] flex flex-col transition-all hover:border-[#C67D3D]/20">
              <h3 className="text-lg font-bold mb-2">Plano Vitalício</h3>
              <div className="flex items-baseline gap-1 mb-6"><span className="text-3xl font-black text-white">R$ 1.297,00</span></div>
              <ul className="space-y-3 mb-8 flex-grow">{['Pagamento Único', 'Sem Mensalidades', 'Licença Vitalícia', 'Empresa Ativa'].map(f => <li key={f} className="flex items-center gap-3 text-xs text-gray-400"><CheckCircle2 className="text-[#C67D3D] w-4 h-4 shrink-0" />{f}</li>)}</ul>
              <button onClick={() => openCheckout('Vitalício', 'R$ 1.297,00')} className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-bold text-sm">Comprar Licença</button>
            </div>
          </div>
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 bg-[#C67D3D]/10 border border-[#C67D3D]/20 px-6 py-2 rounded-full">
              <ShieldCheck className="w-4 h-4 text-[#C67D3D]" /><span className="text-[#C67D3D] text-xs font-bold">Taxa de ativação ISENTA esta semana • PIX · Boleto · Cartão até 12x</span>
            </div>
          </div>
        </div>
      </section>

      <LicenseActivation />

      <section id="faq" className="py-24 bg-[#0a0a0a]">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl font-black mb-12 text-center">Perguntas Técnicas</h2>
          <div className="space-y-2">
            <FAQItem question="O software funciona sem internet?" answer="Sim. A internet só é necessária para a ativação inicial e atualizações opcionais." />
            <FAQItem question="Quais os requisitos do sistema?" answer="Roda em qualquer computador com Windows 7 ou superior. Consome pouquíssima memória RAM." />
            <FAQItem question="Posso importar meus dados de planilhas?" answer="Sim! O sistema possui um módulo de importação via Excel/CSV." />
            <FAQItem question="Quais formas de pagamento são aceitas?" answer="PIX (aprovação imediata), Boleto Bancário e Cartão de Crédito em até 6x sem juros ou até 12x com juros de 2,99% a.m." />
            <FAQItem question="Como funciona o licenciamento?" answer="Planos de assinatura flexíveis ou licença vitalícia para uso contínuo." />
          </div>
        </div>
      </section>

      <footer className="pt-16 pb-32 border-t border-white/5 bg-[#080808] relative z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 overflow-hidden"><img src={logoR3D} alt="Logo" className="w-full h-full object-contain" /></div><span className="text-xl font-bold text-white">R3D <span className="text-[#C67D3D]">Pro</span></span></div>
              <p className="text-gray-500 text-sm max-w-xs leading-relaxed">A solução definitiva para gestão de impressão 3D profissional.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Navegação</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li><a href="#features" className="hover:text-[#C67D3D] transition-colors">Funcionalidades</a></li>
                <li><a href="#security" className="hover:text-[#C67D3D] transition-colors">Segurança</a></li>
                <li><a href="#pricing" className="hover:text-[#C67D3D] transition-colors">Preços</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Legal</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li><button onClick={() => setIsTermsOpen(true)} className="hover:text-[#C67D3D] transition-colors">Termos de Uso</button></li>
                <li><a href="#" className="hover:text-[#C67D3D] transition-colors">Privacidade</a></li>
                <li><button onClick={() => setIsTermsOpen(true)} className="hover:text-[#C67D3D] transition-colors">Licenciamento</button></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-gray-600 uppercase tracking-widest font-medium">
            <div>© 2026 R3D Print Manager Pro. Todos os direitos reservados.</div>
            <div className="flex gap-6 items-center">
              <span>Desenvolvido no Brasil</span>
              <span className="text-[#C67D3D]">v2.5.0 Stable</span>
              <a href="/admin/cupons" onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/admin/cupons'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="hover:text-white transition-colors border-l border-white/10 pl-6 flex items-center gap-2"><ShieldCheck className="w-3 h-3 text-[#C67D3D]" />Painel Admin</a>
            </div>
          </div>
        </div>
      </footer>

      <a href="https://api.whatsapp.com/send?phone=5511951161563&text=Ol%C3%A1+Acabei+de+assinar+um+plano%2C+como+proceder+agora%3F" target="_blank" rel="noopener noreferrer" className="fixed bottom-8 right-8 z-40 bg-[#25D366] hover:bg-[#128C7E] text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 group">
        <MessageCircle className="w-8 h-8" />
        <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-white text-black px-4 py-2 rounded-xl text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">Fale Conosco</span>
      </a>
    </div>
  );
}
