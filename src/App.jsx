import React, { useState, useEffect } from 'react';
import {
  Menu, X, ChevronRight, Zap, Volume2, Settings, MessageCircle, Activity,
  ShieldCheck, Wrench, Star, PlayCircle, CheckCircle2, UserPlus, Send
} from 'lucide-react';

/* ── Image constants ─────────────────────────────────────────── */
const LOGO_SRC = '/images/logo.png';
const HERO_BG  = 'https://drive.google.com/thumbnail?id=1G3y845m2OTvSpoDjUG4v59Tx6G--VMtY&sz=w2400';
const PROD_BG  = 'https://drive.google.com/thumbnail?id=1Fw5aLkbJZvHxIeu7NtegJnRSE_aO1UiA&sz=w2400';
const LINE_URL  = 'https://lin.ee/nZOMcph';
// ↓ Google Apps Script Web App URL (deployment เดียว ใช้ทั้ง forms + visit tracking)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxGc0JZJkZ0MtW73_MldOdcc-ILttkvcA5G_16-0MwhjrLtWLSFTlQrMdD3W-g-dmqIDg/exec';

// ─── Watermark Component ──────────────────────────────────────────────────────
// ใส่ลายน้ำโลโก้ทับรูปอัตโนมัติ (Portfolio + HKS)
// ค่า: opacity 22%, เฉียง -30°, ระยะห่าง 1.5x, โลโก้ 28% ของรูป
const WatermarkedImage = ({ src, alt, className }) => {
  const overlayStyle = {
    position: 'absolute',
    inset: '-60%',
    width: '220%',
    height: '220%',
    backgroundImage: 'url(/images/logo.png)',
    backgroundRepeat: 'repeat',
    backgroundSize: '19%',   // 42% ของ container ÷ 220% = ~19% ของ overlay
    opacity: 0.22,
    transform: 'rotate(-30deg)',
    pointerEvents: 'none',
    zIndex: 10,
  };
  return (
    <>
      <img src={src} alt={alt} className={className} />
      <div style={overlayStyle} />
    </>
  );
};

// ส่งข้อมูล Lead → Apps Script (sheet write, no-cors)
async function submitToSheets(payload) {
  if (!GOOGLE_SCRIPT_URL) return;
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ ...payload, timestamp: new Date().toLocaleString('th-TH') }),
    });
  } catch (_) {}
}

// แจ้ง server → ส่ง email notification (fire-and-forget)
function notifyServer(payload) {
  fetch('/api/notify-lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

// --- MAIN APP COMPONENT (Handles Routing) ---
const ShiftupApp = () => {
  const [activePage, setActivePage] = useState('home');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDashPw, setShowDashPw] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activePage]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track page visits
  useEffect(() => {
    const KEY = 'shiftup_sid';
    const isFirst = !sessionStorage.getItem(KEY);
    let sid = sessionStorage.getItem(KEY);
    if (!sid) { sid = Math.random().toString(36).slice(2) + Date.now(); sessionStorage.setItem(KEY, sid); }

    const ua  = navigator.userAgent;
    const device = /Mobi|Android/i.test(ua) ? 'mobile' : 'desktop';
    const referrer = isFirst ? (document.referrer || '') : '';
    const language = navigator.language || '';

    // detect browser + OS in browser (ส่งลง Sheet ได้)
    let detectedBrowser = 'Other';
    if      (/Edg\//i.test(ua))     detectedBrowser = 'Edge';
    else if (/OPR|Opera/i.test(ua)) detectedBrowser = 'Opera';
    else if (/Chrome/i.test(ua))    detectedBrowser = 'Chrome';
    else if (/Firefox/i.test(ua))   detectedBrowser = 'Firefox';
    else if (/Safari/i.test(ua))    detectedBrowser = 'Safari';

    let detectedOS = 'Other';
    if      (/Windows/i.test(ua))     detectedOS = 'Windows';
    else if (/Android/i.test(ua))     detectedOS = 'Android';
    else if (/iPhone|iPad/i.test(ua)) detectedOS = 'iOS';
    else if (/Mac OS X/i.test(ua))    detectedOS = 'macOS';
    else if (/Linux/i.test(ua))       detectedOS = 'Linux';

    const payload = {
      page: activePage, device, sessionId: sid, referrer, language,
      browser: detectedBrowser, os: detectedOS,
      isoTimestamp: new Date().toISOString(),
      timestamp: new Date().toLocaleString('th-TH'),
    };

    // 1. Server → dashboard memory + geo/ISP (province, city, ISP จาก IP)
    fetch('/api/track-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});

    // 2. Google Sheet → Image pixel tracking (ไม่มี CORS ปัญหาเลย, ไม่มี 400 จาก mode:no-cors)
    // Image.src ส่ง GET request ผ่าน img loader — Apps Script รับแล้ว doGet action=track บันทึก Visits
    try {
      const tp = new URLSearchParams({
        action:  'track',
        page:    payload.page,
        device:  payload.device,
        sid:     sid,
        browser: payload.browser,
        os:      payload.os,
        ref:     payload.referrer,
        language: payload.language,
      });
      new Image().src = 'https://script.google.com/macros/s/AKfycbxGc0JZJkZ0MtW73_MldOdcc-ILttkvcA5G_16-0MwhjrLtWLSFTlQrMdD3W-g-dmqIDg/exec?' + tp.toString();
    } catch (_) {}
  }, [activePage]);

  const lineUrl = "https://lin.ee/nZOMcph";

  const navigateTo = (page) => {
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  if (activePage === 'dashboard') {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans">
        <DashboardPage onBack={() => navigateTo('home')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-red-600 selection:text-white">
      {showDashPw && (
        <PasswordModal
          onSuccess={() => { setShowDashPw(false); setActivePage('dashboard'); }}
          onClose={() => setShowDashPw(false)}
        />
      )}

      {/* ── Shared Navigation ── */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800 shadow-lg' : 'bg-neutral-950/50 backdrop-blur-sm'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* Logo image */}
            <div className="flex-shrink-0 cursor-pointer" onClick={() => navigateTo('home')}>
              <img src={LOGO_SRC} alt="Shiftup Performance" className="h-20 w-auto" />
            </div>

            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-6 lg:space-x-8">
                <button onClick={() => navigateTo('home')} className={`hover:text-red-500 transition-colors px-3 py-2 text-sm font-medium tracking-wide ${activePage === 'home' ? 'text-red-500' : 'text-neutral-300'}`}>HOME</button>
                <button onClick={() => navigateTo('remap')} className={`hover:text-red-500 transition-colors px-3 py-2 text-sm font-medium tracking-wide ${activePage === 'remap' ? 'text-red-500' : 'text-neutral-300'}`}>REMAP</button>
                <button onClick={() => navigateTo('hks')} className={`hover:text-red-500 transition-colors px-3 py-2 text-sm font-medium tracking-wide ${activePage === 'hks' ? 'text-red-500' : 'text-neutral-300'}`}>HKS EXHAUST</button>
                <button onClick={() => navigateTo('panthera')} className={`hover:text-red-500 transition-colors px-3 py-2 text-sm font-medium tracking-wide ${activePage === 'panthera' ? 'text-red-500' : 'text-neutral-300'}`}>PANTHERA</button>
                <button onClick={() => navigateTo('partner')} className={`hover:text-red-500 transition-colors px-3 py-2 text-sm font-medium tracking-wide text-orange-400 ${activePage === 'partner' ? 'border-b-2 border-orange-400' : ''}`}>JOIN PARTNER</button>
              </div>
            </div>

            <div className="hidden md:block">
              <a href={lineUrl} target="_blank" rel="noreferrer" className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:shadow-[0_0_25px_rgba(220,38,38,0.6)] flex items-center gap-2">
                <MessageCircle size={18} />
                ปรึกษาช่างเทคนิค
              </a>
            </div>

            <div className="md:hidden flex items-center">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-neutral-300 hover:text-white">
                {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-neutral-900 border-b border-neutral-800 absolute w-full shadow-2xl">
            <div className="px-4 pt-2 pb-6 space-y-1 sm:px-3 flex flex-col gap-4">
              <button onClick={() => navigateTo('home')} className="block px-3 py-2 text-base font-medium text-white text-left">Home</button>
              <button onClick={() => navigateTo('remap')} className="block px-3 py-2 text-base font-medium text-white text-left">ECU Remap</button>
              <button onClick={() => navigateTo('hks')} className="block px-3 py-2 text-base font-medium text-white text-left">HKS Exhaust</button>
              <button onClick={() => navigateTo('panthera')} className="block px-3 py-2 text-base font-medium text-white text-left">Panthera Active Exhaust Sound</button>
              <button onClick={() => navigateTo('partner')} className="block px-3 py-2 text-base font-medium text-orange-400 text-left">สมัคร Partner / ทีมงาน</button>
              <a href={lineUrl} target="_blank" rel="noreferrer" className="mt-4 bg-red-600 text-white px-4 py-3 rounded-md text-center font-bold flex justify-center items-center gap-2">
                <MessageCircle size={18} /> คุยกับเราผ่าน LINE
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Page Content */}
      <div className="pt-20">
        {activePage === 'home'     && <HomePage navigateTo={navigateTo} lineUrl={lineUrl} />}
        {activePage === 'remap'    && <RemapPage />}
        {activePage === 'hks'      && <HKSPage />}
        {activePage === 'panthera' && <PantheraPage />}
        {activePage === 'partner'  && <PartnerPage />}
      </div>

      {/* ── Shared Footer ── */}
      <footer className="bg-neutral-950 border-t border-neutral-900 pt-16 pb-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div className="col-span-1 lg:col-span-2">
              {/* Footer logo image */}
              <div className="cursor-pointer mb-4 inline-block" onClick={() => navigateTo('home')}>
                <img src={LOGO_SRC} alt="Shiftup Performance" className="h-24 w-auto" />
              </div>
              <p className="text-neutral-500 max-w-sm mb-6">
                Performance tuning, exhaust selection, and the next sound experience for selected vehicles. By P2W Interplus.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Quick Links</h4>
              <ul className="space-y-3 text-neutral-400">
                <li><button onClick={() => navigateTo('remap')} className="hover:text-white transition-colors">ECU Remap</button></li>
                <li><button onClick={() => navigateTo('hks')} className="hover:text-white transition-colors">HKS Exhaust</button></li>
                <li><button onClick={() => navigateTo('panthera')} className="hover:text-white transition-colors">Panthera Active Exhaust Sound</button></li>
                <li><button onClick={() => navigateTo('partner')} className="hover:text-orange-400 text-orange-500 transition-colors font-medium">ร่วมงานกับเรา (Partner)</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Contact Info</h4>
              <ul className="space-y-3 text-neutral-400">
                <li><a href="tel:0830092554" className="hover:text-white transition-colors">Tel: 083-009-2554 (ปิง)</a></li>
                <li><a href="tel:0887888364" className="hover:text-white transition-colors">Tel: 088-788-8364</a></li>
                <li><a href={lineUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors text-[#06C755]">LINE: @shiftup</a></li>
                <li><a href="https://www.facebook.com/shiftupperformance" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Facebook Page</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-neutral-900 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-neutral-600 text-sm">
              &copy; {new Date().getFullYear()} Shiftup Performance. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* ── Hidden Dashboard gear — หน้าแรกเท่านั้น ── */}
      {activePage === 'home' && (
        <button
          onClick={() => setShowDashPw(true)}
          title="Admin Dashboard"
          className="fixed bottom-6 right-6 w-9 h-9 rounded-full bg-neutral-900/40 hover:bg-neutral-700 border border-neutral-800/50 flex items-center justify-center text-neutral-700 hover:text-neutral-300 transition-all duration-300 z-50 opacity-30 hover:opacity-100"
          style={{ fontSize: '14px' }}>
          ⚙
        </button>
      )}
    </div>
  );
};

// --- HOME PAGE ---
const HomePage = ({ navigateTo, lineUrl }) => {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative pt-12 pb-20 lg:pt-32 lg:pb-32 overflow-hidden flex items-center min-h-[85vh]">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          {/* Background photo from Google Drive */}
          <img
            src={HERO_BG}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center opacity-20"
          />
          <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] bg-red-600/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[40vw] h-[40vw] bg-blue-600/10 rounded-full blur-[100px]"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 w-full">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800/50 border border-neutral-700 backdrop-blur-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-xs font-semibold tracking-wider text-neutral-300 uppercase">Performance by P2W Interplus</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.1] tracking-tighter mb-6">
              Shiftup<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                Performance
              </span>
            </h1>
            <p className="text-lg lg:text-xl text-neutral-400 mb-10 max-w-2xl leading-relaxed">
              ไม่ใช่แค่การจูนรถ แต่คือการสร้างคาแรกเตอร์ใหม่ให้สอดรับกับสไตล์คุณ ปลดล็อกสมรรถนะที่ซ่อนอยู่ด้วยการทำ <strong>ECU Remap</strong> พร้อมยกระดับสุ้มเสียงด้วย <strong>HKS Exhaust</strong> และนวัตกรรม <strong>Active Exhaust Sound</strong> สำหรับ รถน้ำมัน และรถEV
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href={lineUrl} target="_blank" rel="noreferrer" className="bg-white text-black hover:bg-neutral-200 px-8 py-4 rounded-full font-bold text-center transition-colors flex items-center justify-center gap-2">
                ประเมินรถกับทีมงาน <ChevronRight size={20} />
              </a>
              <button
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 rounded-full font-bold text-center border border-neutral-700 hover:bg-neutral-800 transition-colors text-white"
              >
                ดูบริการของเรา
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div className="border-y border-neutral-800 bg-neutral-900/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-neutral-800">
            <div className="flex flex-col items-center pt-4 md:pt-0">
              <Settings className="text-red-500 mb-3" size={32} />
              <h3 className="text-white font-bold text-lg mb-1">Engineering Specialist</h3>
              <p className="text-sm text-neutral-400">เชี่ยวชาญพิเศษ ประสบการณ์ตรง สู่สมรรถนะที่เหนือกว่า</p>
            </div>
            <div className="flex flex-col items-center pt-8 md:pt-0">
              <Activity className="text-red-500 mb-3" size={32} />
              <h3 className="text-white font-bold text-lg mb-1">Fit Before Flash</h3>
              <p className="text-sm text-neutral-400">วิเคราะห์โจทย์และสภาพรถอย่างละเอียด ก่อนตัดสินใจจูน</p>
            </div>
            <div className="flex flex-col items-center pt-8 md:pt-0">
              <MessageCircle className="text-red-500 mb-3" size={32} />
              <h3 className="text-white font-bold text-lg mb-1">One Contact</h3>
              <p className="text-sm text-neutral-400">ดูแลเบ็ดเสร็จในที่เดียว จองคิว ปรึกษา จบผ่าน LINE</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Services ── */}
      <section id="services" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-red-500 font-bold tracking-widest text-sm uppercase mb-3">Core Services</h2>
            <h3 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">รถคันเดิม แต่ประสบการณ์ที่เหนือกว่าเดิม</h3>
            <p className="text-neutral-400 text-lg">คลิกที่บริการด้านล่างเพื่อดูรายละเอียดเชิงลึก ผลงาน และราคา</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 01 – ECU Remap */}
            <div
              onClick={() => navigateTo('remap')}
              className="group cursor-pointer bg-neutral-900 border border-neutral-800 hover:border-red-500/80 rounded-2xl p-8 transition-all duration-300 hover:bg-neutral-900/80 hover:shadow-[0_0_30px_rgba(220,38,38,0.15)] hover:-translate-y-2 relative overflow-hidden"
            >
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="text-red-500" />
              </div>
              <div className="w-14 h-14 bg-red-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="text-red-500" size={28} />
              </div>
              <h4 className="text-2xl font-bold text-white mb-3">ECU Remap</h4>
              <p className="text-neutral-400 mb-6 leading-relaxed">
                ปรับจูนให้เหนือขีดจำกัดยิ่งกว่าเดิมผ่านพอร์ต OBD2 ออกแบบกราฟเครื่องยนต์ใหม่ตามสภาพรถและสไตล์การขับขี่ของคุณโดยเฉพาะ (ลืมปัญหาเดิมๆไปได้เลย)
              </p>
              <ul className="space-y-2 mb-8 text-sm text-neutral-300">
                <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-green-500" /> สื่อสารโจทย์ชัดเจนก่อนเริ่มงาน</li>
                <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-green-500" /> คันเร่งตอบสนองไวขึ้น ขับสนุกขึ้น</li>
              </ul>
              <div className="text-red-500 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                ดูรายละเอียดและราคา <ChevronRight size={16} />
              </div>
            </div>

            {/* 02 – HKS Exhaust */}
            <div
              onClick={() => navigateTo('hks')}
              className="group cursor-pointer bg-neutral-900 border border-neutral-800 hover:border-orange-500/80 rounded-2xl p-8 transition-all duration-300 hover:bg-neutral-900/80 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)] hover:-translate-y-2 relative overflow-hidden"
            >
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="text-orange-500" />
              </div>
              <div className="w-14 h-14 bg-orange-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Wrench className="text-orange-500" size={28} />
              </div>
              <h4 className="text-2xl font-bold text-white mb-3">HKS Exhaust</h4>
              <p className="text-neutral-400 mb-6 leading-relaxed">
                ยกระดับสุ้มเสียงและภาพลักษณ์ ด้วยระบบท่อไอเสียแบรนด์ระดับโลก HKS เราช่วยเลือกสเปคที่พอดีกับรถคุณ ทั้งขับใช้งานประจำวันหรือสายซิ่ง
              </p>
              <ul className="space-y-2 mb-8 text-sm text-neutral-300">
                <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-green-500" /> สินค้าตรงรุ่น ติดตั้งง่าย ไม่ต้องดัดแปลง</li>
                <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-green-500" /> รับประกันสินค้า 2 ปีเต็มจากโรงงาน</li>
              </ul>
              <div className="text-orange-500 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                ดูรุ่นท่อและรายละเอียด <ChevronRight size={16} />
              </div>
            </div>

            {/* 03 – Panthera EV Sound */}
            <div
              onClick={() => navigateTo('panthera')}
              className="group cursor-pointer bg-neutral-900 border border-neutral-800 hover:border-blue-500/80 rounded-2xl p-8 transition-all duration-300 hover:bg-neutral-900/80 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:-translate-y-2 relative overflow-hidden"
            >
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="text-blue-500" />
              </div>
              <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Volume2 className="text-blue-500" size={28} />
              </div>
              <h4 className="text-2xl font-bold text-white mb-3">Panthera Active Exhaust Sound</h4>
              <p className="text-neutral-400 mb-6 leading-relaxed">
                เปิดมิติใหม่แห่งเสียงให้กับรถน้ำมัน และรถ EV ด้วยระบบ Active Exhaust Sound จาก Panthera สร้างความเร้าใจในทุกอัตราเร่ง
              </p>
              <ul className="space-y-2 mb-8 text-sm text-neutral-300">
                <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-green-500" /> ไม่มีการตัดต่อสายไฟ ประกันไม่ขาด</li>
                <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-green-500" /> ปรับแต่งเสียงได้หลากหลายคาแรกเตอร์</li>
              </ul>
              <div className="text-blue-500 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                ดูคลิปรีวิวและราคา <ChevronRight size={16} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

// ─── Remap Content Data Layer ────────────────────────────────────────────────
const DEFAULT_REMAP = {
  articles: [
    { id: 1, imgUrl: '', tag: 'KNOWLEDGE', title: 'ทำไมต้อง Fit Before Flash? ขั้นตอนสำคัญที่หลายคนมองข้าม', excerpt: 'การเช็คความพร้อมของฮาร์ดแวร์ก่อนปรับจูนซอฟต์แวร์ คือหัวใจสำคัญของความทนทาน...' },
    { id: 2, imgUrl: '', tag: 'KNOWLEDGE', title: 'ทำไมต้อง Fit Before Flash? ขั้นตอนสำคัญที่หลายคนมองข้าม', excerpt: 'การเช็คความพร้อมของฮาร์ดแวร์ก่อนปรับจูนซอฟต์แวร์ คือหัวใจสำคัญของความทนทาน...' },
    { id: 3, imgUrl: '', tag: 'KNOWLEDGE', title: 'ทำไมต้อง Fit Before Flash? ขั้นตอนสำคัญที่หลายคนมองข้าม', excerpt: 'การเช็คความพร้อมของฮาร์ดแวร์ก่อนปรับจูนซอฟต์แวร์ คือหัวใจสำคัญของความทนทาน...' },
  ],
  portfolio: [
    { id: 1, imgUrl: '', caption: 'Mazda 3 Skyactiv-G' },
    { id: 2, imgUrl: '', caption: 'Mazda 2 Diesel' },
    { id: 3, imgUrl: '', caption: 'Mazda CX-30' },
    { id: 4, imgUrl: '', caption: 'Mazda CX-5' },
    { id: 5, imgUrl: '', caption: 'Mazda 3 BM' },
    { id: 6, imgUrl: '', caption: 'Mazda 6' },
    { id: 7, imgUrl: '', caption: 'Mazda 2 Gasoline' },
    { id: 8, imgUrl: '', caption: 'Mazda MX-5' },
  ],
  reviews: [
    { id: 1, stars: 5, text: 'คันเร่งเบาขึ้นชัดเจน อาการรอรอบตอนออกตัวหายไปเลย ช่างอธิบายละเอียดมากว่ากราฟเดิมเป็นยังไง คุ้มค่าครับ', name: 'คุณ K.', car: 'Mazda 2 Diesel' },
    { id: 2, stars: 5, text: 'คันเร่งเบาขึ้นชัดเจน อาการรอรอบตอนออกตัวหายไปเลย ช่างอธิบายละเอียดมากว่ากราฟเดิมเป็นยังไง คุ้มค่าครับ', name: 'คุณ K.', car: 'Mazda 2 Diesel' },
    { id: 3, stars: 5, text: 'คันเร่งเบาขึ้นชัดเจน อาการรอรอบตอนออกตัวหายไปเลย ช่างอธิบายละเอียดมากว่ากราฟเดิมเป็นยังไง คุ้มค่าครับ', name: 'คุณ K.', car: 'Mazda 2 Diesel' },
  ],
  brandPricing: [
    {
      id: 1, brand: 'Mazda',
      packages: [
        { id: 1, name: 'Custom Tune เบนซิน', desc: 'สำหรับ Mazda 2', price: '3,900' },
        { id: 2, name: 'Custom Tune เบนซิน', desc: 'สำหรับ Mz3, Cx-3, Cx-30, Cx-5', price: '4,200' },
        { id: 3, name: 'Custom Tune เบนซิน', desc: 'สำหรับ Cx-8', price: '4,500' },
        { id: 4, name: 'Custom Tune ดีเซล',  desc: 'สำหรับรถดีเซล Mz2, Cx-3, Cx-5, Cx-8', price: '5,000' },
        { id: 5, name: 'Plus POP&BANG',      desc: 'สำหรับลูกค้าที่ต้องการเสียงเพาะๆ จับใจ', price: '+1,500' },
        { id: 6, name: 'Plus EGR DPF OFF',   desc: 'สำหรับรถที่ตัด DPF คิดเพิ่มจากราคาปกติ', price: '+3,000' },
      ],
    },
    {
      id: 2, brand: 'Honda',
      packages: [
        { id: 1, name: 'Custom Tune เบนซิน', desc: 'สำหรับ Civic, Jazz, City', price: 'สอบถาม' },
      ],
    },
    {
      id: 3, brand: 'Toyota',
      packages: [
        { id: 1, name: 'Custom Tune เบนซิน', desc: 'สำหรับ Yaris, Corolla, Camry', price: 'สอบถาม' },
      ],
    },
  ],
  perks: ['ฟรี! ตรวจเช็คค่าต่างๆ ก่อนจูน', 'On-Site Service'],
};

// ── บันทึกเนื้อหาไป GitHub ผ่าน server ───────────────────────────────────────
async function saveContent(section, data) {
  try {
    await fetch('/api/save-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section, data }),
    });
  } catch (_) {}
}

// ─── HKS Content Data Layer ───────────────────────────────────────────────────
const HKS_BRANDS = ['Ford', 'BMW', 'Honda', 'Isuzu', 'Mazda', 'Mitsubishi', 'Toyota', 'Nissan'];
const HKS_PER_PAGE = 12;

const DEFAULT_HKS = { pipes: [] };

// ─── Panthera Content Data Layer ─────────────────────────────────────────────
const DEFAULT_PANTHERA = {
  videos: [
    { id: 1, title: 'ทดสอบเสียง V8 Muscle ในรถ BYD Seal',       youtubeUrl: '', length: '03:45' },
    { id: 2, title: 'Panthera App Walkthrough สอนปรับจูนเสียง',  youtubeUrl: '', length: '05:20' },
    { id: 3, title: 'รีวิวขับจริง อารมณ์เปลี่ยนไปแค่ไหน?',    youtubeUrl: '', length: '08:15' },
    { id: 4, title: 'เสียงสไตล์ Futuristic Hypercar',            youtubeUrl: '', length: '02:30' },
  ],
  pricing: [
    { id: 1, name: 'Single Speaker Unit',     desc: 'ลำโพงเดี่ยว + กล่องคอนโทรล + แอปพลิเคชัน (เหมาะสำหรับรถเก๋ง/SUV ทั่วไป)',                          price: 'XX,XXX.-' },
    { id: 2, name: 'Dual Speaker Unit (Pro)', desc: 'ลำโพงคู่ + กล่องคอนโทรล + แอปพลิเคชัน (เพิ่มมิติและความดัง เหมาะสำหรับรถคันใหญ่)',             price: 'XX,XXX.-' },
  ],
};


// ─── 3D Portfolio Slideshow ───────────────────────────────────────────────────
const Portfolio3DSlideshow = ({ items }) => {
  const [current, setCurrent] = useState(0);
  const [hovered, setHovered] = useState(false);
  const total = items.length;

  useEffect(() => {
    if (hovered || total < 2) return;
    const t = setInterval(() => setCurrent(c => (c + 1) % total), 3500);
    return () => clearInterval(t);
  }, [hovered, total]);

  const goTo = (i) => setCurrent((i + total) % total);

  if (total === 0) return (
    <div className="h-64 flex items-center justify-center text-neutral-600 text-sm">
      ยังไม่มีภาพผลงาน — เพิ่มผ่าน Admin
    </div>
  );

  return (
    <div className="relative select-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>

      {/* 3D Stage */}
      <div className="relative h-64 sm:h-80 md:h-[30rem] flex items-center justify-center"
        style={{ perspective: '1400px' }}>

        {items.map((item, i) => {
          let off = i - current;
          if (off > total / 2)  off -= total;
          if (off < -total / 2) off += total;
          const abs = Math.abs(off);
          if (abs > 2) return null;

          return (
            <div key={item.id}
              className="absolute rounded-2xl overflow-hidden border border-neutral-700 shadow-2xl"
              style={{
                width: 'min(420px, 78vw)',
                aspectRatio: '4/3',
                cursor: abs === 0 ? 'default' : 'pointer',
                transform: `rotateY(${off * 38}deg) translateX(${off * 50}%) translateZ(${-abs * 130}px) scale(${1 - abs * 0.18})`,
                opacity: abs === 0 ? 1 : abs === 1 ? 0.72 : 0.42,
                zIndex: 10 - abs * 3,
                transition: 'all 0.55s cubic-bezier(0.25,0.46,0.45,0.94)',
              }}
              onClick={() => abs > 0 && goTo(i)}>

              {item.imgUrl
                ? <WatermarkedImage src={item.imgUrl} alt={item.caption} className="w-full h-full object-cover pointer-events-none" />
                : <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                    <span className="text-neutral-600 text-sm text-center px-4">{item.caption || `ภาพผลงาน ${i + 1}`}</span>
                  </div>}

              {abs === 0 && item.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <span className="text-white font-bold text-sm">{item.caption}</span>
                </div>
              )}
              {abs > 0 && <div className="absolute inset-0 bg-black/25 pointer-events-none" />}
            </div>
          );
        })}
      </div>

      {/* Arrows */}
      <button onClick={() => goTo(current - 1)}
        className="absolute left-0 top-[calc(50%-2.5rem)] z-20 w-10 h-10 rounded-full bg-neutral-900/80 hover:bg-red-600 border border-neutral-700 text-white flex items-center justify-center transition-all text-sm font-bold shadow-lg">◀</button>
      <button onClick={() => goTo(current + 1)}
        className="absolute right-0 top-[calc(50%-2.5rem)] z-20 w-10 h-10 rounded-full bg-neutral-900/80 hover:bg-red-600 border border-neutral-700 text-white flex items-center justify-center transition-all text-sm font-bold shadow-lg">▶</button>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-5">
        {items.map((_, i) => (
          <button key={i} onClick={() => goTo(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-red-500' : 'w-2 bg-neutral-700 hover:bg-neutral-500'}`} />
        ))}
      </div>
    </div>
  );
};

// ─── Reviews Infinite Auto-scroll Carousel ────────────────────────────────────
const ReviewsCarousel = ({ reviews }) => {
  const [paused, setPaused] = useState(false);
  if (!reviews.length) return null;

  const CARD_W = 320;
  const GAP    = 24;
  const totalW = reviews.length * (CARD_W + GAP);

  return (
    <div className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}>

      <style>{`@keyframes reviewScroll{from{transform:translateX(0)}to{transform:translateX(-${totalW}px)}}`}</style>

      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-neutral-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-neutral-950 to-transparent z-10 pointer-events-none" />

      <div className="flex pb-2" style={{
        gap: `${GAP}px`,
        width: `${totalW * 2}px`,
        animation: `reviewScroll ${reviews.length * 9}s linear infinite`,
        animationPlayState: paused ? 'paused' : 'running',
      }}>
        {[...reviews, ...reviews].map((rev, i) => (
          <div key={i}
            className="flex-shrink-0 bg-neutral-900 p-6 rounded-2xl border border-neutral-800"
            style={{ width: `${CARD_W}px` }}>
            <div className="flex text-yellow-500 mb-3">
              {[...Array(rev.stars)].map((_, s) => <Star key={s} fill="currentColor" size={16} />)}
            </div>
            <p className="text-neutral-300 text-sm mb-4 italic leading-relaxed line-clamp-4">"{rev.text}"</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center text-neutral-500 font-bold text-sm flex-shrink-0">
                {rev.name.charAt(rev.name.length - 1)}
              </div>
              <div>
                <p className="text-white font-bold text-sm">{rev.name}</p>
                <p className="text-neutral-500 text-xs">{rev.car}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Admin Panel ──────────────────────────────────────────────────────────────
const AdminPanel = ({ data, onSave, onClose }) => {
  const [tab, setTab] = useState('articles');
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(data)));

  const upArt  = (i,f,v) => { const a=[...draft.articles];  a[i]={...a[i],[f]:v}; setDraft({...draft,articles:a}); };
  const upPort = (i,f,v) => { const p=[...draft.portfolio]; p[i]={...p[i],[f]:v}; setDraft({...draft,portfolio:p}); };
  const upRev  = (i,f,v) => { const r=[...draft.reviews];   r[i]={...r[i],[f]:v}; setDraft({...draft,reviews:r}); };
  const upPerk = (i,v) => { const p=[...draft.perks]; p[i]=v; setDraft({...draft,perks:p}); };

  const addArt  = ()  => setDraft({...draft, articles:  [...draft.articles,  {id:Date.now(),imgUrl:'',tag:'KNOWLEDGE',title:'',excerpt:''}]});
  const delArt  = (i) => { if(!window.confirm('ลบบทความนี้?'))return; setDraft({...draft, articles:  draft.articles.filter((_,j)=>j!==i)}); };
  const addPort = ()  => setDraft({...draft, portfolio: [...draft.portfolio, {id:Date.now(),imgUrl:'',caption:''}]});
  const delPort = (i) => { if(!window.confirm('ลบภาพนี้?'))return;    setDraft({...draft, portfolio: draft.portfolio.filter((_,j)=>j!==i)}); };
  const addRev  = ()  => setDraft({...draft, reviews:   [...draft.reviews,   {id:Date.now(),stars:5,text:'',name:'',car:''}]});
  const delRev  = (i) => { if(!window.confirm('ลบรีวิวนี้?'))return;   setDraft({...draft, reviews:   draft.reviews.filter((_,j)=>j!==i)}); };
  const addPerk = ()  => setDraft({...draft, perks: [...draft.perks, '']});
  const delPerk = (i) => setDraft({...draft, perks: draft.perks.filter((_,j)=>j!==i)});

  // brand-pricing helpers
  const upBrand     = (bi,f,v) => { const bp=[...draft.brandPricing]; bp[bi]={...bp[bi],[f]:v}; setDraft({...draft,brandPricing:bp}); };
  const addBrand    = ()       => setDraft({...draft, brandPricing:[...(draft.brandPricing||[]),{id:Date.now(),brand:'ยี่ห้อใหม่',packages:[]}]});
  const delBrand    = (bi)     => { if(!window.confirm('ลบยี่ห้อนี้?'))return; setDraft({...draft,brandPricing:draft.brandPricing.filter((_,j)=>j!==bi)}); };
  const upBrandPkg  = (bi,pi,f,v) => { const bp=[...draft.brandPricing]; const pkgs=[...bp[bi].packages]; pkgs[pi]={...pkgs[pi],[f]:v}; bp[bi]={...bp[bi],packages:pkgs}; setDraft({...draft,brandPricing:bp}); };
  const addBrandPkg = (bi)     => { const bp=[...draft.brandPricing]; bp[bi]={...bp[bi],packages:[...bp[bi].packages,{id:Date.now(),name:'',desc:'',price:''}]}; setDraft({...draft,brandPricing:bp}); };
  const delBrandPkg = (bi,pi)  => { if(!window.confirm('ลบรายการนี้?'))return; const bp=[...draft.brandPricing]; bp[bi]={...bp[bi],packages:bp[bi].packages.filter((_,j)=>j!==pi)}; setDraft({...draft,brandPricing:bp}); };

  const inputCls = 'w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 placeholder-neutral-600';
  const addBtn   = (label, fn) => (
    <button onClick={fn} className="w-full py-3 border-2 border-dashed border-neutral-700 hover:border-red-500 rounded-2xl text-neutral-500 hover:text-red-400 transition-colors font-bold text-sm mt-2 mb-6">
      {label}
    </button>
  );
  const tabs = [
    { key: 'articles',  label: '📝 บทความ' },
    { key: 'portfolio', label: '🖼️ Portfolio' },
    { key: 'reviews',   label: '⭐ รีวิว' },
    { key: 'pricing',   label: '💰 ราคา' },
  ];

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm overflow-auto">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6 border-b border-neutral-800 pb-6">
          <div>
            <h2 className="text-2xl font-black text-white">⚙️ Admin Panel — ECU Remap</h2>
            <p className="text-neutral-500 text-sm mt-1">กด + เพิ่ม / 🗑 ลบ แล้วกด "บันทึก" เพื่ออัปเดตหน้าเว็บ</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white text-2xl leading-none px-2">✕</button>
        </div>

        <div className="flex gap-2 mb-8 flex-wrap">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${tab === t.key ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Articles ── */}
        {tab === 'articles' && (
          <>
            {draft.articles.map((a, i) => (
              <div key={a.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-red-400 font-bold text-xs">บทความที่ {i + 1}</p>
                  <button onClick={() => delArt(i)} className="text-neutral-600 hover:text-red-500 text-xs transition-colors">🗑 ลบ</button>
                </div>
                <div className="space-y-3">
                  <div><label className="text-neutral-400 text-xs mb-1 block">รูปภาพปก (URL)</label>
                    <input className={inputCls} value={a.imgUrl} onChange={e => upArt(i,'imgUrl',e.target.value)} placeholder="https://..." /></div>
                  <div><label className="text-neutral-400 text-xs mb-1 block">Tag</label>
                    <input className={inputCls} value={a.tag} onChange={e => upArt(i,'tag',e.target.value)} placeholder="KNOWLEDGE" /></div>
                  <div><label className="text-neutral-400 text-xs mb-1 block">หัวข้อบทความ</label>
                    <input className={inputCls} value={a.title} onChange={e => upArt(i,'title',e.target.value)} /></div>
                  <div><label className="text-neutral-400 text-xs mb-1 block">เนื้อหาย่อ</label>
                    <textarea rows={2} className={inputCls} value={a.excerpt} onChange={e => upArt(i,'excerpt',e.target.value)} /></div>
                </div>
              </div>
            ))}
            {addBtn('+ เพิ่มบทความ', addArt)}
          </>
        )}

        {/* ── Portfolio ── */}
        {tab === 'portfolio' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {draft.portfolio.map((p, i) => (
                <div key={p.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-neutral-500 text-xs">ภาพที่ {i + 1}</p>
                    <button onClick={() => delPort(i)} className="text-neutral-600 hover:text-red-500 text-xs transition-colors">🗑 ลบ</button>
                  </div>
                  <div className="space-y-2">
                    <div><label className="text-neutral-400 text-xs mb-1 block">URL รูปภาพ</label>
                      <input className={inputCls} value={p.imgUrl} onChange={e => upPort(i,'imgUrl',e.target.value)} placeholder="https://..." /></div>
                    <div><label className="text-neutral-400 text-xs mb-1 block">คำบรรยาย</label>
                      <input className={inputCls} value={p.caption} onChange={e => upPort(i,'caption',e.target.value)} placeholder="เช่น Mazda 3 Skyactiv-G" /></div>
                  </div>
                </div>
              ))}
            </div>
            {addBtn('+ เพิ่มภาพผลงาน', addPort)}
          </>
        )}

        {/* ── Reviews ── */}
        {tab === 'reviews' && (
          <>
            {draft.reviews.map((r, i) => (
              <div key={r.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-neutral-500 text-xs">รีวิวที่ {i + 1}</p>
                  <button onClick={() => delRev(i)} className="text-neutral-600 hover:text-red-500 text-xs transition-colors">🗑 ลบ</button>
                </div>
                <div className="space-y-3">
                  <div><label className="text-neutral-400 text-xs mb-1 block">ข้อความรีวิว</label>
                    <textarea rows={3} className={inputCls} value={r.text} onChange={e => upRev(i,'text',e.target.value)} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-neutral-400 text-xs mb-1 block">ชื่อผู้รีวิว</label>
                      <input className={inputCls} value={r.name} onChange={e => upRev(i,'name',e.target.value)} placeholder="คุณ K." /></div>
                    <div><label className="text-neutral-400 text-xs mb-1 block">รุ่นรถ</label>
                      <input className={inputCls} value={r.car} onChange={e => upRev(i,'car',e.target.value)} placeholder="Mazda 2 Diesel" /></div>
                  </div>
                </div>
              </div>
            ))}
            {addBtn('+ เพิ่มรีวิว', addRev)}
          </>
        )}

        {/* ── Pricing (Brand-based) ── */}
        {tab === 'pricing' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-white font-bold mb-3">ราคาตามยี่ห้อรถ</h3>
              {(draft.brandPricing||[]).map((bp, bi) => (
                <div key={bp.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 mb-4">
                  {/* Brand name row */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1">
                      <label className="text-neutral-400 text-xs mb-1 block">ยี่ห้อรถ</label>
                      <input className={inputCls + ' font-bold'} value={bp.brand}
                        onChange={e => upBrand(bi,'brand',e.target.value)} placeholder="เช่น Mazda, Honda" />
                    </div>
                    <button onClick={() => delBrand(bi)}
                      className="text-neutral-600 hover:text-red-500 text-xs transition-colors mt-4 shrink-0">🗑 ลบยี่ห้อ</button>
                  </div>
                  {/* Packages for this brand */}
                  {bp.packages.map((pkg, pi) => (
                    <div key={pkg.id} className="bg-neutral-950 border border-neutral-700 rounded-xl p-4 mb-2">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-neutral-500 text-xs">รายการที่ {pi + 1}</p>
                        <button onClick={() => delBrandPkg(bi,pi)}
                          className="text-neutral-600 hover:text-red-500 text-xs transition-colors">🗑 ลบ</button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div><label className="text-neutral-400 text-xs mb-1 block">ชื่อ</label>
                          <input className={inputCls} value={pkg.name} onChange={e => upBrandPkg(bi,pi,'name',e.target.value)} /></div>
                        <div><label className="text-neutral-400 text-xs mb-1 block">คำอธิบาย</label>
                          <input className={inputCls} value={pkg.desc} onChange={e => upBrandPkg(bi,pi,'desc',e.target.value)} /></div>
                        <div><label className="text-neutral-400 text-xs mb-1 block">ราคา</label>
                          <input className={inputCls} value={pkg.price} onChange={e => upBrandPkg(bi,pi,'price',e.target.value)} placeholder="3,900 หรือ +1,500" /></div>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => addBrandPkg(bi)}
                    className="w-full py-2 mt-2 border border-dashed border-neutral-700 hover:border-red-500 rounded-xl text-neutral-500 hover:text-red-400 transition-colors text-sm font-bold">
                    + เพิ่มรายการราคา
                  </button>
                </div>
              ))}
              {addBtn('+ เพิ่มยี่ห้อรถ', addBrand)}
            </div>
            <div>
              <h3 className="text-white font-bold mb-3">สิ่งที่รวมอยู่ในราคา (✓)</h3>
              {draft.perks.map((perk, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input className={inputCls} value={perk} onChange={e => upPerk(i, e.target.value)} />
                  <button onClick={() => delPerk(i)} className="text-neutral-600 hover:text-red-500 transition-colors px-2 text-sm">🗑</button>
                </div>
              ))}
              <button onClick={addPerk} className="text-neutral-500 hover:text-red-400 text-sm transition-colors font-bold mt-1">+ เพิ่มรายการ</button>
            </div>
          </div>
        )}

        <div className="flex gap-4 mt-10 pt-6 border-t border-neutral-800">
          <button onClick={() => onSave(draft)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-xl flex items-center gap-2 transition-colors">
            <CheckCircle2 size={18} /> บันทึกและอัปเดตหน้าเว็บ
          </button>
          <button onClick={onClose} className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold px-8 py-3 rounded-xl transition-colors">
            ยกเลิก
          </button>
          <button onClick={() => { if(window.confirm('รีเซ็ตเนื้อหากลับค่าเริ่มต้น?')){ onSave(DEFAULT_REMAP); } }}
            className="ml-auto text-neutral-600 hover:text-red-500 text-sm transition-colors">
            รีเซ็ตเป็นค่าเริ่มต้น
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Admin Password Gate ──────────────────────────────────────────────────────
const ADMIN_PASS = 'Chev9872';

const PasswordModal = ({ onSuccess, onClose }) => {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);
  const [shake, setShake] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (pw === ADMIN_PASS) { onSuccess(); }
    else {
      setErr(true); setShake(true); setPw('');
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className={`bg-neutral-900 border ${err ? 'border-red-600' : 'border-neutral-700'} rounded-2xl p-8 w-full max-w-sm shadow-2xl transition-all ${shake ? 'animate-[shake_0.4s_ease]' : ''}`}
        style={shake ? { animation: 'shake 0.4s ease' } : {}}>
        <div className="text-center mb-6">
          <span className="text-3xl">🔒</span>
          <h3 className="text-white font-black text-xl mt-2">Admin Access</h3>
          <p className="text-neutral-500 text-sm mt-1">กรอกรหัสผ่านเพื่อแก้ไขเนื้อหา</p>
        </div>
        <form onSubmit={submit}>
          <input
            type="password"
            autoFocus
            value={pw}
            onChange={(e) => { setPw(e.target.value); setErr(false); }}
            placeholder="รหัสผ่าน"
            className={`w-full bg-neutral-950 border ${err ? 'border-red-500' : 'border-neutral-700'} rounded-xl px-4 py-3 text-white text-center text-lg tracking-widest focus:outline-none focus:border-red-500 mb-2`}
          />
          {err && <p className="text-red-500 text-xs text-center mb-3">รหัสผ่านไม่ถูกต้อง</p>}
          <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl mt-2 transition-colors">
            เข้าสู่ระบบ
          </button>
          <button type="button" onClick={onClose} className="w-full text-neutral-500 hover:text-neutral-300 text-sm mt-3 transition-colors">
            ยกเลิก
          </button>
        </form>
      </div>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>
    </div>
  );
};

// --- PAGE 2: ECU REMAP ---
const RemapPage = () => {
  const [data, setData] = useState(DEFAULT_REMAP);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('');

  useEffect(() => {
    fetch('/content.json')
      .then(r => r.json())
      .then(d => {
        if (d.remap) {
          setData(d.remap);
          setSelectedBrand(d.remap.brandPricing?.[0]?.brand || '');
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = (newData) => {
    setData(newData);
    setShowAdmin(false);
    if (!newData.brandPricing?.find(b => b.brand === selectedBrand)) {
      setSelectedBrand(newData.brandPricing?.[0]?.brand || '');
    }
    saveContent('remap', newData);
  };

  const handleAdminClick = () => setShowPassword(true);
  const handlePasswordSuccess = () => { setShowPassword(false); setShowAdmin(true); };

  return (
    <div className="pb-24 relative">
      {/* ── Password Gate ── */}
      {showPassword && <PasswordModal onSuccess={handlePasswordSuccess} onClose={() => setShowPassword(false)} />}

      {/* ── Admin Panel Overlay ── */}
      {showAdmin && <AdminPanel data={data} onSave={handleSave} onClose={() => setShowAdmin(false)} />}

      {/* ── Hero ── */}
      <div className="bg-neutral-900 border-b border-neutral-800 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Zap className="text-red-500 w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">ECU Remap</h1>
          <p className="text-xl text-neutral-400">ปลดล็อกพลังแฝง ปรับจูนให้ตรงสไตล์คุณ ขับสนุกขึ้น ประหยัดขึ้น ในแบบที่คุณสัมผัสได้ทันที</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-24 mt-16">

        {/* ── Articles ── */}
        <section>
          <h2 className="text-3xl font-bold text-white mb-8 border-l-4 border-red-500 pl-4">บทความ & ความรู้ก่อนรีแมป</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.articles.map((art) => (
              <div key={art.id} className="bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 hover:border-neutral-600 transition-colors cursor-pointer group">
                <div className="h-48 bg-neutral-800 flex items-center justify-center overflow-hidden">
                  {art.imgUrl
                    ? <img src={art.imgUrl} alt={art.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <span className="text-neutral-600 text-sm">รูปภาพปกบทความ {art.id}</span>
                  }
                </div>
                <div className="p-6">
                  <div className="text-red-500 text-xs font-bold mb-2 tracking-widest">{art.tag}</div>
                  <h3 className="text-base font-bold text-white mb-2 leading-snug">{art.title}</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed">{art.excerpt}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Portfolio 3D Slideshow ── */}
        <section>
          <h2 className="text-3xl font-bold text-white mb-8 border-l-4 border-red-500 pl-4">ผลงานรีแมป (Portfolio)</h2>
          <Portfolio3DSlideshow items={data.portfolio} />
        </section>

        {/* ── Reviews Carousel ── */}
        <section>
          <h2 className="text-3xl font-bold text-white mb-8 border-l-4 border-red-500 pl-4">รีวิวจากผู้ใช้จริง</h2>
          <ReviewsCarousel reviews={data.reviews} />
        </section>

        {/* ── CTA จองคิว ── */}
        <div className="text-center py-4">
          <a href={LINE_URL} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white font-black text-xl px-12 py-5 rounded-full shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:shadow-[0_0_45px_rgba(220,38,38,0.6)] transition-all">
            <MessageCircle size={24} /> จองคิวเลย
          </a>
        </div>

        {/* ── Pricing + Form ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <section className="bg-gradient-to-br from-neutral-900 to-neutral-950 p-8 rounded-3xl border border-neutral-800">
            <h2 className="text-3xl font-bold text-white mb-2">อัตราค่าบริการ (Pricing)</h2>
            <p className="text-neutral-400 mb-5">ราคามาตรฐาน พร้อมบริการเช็คความพร้อมก่อนและหลังจูน</p>

            {/* Brand tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {(data.brandPricing||[]).map(bp => (
                <button key={bp.id}
                  onClick={() => setSelectedBrand(bp.brand)}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                    selectedBrand === bp.brand
                      ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.4)]'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700'
                  }`}>
                  {bp.brand}
                </button>
              ))}
            </div>

            {/* Packages for selected brand */}
            <div className="space-y-3">
              {((data.brandPricing||[]).find(bp => bp.brand === selectedBrand)?.packages || []).map((pkg) => (
                <div key={pkg.id} className="bg-neutral-950 px-6 py-4 rounded-2xl border border-neutral-800 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-white">{pkg.name}</h3>
                    <p className="text-sm text-neutral-500">{pkg.desc}</p>
                  </div>
                  <div className="text-2xl font-black text-red-500 ml-4 shrink-0 whitespace-nowrap">
                    {pkg.price.startsWith('+') || pkg.price === 'สอบถาม' ? pkg.price : `฿ ${pkg.price}`}
                  </div>
                </div>
              ))}
            </div>

            <ul className="mt-8 space-y-2 text-sm text-neutral-400">
              {data.perks.map((perk, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-500 shrink-0" /> {perk}
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-neutral-900 p-8 rounded-3xl border border-neutral-800 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <MessageCircle className="text-red-500" /> ประเมินรถของคุณฟรี
            </h2>
            <form className="space-y-4" onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              const remapData = { source:'remap', name:fd.get('name'), contact:fd.get('contact'), car:fd.get('car'), location:fd.get('location'), detail:fd.get('detail') };
              await submitToSheets(remapData);
              notifyServer(remapData);
              alert('ส่งข้อมูลเรียบร้อย ทีมงานจะติดต่อกลับเร็วๆ นี้ครับ');
              e.target.reset();
            }}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">ชื่อ - นามสกุล *</label>
                  <input name="name" type="text" required className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500" placeholder="ระบุชื่อ" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">เบอร์ติดต่อ / LINE ID *</label>
                  <input name="contact" type="text" required className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500" placeholder="เบอร์โทร หรือไอดีไลน์" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">รุ่นรถ และ ปี (เช่น Mazda 2 ดีเซล 2018) *</label>
                <input name="car" type="text" required className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500" placeholder="ยี่ห้อ / รุ่น / เครื่องยนต์ / ปี" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">สถานที่ / เขตที่พักอาศัย</label>
                <input name="location" type="text" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500" placeholder="เพื่อประเมินการเดินทาง" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">รายละเอียดที่ต้องการ / อาการปัจจุบัน</label>
                <textarea name="detail" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 h-28 resize-none" placeholder="เช่น อยากได้ต้นจัดขึ้น, ปัจจุบันรถมีอาการอืดตอนออกตัว, มีของแต่งอะไรใส่มาบ้างแล้ว" />
              </div>
              <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
                <Send size={18} /> ส่งข้อมูลเพื่อรับคำปรึกษา
              </button>
            </form>
          </section>
        </div>
      </div>

      {/* ── Hidden Admin Button (bottom-right corner) ── */}
      <button
        onClick={handleAdminClick}
        title="Admin"
        className="fixed bottom-6 right-6 w-9 h-9 rounded-full bg-neutral-900/40 hover:bg-neutral-700 border border-neutral-800/50 flex items-center justify-center text-neutral-700 hover:text-neutral-300 transition-all duration-300 z-50 opacity-30 hover:opacity-100"
        style={{ fontSize: '14px' }}
      >
        ⚙
      </button>
    </div>
  );
};

// ─── HKS Admin Panel ──────────────────────────────────────────────────────────
const HKSAdminPanel = ({ data, onSave, onClose }) => {
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(data)));

  const inputCls = 'w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500 placeholder-neutral-600';

  const updatePipe = (i, field, val) => {
    const pipes = [...draft.pipes];
    pipes[i] = { ...pipes[i], [field]: val };
    setDraft({ ...draft, pipes });
  };

  const addPipe = () => {
    const newId = Date.now();
    setDraft({ ...draft, pipes: [...draft.pipes, { id: newId, brand: 'Mazda', model: '', type: '', desc: '', price: '', imgUrl: '' }] });
  };

  const deletePipe = (i) => {
    if (!window.confirm('ลบรายการนี้?')) return;
    setDraft({ ...draft, pipes: draft.pipes.filter((_, idx) => idx !== i) });
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm overflow-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b border-neutral-800 pb-6">
          <div>
            <h2 className="text-2xl font-black text-white">⚙️ Admin Panel — HKS Exhaust</h2>
            <p className="text-neutral-500 text-sm mt-1">จัดการรายการท่อ · กรอกข้อมูลให้ครบ (ยี่ห้อ + รุ่นรถ + ชื่อท่อ) ถึงจะแสดงบนหน้าเว็บ</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white text-2xl leading-none px-2">✕</button>
        </div>

        {/* Pipe list */}
        <div className="space-y-4 mb-6">
          {draft.pipes.length === 0 && (
            <p className="text-center text-neutral-600 py-8">ยังไม่มีรายการท่อ — กด "เพิ่มท่อใหม่" ด้านล่าง</p>
          )}
          {draft.pipes.map((pipe, i) => (
            <div key={pipe.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-orange-400 font-bold text-xs">รายการที่ {i + 1} {pipe.model ? `— ${pipe.brand} ${pipe.model}` : '(ยังไม่กรอกข้อมูล)'}</p>
                <button onClick={() => deletePipe(i)} className="text-neutral-600 hover:text-red-500 text-xs transition-colors">🗑 ลบ</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 text-xs mb-1 block">ยี่ห้อรถ (Brand) *</label>
                  <select className={inputCls} value={pipe.brand} onChange={e => updatePipe(i, 'brand', e.target.value)}>
                    {HKS_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-neutral-400 text-xs mb-1 block">รุ่นรถ (Model) *</label>
                  <input className={inputCls} value={pipe.model} onChange={e => updatePipe(i, 'model', e.target.value)} placeholder="เช่น Mazda 3 (BP) หรือ Civic FE" />
                </div>
                <div>
                  <label className="text-neutral-400 text-xs mb-1 block">ชื่อท่อ HKS (Type) *</label>
                  <input className={inputCls} value={pipe.type} onChange={e => updatePipe(i, 'type', e.target.value)} placeholder="เช่น Legamax Premium" />
                </div>
                <div>
                  <label className="text-neutral-400 text-xs mb-1 block">ราคา</label>
                  <input className={inputCls} value={pipe.price} onChange={e => updatePipe(i, 'price', e.target.value)} placeholder="เช่น ฿XX,XXX หรือ สอบถาม" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-neutral-400 text-xs mb-1 block">รายละเอียด</label>
                  <textarea rows={2} className={inputCls} value={pipe.desc} onChange={e => updatePipe(i, 'desc', e.target.value)} placeholder="คำอธิบายสั้นๆ เกี่ยวกับท่อรุ่นนี้" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-neutral-400 text-xs mb-1 block">URL รูปภาพ</label>
                  <input className={inputCls} value={pipe.imgUrl} onChange={e => updatePipe(i, 'imgUrl', e.target.value)} placeholder="https://... หรือ /images/hks1.jpg" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add button */}
        <button
          onClick={addPipe}
          className="w-full py-4 border-2 border-dashed border-neutral-700 hover:border-orange-500 rounded-2xl text-neutral-500 hover:text-orange-500 transition-colors font-bold mb-8">
          + เพิ่มท่อใหม่
        </button>

        {/* Save / Cancel */}
        <div className="flex gap-4 pt-6 border-t border-neutral-800">
          <button
            onClick={() => onSave(draft)}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 py-3 rounded-xl flex items-center gap-2 transition-colors">
            <CheckCircle2 size={18} /> บันทึกและอัปเดตหน้าเว็บ
          </button>
          <button onClick={onClose} className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold px-8 py-3 rounded-xl transition-colors">
            ยกเลิก
          </button>
          <button
            onClick={() => { if (window.confirm('รีเซ็ตรายการท่อทั้งหมด?')) { onSave(DEFAULT_HKS); } }}
            className="ml-auto text-neutral-600 hover:text-red-500 text-sm transition-colors">
            รีเซ็ตทั้งหมด
          </button>
        </div>
      </div>
    </div>
  );
};

// --- PAGE 3: HKS EXHAUST ---
const HKSPage = () => {
  const [data, setData]               = useState(DEFAULT_HKS);
  const [activeBrand, setActiveBrand] = useState('ทั้งหมด');
  const [page, setPage]               = useState(1);
  const [showAdmin, setShowAdmin]     = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetch('/content.json')
      .then(r => r.json())
      .then(d => { if (d.hks) setData(d.hks); })
      .catch(() => {});
  }, []);

  const handleSave = (newData) => { setData(newData); setShowAdmin(false); saveContent('hks', newData); };
  const handleAdminClick = () => setShowPassword(true);
  const handlePasswordSuccess = () => { setShowPassword(false); setShowAdmin(true); };

  // Only show pipes that have brand + model + type filled in
  const filledPipes = data.pipes.filter(p => p.brand && p.model.trim() && p.type.trim());

  // Filter by brand
  const brandFiltered = activeBrand === 'ทั้งหมด'
    ? filledPipes
    : filledPipes.filter(p => p.brand === activeBrand);

  // Pagination
  const totalPages  = Math.max(1, Math.ceil(brandFiltered.length / HKS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const displayed   = brandFiltered.slice((currentPage - 1) * HKS_PER_PAGE, currentPage * HKS_PER_PAGE);

  const handleBrandChange = (brand) => { setActiveBrand(brand); setPage(1); };

  return (
    <div className="pb-24 relative">
      {showPassword && <PasswordModal onSuccess={handlePasswordSuccess} onClose={() => setShowPassword(false)} />}
      {showAdmin    && <HKSAdminPanel data={data} onSave={handleSave} onClose={() => setShowAdmin(false)} />}

      {/* ── Hero ── */}
      <div className="border-b border-neutral-800 py-20 px-6 relative overflow-hidden" style={{ background: '#0d1116' }}>
        <img src={PROD_BG} alt="HKS Exhaust Products" className="absolute inset-0 w-full h-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/95 via-neutral-950/70 to-neutral-950/40" />
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none w-1/2 h-full flex items-center justify-end">
          <div className="w-[500px] h-[200px] border-[20px] border-orange-500 rounded-l-[100px] mr-[-100px]" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Wrench className="text-orange-500 w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">HKS Exhaust Systems</h1>
          <p className="text-xl text-neutral-400 mb-8">
            นิยามใหม่ของเสียงและสมรรถนะระดับโลก ยกระดับภาพลักษณ์พร้อมปลดปล่อยความดุดันในสไตล์ที่เป็นคุณ<br />
            เราคือตัวกลางที่ช่วยคุณเลือกสเปคที่ตรงรุ่นแบบ <span className="text-orange-500 font-bold">100% Fitment</span>
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-16">

        {/* ── Brand Filter ── */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-6">เลือกยี่ห้อรถเพื่อดูสินค้า</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {['ทั้งหมด', ...HKS_BRANDS].map(brand => (
              <button
                key={brand}
                onClick={() => handleBrandChange(brand)}
                className={`px-5 py-2 rounded-full font-bold text-sm transition-all ${
                  activeBrand === brand
                    ? 'bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600'
                }`}>
                {brand}
              </button>
            ))}
          </div>
        </div>

        {/* ── Product Grid ── */}
        {displayed.length === 0 ? (
          <div className="text-center py-24 text-neutral-600">
            <Wrench size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-bold mb-2">
              {filledPipes.length === 0
                ? 'ยังไม่มีรายการท่อในระบบ'
                : `ไม่มีรายการสำหรับ ${activeBrand}`}
            </p>
            <p className="text-sm text-neutral-700">กรุณาเพิ่มข้อมูลผ่านระบบ Admin (ปุ่ม ⚙ มุมล่างขวา)</p>
          </div>
        ) : (
          <>
            {/* count */}
            <p className="text-neutral-600 text-sm mb-6">
              แสดง {(currentPage - 1) * HKS_PER_PAGE + 1}–{Math.min(currentPage * HKS_PER_PAGE, brandFiltered.length)} จาก {brandFiltered.length} รายการ
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {displayed.map((item) => (
                <div key={item.id} className="bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 group hover:border-orange-500/50 transition-colors">
                  {/* Product image */}
                  <div className="h-56 bg-neutral-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                    {item.imgUrl ? (
                      <WatermarkedImage src={item.imgUrl} alt={item.model} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <>
                        <div className="w-3/4 h-8 bg-neutral-800 rounded-full mb-2" />
                        <div className="w-1/2 h-8 bg-neutral-800 rounded-full flex items-center justify-end pr-2">
                          <div className="w-10 h-10 bg-orange-900/50 rounded-full" />
                        </div>
                        <span className="absolute bottom-3 right-3 text-neutral-700 font-mono text-xs">HKS_{item.brand.toUpperCase()}</span>
                      </>
                    )}
                    {/* Brand badge */}
                    <span className="absolute top-3 left-3 bg-orange-600/90 text-white text-xs font-bold px-2 py-1 rounded-full z-10">{item.brand}</span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white group-hover:text-orange-500 transition-colors mb-1">{item.model}</h3>
                    <p className="text-orange-400 text-sm font-bold mb-3">{item.type}</p>
                    {item.desc  && <p className="text-neutral-400 text-sm mb-4 leading-relaxed">{item.desc}</p>}
                    {item.price && <p className="text-white font-black text-lg mb-4">{item.price}</p>}
                    <button className="w-full py-3 rounded-lg border border-neutral-700 hover:bg-white hover:text-black transition-colors font-bold text-sm">
                      เช็คสต็อกและราคา
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-6 pb-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-6 py-2.5 rounded-full border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-sm">
                  ← ก่อนหน้า
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`w-9 h-9 rounded-full text-sm font-bold transition-all ${
                        n === currentPage
                          ? 'bg-orange-600 text-white'
                          : 'text-neutral-500 hover:text-white'
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-6 py-2.5 rounded-full border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-sm">
                  ถัดไป →
                </button>
              </div>
            )}
          </>
        )}

        {/* ── CTA สั่งซื้อ ── */}
        <div className="text-center py-10">
          <a href={LINE_URL} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-3 bg-orange-600 hover:bg-orange-700 text-white font-black text-xl px-12 py-5 rounded-full shadow-[0_0_30px_rgba(234,88,12,0.4)] hover:shadow-[0_0_45px_rgba(234,88,12,0.6)] transition-all">
            <MessageCircle size={24} /> สั่งซื้อสินค้า
          </a>
        </div>

      </div>

      {/* ── Hidden Admin Button (bottom-right) ── */}
      <button
        onClick={handleAdminClick}
        title="Admin"
        className="fixed bottom-6 right-6 w-9 h-9 rounded-full bg-neutral-900/40 hover:bg-neutral-700 border border-neutral-800/50 flex items-center justify-center text-neutral-700 hover:text-neutral-300 transition-all duration-300 z-50 opacity-30 hover:opacity-100"
        style={{ fontSize: '14px' }}>
        ⚙
      </button>
    </div>
  );
};

// ─── Panthera Admin Panel ─────────────────────────────────────────────────────
const PantheraAdminPanel = ({ data, initialTab = 'videos', onSave, onClose }) => {
  const [tab, setTab]     = useState(initialTab);
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(data)));

  const inputCls = 'w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-neutral-600';

  const upVid  = (i,f,v) => { const vs=[...draft.videos];  vs[i]={...vs[i],[f]:v};  setDraft({...draft,videos:vs}); };
  const upPric = (i,f,v) => { const ps=[...draft.pricing]; ps[i]={...ps[i],[f]:v};  setDraft({...draft,pricing:ps}); };
  const addVid  = ()  => setDraft({...draft, videos:  [...draft.videos,  {id:Date.now(),title:'',youtubeUrl:'',length:'00:00'}]});
  const delVid  = (i) => { if(!window.confirm('ลบคลิปนี้?'))return;      setDraft({...draft, videos:  draft.videos.filter((_,j)=>j!==i)}); };
  const addPric = ()  => setDraft({...draft, pricing: [...draft.pricing, {id:Date.now(),name:'',desc:'',price:''}]});
  const delPric = (i) => { if(!window.confirm('ลบรายการนี้?'))return;    setDraft({...draft, pricing: draft.pricing.filter((_,j)=>j!==i)}); };

  const addBtn = (label, fn) => (
    <button onClick={fn} className="w-full py-3 border-2 border-dashed border-neutral-700 hover:border-blue-500 rounded-2xl text-neutral-500 hover:text-blue-400 transition-colors font-bold text-sm mt-2 mb-4">
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm overflow-auto">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6 border-b border-neutral-800 pb-6">
          <div>
            <h2 className="text-2xl font-black text-white">⚙️ Admin Panel — Panthera</h2>
            <p className="text-neutral-500 text-sm mt-1">จัดการคลิปวิดีโอและตารางราคา</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white text-2xl leading-none px-2">✕</button>
        </div>
        <div className="flex gap-2 mb-8">
          {[{key:'videos',label:'🎬 คลิปวิดีโอ'},{key:'pricing',label:'💰 ตารางราคา'}].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${tab===t.key ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Videos */}
        {tab === 'videos' && (
          <>
            {draft.videos.map((v, i) => (
              <div key={v.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-blue-400 font-bold text-xs">คลิปที่ {i + 1}</p>
                  <button onClick={() => delVid(i)} className="text-neutral-600 hover:text-red-500 text-xs transition-colors">🗑 ลบ</button>
                </div>
                <div className="space-y-3">
                  <div><label className="text-neutral-400 text-xs mb-1 block">ชื่อคลิป</label>
                    <input className={inputCls} value={v.title} onChange={e => upVid(i,'title',e.target.value)} placeholder="ชื่อคลิปวิดีโอ" /></div>
                  <div><label className="text-neutral-400 text-xs mb-1 block">YouTube URL</label>
                    <input className={inputCls} value={v.youtubeUrl} onChange={e => upVid(i,'youtubeUrl',e.target.value)} placeholder="https://www.youtube.com/watch?v=..." /></div>
                  <div><label className="text-neutral-400 text-xs mb-1 block">ความยาว (เช่น 03:45)</label>
                    <input className={inputCls} value={v.length} onChange={e => upVid(i,'length',e.target.value)} placeholder="03:45" /></div>
                </div>
              </div>
            ))}
            {addBtn('+ เพิ่มคลิปวิดีโอ', addVid)}
          </>
        )}

        {/* Pricing */}
        {tab === 'pricing' && (
          <>
            {draft.pricing.map((p, i) => (
              <div key={p.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-blue-400 font-bold text-xs">แพ็กเกจที่ {i + 1}</p>
                  <button onClick={() => delPric(i)} className="text-neutral-600 hover:text-red-500 text-xs transition-colors">🗑 ลบ</button>
                </div>
                <div className="space-y-3">
                  <div><label className="text-neutral-400 text-xs mb-1 block">ชื่อแพ็กเกจ</label>
                    <input className={inputCls} value={p.name} onChange={e => upPric(i,'name',e.target.value)} placeholder="เช่น Single Speaker Unit" /></div>
                  <div><label className="text-neutral-400 text-xs mb-1 block">รายละเอียด</label>
                    <textarea rows={2} className={inputCls} value={p.desc} onChange={e => upPric(i,'desc',e.target.value)} /></div>
                  <div><label className="text-neutral-400 text-xs mb-1 block">ราคา</label>
                    <input className={inputCls} value={p.price} onChange={e => upPric(i,'price',e.target.value)} placeholder="XX,XXX.-" /></div>
                </div>
              </div>
            ))}
            {addBtn('+ เพิ่มแพ็กเกจ', addPric)}
          </>
        )}

        <div className="flex gap-4 pt-6 border-t border-neutral-800">
          <button onClick={() => onSave(draft)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl flex items-center gap-2 transition-colors">
            <CheckCircle2 size={18} /> บันทึกและอัปเดตหน้าเว็บ
          </button>
          <button onClick={onClose} className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold px-8 py-3 rounded-xl transition-colors">ยกเลิก</button>
          <button onClick={() => { if(window.confirm('รีเซ็ตกลับค่าเริ่มต้น?')){ onSave(DEFAULT_PANTHERA); } }}
            className="ml-auto text-neutral-600 hover:text-red-500 text-sm transition-colors">รีเซ็ตเป็นค่าเริ่มต้น</button>
        </div>
      </div>
    </div>
  );
};

// --- PAGE 4: PANTHERA ---
const PantheraPage = () => {
  const [data, setData]                 = useState(DEFAULT_PANTHERA);
  const [showAdmin, setShowAdmin]       = useState(false);
  const [adminTab, setAdminTab]         = useState('videos');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetch('/content.json')
      .then(r => r.json())
      .then(d => { if (d.panthera) setData(d.panthera); })
      .catch(() => {});
  }, []);

  const handleSave    = (nd) => { setData(nd); setShowAdmin(false); saveContent('panthera', nd); };
  const openAdmin     = (tab = 'videos') => { setAdminTab(tab); setShowPassword(true); };
  const onPassSuccess = () => { setShowPassword(false); setShowAdmin(true); };

  const getYtId = (url) => {
    if (!url) return null;
    const m = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
    return m ? m[1] : null;
  };

  const editBtnCls = 'opacity-30 hover:opacity-100 w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-all text-xs shrink-0';

  return (
    <div className="pb-24 relative">
      {showPassword && <PasswordModal onSuccess={onPassSuccess} onClose={() => setShowPassword(false)} />}
      {showAdmin    && <PantheraAdminPanel data={data} initialTab={adminTab} onSave={handleSave} onClose={() => setShowAdmin(false)} />}

      {/* ── Hero ── */}
      <div className="bg-neutral-900 border-b border-neutral-800 py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-5"><Volume2 size={400} /></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Volume2 className="text-blue-500 w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">Panthera Active Exhaust Sound</h1>
          <p className="text-xl text-neutral-400">
            เติมเต็มอรรถรสการขับขี่ให้รถน้ำมัน และยนตรกรรมไฟฟ้า (EV) ด้วยมิติแห่งเสียงที่เลือกได้<br />
            สร้างคาแรกเตอร์ตั้งแต่เสียงยานอวกาศล้ำอนาคต ไปจนถึงเสียง V8 สุดดุดัน
          </p>
          <div className="mt-8 inline-block bg-blue-600 border border-blue-400 text-white px-6 py-2 rounded-full text-sm font-black tracking-wide animate-pulse">
            Pre order NOW!!
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-16 space-y-24">
        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "Custom Profiles",    desc: "ปรับแต่งและสลับเสียงผ่านแอปพลิเคชันบนมือถือได้แบบ Real-time" },
            { title: "OBD2 Integration",   desc: "อ่านค่าคันเร่งและความเร็วรถโดยตรง เพื่อความสมจริงในการไล่ระดับเสียง" },
            { title: "Safe Installation",  desc: "ติดตั้งง่าย ไม่ต้องดัดแปลงโครงสร้างรถ ปลอดภัยต่อระบบไฟฟ้าเดิม" },
          ].map((f, i) => (
            <div key={i} className="bg-neutral-900 p-8 rounded-2xl border border-neutral-800">
              <h3 className="text-xl font-bold text-white mb-4">{f.title}</h3>
              <p className="text-neutral-400">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Video Reviews ── */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white border-l-4 border-blue-500 pl-4">คลิปทดสอบ & รีวิวเสียงจริง</h2>
            <button onClick={() => openAdmin('videos')} title="แก้ไขคลิป" className={editBtnCls}>⚙</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {data.videos.map((video, idx) => {
              const ytId = getYtId(video.youtubeUrl);
              return (
                <div key={video.id} className="group cursor-pointer">
                  {ytId ? (
                    <a href={video.youtubeUrl} target="_blank" rel="noreferrer">
                      <div className="aspect-video rounded-2xl overflow-hidden border border-neutral-800 mb-4 group-hover:border-blue-500 transition-colors relative">
                        <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt={video.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                          <PlayCircle className="text-white w-16 h-16 drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <span className="absolute bottom-4 right-4 bg-black/80 px-2 py-1 rounded text-xs text-white font-mono">{video.length}</span>
                      </div>
                    </a>
                  ) : (
                    <div className="aspect-video bg-neutral-900 rounded-2xl border border-neutral-800 flex flex-col items-center justify-center relative overflow-hidden mb-4 group-hover:border-blue-500 transition-colors">
                      <PlayCircle className="text-neutral-600 w-16 h-16 group-hover:text-blue-500 transition-colors group-hover:scale-110 duration-300" />
                      <span className="absolute bottom-4 right-4 bg-black/80 px-2 py-1 rounded text-xs text-white font-mono">{video.length}</span>
                      <span className="absolute top-4 left-4 text-neutral-700 font-mono text-xs">VIDEO_{idx+1}.MP4</span>
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{video.title}</h3>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Pricing Table ── */}
        <section className="bg-gradient-to-b from-neutral-900 to-neutral-950 p-8 md:p-12 rounded-3xl border border-neutral-800">
          <div className="flex items-start justify-between mb-10">
            <div className="text-center flex-1">
              <h2 className="text-3xl font-bold text-white mb-4">ตารางราคาล่วงหน้า (Pre-Order Pricing)</h2>
              <p className="text-neutral-400">สำหรับลูกค้า Pre-Order จะได้รับสิทธิพิเศษราคา Early Bird</p>
            </div>
            <button onClick={() => openAdmin('pricing')} title="แก้ไขราคา" className={editBtnCls}>⚙</button>
          </div>
          <div className="max-w-4xl mx-auto overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-neutral-800 text-neutral-300">
                  <th className="p-4 font-bold text-lg">แพ็กเกจ (Package)</th>
                  <th className="p-4 font-bold text-lg">รายละเอียด</th>
                  <th className="p-4 font-bold text-lg text-right">ราคา (บาท)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-neutral-400">
                {data.pricing.map((row) => (
                  <tr key={row.id} className="hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 font-bold text-white">{row.name}</td>
                    <td className="p-4">{row.desc}</td>
                    <td className="p-4 text-right font-bold text-blue-400">{row.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-12 text-center">
            <a href={LINE_URL} target="_blank" rel="noreferrer"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-full font-black text-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_35px_rgba(37,99,235,0.6)] transition-all">
              Order NOW!!
            </a>
          </div>
        </section>
      </div>

      {/* Hidden admin button */}
      <button onClick={() => openAdmin('videos')} title="Admin"
        className="fixed bottom-6 right-6 w-9 h-9 rounded-full bg-neutral-900/40 hover:bg-neutral-700 border border-neutral-800/50 flex items-center justify-center text-neutral-700 hover:text-neutral-300 transition-all duration-300 z-50 opacity-30 hover:opacity-100"
        style={{ fontSize: '14px' }}>⚙</button>
    </div>
  );
};

// --- PAGE 5: PARTNER RECRUITMENT ---
const PartnerPage = () => (
  <div className="pb-24">
    <div className="bg-gradient-to-r from-orange-950 to-neutral-900 border-b border-orange-900/50 py-24 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <UserPlus className="text-orange-500 w-20 h-20 mx-auto mb-6" />
        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight uppercase">Join Our Network</h1>
        <p className="text-xl md:text-2xl text-orange-200/80 mb-8 font-light">
          รับสมัครพาร์ทเนอร์ อู่พันธมิตร และทีมงาน <br className="hidden md:block" />
          ทั้งในกรุงเทพฯ และต่างจังหวัด
        </p>
      </div>
    </div>

    <div className="max-w-5xl mx-auto px-6 lg:px-8 mt-16">
      {/* Why join */}
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-white mb-6">ทำไมถึงควรเป็น Partner กับ Shiftup?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {[
            { n: "1", title: "ขยายฐานลูกค้า", desc: "เรามีฐานลูกค้าจากส่วนกลางที่พร้อมส่งต่องานติดตั้งหรือบริการให้คุณในพื้นที่ของคุณ" },
            { n: "2", title: "สินค้าและซอฟต์แวร์คุณภาพ", desc: "เข้าถึงไฟล์จูนระดับมืออาชีพ และสินค้าราคาตัวแทนจำหน่าย (เช่น HKS, Panthera)" },
            { n: "3", title: "Support จากส่วนกลาง", desc: "มีทีมเทคนิคคอยให้คำปรึกษาตลอดการทำงาน พร้อมสื่อการตลาดช่วยเหลือ" },
          ].map((item) => (
            <div key={item.n} className="bg-neutral-900 p-8 rounded-2xl border border-neutral-800">
              <div className="w-12 h-12 bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center font-bold text-xl mb-4">{item.n}</div>
              <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
              <p className="text-neutral-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Requirements */}
      <div className="bg-neutral-900 rounded-3xl border border-neutral-800 p-8 md:p-12 mb-16 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-8 border-l-4 border-orange-500 pl-4">สิ่งที่เรามองหาในตัว Partner</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-orange-500 shrink-0 mt-1" size={20} />
              <span className="text-neutral-300">อู่ซ่อมรถยนต์ หรือร้านติดตั้งอุปกรณ์ตกแต่งรถยนต์ ที่มีหน้าร้านชัดเจน</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-orange-500 shrink-0 mt-1" size={20} />
              <span className="text-neutral-300">มีความรู้ความเข้าใจพื้นฐานด้านเครื่องยนต์ และระบบไฟฟ้า (สำหรับงานติดตั้ง)</span>
            </li>
          </ul>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-orange-500 shrink-0 mt-1" size={20} />
              <span className="text-neutral-300">ช่างเทคนิคอิสระ (Freelance) ที่มีเครื่องมือพร้อมรับงานนอกสถานที่ (เฉพาะบางพื้นที่)</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-orange-500 shrink-0 mt-1" size={20} />
              <span className="text-neutral-300">มีความซื่อสัตย์ ตรงต่อเวลา และใส่ใจในความปลอดภัยของรถลูกค้าเป็นอันดับแรก</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Application Form */}
      <div className="bg-neutral-950 p-8 md:p-12 rounded-3xl border border-neutral-800 border-t-4 border-t-orange-500">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">ฟอร์มสมัครพาร์ทเนอร์</h2>
          <p className="text-neutral-400">กรอกข้อมูลเบื้องต้นเพื่อให้ทีมงานของเราติดต่อกลับไปพูดคุยรายละเอียด</p>
        </div>
        <form className="space-y-6 max-w-2xl mx-auto" onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const partnerData = { source:'partner', shopName:fd.get('shopName'), contactName:fd.get('contactName'), phone:fd.get('phone'), lineId:fd.get('lineId'), province:fd.get('province'), expertise:fd.get('expertise'), facebook:fd.get('facebook') };
          await submitToSheets(partnerData);
          notifyServer(partnerData);
          alert('ข้อมูลการสมัครถูกส่งเรียบร้อยแล้ว ทีมงานจะติดต่อกลับเร็วๆ นี้');
          e.target.reset();
        }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">ชื่อร้าน / อู่ (ถ้ามี)</label>
              <input name="shopName" type="text" className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500" placeholder="ระบุชื่อร้าน" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">ชื่อผู้ติดต่อ *</label>
              <input name="contactName" type="text" required className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500" placeholder="ระบุชื่อผู้ติดต่อ" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">เบอร์โทรศัพท์ *</label>
              <input name="phone" type="text" required className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500" placeholder="เบอร์โทรติดต่อ" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">LINE ID</label>
              <input name="lineId" type="text" className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500" placeholder="ไอดีไลน์" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">จังหวัดที่ให้บริการ *</label>
              <input name="province" type="text" required className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500" placeholder="เช่น กรุงเทพฯ, เชียงใหม่" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">ความถนัดหลัก</label>
              <select name="expertise" className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 appearance-none">
                <option>รับรีแมป (มีเครื่องมือ/ไม่มีเครื่องมือ)</option>
                <option>ติดตั้งท่อไอเสีย</option>
                <option>ติดตั้งระบบไฟ/เครื่องเสียง (เหมาะกับ Panthera)</option>
                <option>ทำได้ทุกอย่างข้างต้น</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">ลิงก์เพจ Facebook ร้าน (ถ้ามี)</label>
            <input name="facebook" type="url" className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500" placeholder="https://facebook.com/..." />
          </div>
          <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl transition-colors mt-4 text-lg">
            ส่งข้อมูลการสมัคร
          </button>
        </form>
      </div>
    </div>
  </div>
);

// ─── Analytics Section ───────────────────────────────────────────────────────
const AnalyticsSection = ({ visits = [] }) => {
  const [rangeType, setRangeType] = useState('7d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo]   = useState('');
  const [visitPage, setVisitPage] = useState(0);
  const [visitRows, setVisitRows] = useState(10);
  // ── NEW: page click-to-filter ────────────────────────────────────
  const [selectedPage, setSelectedPage] = useState(null); // null = all
  // ── NEW: table column filters ────────────────────────────────────
  const [tableFilters, setTableFilters] = useState({ page:'', device:'', browser:'', os:'', province:'', isp:'', language:'', referrer:'' });

  const now        = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart  = new Date(todayStart.getTime() - 6 * 86400000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart  = new Date(now.getFullYear(), 0, 1);

  const safeDate = (iso) => { try { return new Date(iso); } catch { return null; } };

  const getRangeStart = () => {
    if (rangeType === '1d')     return todayStart;
    if (rangeType === '7d')     return weekStart;
    if (rangeType === '30d')    return new Date(todayStart.getTime() - 29 * 86400000);
    if (rangeType === 'year')   return yearStart;
    if (rangeType === 'custom' && customFrom) return new Date(customFrom);
    return weekStart;
  };
  const getRangeEnd = () => {
    if (rangeType === 'custom' && customTo) return new Date(customTo + 'T23:59:59');
    return now;
  };

  const rangeStart = getRangeStart();
  const rangeEnd   = getRangeEnd();

  const filterKey = Object.values(tableFilters).join('|');
  useEffect(() => { setVisitPage(0); }, [rangeType, customFrom, customTo, filterKey]);

  const inRange  = (v) => { const d = safeDate(v.isoTimestamp); return d && d >= rangeStart && d <= rangeEnd; };
  const filtered = visits.filter(inRange);

  const todayCount  = visits.filter(v => { const d = safeDate(v.isoTimestamp); return d && d >= todayStart; }).length;
  const weekCount   = visits.filter(v => { const d = safeDate(v.isoTimestamp); return d && d >= weekStart; }).length;
  const monthCount  = visits.filter(v => { const d = safeDate(v.isoTimestamp); return d && d >= monthStart; }).length;
  const yearCount   = visits.filter(v => { const d = safeDate(v.isoTimestamp); return d && d >= yearStart; }).length;

  const uniqueSessions = new Set(filtered.map(v => v.sessionId)).size;
  const avgPages       = uniqueSessions > 0 ? (filtered.length / uniqueSessions).toFixed(1) : '0';

  const days = [];
  let cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
  const endDay = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate());
  while (cur <= endDay && days.length < 60) {
    const ds = new Date(cur), de = new Date(cur.getTime() + 86400000 - 1);
    days.push({
      label: `${cur.getDate()}/${cur.getMonth() + 1}`,
      count: filtered.filter(v => { const d = safeDate(v.isoTimestamp); return d && d >= ds && d <= de; }).length,
    });
    cur = new Date(cur.getTime() + 86400000);
  }
  const maxBar = Math.max(...days.map(d => d.count), 1);

  // Trend line — linear regression
  let trendPoints = '';
  if (days.length >= 2 && days.some(d => d.count > 0)) {
    const n = days.length;
    const xMean = (n - 1) / 2;
    const yMean = days.reduce((s, d) => s + d.count, 0) / n;
    let num = 0, den = 0;
    days.forEach((d, i) => { num += (i - xMean) * (d.count - yMean); den += (i - xMean) ** 2; });
    const slope = den !== 0 ? num / den : 0;
    const intercept = yMean - slope * xMean;
    trendPoints = days.map((_, i) => {
      const tv = intercept + slope * i;
      const x  = i * 38 + 19;
      const y  = 130 - Math.max(2, Math.min((tv / maxBar) * 120, 128));
      return `${x},${y}`;
    }).join(' ');
  }

  // Page breakdown
  const PAGE_NAMES = { home: 'หน้าแรก', remap: 'ECU Remap', hks: 'HKS Exhaust', panthera: 'Panthera', partner: 'Partner', dashboard: 'Dashboard' };
  const pageMap = {};
  filtered.forEach(v => { pageMap[v.page] = (pageMap[v.page] || 0) + 1; });
  const pageBreakdown = Object.entries(pageMap).sort((a, b) => b[1] - a[1]);

  // Device breakdown — filtered by selectedPage when set
  const deviceSource  = selectedPage ? filtered.filter(v => v.page === selectedPage) : filtered;
  const mobileCount   = deviceSource.filter(v => v.device === 'mobile').length;
  const desktopCount  = deviceSource.filter(v => v.device === 'desktop').length;
  const deviceTotal   = deviceSource.length;

  // Table: sort → apply column filters
  const sortedVisits = [...filtered].sort((a, b) => new Date(b.isoTimestamp) - new Date(a.isoTimestamp));

  const getRefHost = (ref) => { if (!ref) return ''; try { return new URL(ref).hostname; } catch { return ref; } };

  const filteredTableVisits = sortedVisits.filter(v => {
    if (tableFilters.page     && v.page !== tableFilters.page) return false;
    if (tableFilters.device   && v.device !== tableFilters.device) return false;
    if (tableFilters.browser  && v.browser !== tableFilters.browser) return false;
    if (tableFilters.os       && v.os !== tableFilters.os) return false;
    if (tableFilters.province && v.province !== tableFilters.province) return false;
    if (tableFilters.isp      && (v.isp || '').split(' ')[0] !== tableFilters.isp) return false;
    if (tableFilters.language && v.language !== tableFilters.language) return false;
    if (tableFilters.referrer && getRefHost(v.referrer) !== tableFilters.referrer) return false;
    return true;
  });

  const totalVPages = Math.ceil(filteredTableVisits.length / visitRows);
  const pagedVisits = filteredTableVisits.slice(visitPage * visitRows, (visitPage + 1) * visitRows);

  // Unique values for filter dropdowns
  const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort();
  const uPages     = uniq(sortedVisits.map(v => v.page));
  const uDevices   = uniq(sortedVisits.map(v => v.device));
  const uBrowsers  = uniq(sortedVisits.map(v => v.browser));
  const uOSes      = uniq(sortedVisits.map(v => v.os));
  const uProvinces = uniq(sortedVisits.map(v => v.province));
  const uISPs      = uniq(sortedVisits.map(v => (v.isp || '').split(' ')[0]));
  const uLangs     = uniq(sortedVisits.map(v => v.language));
  const uRefs      = uniq(sortedVisits.map(v => getRefHost(v.referrer)));

  const hasFilter = Object.values(tableFilters).some(v => v !== '');
  const clearFilters = () => setTableFilters({ page:'', device:'', browser:'', os:'', province:'', isp:'', language:'', referrer:'' });

  const showRef = (ref) => {
    if (!ref) return <span className="text-neutral-600 text-xs">ตรงมา</span>;
    try { return <span className="text-blue-400 text-xs">{new URL(ref).hostname}</span>; }
    catch { return <span className="text-neutral-400 text-xs">{String(ref).slice(0, 25)}</span>; }
  };

  const selCls = 'bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 px-1 py-0.5 w-full focus:outline-none focus:border-blue-500 cursor-pointer';
  const btnCls = (t) => `px-4 py-2 rounded-full text-sm font-bold transition-all ${rangeType === t ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'วันนี้',      value: todayCount,  color: 'text-blue-400' },
          { label: 'สัปดาห์นี้', value: weekCount,   color: 'text-cyan-400' },
          { label: 'เดือนนี้',   value: monthCount,  color: 'text-teal-400' },
          { label: 'ปีนี้',      value: yearCount,   color: 'text-green-400' },
        ].map((s, i) => (
          <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center">
            <p className="text-neutral-500 text-xs uppercase tracking-wider mb-2">{s.label}</p>
            <p className={`text-4xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-neutral-600 text-xs mt-1">การเข้าชม</p>
          </div>
        ))}
      </div>

      {/* Range selector */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <p className="text-neutral-400 text-sm mb-3 font-medium">เลือกช่วงเวลา</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {[{k:'1d',label:'วันนี้'},{k:'7d',label:'7 วัน'},{k:'30d',label:'30 วัน'},{k:'year',label:'ปีนี้'},{k:'custom',label:'กำหนดเอง'}].map(b => (
            <button key={b.k} onClick={() => setRangeType(b.k)} className={btnCls(b.k)}>{b.label}</button>
          ))}
        </div>
        {rangeType === 'custom' && (
          <div className="flex flex-wrap gap-3 items-center mt-3">
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              className="bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
            <span className="text-neutral-500">ถึง</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              className="bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
          </div>
        )}
        <div className="flex flex-wrap gap-6 mt-4 text-sm border-t border-neutral-800 pt-4">
          <span className="text-neutral-400">การเข้าชม: <span className="text-white font-bold">{filtered.length}</span></span>
          <span className="text-neutral-400">Sessions: <span className="text-white font-bold">{uniqueSessions}</span></span>
          <span className="text-neutral-400">เฉลี่ย: <span className="text-white font-bold">{avgPages}</span> หน้า/session</span>
        </div>
      </div>

      {/* Bar chart + trend line */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold">การเข้าชมรายวัน</h3>
          {trendPoints && (
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke="#f97316" strokeWidth="2" strokeDasharray="4,2"/></svg>
              แนวโน้ม
            </div>
          )}
        </div>
        {days.every(d => d.count === 0) ? (
          <p className="text-neutral-600 text-center py-8">ยังไม่มีข้อมูลในช่วงนี้</p>
        ) : (
          <div className="overflow-x-auto pb-2">
            <svg width={Math.max(days.length * 38, 300)} height="170">
              {days.map((day, i) => {
                const bh = Math.max((day.count / maxBar) * 120, day.count > 0 ? 6 : 0);
                const x  = i * 38 + 6;
                return (
                  <g key={i}>
                    <rect x={x} y={130 - bh} width={26} height={bh} rx={4} fill={day.count > 0 ? '#3b82f6' : '#1f2937'} />
                    {day.count > 0 && <text x={x+13} y={125-bh} textAnchor="middle" fill="#93c5fd" fontSize="10">{day.count}</text>}
                    <text x={x+13} y={148} textAnchor="middle" fill="#6b7280" fontSize="9">{day.label}</text>
                  </g>
                );
              })}
              {trendPoints && (
                <polyline points={trendPoints} fill="none" stroke="#f97316" strokeWidth="2" strokeDasharray="5,3" strokeLinecap="round"/>
              )}
            </svg>
          </div>
        )}
      </div>

      {/* Page breakdown + Device — click-to-filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* หน้าที่เข้าชม — คลิกเพื่อ filter */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">หน้าที่เข้าชมมากสุด</h3>
            <span className="text-neutral-600 text-xs">คลิกเพื่อกรอง →</span>
          </div>
          {pageBreakdown.length === 0 ? <p className="text-neutral-600 text-sm">ยังไม่มีข้อมูล</p> :
            pageBreakdown.map(([pg, count]) => {
              const isSelected = selectedPage === pg;
              const isFaded    = selectedPage && !isSelected;
              return (
                <div
                  key={pg}
                  onClick={() => setSelectedPage(prev => prev === pg ? null : pg)}
                  className={`flex items-center gap-3 mb-2 rounded-xl px-3 py-2 cursor-pointer transition-all duration-200
                    ${isSelected ? 'bg-blue-900/30 ring-1 ring-blue-500/50' : 'hover:bg-neutral-800/60'}
                    ${isFaded ? 'opacity-30' : 'opacity-100'}`}
                >
                  <span className={`text-sm w-28 shrink-0 font-medium ${isSelected ? 'text-blue-300' : 'text-neutral-300'}`}>
                    {PAGE_NAMES[pg] || pg}
                  </span>
                  <div className="flex-1 bg-neutral-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${isSelected ? 'bg-blue-400' : 'bg-blue-600'}`}
                      style={{ width: `${filtered.length > 0 ? (count/filtered.length)*100 : 0}%` }}
                    />
                  </div>
                  <span className={`text-sm w-6 text-right shrink-0 font-bold ${isSelected ? 'text-blue-300' : 'text-neutral-400'}`}>{count}</span>
                </div>
              );
            })}
        </div>

        {/* อุปกรณ์ — แสดง breakdown ของหน้าที่ selected */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-white font-bold">อุปกรณ์</h3>
            {selectedPage && (
              <button
                onClick={() => setSelectedPage(null)}
                className="text-xs text-neutral-500 hover:text-white flex items-center gap-1 transition-colors"
              >
                ✕ ล้าง
              </button>
            )}
          </div>
          {selectedPage && (
            <div className="flex items-center gap-2 mb-4 mt-1">
              <span className="text-blue-400 text-xs">🔍 กำลังดู:</span>
              <span className="bg-blue-900/40 text-blue-300 text-xs px-2 py-0.5 rounded-full font-medium">
                {PAGE_NAMES[selectedPage] || selectedPage}
              </span>
              <span className="text-neutral-600 text-xs">({deviceTotal} visits)</span>
            </div>
          )}
          {!selectedPage && <div className="mb-5" />}
          {deviceTotal === 0 ? <p className="text-neutral-600 text-sm">ยังไม่มีข้อมูล</p> :
            [{ label:'📱 Mobile', count:mobileCount, color:'bg-blue-500' },
             { label:'💻 Desktop', count:desktopCount, color:'bg-purple-500' }].map(d => (
              <div key={d.label} className="flex items-center gap-3 mb-4">
                <span className="text-neutral-300 text-sm w-28 shrink-0">{d.label}</span>
                <div className="flex-1 bg-neutral-800 rounded-full h-2">
                  <div className={`${d.color} h-2 rounded-full transition-all duration-500`} style={{ width: `${deviceTotal > 0 ? (d.count/deviceTotal)*100 : 0}%` }} />
                </div>
                <span className="text-neutral-400 text-sm w-6 text-right shrink-0">{d.count}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Visitor details table + column filters */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-white font-bold">รายละเอียดผู้เข้าชม</h3>
            {hasFilter && (
              <button onClick={clearFilters}
                className="text-xs text-orange-400 hover:text-orange-300 border border-orange-400/40 px-2 py-0.5 rounded-full transition-colors">
                ✕ ล้าง filter
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neutral-500 text-sm">แสดง</span>
            {[10, 25, 50].map(n => (
              <button key={n} onClick={() => { setVisitRows(n); setVisitPage(0); }}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition-all ${visitRows === n ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}>
                {n}
              </button>
            ))}
            <span className="text-neutral-500 text-sm">แถว</span>
          </div>
        </div>

        {sortedVisits.length === 0 ? (
          <p className="text-neutral-600 text-center py-8 text-sm">ยังไม่มีข้อมูลในช่วงนี้</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  {/* Column headers */}
                  <tr className="border-b border-neutral-800">
                    {['วันที่-เวลา','หน้า','อุปกรณ์','Browser','OS','จังหวัด','ISP','ภาษา','ที่มา'].map(h => (
                      <th key={h} className="text-left text-neutral-500 text-xs uppercase py-3 px-2 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                  {/* Filter row */}
                  <tr className="border-b border-neutral-700/60">
                    <td className="py-1.5 px-2">
                      <span className="text-neutral-700 text-xs">—</span>
                    </td>
                    {[
                      { key:'page',     opts:uPages,     label:'ทุกหน้า',     fn:(v) => PAGE_NAMES[v] || v },
                      { key:'device',   opts:uDevices,   label:'ทุกอุปกรณ์' },
                      { key:'browser',  opts:uBrowsers,  label:'ทุก Browser' },
                      { key:'os',       opts:uOSes,      label:'ทุก OS' },
                      { key:'province', opts:uProvinces, label:'ทุกจังหวัด' },
                      { key:'isp',      opts:uISPs,      label:'ทุก ISP' },
                      { key:'language', opts:uLangs,     label:'ทุกภาษา' },
                      { key:'referrer', opts:uRefs,      label:'ทุกที่มา' },
                    ].map(({ key, opts, label, fn }) => (
                      <td key={key} className="py-1.5 px-2">
                        <select
                          value={tableFilters[key]}
                          onChange={e => { setTableFilters(prev => ({ ...prev, [key]: e.target.value })); setVisitPage(0); }}
                          className={`${selCls} ${tableFilters[key] ? 'text-blue-300 border-blue-500/50' : ''}`}
                        >
                          <option value="">{label}</option>
                          {opts.map(o => <option key={o} value={o}>{fn ? fn(o) : o}</option>)}
                        </select>
                      </td>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTableVisits.length === 0 ? (
                    <tr><td colSpan={9} className="py-8 text-center text-neutral-600 text-sm">ไม่พบข้อมูลที่ตรงกับ filter</td></tr>
                  ) : pagedVisits.map((v, i) => (
                    <tr key={i} className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors">
                      <td className="py-2.5 px-2 text-neutral-500 whitespace-nowrap text-xs">{v.timestamp || '-'}</td>
                      <td className="py-2.5 px-2 text-neutral-300 whitespace-nowrap text-xs">{PAGE_NAMES[v.page] || v.page || '-'}</td>
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${v.device === 'mobile' ? 'bg-blue-900/50 text-blue-300' : 'bg-purple-900/50 text-purple-300'}`}>
                          {v.device === 'mobile' ? '📱' : '💻'} {v.device || '-'}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-neutral-400 whitespace-nowrap text-xs">{v.browser || '-'}</td>
                      <td className="py-2.5 px-2 text-neutral-400 whitespace-nowrap text-xs">{v.os || '-'}</td>
                      <td className="py-2.5 px-2 text-neutral-300 whitespace-nowrap text-xs">{v.province || '-'}</td>
                      <td className="py-2.5 px-2 text-neutral-400 whitespace-nowrap text-xs" title={v.isp}>{v.isp ? v.isp.split(' ')[0] : '-'}</td>
                      <td className="py-2.5 px-2 text-neutral-400 whitespace-nowrap text-xs">{v.language || '-'}</td>
                      <td className="py-2.5 px-2 whitespace-nowrap">{showRef(v.referrer)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-800">
              <span className="text-neutral-500 text-sm">
                {filteredTableVisits.length > 0
                  ? `${visitPage * visitRows + 1}–${Math.min((visitPage + 1) * visitRows, filteredTableVisits.length)} จาก ${filteredTableVisits.length} รายการ${hasFilter ? ` (กรองจาก ${sortedVisits.length})` : ''}`
                  : '0 รายการ'}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setVisitPage(p => Math.max(0, p - 1))} disabled={visitPage === 0}
                  className="px-3 py-1.5 bg-neutral-800 text-neutral-300 rounded-lg text-sm disabled:opacity-30 hover:bg-neutral-700 transition-colors">
                  ← ก่อนหน้า
                </button>
                <span className="text-neutral-400 text-sm px-2">{visitPage + 1} / {Math.max(1, totalVPages)}</span>
                <button onClick={() => setVisitPage(p => Math.min(totalVPages - 1, p + 1))} disabled={visitPage >= totalVPages - 1}
                  className="px-3 py-1.5 bg-neutral-800 text-neutral-300 rounded-lg text-sm disabled:opacity-30 hover:bg-neutral-700 transition-colors">
                  ถัดไป →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Pie Chart ────────────────────────────────────────────────────────────────
const PieChart = ({ remapCount, partnerCount }) => {
  const total = remapCount + partnerCount;
  if (total === 0) return (
    <div className="flex flex-col items-center py-8">
      <div className="w-48 h-48 rounded-full border-4 border-dashed border-neutral-800 flex items-center justify-center">
        <span className="text-neutral-600 text-sm">ยังไม่มีข้อมูล</span>
      </div>
    </div>
  );

  const cx = 120, cy = 120, r = 100;
  const toXY = (deg) => {
    const rad = (deg - 90) * Math.PI / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };
  const remapPct   = remapCount / total;
  const remapAngle = remapPct * 360;
  let remapPath, partnerPath;
  if (remapCount === 0) {
    partnerPath = `M ${cx},${cy-r} A ${r},${r} 0 1,1 ${cx-0.01},${cy-r} Z`;
    remapPath   = null;
  } else if (partnerCount === 0) {
    remapPath   = `M ${cx},${cy-r} A ${r},${r} 0 1,1 ${cx-0.01},${cy-r} Z`;
    partnerPath = null;
  } else {
    const [x1,y1] = toXY(0);
    const [x2,y2] = toXY(remapAngle);
    const largeR  = remapAngle > 180 ? 1 : 0;
    const largeP  = remapAngle <= 180 ? 1 : 0;
    remapPath   = `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${largeR},1 ${x2},${y2} Z`;
    partnerPath = `M ${cx},${cy} L ${x2},${y2} A ${r},${r} 0 ${largeP},1 ${x1},${y1} Z`;
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <svg width="240" height="240" viewBox="0 0 240 240">
        {remapPath   && <path d={remapPath}   fill="#ef4444" />}
        {partnerPath && <path d={partnerPath} fill="#f97316" />}
        <circle cx={cx} cy={cy} r={44} fill="#111827" />
        <text x={cx} y={cy-8}  textAnchor="middle" fill="#ffffff" fontSize="24" fontWeight="bold">{total}</text>
        <text x={cx} y={cy+14} textAnchor="middle" fill="#9ca3af" fontSize="11">รวมทั้งหมด</text>
      </svg>
      <div className="flex flex-wrap justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
          <span className="text-neutral-300 text-sm">ECU Remap ({remapCount}) — {Math.round(remapPct*100)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500 shrink-0" />
          <span className="text-neutral-300 text-sm">Partner ({partnerCount}) — {Math.round((1-remapPct)*100)}%</span>
        </div>
      </div>
    </div>
  );
};

// ─── Dashboard Page ───────────────────────────────────────────────────────────
const DashboardPage = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [data, setData]       = useState({ remapLeads:[], partnerApplications:[], visits:[], counts:{remap:0,partner:0} });

  useEffect(() => {
    fetch('/api/get-leads')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError('โหลดข้อมูลไม่ได้ กรุณาตรวจสอบการเชื่อมต่อ'); setLoading(false); });
  }, []);

  const { remapLeads, partnerApplications, counts } = data;
  const total = counts.remap + counts.partner;
  const thCls = 'px-4 py-3 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider';
  const tdCls = 'px-4 py-3 text-sm';

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200">
      <div className="bg-neutral-900 border-b border-neutral-800 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={onBack} className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm font-medium">
          ← กลับหน้าหลัก
        </button>
        <span className="text-neutral-700">|</span>
        <h1 className="text-white font-bold">🔐 Admin Dashboard</h1>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {loading && (
          <div className="text-center text-neutral-500 py-32">
            <div className="text-4xl mb-4 animate-pulse">⏳</div>
            <p>กำลังโหลดข้อมูลจาก Google Sheets...</p>
          </div>
        )}
        {error && (
          <div className="text-center text-red-400 py-32">
            <div className="text-4xl mb-4">⚠️</div>
            <p>{error}</p>
          </div>
        )}
        {!loading && !error && (
          <>
            <div>
              <h2 className="text-white font-bold text-xl mb-6 border-l-4 border-blue-500 pl-4">📊 Analytics — การเข้าชมเว็บไซต์</h2>
              <AnalyticsSection visits={data.visits || []} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center">
                <p className="text-neutral-500 text-sm mb-3 uppercase tracking-wider">ECU Remap Leads</p>
                <p className="text-6xl font-black text-red-500">{counts.remap}</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center">
                <p className="text-neutral-500 text-sm mb-3 uppercase tracking-wider">Partner Applications</p>
                <p className="text-6xl font-black text-orange-500">{counts.partner}</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center">
                <p className="text-neutral-500 text-sm mb-3 uppercase tracking-wider">รวมทั้งหมด</p>
                <p className="text-6xl font-black text-white">{total}</p>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 md:p-12">
              <h2 className="text-white font-bold text-xl mb-8 text-center">สัดส่วน Leads ทั้งหมด</h2>
              <PieChart remapCount={counts.remap} partnerCount={counts.partner} />
            </div>

            <div>
              <h2 className="text-white font-bold text-xl mb-4 border-l-4 border-red-500 pl-4">
                ECU Remap Leads <span className="text-neutral-500 font-normal text-base ml-2">({counts.remap} รายการ)</span>
              </h2>
              <div className="overflow-x-auto rounded-2xl border border-neutral-800">
                <table className="w-full">
                  <thead className="bg-neutral-900 border-b border-neutral-800">
                    <tr>
                      <th className={thCls}>วันที่</th><th className={thCls}>ชื่อ</th>
                      <th className={thCls}>ติดต่อ</th><th className={thCls}>รุ่นรถ</th>
                      <th className={thCls}>สถานที่</th><th className={thCls}>รายละเอียด</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {remapLeads.length === 0
                      ? <tr><td colSpan={6} className="px-4 py-12 text-center text-neutral-600">ยังไม่มีข้อมูล</td></tr>
                      : [...remapLeads].reverse().map((row, i) => (
                        <tr key={i} className="bg-neutral-950 hover:bg-neutral-900 transition-colors">
                          <td className={`${tdCls} text-neutral-500 whitespace-nowrap`}>{String(row.timestamp)}</td>
                          <td className={`${tdCls} text-white font-medium`}>{row.name}</td>
                          <td className={`${tdCls} text-neutral-300`}>{row.contact}</td>
                          <td className={`${tdCls} text-neutral-300`}>{row.car}</td>
                          <td className={`${tdCls} text-neutral-400`}>{row.location}</td>
                          <td className={`${tdCls} text-neutral-400 max-w-xs truncate`}>{row.detail}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="text-white font-bold text-xl mb-4 border-l-4 border-orange-500 pl-4">
                Partner Applications <span className="text-neutral-500 font-normal text-base ml-2">({counts.partner} รายการ)</span>
              </h2>
              <div className="overflow-x-auto rounded-2xl border border-neutral-800">
                <table className="w-full">
                  <thead className="bg-neutral-900 border-b border-neutral-800">
                    <tr>
                      <th className={thCls}>วันที่</th><th className={thCls}>ชื่อร้าน</th>
                      <th className={thCls}>ผู้ติดต่อ</th><th className={thCls}>เบอร์</th>
                      <th className={thCls}>จังหวัด</th><th className={thCls}>ความถนัด</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {partnerApplications.length === 0
                      ? <tr><td colSpan={6} className="px-4 py-12 text-center text-neutral-600">ยังไม่มีข้อมูล</td></tr>
                      : [...partnerApplications].reverse().map((row, i) => (
                        <tr key={i} className="bg-neutral-950 hover:bg-neutral-900 transition-colors">
                          <td className={`${tdCls} text-neutral-500 whitespace-nowrap`}>{String(row.timestamp)}</td>
                          <td className={`${tdCls} text-white font-medium`}>{row.shopName}</td>
                          <td className={`${tdCls} text-neutral-300`}>{row.contactName}</td>
                          <td className={`${tdCls} text-neutral-300`}>{row.phone}</td>
                          <td className={`${tdCls} text-neutral-400`}>{row.province}</td>
                          <td className={`${tdCls} text-neutral-400 text-xs`}>{row.expertise}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShiftupApp;
