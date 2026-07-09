import React, { useState, useEffect } from 'react';
import {
  Menu, X, ChevronRight, Zap, Volume2, Settings, MessageCircle, Activity,
  ShieldCheck, Wrench, Star, PlayCircle, CheckCircle2, UserPlus, Send,
  CalendarDays, ChevronLeft, Clock, MapPin, Phone, User, Car, AlertCircle,
  CheckCircle, XCircle, Trash2, Plus, Minus, ChevronDown, ChevronUp, CalendarCheck
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
      body: JSON.stringify({ ...payload, timestamp: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }) }),
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
// แปลง pathname → page key และกลับกัน
const PATH_MAP = { '/': 'home', '/remap': 'remap', '/hks': 'hks', '/panthera': 'panthera', '/partner': 'partner', '/about': 'about', '/booking': 'booking', '/cancel': 'cancel' };
const PAGE_PATH = Object.fromEntries(Object.entries(PATH_MAP).map(([k, v]) => [v, k]));
const pathToPage = (p) => PATH_MAP[p] || 'home';

const ShiftupApp = () => {
  const [activePage, setActivePage] = useState(() => pathToPage(window.location.pathname));
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDashPw, setShowDashPw] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    // อัปเดต URL ให้ตรงกับหน้าที่เปิด
    const path = PAGE_PATH[activePage] || '/';
    if (window.location.pathname !== path) {
      window.history.pushState({ page: activePage }, '', path);
    }
  }, [activePage]);

  // รองรับปุ่ม back/forward ของ browser
  useEffect(() => {
    const onPop = (e) => setActivePage(e.state?.page || pathToPage(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track หน้าแรกเท่านั้น
  useEffect(() => {
    if (activePage !== 'home') return;

    const KEY = 'shiftup_sid';
    const isFirst = !sessionStorage.getItem(KEY);
    let sid = sessionStorage.getItem(KEY);
    if (!sid) { sid = Math.random().toString(36).slice(2) + Date.now(); sessionStorage.setItem(KEY, sid); }

    const ua  = navigator.userAgent;
    const device = /Mobi|Android/i.test(ua) ? 'mobile' : 'desktop';
    const referrer = isFirst ? (document.referrer || '') : '';
    const language = navigator.language || '';

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
      page: 'home', device, sessionId: sid, referrer, language,
      browser: detectedBrowser, os: detectedOS,
      isoTimestamp: new Date().toISOString(),
      timestamp: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
    };

    fetch('/api/track-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
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
      <style>{`@keyframes border-run{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}`}</style>
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
                <button onClick={() => navigateTo('about')} className={`hover:text-red-500 transition-colors px-3 py-2 text-sm font-medium tracking-wide ${activePage === 'about' ? 'text-red-500' : 'text-neutral-300'}`}>ABOUT US</button>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <button onClick={() => navigateTo('booking')} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all shadow-[0_0_12px_rgba(220,38,38,0.35)] hover:shadow-[0_0_20px_rgba(220,38,38,0.55)] flex items-center gap-1.5">
                <CalendarCheck size={14} />
                จองคิวรีแมป
              </button>
              <a href={lineUrl} target="_blank" rel="noreferrer" className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all border border-neutral-700 flex items-center gap-1.5">
                <MessageCircle size={14} />
                ติดต่อเรา
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
              <button onClick={() => navigateTo('about')} className="block px-3 py-2 text-base font-medium text-neutral-300 text-left">About Us</button>
              <button onClick={() => { navigateTo('booking'); setMobileMenuOpen(false); }} className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-md text-center font-bold flex justify-center items-center gap-2 text-sm shadow-[0_0_12px_rgba(220,38,38,0.3)]">
                <CalendarCheck size={16} /> จองคิวรีแมปรถยนต์
              </button>
              <a href={lineUrl} target="_blank" rel="noreferrer" className="mt-2 bg-neutral-800 border border-neutral-700 text-white px-4 py-3 rounded-md text-center font-bold flex justify-center items-center gap-2">
                <MessageCircle size={18} /> ติดต่อเรา
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Page Content */}
      <div className="pt-20">
        {activePage === 'home'     && <HomePage navigateTo={navigateTo} lineUrl={lineUrl} />}
        {activePage === 'remap'    && <RemapPage navigateTo={navigateTo} />}
        {activePage === 'booking'  && <BookingPage navigateTo={navigateTo} />}
        {activePage === 'cancel'   && <CancelPage navigateTo={navigateTo} />}
        {activePage === 'hks'      && <HKSPage />}
        {activePage === 'panthera' && <PantheraPage />}
        {activePage === 'partner'  && <PartnerPage />}
        {activePage === 'about'    && <AboutPage lineUrl={lineUrl} />}
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
                <li><button onClick={() => navigateTo('about')} className="hover:text-white transition-colors">About Us</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Contact Info</h4>
              <ul className="space-y-3 text-neutral-400">
                <li><a href="tel:0830092554" className="hover:text-white transition-colors">Tel: 083-009-2554 (ปิง)</a></li>
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
              <div style={{ background: 'linear-gradient(90deg,#ef4444,#f97316,#facc15,#f97316,#ef4444)', backgroundSize: '300% 300%', animation: 'border-run 2s linear infinite', padding: '2px', borderRadius: '9999px', display: 'inline-block' }}>
                <button
                  onClick={() => navigateTo('booking')}
                  className="bg-neutral-950 text-white font-bold px-8 py-4 rounded-full hover:bg-neutral-900 transition-colors"
                >
                  จองคิวรีแมปรถยนต์
                </button>
              </div>
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

const DEFAULT_HKS = { pipes: [], brands: ['Ford', 'BMW', 'Honda', 'Isuzu', 'Mazda', 'Mitsubishi', 'Toyota', 'Nissan'] };

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
const RemapPage = ({ navigateTo }) => {
  const [data, setData] = useState(DEFAULT_REMAP);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [openArticles, setOpenArticles] = useState(new Set());
  const toggleArticle = (id) => setOpenArticles(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

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
      <div className="relative border-b border-neutral-800 py-20 px-6 overflow-hidden">
        <img src="https://drive.google.com/thumbnail?id=14phTvXtXXaoh0thcbO3NEoiU5Ch1dPK8&sz=w1200" alt="" className="absolute inset-0 w-full h-full object-cover object-center opacity-65" />
        <div className="absolute inset-0 bg-neutral-950/20" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Zap className="text-red-500 w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">ECU Remap</h1>
          <p className="text-xl text-neutral-400">ปลดล็อกพลังแฝง ปรับจูนให้ตรงสไตล์คุณ ขับสนุกขึ้น ประหยัดขึ้น ในแบบที่คุณสัมผัสได้ทันที</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-24 mt-16">

        {/* ── Pricing ── */}
        <section className="relative p-8 rounded-3xl border border-neutral-800 overflow-hidden">
          <img src="https://drive.google.com/thumbnail?id=1aqfxgrPBf88tILTPoq0j44wPhm9XHnX5&sz=w1200" alt="" className="absolute inset-0 w-full h-full object-cover object-center opacity-55" />
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900/50 to-neutral-950/60 rounded-3xl" />
          <div className="relative z-10">
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

          {/* Packages grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-8">
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

          <ul className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-neutral-400">
            {data.perks.map((perk, i) => (
              <li key={i} className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-500 shrink-0" /> {perk}
              </li>
            ))}
          </ul>
          </div>
        </section>

        {/* ── CTA จองคิว ── */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center py-4">
          <div style={{ background: 'linear-gradient(90deg,#ef4444,#f97316,#facc15,#22d3ee,#f97316,#ef4444)', backgroundSize: '400% 400%', animation: 'border-run 1.8s linear infinite', padding: '3px', borderRadius: '9999px', display: 'inline-block', boxShadow: '0 0 24px rgba(239,68,68,0.5)' }}>
            <button
              onClick={() => navigateTo('booking')}
              className="bg-red-600 hover:bg-red-700 text-white font-black text-xl px-10 py-5 rounded-full transition-colors flex items-center gap-3"
            >
              <CalendarDays size={24} /> จองคิวรีแมปรถยนต์
            </button>
          </div>
          <a href={LINE_URL} target="_blank" rel="noreferrer"
            className="inline-flex items-center justify-center gap-3 bg-neutral-800 hover:bg-neutral-700 text-white font-black text-xl px-10 py-5 rounded-full border border-neutral-600 transition-all">
            <MessageCircle size={24} /> ติดต่อเรา
          </a>
        </div>

        {/* ── Articles Accordion ── */}
        <section>
          <h2 className="text-3xl font-bold text-white mb-8 border-l-4 border-red-500 pl-4">บทความ & ความรู้ก่อนรีแมป</h2>
          <div className="space-y-3">
            {data.articles.map((art) => {
              const isOpen = openArticles.has(art.id);
              return (
                <div key={art.id} className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden transition-colors hover:border-neutral-600">
                  <button
                    onClick={() => toggleArticle(art.id)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-red-500 text-xs font-bold tracking-widest shrink-0">{art.tag}</span>
                      <span className="text-white font-bold text-sm md:text-base leading-snug truncate">{art.title}</span>
                    </div>
                    <span className={`text-neutral-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▾</span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 border-t border-neutral-800">
                      {art.imgUrl && (
                        <div className="h-48 md:h-64 rounded-xl overflow-hidden mt-4 mb-4">
                          <img src={art.imgUrl} alt={art.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <p className="text-neutral-400 text-sm leading-relaxed mt-4">{art.excerpt}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Portfolio 3D Slideshow ── */}
        <section className="relative -mx-6 lg:-mx-8 px-6 lg:px-8 py-16 overflow-hidden">
          <img src="https://drive.google.com/thumbnail?id=1mN6B8sqAjq6y1iReoxhueJrMwQVGvQaZ&sz=w1200" alt="" className="absolute inset-0 w-full h-full object-cover object-center opacity-80" />
          <div className="absolute inset-0 bg-neutral-950/15" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-8 border-l-4 border-red-500 pl-4">ผลงานรีแมป (Portfolio)</h2>
            <Portfolio3DSlideshow items={data.portfolio} />
          </div>
        </section>

        {/* ── Reviews Carousel ── */}
        <section>
          <h2 className="text-3xl font-bold text-white mb-8 border-l-4 border-red-500 pl-4">รีวิวจากผู้ใช้จริง</h2>
          <ReviewsCarousel reviews={data.reviews} />
        </section>

        {/* ── Consult Form (bottom) ── */}
        <section className="relative -mx-6 lg:-mx-8 px-6 lg:px-8 py-16 overflow-hidden">
          <img src="https://drive.google.com/thumbnail?id=1y-LlWqGzrLskUMsj9BDSke-Ye2S95p-E&sz=w1200" alt="" className="absolute inset-0 w-full h-full object-cover object-center opacity-25" />
          <div className="absolute inset-0 bg-neutral-950/65" />
          <div className="relative z-10 max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-3">ประเมินรถของคุณฟรี</h2>
            <p className="text-neutral-400">กรอกข้อมูลด้านล่าง ทีมงานจะติดต่อกลับเพื่อประเมินและแนะนำแพ็กเกจที่เหมาะกับรถคุณ</p>
          </div>
          <div className="bg-neutral-900 p-8 rounded-3xl border border-neutral-800 shadow-2xl">
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
          </div>
          </div>
        </section>

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
// ─── HKS Media Helpers ───────────────────────────────────────────────────────
const detectMediaType = (url) => {
  if (!url) return 'image';
  const l = url.toLowerCase();
  if (l.includes('youtube.com') || l.includes('youtu.be') || /\.(mp4|webm|mov|avi)(\?|$)/.test(l)) return 'video';
  return 'image';
};
const getYouTubeId = (url) => {
  if (!url) return '';
  if (url.includes('youtube.com/watch')) { try { return new URL(url).searchParams.get('v') || ''; } catch(e) { return ''; } }
  if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0];
  return '';
};
const getYouTubeEmbed = (url, autoplay = false) => {
  const id = getYouTubeId(url);
  if (!id) return url;
  return `https://www.youtube.com/embed/${id}?autoplay=${autoplay ? 1 : 0}&rel=0`;
};
const getYtThumb = (url) => {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
};
const getFirstImage = (pipe) => {
  if (pipe.media && pipe.media.length > 0) {
    const img = pipe.media.find(m => m.type === 'image');
    if (img) return img.url;
  }
  return pipe.imgUrl || null;
};

// ─── HKS Product Detail Modal ────────────────────────────────────────────────
const HKSProductModal = ({ pipe, onClose }) => {
  const mediaList = (pipe.media && pipe.media.length > 0)
    ? pipe.media
    : (pipe.imgUrl ? [{ type: 'image', url: pipe.imgUrl }] : []);

  const firstVideoIdx = mediaList.findIndex(m => m.type === 'video');
  const [idx, setIdx] = useState(firstVideoIdx >= 0 ? firstVideoIdx : 0);
  const total = mediaList.length;
  const current = mediaList[idx];

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && total > 1) setIdx(i => (i + 1) % total);
      if (e.key === 'ArrowLeft'  && total > 1) setIdx(i => (i - 1 + total) % total);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [total, onClose]);

  const renderMedia = () => {
    if (!current) return <div className="flex items-center justify-center h-full text-neutral-600">ไม่มีสื่อ</div>;
    if (current.type === 'video') {
      const isYT = current.url.includes('youtube.com') || current.url.includes('youtu.be');
      if (isYT) return <iframe key={`yt-${idx}`} src={getYouTubeEmbed(current.url, true)} className="w-full h-full" allow="autoplay; encrypted-media; fullscreen" allowFullScreen />;
      return <video key={`v-${idx}`} src={current.url} controls autoPlay className="w-full h-full object-contain" />;
    }
    return (
      <div className="relative w-full h-full">
        <WatermarkedImage src={current.url} alt={pipe.model} className="w-full h-full object-contain" />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-2 md:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-neutral-950 rounded-2xl overflow-hidden w-full max-w-4xl border border-neutral-800 flex flex-col" style={{ maxHeight: '92vh' }}>

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-neutral-800 flex-shrink-0">
          <div>
            <span className="text-xs text-orange-500 font-bold">{pipe.brand}</span>
            <h3 className="text-white font-black text-lg leading-tight">{pipe.model}</h3>
            <p className="text-orange-400 text-sm font-semibold">{pipe.type}</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white text-xl leading-none ml-4 flex-shrink-0 mt-1">✕</button>
        </div>

        {/* Main media */}
        <div className="relative bg-black flex-shrink-0" style={{ height: '420px' }}>
          {renderMedia()}
          {total > 1 && (
            <>
              <button onClick={() => setIdx(i => (i - 1 + total) % total)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl font-light transition-colors z-10 select-none">‹</button>
              <button onClick={() => setIdx(i => (i + 1) % total)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl font-light transition-colors z-10 select-none">›</button>
              <div className="absolute bottom-2 right-3 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full z-10">{idx + 1} / {total}</div>
            </>
          )}
        </div>

        {/* Thumbnail strip */}
        {total > 1 && (
          <div className="flex gap-2 px-4 py-3 overflow-x-auto border-t border-neutral-800 flex-shrink-0 bg-neutral-950">
            {mediaList.map((m, i) => {
              const thumb = m.type === 'video' ? getYtThumb(m.url) : m.url;
              return (
                <button key={i} onClick={() => setIdx(i)}
                  className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === idx ? 'border-orange-500' : 'border-neutral-700 opacity-50 hover:opacity-100'}`}>
                  {thumb
                    ? <img src={thumb} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-neutral-800" />}
                  {m.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="w-5 h-5 bg-white/80 rounded-full flex items-center justify-center">
                        <span className="text-black text-xs" style={{ marginLeft: '2px' }}>▶</span>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Details + CTA */}
        <div className="px-5 py-4 border-t border-neutral-800 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex-1 min-w-0">
            {pipe.desc  && <p className="text-neutral-400 text-sm leading-relaxed mb-1">{pipe.desc}</p>}
            {pipe.price && <p className="text-white font-black text-2xl">{pipe.price}</p>}
          </div>
          <a href={LINE_URL} target="_blank" rel="noopener noreferrer"
            className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white font-bold px-5 py-3 rounded-xl text-sm transition-colors whitespace-nowrap">
            💬 สอบถาม LINE
          </a>
        </div>

      </div>
    </div>
  );
};

const HKSAdminPanel = ({ data, onSave, onClose }) => {
  const [draft, setDraft] = useState(() => {
    const d = JSON.parse(JSON.stringify(data));
    if (!d.brands || d.brands.length === 0) d.brands = [...DEFAULT_HKS.brands];
    return d;
  });
  const [newBrand, setNewBrand] = useState('');

  const inputCls = 'w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500 placeholder-neutral-600';

  const updatePipe = (i, field, val) => {
    const pipes = [...draft.pipes];
    pipes[i] = { ...pipes[i], [field]: val };
    setDraft({ ...draft, pipes });
  };

  const addPipe = () => {
    const newId = Date.now();
    const defaultBrand = draft.brands[0] || 'Toyota';
    setDraft({ ...draft, pipes: [...draft.pipes, { id: newId, brand: defaultBrand, model: '', type: '', desc: '', price: '', imgUrl: '', media: [] }] });
  };

  const addBrand = () => {
    const trimmed = newBrand.trim();
    if (!trimmed) return;
    if (draft.brands.includes(trimmed)) { alert('ยี่ห้อนี้มีอยู่แล้ว'); return; }
    setDraft({ ...draft, brands: [...draft.brands, trimmed] });
    setNewBrand('');
  };

  const deleteBrand = (brand) => {
    const hasPipes = draft.pipes.some(p => p.brand === brand);
    if (hasPipes && !window.confirm(`ยังมีสินค้าของ ${brand} อยู่ ${draft.pipes.filter(p=>p.brand===brand).length} รายการ\nถ้าลบยี่ห้อนี้ สินค้าเหล่านั้นจะยังอยู่แต่ไม่แสดงในฟิลเตอร์\nต้องการลบต่อไหม?`)) return;
    setDraft({ ...draft, brands: draft.brands.filter(b => b !== brand) });
  };

  const deletePipe = (i) => {
    if (!window.confirm('ลบรายการนี้?')) return;
    setDraft({ ...draft, pipes: draft.pipes.filter((_, idx) => idx !== i) });
  };

  const [newMediaUrl, setNewMediaUrl] = useState({});
  const [dragging,   setDragging]   = useState(null); // { pipeIdx, mediaIdx }
  const [dragOver,   setDragOver]   = useState(null); // { pipeIdx, mediaIdx }

  const reorderMedia = (pipeIdx, fromIdx, toIdx) => {
    if (fromIdx === toIdx) return;
    const pipes = [...draft.pipes];
    const media = [...(pipes[pipeIdx].media || [])];
    const [moved] = media.splice(fromIdx, 1);
    media.splice(toIdx, 0, moved);
    pipes[pipeIdx] = { ...pipes[pipeIdx], media };
    setDraft({ ...draft, pipes });
  };

  const addMedia = (pipeIdx, url) => {
    const trimmed = (url || '').trim();
    if (!trimmed) return;
    const type = detectMediaType(trimmed);
    const pipes = [...draft.pipes];
    const media = [...(pipes[pipeIdx].media || []), { type, url: trimmed }];
    pipes[pipeIdx] = { ...pipes[pipeIdx], media };
    setDraft({ ...draft, pipes });
    setNewMediaUrl(prev => ({ ...prev, [pipeIdx]: '' }));
  };

  const removeMedia = (pipeIdx, mediaIdx) => {
    const pipes = [...draft.pipes];
    const media = (pipes[pipeIdx].media || []).filter((_, mi) => mi !== mediaIdx);
    pipes[pipeIdx] = { ...pipes[pipeIdx], media };
    setDraft({ ...draft, pipes });
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

        {/* ── Brand Management ── */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 mb-6">
          <h3 className="text-white font-bold mb-4">🏷️ จัดการยี่ห้อรถ (Filter Tabs)</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {draft.brands.map(brand => (
              <span key={brand} className="flex items-center gap-1 bg-neutral-800 border border-neutral-700 rounded-full px-3 py-1 text-sm text-white">
                {brand}
                <button onClick={() => deleteBrand(brand)} className="text-neutral-500 hover:text-red-500 transition-colors ml-1 leading-none">✕</button>
              </span>
            ))}
            {draft.brands.length === 0 && <p className="text-neutral-600 text-sm">ยังไม่มียี่ห้อ</p>}
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500 placeholder-neutral-600"
              placeholder="พิมพ์ยี่ห้อรถใหม่ เช่น Subaru"
              value={newBrand}
              onChange={e => setNewBrand(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addBrand()}
            />
            <button onClick={addBrand} className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors">+ เพิ่ม</button>
          </div>
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
                    {draft.brands.map(b => <option key={b} value={b}>{b}</option>)}
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
                  <label className="text-neutral-400 text-xs mb-1 block">URL รูปหน้าปก (fallback ถ้าไม่มี Gallery)</label>
                  <input className={inputCls} value={pipe.imgUrl} onChange={e => updatePipe(i, 'imgUrl', e.target.value)} placeholder="https://... หรือ /images/hks1.jpg" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-neutral-400 text-xs mb-2 block">🖼️ Gallery รูปภาพ / วิดีโอ (ใส่ได้หลายรายการ)</label>
                  {/* รายการ media ที่มีอยู่ */}
                  {(pipe.media || []).length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(pipe.media || []).map((m, mi) => {
                        const thumb = m.type === 'video' ? getYtThumb(m.url) : m.url;
                        const isDraggingThis = dragging?.pipeIdx === i && dragging?.mediaIdx === mi;
                        const isOver = dragOver?.pipeIdx === i && dragOver?.mediaIdx === mi && !isDraggingThis;
                        return (
                          <div
                            key={mi}
                            className={`relative group cursor-grab active:cursor-grabbing select-none transition-all duration-150 ${isDraggingThis ? 'opacity-25 scale-90' : ''} ${isOver ? 'ring-2 ring-orange-500 rounded-lg scale-105' : ''}`}
                            draggable
                            onDragStart={(e) => {
                              setDragging({ pipeIdx: i, mediaIdx: mi });
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              if (dragging?.pipeIdx === i) setDragOver({ pipeIdx: i, mediaIdx: mi });
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (dragging?.pipeIdx === i) reorderMedia(i, dragging.mediaIdx, mi);
                              setDragging(null); setDragOver(null);
                            }}
                            onDragEnd={() => { setDragging(null); setDragOver(null); }}
                          >
                            <div className="w-16 h-16 rounded-lg overflow-hidden border border-neutral-700 bg-neutral-800">
                              {thumb
                                ? <img src={thumb} alt="" className="w-full h-full object-cover pointer-events-none" />
                                : <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-orange-500 text-xl">▶</div>}
                              {m.type === 'video' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                                  <span className="text-white text-lg">▶</span>
                                </div>
                              )}
                            </div>
                            {/* ลบ */}
                            <div className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => removeMedia(i, mi)} className="w-5 h-5 bg-red-600 hover:bg-red-500 rounded-full text-white text-xs flex items-center justify-center leading-none">✕</button>
                            </div>
                            {/* drag handle hint */}
                            <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-b-lg flex items-center justify-center py-0.5">
                              <span className="text-neutral-400 text-[10px]">⠿⠿</span>
                            </div>
                            <p className="text-center text-neutral-500 text-[9px] mt-0.5">{m.type === 'video' ? 'VDO' : `${mi + 1}`}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* เพิ่ม media ใหม่ */}
                  <div className="flex gap-2">
                    <input
                      className={`${inputCls} flex-1`}
                      value={newMediaUrl[i] || ''}
                      onChange={e => setNewMediaUrl(prev => ({ ...prev, [i]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addMedia(i, newMediaUrl[i] || '')}
                      placeholder="วาง URL รูปภาพ หรือลิงก์ YouTube..."
                    />
                    <button onClick={() => addMedia(i, newMediaUrl[i] || '')}
                      className="bg-neutral-700 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap">
                      + เพิ่ม
                    </button>
                  </div>
                  <p className="text-neutral-600 text-xs mt-1.5">รองรับ: URL รูปภาพ, ลิงก์ YouTube, ไฟล์วิดีโอ (.mp4) — รูปแรกในรายการจะเป็นหน้าปกสินค้า, วิดีโอจะเล่นอัตโนมัติเมื่อกดดูรายละเอียด</p>
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
  const [selectedPipe, setSelectedPipe] = useState(null);

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
      {showPassword  && <PasswordModal onSuccess={handlePasswordSuccess} onClose={() => setShowPassword(false)} />}
      {showAdmin     && <HKSAdminPanel data={data} onSave={handleSave} onClose={() => setShowAdmin(false)} />}
      {selectedPipe  && <HKSProductModal pipe={selectedPipe} onClose={() => setSelectedPipe(null)} />}

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
            {['ทั้งหมด', ...(data.brands && data.brands.length > 0 ? data.brands : HKS_BRANDS)].map(brand => (
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
                    {getFirstImage(item) ? (
                      <WatermarkedImage src={getFirstImage(item)} alt={item.model} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
                    <button onClick={() => setSelectedPipe(item)} className="w-full py-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition-colors font-bold text-sm">
                      รายละเอียดสินค้า
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
const AnalyticsSection = ({ visits = [], botVisits = [] }) => {
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

  const botInRange  = botVisits.filter(v => { const d = safeDate(v.isoTimestamp); return d && d >= rangeStart && d <= rangeEnd; }).length;
  const botToday    = botVisits.filter(v => { const d = safeDate(v.isoTimestamp); return d && d >= todayStart; }).length;

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

      {/* Human vs Bot comparison */}
      {(() => {
        const totalToday   = todayCount + botToday;
        const totalInRange = filtered.length + botInRange;
        const humanRangePct = totalInRange > 0 ? Math.round(filtered.length / totalInRange * 100) : 0;

        // SVG donut pie chart — ขนาด 200x200
        const R = 76, CX = 100, CY = 100;
        const mkArc = (pct) => {
          if (pct <= 0) return null;
          if (pct >= 100) return <circle cx={CX} cy={CY} r={R} fill="#22c55e" />;
          const a  = (pct / 100) * 2 * Math.PI;
          const x1 = CX + R * Math.cos(-Math.PI / 2);
          const y1 = CY + R * Math.sin(-Math.PI / 2);
          const x2 = CX + R * Math.cos(a - Math.PI / 2);
          const y2 = CY + R * Math.sin(a - Math.PI / 2);
          return <path d={`M${CX} ${CY} L${x1.toFixed(1)} ${y1.toFixed(1)} A${R} ${R} 0 ${pct > 50 ? 1 : 0} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`} fill="#22c55e" />;
        };

        return (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <p className="text-neutral-400 text-sm font-medium mb-4">👤 คนจริง vs 🤖 Bot</p>
            <div className="grid grid-cols-2 gap-5 items-center">

              {/* Left: stats */}
              <div className="space-y-3">
                {[
                  { label: 'วันนี้',        human: todayCount,      bot: botToday,   total: totalToday   },
                  { label: 'ช่วงที่เลือก',  human: filtered.length, bot: botInRange, total: totalInRange },
                ].map(({ label, human, bot, total }) => {
                  const hPct = total > 0 ? Math.round(human / total * 100) : 0;
                  return (
                    <div key={label} className="bg-neutral-950 rounded-xl p-4">
                      <p className="text-neutral-600 text-xs mb-2">{label} <span className="text-neutral-700">(รวม {total})</span></p>
                      <div className="flex gap-5 items-end">
                        <div>
                          <p className="text-2xl font-black text-green-400">{human}</p>
                          <p className="text-green-600 text-xs font-bold">{hPct}%</p>
                          <p className="text-neutral-600 text-xs">👤 คนจริง</p>
                        </div>
                        <div className="w-px h-10 bg-neutral-800" />
                        <div>
                          <p className="text-2xl font-black text-neutral-500">{bot}</p>
                          <p className="text-neutral-700 text-xs font-bold">{100 - hPct}%</p>
                          <p className="text-neutral-600 text-xs">🤖 Bot</p>
                        </div>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${hPct}%` }} />
                      </div>
                    </div>
                  );
                })}
                <p className="text-neutral-700 text-xs">💾 Bot บันทึกลง visits.json ทุก 30 นาที (persistent)</p>
              </div>

              {/* Right: donut chart */}
              <div className="flex flex-col items-center gap-3">
                <svg width="200" height="200" viewBox="0 0 200 200">
                  <circle cx={CX} cy={CY} r={R} fill="#404040" />
                  {mkArc(humanRangePct)}
                  <circle cx={CX} cy={CY} r={R * 0.56} fill="#171717" />
                  <text x={CX} y={CY - 8}  textAnchor="middle" fill="#22c55e" fontSize="20" fontWeight="900">{humanRangePct}%</text>
                  <text x={CX} y={CY + 12} textAnchor="middle" fill="#525252" fontSize="11">คนจริง</text>
                </svg>
                <div className="flex gap-4 text-xs text-neutral-500">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />คนจริง</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-neutral-600 inline-block" />Bot</span>
                </div>
                <p className="text-neutral-600 text-xs">ช่วงที่เลือก</p>
              </div>

            </div>
          </div>
        );
      })()}

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
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetch('/api/get-leads')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError('โหลดข้อมูลไม่ได้ กรุณาตรวจสอบการเชื่อมต่อ'); setLoading(false); });
    fetch('/api/bookings')
      .then(r => r.json())
      .then(d => setBookings(d.bookings || []));
  }, []);

  const { remapLeads, partnerApplications, counts } = data;
  const total = counts.remap + counts.partner;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
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
              <AnalyticsSection visits={data.visits || []} botVisits={data.botVisits || []} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center">
                <p className="text-neutral-500 text-sm mb-3 uppercase tracking-wider">ECU Remap Leads</p>
                <p className="text-6xl font-black text-red-500">{counts.remap}</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center">
                <p className="text-neutral-500 text-sm mb-3 uppercase tracking-wider">Partner Applications</p>
                <p className="text-6xl font-black text-orange-500">{counts.partner}</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center">
                <p className="text-neutral-500 text-sm mb-3 uppercase tracking-wider">📅 การจองคิว</p>
                <p className="text-6xl font-black text-blue-400">{confirmedBookings.length}</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center">
                <p className="text-neutral-500 text-sm mb-3 uppercase tracking-wider">รวม Leads + จอง</p>
                <p className="text-6xl font-black text-white">{total + confirmedBookings.length}</p>
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

            <div>
              <h2 className="text-white font-bold text-xl mb-4 border-l-4 border-blue-400 pl-4">
                📅 การจองคิวรีแมป <span className="text-neutral-500 font-normal text-base ml-2">({confirmedBookings.length} รายการ)</span>
              </h2>
              <div className="overflow-x-auto rounded-2xl border border-neutral-800">
                <table className="w-full">
                  <thead className="bg-neutral-900 border-b border-neutral-800">
                    <tr>
                      <th className={thCls}>วันจอง</th><th className={thCls}>วันนัด</th>
                      <th className={thCls}>เวลา</th><th className={thCls}>ชื่อ</th>
                      <th className={thCls}>โทร / LINE</th><th className={thCls}>รถ</th>
                      <th className={thCls}>สถานที่</th><th className={thCls}>หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {bookings.length === 0
                      ? <tr><td colSpan={8} className="px-4 py-12 text-center text-neutral-600">ยังไม่มีการจอง</td></tr>
                      : [...bookings].sort((a,b) => a.date > b.date ? 1 : -1).map((b, i) => (
                        <tr key={i} className={`transition-colors ${b.status === 'cancelled' ? 'opacity-40 bg-neutral-950' : 'bg-neutral-950 hover:bg-neutral-900'}`}>
                          <td className={`${tdCls} text-neutral-500 whitespace-nowrap text-xs`}>{b.timestamp}</td>
                          <td className={`${tdCls} text-white font-bold whitespace-nowrap`}>{b.date}</td>
                          <td className={`${tdCls} text-blue-400 font-bold whitespace-nowrap`}>{b.time}</td>
                          <td className={`${tdCls} text-white font-medium`}>{b.name}</td>
                          <td className={`${tdCls} text-neutral-300 text-xs`}>{b.phone}{b.lineId ? ` / ${b.lineId}` : ''}</td>
                          <td className={`${tdCls} text-neutral-300 text-xs whitespace-nowrap`}>{[b.carModel, b.carYear, b.carColor].filter(Boolean).join(' ')}</td>
                          <td className={`${tdCls} text-neutral-400 text-xs max-w-xs`}>
                            {b.locationName && <span className="block">{b.locationName}</span>}
                            {b.locationUrl && <a href={b.locationUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-xs">📍 ดูแผนที่</a>}
                          </td>
                          <td className={`${tdCls} text-neutral-500 text-xs max-w-xs truncate`}>
                            {b.status === 'cancelled' ? <span className="text-red-500 font-bold">ยกเลิก</span> : b.note || '-'}
                          </td>
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

// ─── About Page Default Data ──────────────────────────────────────────────────
const DEFAULT_ABOUT = {
  hero: {
    title: 'Shiftup Performance',
    subtitle: 'ผู้เชี่ยวชาญด้านการปรับแต่งสมรรถนะรถยนต์ครบวงจร โดย P2W Interplus',
  },
  whoWeAre: {
    title: 'เราคือใคร',
    content: 'Shiftup Performance (P2W Interplus) คือทีมช่างผู้เชี่ยวชาญด้านการปรับแต่งสมรรถนะรถยนต์ เราให้บริการ ECU Remap ผ่าน OBD2 โดยไม่ต้องถอดกล่อง พร้อมจำหน่ายท่อไอเสีย HKS ของแท้ และระบบเสียงไอเสียเทียม Panthera Active Sound สำหรับทั้งรถน้ำมันและรถ EV\n\nเราเชื่อว่าทุกคันควรมีคาแรกเตอร์เป็นของตัวเอง ด้วยประสบการณ์ตรงจากทีมช่างที่คลุกคลีกับวงการรถมาอย่างยาวนาน เราพร้อมดูแลและพัฒนารถของคุณให้ตรงกับสไตล์การขับขี่มากที่สุด',
  },
  whyUs: {
    title: 'ทำไมต้องเลือกเรา',
    items: [
      { icon: '⚡', title: 'ช่างมีประสบการณ์จริง', desc: 'ทีมช่างเชี่ยวชาญด้าน ECU Remap และระบบไอเสีย คลุกคลีกับวงการรถมาอย่างยาวนาน' },
      { icon: '🔧', title: 'บริการครบจบที่เดียว', desc: 'ตั้งแต่ ECU Remap, ท่อไอเสีย HKS, ไปจนถึงระบบเสียง Panthera ไม่ต้องวิ่งหลายที่' },
      { icon: '📱', title: 'ไม่ต้องถอดกล่อง', desc: 'ใช้เทคนิค OBD2 Remap ปลอดภัย รวดเร็ว และไม่กระทบการรับประกันจากศูนย์' },
      { icon: '✅', title: 'รองรับรถหลากหลายรุ่น', desc: 'รองรับรถยนต์จากหลายแบรนด์ ทั้งรถน้ำมัน ดีเซล และ EV' },
      { icon: '💬', title: 'ปรึกษาฟรี ไม่มีค่าใช้จ่าย', desc: 'ทีมงานพร้อมแนะนำและประเมินรถก่อนตัดสินใจ ไม่มีค่าใช้จ่ายในการปรึกษา' },
      { icon: '🚗', title: 'บริการ On-Site', desc: 'มีบริการ On-Site ถึงที่ สะดวกสบาย ไม่ต้องเสียเวลาเดินทาง (เงื่อนไขตามที่ตกลง)' },
    ],
  },
  policy: {
    title: 'นโยบายและเงื่อนไข',
    items: [
      { title: 'การรับประกันงาน', content: 'รับประกันงาน ECU Remap หากพบปัญหาจากการจูน ทางทีมช่างพร้อมแก้ไขให้ฟรีภายในระยะเวลาที่กำหนด' },
      { title: 'ขั้นตอนการให้บริการ', content: '1. ปรึกษาและประเมินรถฟรีผ่าน LINE OA\n2. นัดหมายวันและเวลา\n3. ตรวจสอบสภาพรถก่อนเริ่มงาน\n4. ดำเนินการ Remap / ติดตั้ง\n5. ทดสอบและส่งมอบ พร้อมคำแนะนำหลังการใช้งาน' },
      { title: 'เงื่อนไขการให้บริการ', content: 'รถควรอยู่ในสภาพพร้อมใช้งาน ไม่มีปัญหา Engine Light ก่อนรับบริการ Remap ทางทีมช่างขอสงวนสิทธิ์ในการประเมินและแนะนำก่อนเริ่มงานทุกครั้ง' },
      { title: 'นโยบายความเป็นส่วนตัว', content: 'ข้อมูลลูกค้าที่กรอกในฟอร์มจะถูกใช้เพื่อการติดต่อและให้บริการเท่านั้น ไม่มีการเปิดเผยข้อมูลต่อบุคคลที่สาม' },
    ],
  },
  contact: {
    title: 'ติดต่อเรา',
    desc: 'ปรึกษาฟรี ไม่มีค่าใช้จ่าย ทีมงานพร้อมตอบทุกคำถาม',
    phone: '083-009-2554',
    phoneName: 'ปิง',
    lineId: '@shiftup',
    lineUrl: 'https://lin.ee/nZOMcph',
    facebookUrl: 'https://www.facebook.com/shiftupperformance',
  },
};

// ─── About Admin Panel ────────────────────────────────────────────────────────
const AboutAdminPanel = ({ data, onSave, onClose }) => {
  const [d, setD] = useState(JSON.parse(JSON.stringify(data)));
  const [tab, setTab] = useState('hero');

  const tabBtn = (key, label) => (
    <button key={key} onClick={() => setTab(key)}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === key ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}>
      {label}
    </button>
  );

  const inputCls = 'w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-red-500';
  const labelCls = 'block text-xs text-neutral-400 mb-1';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 pt-8">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-3xl">
        <div className="flex items-center justify-between p-5 border-b border-neutral-800">
          <h2 className="text-white font-bold text-lg">✏️ แก้ไข About Us</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white"><X size={22} /></button>
        </div>

        <div className="p-5 flex gap-2 flex-wrap border-b border-neutral-800">
          {tabBtn('hero', 'Hero')}
          {tabBtn('whoWeAre', 'เราคือใคร')}
          {tabBtn('whyUs', 'ทำไมเลือกเรา')}
          {tabBtn('policy', 'นโยบาย')}
          {tabBtn('contact', 'ติดต่อ')}
        </div>

        <div className="p-5 space-y-4">
          {tab === 'hero' && (
            <>
              <div><label className={labelCls}>ชื่อหลัก (Title)</label>
                <input className={inputCls} value={d.hero.title} onChange={e => setD({ ...d, hero: { ...d.hero, title: e.target.value } })} /></div>
              <div><label className={labelCls}>คำอธิบายใต้ชื่อ (Subtitle)</label>
                <textarea rows={3} className={inputCls} value={d.hero.subtitle} onChange={e => setD({ ...d, hero: { ...d.hero, subtitle: e.target.value } })} /></div>
            </>
          )}

          {tab === 'whoWeAre' && (
            <>
              <div><label className={labelCls}>หัวข้อ</label>
                <input className={inputCls} value={d.whoWeAre.title} onChange={e => setD({ ...d, whoWeAre: { ...d.whoWeAre, title: e.target.value } })} /></div>
              <div><label className={labelCls}>เนื้อหา (ขึ้นบรรทัดใหม่ได้)</label>
                <textarea rows={8} className={inputCls} value={d.whoWeAre.content} onChange={e => setD({ ...d, whoWeAre: { ...d.whoWeAre, content: e.target.value } })} /></div>
            </>
          )}

          {tab === 'whyUs' && (
            <>
              <div><label className={labelCls}>หัวข้อ Section</label>
                <input className={inputCls} value={d.whyUs.title} onChange={e => setD({ ...d, whyUs: { ...d.whyUs, title: e.target.value } })} /></div>
              <div className="space-y-3">
                {d.whyUs.items.map((item, i) => (
                  <div key={i} className="bg-neutral-800 rounded-xl p-4 space-y-2">
                    <div className="flex gap-2">
                      <div className="w-20"><label className={labelCls}>Emoji</label>
                        <input className={inputCls} value={item.icon} onChange={e => { const arr = [...d.whyUs.items]; arr[i] = { ...arr[i], icon: e.target.value }; setD({ ...d, whyUs: { ...d.whyUs, items: arr } }); }} /></div>
                      <div className="flex-1"><label className={labelCls}>หัวข้อ</label>
                        <input className={inputCls} value={item.title} onChange={e => { const arr = [...d.whyUs.items]; arr[i] = { ...arr[i], title: e.target.value }; setD({ ...d, whyUs: { ...d.whyUs, items: arr } }); }} /></div>
                      <button onClick={() => { const arr = d.whyUs.items.filter((_, j) => j !== i); setD({ ...d, whyUs: { ...d.whyUs, items: arr } }); }} className="mt-4 text-red-500 hover:text-red-400 text-xs">ลบ</button>
                    </div>
                    <div><label className={labelCls}>คำอธิบาย</label>
                      <textarea rows={2} className={inputCls} value={item.desc} onChange={e => { const arr = [...d.whyUs.items]; arr[i] = { ...arr[i], desc: e.target.value }; setD({ ...d, whyUs: { ...d.whyUs, items: arr } }); }} /></div>
                  </div>
                ))}
                <button onClick={() => setD({ ...d, whyUs: { ...d.whyUs, items: [...d.whyUs.items, { icon: '⭐', title: 'หัวข้อใหม่', desc: 'คำอธิบาย' }] } })}
                  className="w-full py-2 border border-dashed border-neutral-700 text-neutral-500 hover:text-neutral-300 rounded-lg text-sm">+ เพิ่มข้อ</button>
              </div>
            </>
          )}

          {tab === 'policy' && (
            <>
              <div><label className={labelCls}>หัวข้อ Section</label>
                <input className={inputCls} value={d.policy.title} onChange={e => setD({ ...d, policy: { ...d.policy, title: e.target.value } })} /></div>
              <div className="space-y-3">
                {d.policy.items.map((item, i) => (
                  <div key={i} className="bg-neutral-800 rounded-xl p-4 space-y-2">
                    <div className="flex gap-2 items-center">
                      <div className="flex-1"><label className={labelCls}>หัวข้อ</label>
                        <input className={inputCls} value={item.title} onChange={e => { const arr = [...d.policy.items]; arr[i] = { ...arr[i], title: e.target.value }; setD({ ...d, policy: { ...d.policy, items: arr } }); }} /></div>
                      <button onClick={() => { const arr = d.policy.items.filter((_, j) => j !== i); setD({ ...d, policy: { ...d.policy, items: arr } }); }} className="mt-4 text-red-500 hover:text-red-400 text-xs">ลบ</button>
                    </div>
                    <div><label className={labelCls}>เนื้อหา</label>
                      <textarea rows={4} className={inputCls} value={item.content} onChange={e => { const arr = [...d.policy.items]; arr[i] = { ...arr[i], content: e.target.value }; setD({ ...d, policy: { ...d.policy, items: arr } }); }} /></div>
                  </div>
                ))}
                <button onClick={() => setD({ ...d, policy: { ...d.policy, items: [...d.policy.items, { title: 'หัวข้อใหม่', content: 'เนื้อหา' }] } })}
                  className="w-full py-2 border border-dashed border-neutral-700 text-neutral-500 hover:text-neutral-300 rounded-lg text-sm">+ เพิ่มข้อ</button>
              </div>
            </>
          )}

          {tab === 'contact' && (
            <>
              <div><label className={labelCls}>หัวข้อ Section</label>
                <input className={inputCls} value={d.contact.title} onChange={e => setD({ ...d, contact: { ...d.contact, title: e.target.value } })} /></div>
              <div><label className={labelCls}>คำอธิบาย</label>
                <input className={inputCls} value={d.contact.desc} onChange={e => setD({ ...d, contact: { ...d.contact, desc: e.target.value } })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>เบอร์โทร</label>
                  <input className={inputCls} value={d.contact.phone} onChange={e => setD({ ...d, contact: { ...d.contact, phone: e.target.value } })} /></div>
                <div><label className={labelCls}>ชื่อผู้รับ</label>
                  <input className={inputCls} value={d.contact.phoneName} onChange={e => setD({ ...d, contact: { ...d.contact, phoneName: e.target.value } })} /></div>
                <div><label className={labelCls}>LINE ID</label>
                  <input className={inputCls} value={d.contact.lineId} onChange={e => setD({ ...d, contact: { ...d.contact, lineId: e.target.value } })} /></div>
                <div><label className={labelCls}>LINE URL</label>
                  <input className={inputCls} value={d.contact.lineUrl} onChange={e => setD({ ...d, contact: { ...d.contact, lineUrl: e.target.value } })} /></div>
                <div className="col-span-2"><label className={labelCls}>Facebook URL</label>
                  <input className={inputCls} value={d.contact.facebookUrl} onChange={e => setD({ ...d, contact: { ...d.contact, facebookUrl: e.target.value } })} /></div>
              </div>
            </>
          )}
        </div>

        <div className="p-5 border-t border-neutral-800 flex gap-3 justify-end">
          <button onClick={onClose} className="px-5 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white text-sm">ยกเลิก</button>
          <button onClick={() => onSave(d)} className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold">บันทึก</button>
        </div>
      </div>
    </div>
  );
};

// ─── About Page ───────────────────────────────────────────────────────────────
const AboutPage = ({ lineUrl }) => {
  const [data, setData] = useState(DEFAULT_ABOUT);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [openPolicy, setOpenPolicy] = useState(null);

  useEffect(() => {
    fetch('/content.json')
      .then(r => r.json())
      .then(d => { if (d.about) setData(d.about); })
      .catch(() => {});
  }, []);

  const handleSave = (nd) => { setData(nd); setShowAdmin(false); saveContent('about', nd); };

  const services = [
    { icon: <Zap size={28} />, title: 'ECU Remap', desc: 'เพิ่มแรงม้า แรงบิด ลดอาการอืด ผ่าน OBD2 ไม่ต้องถอดกล่อง', page: 'remap', color: 'text-red-400', border: 'border-red-900/40' },
    { icon: <Volume2 size={28} />, title: 'HKS Exhaust', desc: 'ท่อไอเสีย HKS ของแท้ เสียงดี สวยงาม รองรับหลายรุ่น', page: 'hks', color: 'text-orange-400', border: 'border-orange-900/40' },
    { icon: <Activity size={28} />, title: 'Panthera Active Sound', desc: 'ระบบเสียงไอเสียเทียม สำหรับรถน้ำมันและ EV ติดตั้งง่าย', page: 'panthera', color: 'text-blue-400', border: 'border-blue-900/40' },
  ];

  return (
    <div className="pb-24 relative">
      {showPassword && <PasswordModal onSuccess={() => { setShowPassword(false); setShowAdmin(true); }} onClose={() => setShowPassword(false)} />}
      {showAdmin && <AboutAdminPanel data={data} onSave={handleSave} onClose={() => setShowAdmin(false)} />}

      {/* Admin button */}
      <button onClick={() => setShowPassword(true)} title="แก้ไข About Us"
        className="fixed bottom-6 right-6 w-9 h-9 rounded-full bg-neutral-900/40 hover:bg-neutral-700 border border-neutral-800/50 flex items-center justify-center text-neutral-700 hover:text-neutral-300 transition-all duration-300 z-40 opacity-30 hover:opacity-100 text-sm">
        ✏️
      </button>

      {/* ── Section 1: Hero ── */}
      <section className="relative bg-neutral-900 border-b border-neutral-800 py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-5"><ShieldCheck size={500} /></div>
        <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-red-600/8 rounded-full blur-[120px]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800/60 border border-neutral-700 mb-6">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">P2W Interplus</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-4">
            {data.hero.title}
          </h1>
          <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            {data.hero.subtitle}
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 lg:px-8 space-y-24 mt-20">

        {/* ── Section 2: Who We Are ── */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 bg-red-500 rounded-full" />
            <h2 className="text-3xl font-black text-white">{data.whoWeAre.title}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              {data.whoWeAre.content.split('\n\n').map((para, i) => (
                <p key={i} className="text-neutral-400 leading-relaxed text-base">{para}</p>
              ))}
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 flex flex-col items-center gap-4">
              <img src={LOGO_SRC} alt="Shiftup Performance" className="h-28 w-auto opacity-90" />
              <p className="text-neutral-500 text-sm text-center">Shiftup Performance<br />by P2W Interplus</p>
            </div>
          </div>
        </section>

        {/* ── Section 3: Our Services ── */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 bg-red-500 rounded-full" />
            <h2 className="text-3xl font-black text-white">บริการของเรา</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {services.map(s => (
              <div key={s.title} className={`bg-neutral-900 border ${s.border} rounded-2xl p-6 flex flex-col gap-4`}>
                <div className={s.color}>{s.icon}</div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-2">{s.title}</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 4: Why Us ── */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 bg-red-500 rounded-full" />
            <h2 className="text-3xl font-black text-white">{data.whyUs.title}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.whyUs.items.map((item, i) => (
              <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex gap-4">
                <span className="text-3xl shrink-0">{item.icon}</span>
                <div>
                  <p className="text-white font-semibold text-sm mb-1">{item.title}</p>
                  <p className="text-neutral-500 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 5: Policy ── */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 bg-red-500 rounded-full" />
            <h2 className="text-3xl font-black text-white">{data.policy.title}</h2>
          </div>
          <div className="space-y-3">
            {data.policy.items.map((item, i) => (
              <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                <button onClick={() => setOpenPolicy(openPolicy === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left">
                  <span className="text-white font-semibold">{item.title}</span>
                  <ChevronRight size={18} className={`text-neutral-500 transition-transform ${openPolicy === i ? 'rotate-90' : ''}`} />
                </button>
                {openPolicy === i && (
                  <div className="px-6 pb-5">
                    <div className="border-t border-neutral-800 pt-4">
                      {item.content.split('\n').map((line, j) => (
                        <p key={j} className="text-neutral-400 text-sm leading-relaxed">{line}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 6: Contact ── */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 bg-red-500 rounded-full" />
            <h2 className="text-3xl font-black text-white">{data.contact.title}</h2>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
            <p className="text-neutral-400 mb-8 text-base">{data.contact.desc}</p>
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <a href={`tel:${data.contact.phone.replace(/-/g, '')}`}
                className="flex items-center gap-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl p-4 transition-colors">
                <span className="text-2xl">📞</span>
                <div>
                  <p className="text-white font-semibold text-sm">{data.contact.phone}</p>
                  <p className="text-neutral-500 text-xs">({data.contact.phoneName})</p>
                </div>
              </a>
              <a href={data.contact.lineUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl p-4 transition-colors">
                <span className="text-2xl">💬</span>
                <div>
                  <p className="text-[#06C755] font-semibold text-sm">LINE OA</p>
                  <p className="text-neutral-500 text-xs">{data.contact.lineId}</p>
                </div>
              </a>
              <a href={data.contact.facebookUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl p-4 transition-colors">
                <span className="text-2xl">📘</span>
                <div>
                  <p className="text-blue-400 font-semibold text-sm">Facebook</p>
                  <p className="text-neutral-500 text-xs">Shiftup Performance</p>
                </div>
              </a>
            </div>
            <a href={data.contact.lineUrl} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)]">
              <MessageCircle size={18} /> ปรึกษาฟรีผ่าน LINE
            </a>
          </div>
        </section>

      </div>
    </div>
  );
};

// ── Map Picker Modal (Leaflet + OpenStreetMap, ฟรีไม่ต้อง API key) ──
const { useRef: useMapRef } = React;
const MapPicker = ({ initialLat, initialLng, onConfirm, onClose }) => {
  const containerRef  = useMapRef(null);
  const mapRef        = useMapRef(null);
  const markerRef     = useMapRef(null);
  const searchTimer   = useMapRef(null);
  const [address,     setAddress]     = React.useState('กำลังหาที่อยู่...');
  const [coords,      setCoords]      = React.useState({ lat: initialLat, lng: initialLng });
  const [searchQ,     setSearchQ]     = React.useState('');
  const [searchRes,   setSearchRes]   = React.useState([]);
  const [searching,   setSearching]   = React.useState(false);

  const reverseGeocode = async (lat, lng) => {
    setAddress('กำลังหาที่อยู่...');
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=th`);
      const d = await r.json();
      setAddress(d.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } catch {
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  const moveTo = (lat, lng, zoom = 17) => {
    if (!mapRef.current || !markerRef.current) return;
    const latlng = window.L.latLng(lat, lng);
    markerRef.current.setLatLng(latlng);
    mapRef.current.setView(latlng, zoom);
    setCoords({ lat, lng });
    reverseGeocode(lat, lng);
  };

  const doSearch = async (q) => {
    if (!q.trim()) { setSearchRes([]); return; }
    setSearching(true);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&accept-language=th&countrycodes=th`);
      const d = await r.json();
      setSearchRes(d);
    } catch { setSearchRes([]); }
    setSearching(false);
  };

  useEffect(() => {
    if (!window.L || !containerRef.current) return;
    const L   = window.L;
    const map = L.map(containerRef.current).setView([initialLat, initialLng], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
    }).addTo(map);
    const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
    markerRef.current = marker;
    mapRef.current    = map;
    marker.on('dragend', (e) => {
      const { lat, lng } = e.target.getLatLng();
      setCoords({ lat, lng });
      reverseGeocode(lat, lng);
    });
    reverseGeocode(initialLat, initialLng);
    return () => map.remove();
  }, []);

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQ(q);
    clearTimeout(searchTimer.current);
    if (q.length > 1) searchTimer.current = setTimeout(() => doSearch(q), 500);
    else setSearchRes([]);
  };

  const selectResult = (item) => {
    moveTo(parseFloat(item.lat), parseFloat(item.lon));
    setSearchQ(item.display_name);
    setSearchRes([]);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-neutral-900 rounded-2xl overflow-hidden w-full max-w-lg shadow-2xl" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header + Search */}
        <div className="px-5 pt-5 pb-3 flex-shrink-0">
          <h3 className="text-white font-bold text-lg mb-3">📍 เลือกตำแหน่งนัดหมาย</h3>
          <div className="relative">
            <input
              value={searchQ}
              onChange={handleSearchChange}
              placeholder="ค้นหาสถานที่... เช่น บิ๊กซีลำลูกกา"
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 pr-10"
            />
            {searching && <span className="absolute right-3 top-2.5 text-neutral-400 text-xs">...</span>}
            {searchRes.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden z-10 shadow-xl">
                {searchRes.map((item, i) => (
                  <button key={i} onClick={() => selectResult(item)}
                    className="w-full text-left px-4 py-2.5 text-sm text-neutral-200 hover:bg-neutral-700 transition-colors border-b border-neutral-700 last:border-0">
                    {item.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-neutral-500 text-xs mt-2">หรือลากหมุดบนแผนที่เพื่อปรับตำแหน่ง</p>
        </div>
        {/* Map */}
        <div ref={containerRef} style={{ height: 280, width: '100%', flexShrink: 0 }} />
        {/* Address + Buttons */}
        <div className="px-5 py-4 flex-shrink-0">
          <p className="text-neutral-300 text-sm leading-relaxed mb-4 min-h-[2rem] line-clamp-2">{address}</p>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white py-3 rounded-xl font-bold text-sm transition-colors">ยกเลิก</button>
            <button onClick={() => onConfirm(`https://maps.google.com/?q=${coords.lat},${coords.lng}`, address)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-sm transition-colors">✓ ยืนยันตำแหน่ง</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  CANCEL PAGE
// ═══════════════════════════════════════════════════════════════════
const CancelPage = ({ navigateTo }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { success, date, time, name, error }

  const handleCancel = async (e) => {
    e.preventDefault();
    if (code.length !== 4) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await fetch('/api/cancel-by-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelCode: code }),
      }).then(r => r.json());
      setResult(data);
    } catch {
      setResult({ success: false, error: 'ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <button onClick={() => navigateTo('booking')} className="flex items-center gap-2 text-neutral-400 hover:text-white text-sm mb-8 transition-colors">
          <ChevronLeft size={16} /> กลับหน้าจองคิว
        </button>

        {result?.success ? (
          <div className="text-center">
            <CheckCircle size={56} className="text-green-500 mx-auto mb-5" />
            <h2 className="text-2xl font-black text-white mb-2">ยกเลิกสำเร็จ</h2>
            <p className="text-neutral-400 mb-1">วันที่: <span className="text-white font-bold">{result.date}</span></p>
            <p className="text-neutral-400 mb-1">เวลา: <span className="text-white font-bold">{result.time} น.</span></p>
            <p className="text-neutral-400 mb-8">ชื่อ: <span className="text-white font-bold">{result.name}</span></p>
            <p className="text-neutral-500 text-sm mb-8">การจองของคุณถูกยกเลิกเรียบร้อยแล้ว<br/>สามารถจองคิวใหม่ได้ทุกเมื่อ</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => navigateTo('booking')} className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold transition-colors">จองคิวใหม่</button>
              <button onClick={() => navigateTo('home')} className="w-full px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full font-bold transition-colors">กลับหน้าแรก</button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-black text-white mb-2">ยกเลิกการจอง</h1>
              <p className="text-neutral-400 text-sm">กรอกรหัส 4 หลักที่ได้รับหลังจองคิว</p>
            </div>

            <form onSubmit={handleCancel} className="space-y-5">
              <div>
                <label className="text-neutral-300 text-sm font-medium block mb-2">รหัสยกเลิก (4 หลัก)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="0000"
                  className="w-full bg-neutral-900 border border-neutral-700 focus:border-amber-500 rounded-xl px-4 py-4 text-white text-3xl font-black tracking-[0.5em] text-center outline-none transition-colors"
                />
              </div>

              {result?.error && (
                <div className="bg-red-950/60 border border-red-800/50 rounded-xl px-4 py-3 flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{result.error}</p>
                </div>
              )}

              <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3">
                <p className="text-neutral-500 text-xs leading-relaxed">
                  ⚠️ ยกเลิกได้ก่อนเวลานัด <span className="text-white font-bold">12 ชั่วโมง</span> เท่านั้น<br/>
                  หากเลยกำหนดแล้ว กรุณาติดต่อทีมงานโดยตรง
                </p>
              </div>

              <button
                type="submit"
                disabled={code.length !== 4 || loading}
                className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-neutral-800 disabled:text-neutral-600 text-white rounded-full font-black text-lg transition-colors"
              >
                {loading ? 'กำลังตรวจสอบ...' : 'ยืนยันยกเลิก'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  BOOKING PAGE
// ═══════════════════════════════════════════════════════════════════
const BookingPage = ({ navigateTo }) => {
  const ADMIN_PASS = 'Chev9872';
  const [config, setConfig] = useState(null);
  const [bookedSlots, setBookedSlots] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', lineId: '', carModel: '', carYear: '', carColor: '', note: '', locationName: '', locationUrl: '' });
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cancelCode, setCancelCode] = useState('');
  const [error, setError] = useState('');
  const genCaptcha = () => { const a = Math.floor(Math.random()*9)+1; const b = Math.floor(Math.random()*9)+1; return { a, b, ans: a + b }; };
  const [captcha, setCaptcha] = useState(() => genCaptcha());
  const [captchaInput, setCaptchaInput] = useState('');
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapCoords, setMapCoords] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPw, setAdminPw] = useState('');
  const [adminAuth, setAdminAuth] = useState(false);
  const [adminError, setAdminError] = useState('');

  useEffect(() => {
    fetch('/api/booking-config')
      .then(r => r.json())
      .then(d => { setConfig(d.config); setBookedSlots(d.bookedSlots || {}); })
      .catch(() => setConfig({ advanceDays: 30, defaultSlots: ['09:00','10:30','12:00','13:30','15:00','16:30','18:00','19:30','21:00'], closedDates: [], customSlots: {} }));
  }, []);

  const getDates = () => {
    if (!config) return [];
    const days = [];
    const now = new Date();
    for (let i = 0; i < config.advanceDays; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const key = d.toLocaleDateString('sv-SE'); // YYYY-MM-DD
      if (!config.closedDates?.includes(key)) days.push({ key, d });
    }
    return days;
  };

  const getSlots = (dateKey) => {
    if (!config) return [];
    if ((config.closedDates || []).includes(dateKey)) return [];
    return config.customSlots?.[dateKey] || config.defaultSlots || [];
  };

  const isBooked = (dateKey, time) => (bookedSlots[dateKey] || []).includes(time);

  const thDate = (d) => d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' });
  const thDateFull = (key) => {
    const d = new Date(key + 'T00:00:00');
    return d.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) return setError('กรุณาเลือกวันที่และเวลา');
    if (!form.name || !form.phone) return setError('กรุณากรอกชื่อและเบอร์โทร');
    if (!form.lineId) return setError('กรุณากรอก LINE ID');
    if (!form.carModel) return setError('กรุณากรอกรุ่นรถ');
    if (parseInt(captchaInput) !== captcha.ans) { setCaptcha(genCaptcha()); setCaptchaInput(''); return setError('คำตอบยืนยันตัวตนไม่ถูกต้อง กรุณาลองใหม่'); }
    setSubmitting(true); setSending(true); setError('');
    try {
      const [data] = await Promise.all([
        fetch('/api/book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: selectedDate, time: selectedTime, ...form }),
        }).then(r => r.json()),
        new Promise(resolve => setTimeout(resolve, 7000)),
      ]);
      if (data.success) {
        setBookedSlots(prev => ({ ...prev, [selectedDate]: [...(prev[selectedDate] || []), selectedTime] }));
        setCancelCode(data.cancelCode || '');
        setCaptcha(genCaptcha()); setCaptchaInput('');
        setSuccess(true);
      } else {
        setError(data.error || 'เกิดข้อผิดพลาด');
        setCaptcha(genCaptcha()); setCaptchaInput('');
      }
    } catch { setError('ไม่สามารถเชื่อมต่อได้'); }
    setSending(false); setSubmitting(false);
  };

  if (!config) return <div className="min-h-screen flex items-center justify-center text-neutral-400">กำลังโหลด...</div>;

  if (sending) return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-neutral-950 overflow-hidden">
      <style>{`
        @keyframes car-slide {
          0%   { transform: translateX(-180px) }
          100% { transform: translateX(calc(100vw + 180px)) }
        }
        @keyframes line-rush {
          0%   { transform: translateX(60px) scaleX(0); opacity: 0 }
          30%  { opacity: 1 }
          100% { transform: translateX(-120vw) scaleX(1); opacity: 0 }
        }
        @keyframes prog-fill {
          0%   { width: 0% }
          100% { width: 97% }
        }
        @keyframes rpm-spin {
          0%   { transform: rotate(-120deg) }
          100% { transform: rotate(120deg) }
        }
        @keyframes data-fade { 0%,100%{opacity:.25} 50%{opacity:1} }
        @keyframes item-in {
          from { opacity:0; transform: translateY(12px) }
          to   { opacity:1; transform: translateY(0) }
        }
        @keyframes glow-pulse {
          0%,100% { box-shadow: 0 0 8px rgba(239,68,68,0.4) }
          50%     { box-shadow: 0 0 24px rgba(239,68,68,0.9) }
        }
      `}</style>

      <div className="w-full max-w-md text-center">

        {/* Header */}
        <p className="text-neutral-500 text-xs uppercase tracking-[0.25em] mb-1">ECU REMAP BOOKING SYSTEM</p>
        <h2 className="text-white text-xl font-bold mb-8">
          กำลังส่งข้อมูลการจอง
          <span style={{ animation: 'data-fade 1s ease-in-out infinite 0.0s' }}>.</span>
          <span style={{ animation: 'data-fade 1s ease-in-out infinite 0.3s' }}>.</span>
          <span style={{ animation: 'data-fade 1s ease-in-out infinite 0.6s' }}>.</span>
        </h2>

        {/* Racing track */}
        <div className="relative h-20 mb-6 overflow-hidden">
          {/* Road */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-800" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-neutral-700" style={{ top: '50%' }} />

          {/* Speed lines */}
          {[0,1,2,3,4].map(i => (
            <div key={i} className="absolute rounded-full bg-red-500/60"
              style={{
                height: 2,
                width: `${40 + i * 20}px`,
                top: `${28 + i * 8}px`,
                left: '60%',
                animation: `line-rush ${0.5 + i * 0.08}s linear infinite`,
                animationDelay: `${i * 0.12}s`,
              }} />
          ))}
          {[0,1,2].map(i => (
            <div key={`w${i}`} className="absolute rounded-full bg-orange-400/40"
              style={{
                height: 1,
                width: `${25 + i * 15}px`,
                top: `${35 + i * 10}px`,
                left: '55%',
                animation: `line-rush ${0.4 + i * 0.1}s linear infinite`,
                animationDelay: `${0.05 + i * 0.15}s`,
              }} />
          ))}

          {/* Car SVG */}
          <div className="absolute" style={{ bottom: 4, animation: 'car-slide 1.6s linear infinite' }}>
            <svg width="110" height="44" viewBox="0 0 110 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Body */}
              <rect x="8" y="20" width="94" height="18" rx="5" fill="#dc2626"/>
              {/* Cabin */}
              <path d="M28 20 L38 6 L76 6 L88 20 Z" fill="#b91c1c"/>
              {/* Windshield */}
              <path d="M40 8 L36 20 L76 20 L74 8 Z" fill="#1e293b" opacity="0.9"/>
              {/* Side window */}
              <path d="M42 9 L39 18 L68 18 L70 9 Z" fill="#334155" opacity="0.7"/>
              {/* Spoiler */}
              <rect x="98" y="16" width="8" height="3" rx="1" fill="#991b1b"/>
              <rect x="104" y="12" width="2" height="7" rx="1" fill="#7f1d1d"/>
              {/* Front bumper */}
              <rect x="2" y="26" width="8" height="8" rx="2" fill="#991b1b"/>
              {/* Headlight */}
              <rect x="3" y="24" width="6" height="3" rx="1" fill="#fbbf24"/>
              {/* Exhaust glow */}
              <ellipse cx="102" cy="36" rx="4" ry="2" fill="#f97316" opacity="0.7"/>
              {/* Front wheel */}
              <circle cx="28" cy="38" r="7" fill="#1e293b"/>
              <circle cx="28" cy="38" r="4" fill="#374151"/>
              <circle cx="28" cy="38" r="1.5" fill="#dc2626"/>
              {/* Rear wheel */}
              <circle cx="82" cy="38" r="7" fill="#1e293b"/>
              <circle cx="82" cy="38" r="4" fill="#374151"/>
              <circle cx="82" cy="38" r="1.5" fill="#dc2626"/>
              {/* Door line */}
              <line x1="55" y1="21" x2="55" y2="36" stroke="#991b1b" strokeWidth="1"/>
            </svg>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-2 bg-neutral-800 rounded-full overflow-hidden mb-2" style={{ animation: 'glow-pulse 1s ease-in-out infinite' }}>
          <div className="h-full rounded-full" style={{
            background: 'linear-gradient(90deg, #dc2626, #f97316, #facc15)',
            animation: 'prog-fill 7s linear forwards',
          }} />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" style={{ animation: 'line-rush 1.2s linear infinite' }} />
        </div>
        <p className="text-neutral-600 text-xs mb-8">กำลังเชื่อมต่อระบบ...</p>

        {/* Booking detail chips */}
        <div className="space-y-2.5 text-left">
          {[
            { icon: '👤', label: 'ชื่อ', value: form.name, delay: '0.5s' },
            { icon: '📅', label: 'วันที่', value: selectedDate ? thDateFull(selectedDate) : '', delay: '1.5s' },
            { icon: '⏰', label: 'เวลา', value: selectedTime ? `${selectedTime} น.` : '', delay: '2.5s' },
            { icon: '🚗', label: 'รถ', value: [form.carModel, form.carYear, form.carColor].filter(Boolean).join(' '), delay: '3.5s' },
            form.locationName ? { icon: '📍', label: 'สถานที่', value: form.locationName, delay: '4.5s' } : null,
          ].filter(Boolean).map((item, i) => (
            <div key={i} className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 opacity-0"
              style={{ animation: `item-in 0.5s ease forwards`, animationDelay: item.delay }}>
              <span className="text-lg shrink-0">{item.icon}</span>
              <span className="text-neutral-500 text-xs w-14 shrink-0">{item.label}</span>
              <span className="text-white text-sm font-medium truncate">{item.value || '—'}</span>
              <span className="ml-auto text-green-500 text-xs shrink-0" style={{ animation: `data-fade 1s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }}>✓</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (success) return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="text-center max-w-md w-full">
        <CheckCircle size={64} className="text-green-500 mx-auto mb-6" />
        <h2 className="text-3xl font-black text-white mb-4">จองคิวสำเร็จ!</h2>
        <p className="text-neutral-400 mb-2">วันที่: <span className="text-white font-bold">{thDateFull(selectedDate)}</span></p>
        <p className="text-neutral-400 mb-6">เวลา: <span className="text-white font-bold">{selectedTime} น.</span></p>

        {cancelCode && (
          <div className="bg-neutral-900 border border-amber-500/40 rounded-2xl p-5 mb-6 text-left">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">รหัสยกเลิกการจอง</p>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl font-black text-white tracking-[0.3em]">{cancelCode}</span>
            </div>
            <p className="text-neutral-400 text-xs leading-relaxed mb-3">
              📸 ถ่ายรูปรหัสนี้เก็บไว้<br/>
              ⚠️ ยกเลิกได้ก่อนเวลานัด <span className="text-white font-bold">12 ชั่วโมง</span> เท่านั้น
            </p>
            <button onClick={() => navigateTo('cancel')}
              className="w-full py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-400 text-sm font-bold transition-colors border border-amber-500/30">
              ไปหน้ายกเลิกการจอง →
            </button>
          </div>
        )}

        <p className="text-sm text-neutral-500 mb-8">ทีมงานจะติดต่อกลับเพื่อยืนยันการนัดหมายผ่านเบอร์โทรหรือ LINE ของคุณ</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => { setSuccess(false); setCancelCode(''); setSelectedDate(null); setSelectedTime(null); setForm({ name:'',phone:'',lineId:'',carModel:'',carYear:'',carColor:'',note:'',locationName:'',locationUrl:'' }); }} className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full font-bold transition-colors">จองคิวใหม่</button>
          <button onClick={() => navigateTo('home')} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold transition-colors">กลับหน้าแรก</button>
        </div>
      </div>
    </div>
  );

  const dates = getDates();
  const WEEKDAYS = ['อา','จ','อ','พ','พฤ','ศ','ส'];

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <button onClick={() => navigateTo('remap')} className="flex items-center gap-2 text-neutral-400 hover:text-white text-sm mb-6 transition-colors">
          <ChevronLeft size={16} /> กลับหน้า ECU Remap
        </button>
        <h1 className="text-4xl font-black text-white mb-3">จองคิวรีแมปรถยนต์</h1>
        <div className="flex items-center gap-4">
          <p className="text-neutral-400">เลือกวันและเวลาที่สะดวก ทีมงานจะยืนยันผ่าน LINE</p>
          <button onClick={() => navigateTo('cancel')} className="shrink-0 text-xs text-neutral-500 hover:text-red-400 underline underline-offset-2 transition-colors">
            ยกเลิกการจอง
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calendar + Slots */}
        <div>
          {/* Calendar */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mb-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><CalendarDays size={18} className="text-red-500" /> เลือกวันที่</h3>
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map(d => <div key={d} className="text-center text-xs text-neutral-500 py-1">{d}</div>)}
              {/* empty cells to align first day correctly */}
              {dates.length > 0 && Array.from({ length: dates[0].d.getDay() }, (_, i) => <div key={`e${i}`} />)}
              {dates.map(({ key, d }) => {
                const booked = (bookedSlots[key] || []).length;
                const total  = getSlots(key).length;
                const full   = total > 0 && booked >= total;
                const active = selectedDate === key;
                return (
                  <button key={key}
                    onClick={() => { setSelectedDate(key); setSelectedTime(null); }}
                    disabled={full}
                    title={full ? 'เต็มแล้ว' : ''}
                    className={`rounded-lg py-2 text-sm font-bold transition-all text-center leading-none
                      ${active ? 'bg-red-600 text-white' : full ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed' : 'hover:bg-neutral-700 text-white'}`}
                  >
                    <span className="block">{d.getDate()}</span>
                    {full && <span className="block text-[9px] text-neutral-500 mt-0.5">เต็ม</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time slots */}
          {selectedDate && (() => {
            const allSlots = config?.defaultSlots || [];
            const availableCount = allSlots.filter(t => getSlots(selectedDate).includes(t) && !isBooked(selectedDate, t)).length;
            return (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-white font-bold flex items-center gap-2"><Clock size={18} className="text-red-500" /> เลือกเวลา</h3>
                {availableCount <= 3 && availableCount > 0 && (
                  <span className="text-xs font-bold text-amber-400 animate-pulse">⚡ เหลือ {availableCount} ช่อง!</span>
                )}
                {availableCount === 0 && (
                  <span className="text-xs font-bold text-red-400">เต็มทุกช่อง</span>
                )}
              </div>
              <p className="text-neutral-500 text-xs mb-4">{thDateFull(selectedDate)}</p>
              <div className="grid grid-cols-3 gap-2">
                {allSlots.map(t => {
                  const adminClosed = !getSlots(selectedDate).includes(t);
                  const customerBooked = isBooked(selectedDate, t);
                  const unavailable = adminClosed || customerBooked;
                  const active = selectedTime === t;
                  return (
                    <button key={t}
                      onClick={() => !unavailable && setSelectedTime(t)}
                      disabled={unavailable}
                      className={`py-3 rounded-xl text-sm font-bold transition-all relative overflow-hidden
                        ${unavailable
                          ? 'bg-red-950/60 border border-red-900/40 text-red-900 cursor-not-allowed'
                          : active
                            ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 scale-105'
                            : 'bg-neutral-800 border border-neutral-600 hover:border-green-500/60 hover:bg-neutral-700 text-white hover:shadow-md hover:shadow-green-900/20'}`}
                    >
                      {unavailable ? (
                        <span className="flex flex-col items-center gap-0.5">
                          <span className="line-through text-red-900/80 text-xs">{t}</span>
                          <span className="text-[10px] font-bold text-red-700 tracking-wide">จองแล้ว</span>
                        </span>
                      ) : t}
                    </button>
                  );
                })}
              </div>
            </div>
            );
          })()}

          {/* Customer location input — 2 ช่องแยกกัน */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mt-6 space-y-4">
            <h3 className="text-white font-bold flex items-center gap-2"><MapPin size={18} className="text-red-500" /> สถานที่นัดหมาย</h3>

            {/* ช่อง 1: ชื่อสถานที่ (พิมพ์เอง) */}
            <div>
              <label className="block text-xs text-neutral-400 mb-1">ชื่อสถานที่ / จุดสังเกต</label>
              <input
                value={form.locationName}
                onChange={e => setForm(p => ({ ...p, locationName: e.target.value }))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 text-sm"
                placeholder="เช่น บิ๊กซีลำลูกกา, หน้าปั๊ม PT ลาดพร้าว..."
              />
            </div>

            {/* ช่อง 2: พิกัด GPS (ได้จากการปักหมุด) */}
            <div>
              <label className="block text-xs text-neutral-400 mb-1">พิกัด GPS <span className="text-neutral-600">(ไม่บังคับ)</span></label>
              {form.locationUrl ? (
                <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-3">
                  <MapPin size={14} className="text-red-400 shrink-0" />
                  <a href={form.locationUrl} target="_blank" rel="noreferrer" className="text-red-400 hover:text-red-300 text-sm truncate flex-1">ดูตำแหน่งบน Google Maps</a>
                  <button type="button" onClick={() => setForm(p => ({ ...p, locationUrl: '' }))} className="text-neutral-600 hover:text-neutral-400 text-xs shrink-0">✕ ลบ</button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (mapCoords) { setShowMapPicker(true); return; }
                    const fallback = () => { setMapCoords({ lat: 13.7563, lng: 100.5018 }); setShowMapPicker(true); };
                    if (!navigator.geolocation) { fallback(); return; }
                    const timer = setTimeout(fallback, 5000);
                    navigator.geolocation.getCurrentPosition(
                      pos => { clearTimeout(timer); setMapCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setShowMapPicker(true); },
                      () => { clearTimeout(timer); fallback(); }
                    );
                  }}
                  className="w-full flex items-center justify-center gap-2 border border-dashed border-neutral-700 hover:border-red-500/50 rounded-lg py-3 text-sm text-neutral-400 hover:text-red-400 transition-colors"
                >
                  <MapPin size={15} /> ปักหมุดตำแหน่งบนแผนที่
                </button>
              )}
            </div>
          </div>

          {/* Map Picker Modal */}
          {showMapPicker && mapCoords && (
            <MapPicker
              initialLat={mapCoords.lat}
              initialLng={mapCoords.lng}
              onConfirm={(url) => { setForm(p => ({ ...p, locationUrl: url })); setShowMapPicker(false); }}
              onClose={() => setShowMapPicker(false)}
            />
          )}
        </div>

        {/* Booking Form */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-white font-bold mb-6 flex items-center gap-2"><User size={18} className="text-red-500" /> ข้อมูลการจอง</h3>

          {selectedDate && selectedTime && (
            <div className="bg-red-600/10 border border-red-600/30 rounded-xl px-4 py-3 mb-6 text-sm">
              <span className="text-red-400 font-bold">✓ เลือกแล้ว: </span>
              <span className="text-white">{thDateFull(selectedDate)} เวลา {selectedTime} น.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-neutral-400 mb-1">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
              <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500" placeholder="ชื่อ-นามสกุล" required />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-1">เบอร์โทร <span className="text-red-500">*</span></label>
              <input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500" placeholder="08x-xxx-xxxx" type="tel" required />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-1">LINE ID <span className="text-red-500">*</span></label>
              <input value={form.lineId} onChange={e => setForm(p => ({...p, lineId: e.target.value}))} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500" placeholder="@ชื่อ LINE" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">รุ่นรถ <span className="text-red-500">*</span></label>
                <input value={form.carModel} onChange={e => setForm(p => ({...p, carModel: e.target.value}))} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500" placeholder="Mazda 2" required />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">ปีรถ</label>
                <input value={form.carYear} onChange={e => setForm(p => ({...p, carYear: e.target.value}))} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500" placeholder="2022" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-1">สีรถ</label>
              <input value={form.carColor} onChange={e => setForm(p => ({...p, carColor: e.target.value}))} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500" placeholder="ขาว / แดง / ดำ" />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-1">หมายเหตุ</label>
              <textarea value={form.note} onChange={e => setForm(p => ({...p, note: e.target.value}))} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 h-20 resize-none" placeholder="ข้อมูลเพิ่มเติม หรือสิ่งที่ต้องการปรึกษา" />
            </div>

            {/* Captcha ยืนยันตัวตน */}
            <div className="bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-neutral-300 text-sm shrink-0">ยืนยันตัวตน: <span className="text-white font-bold">{captcha.a} + {captcha.b} = ?</span></span>
              <input
                type="number" inputMode="numeric" value={captchaInput}
                onChange={e => setCaptchaInput(e.target.value)}
                className="w-20 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white text-center focus:outline-none focus:border-red-500 text-sm"
                placeholder="?"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-600/10 border border-red-600/30 rounded-lg px-4 py-3">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <button type="submit" disabled={submitting || !selectedDate || !selectedTime}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-lg">
              {submitting ? 'กำลังจอง...' : <><CalendarDays size={20} /> ยืนยันการจอง</>}
            </button>

            {(!selectedDate || !selectedTime) && (
              <p className="text-center text-sm text-neutral-500">← เลือกวันที่และเวลาก่อน</p>
            )}
          </form>

          {/* Admin — hidden gear icon bottom-right */}
          {adminAuth && (
            <div className="mt-6 pt-6 border-t border-neutral-800">
              <BookingAdminPanel config={config} onConfigSaved={(cfg) => setConfig(cfg)} onClose={() => { setShowAdmin(false); setAdminAuth(false); }} />
            </div>
          )}
        </div>
      </div>

      {/* Floating admin gear — fixed bottom-right, barely visible */}
      <div className="fixed bottom-6 right-6 z-40">
        {!showAdmin ? (
          <button onClick={() => setShowAdmin(true)} className="w-8 h-8 flex items-center justify-center text-neutral-800 hover:text-neutral-500 transition-colors" title="Admin">
            <Settings size={16} />
          </button>
        ) : !adminAuth ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-xl w-64">
            <p className="text-white text-sm font-bold mb-3">⚙ Booking Admin</p>
            <input type="password" value={adminPw} onChange={e => setAdminPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && (adminPw === ADMIN_PASS ? setAdminAuth(true) : setAdminError('รหัสผ่านผิด'))} placeholder="รหัสผ่าน" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 mb-2" autoFocus />
            {adminError && <p className="text-red-400 text-xs mb-2">{adminError}</p>}
            <div className="flex gap-2">
              <button onClick={() => { if (adminPw === ADMIN_PASS) setAdminAuth(true); else setAdminError('รหัสผ่านผิด'); }} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-bold transition-colors">เข้าสู่ระบบ</button>
              <button onClick={() => { setShowAdmin(false); setAdminPw(''); setAdminError(''); }} className="px-3 bg-neutral-800 hover:bg-neutral-700 text-white py-2 rounded-lg text-sm transition-colors">ยกเลิก</button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  BOOKING ADMIN PANEL
// ═══════════════════════════════════════════════════════════════════
const BookingAdminPanel = ({ config: initConfig, onConfigSaved, onClose }) => {
  const [cfg, setCfg] = useState(() => JSON.parse(JSON.stringify(initConfig)));
  const [bookings, setBookings] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [tab, setTab] = useState('slots');
  const [newSlot, setNewSlot] = useState('');
  const [editingDate, setEditingDate] = useState(null);

  useEffect(() => {
    fetch('/api/bookings').then(r => r.json()).then(d => setBookings(d.bookings || []));
  }, []);

  const saveConfig = async () => {
    setSaving(true); setMsg('');
    try {
      const res = await fetch('/api/save-booking-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: cfg }),
      });
      const d = await res.json();
      if (d.success) { setMsg('บันทึกสำเร็จ'); onConfigSaved(cfg); }
      else setMsg('เกิดข้อผิดพลาด: ' + d.error);
    } catch { setMsg('ไม่สามารถเชื่อมต่อได้'); }
    setSaving(false);
  };

  const addDefaultSlot = () => {
    if (!newSlot || cfg.defaultSlots.includes(newSlot)) return;
    const sorted = [...cfg.defaultSlots, newSlot].sort();
    setCfg(prev => ({ ...prev, defaultSlots: sorted }));
    setNewSlot('');
  };

  const removeDefaultSlot = (t) => setCfg(prev => ({ ...prev, defaultSlots: prev.defaultSlots.filter(s => s !== t) }));

  const cancelBooking = async (id) => {
    await fetch('/api/cancel-booking', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
  };

  const formatDate = (key) => new Date(key + 'T00:00:00').toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' });

  const futureDates = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toLocaleDateString('sv-SE');
  });

  // per-date slot helpers
  const getDateState = (key) => {
    if ((cfg.closedDates || []).includes(key)) return 'closed';
    if (cfg.customSlots?.[key]) return 'custom';
    return 'default';
  };

  const getActiveSlotsForDate = (key) => {
    if ((cfg.closedDates || []).includes(key)) return [];
    return cfg.customSlots?.[key] || cfg.defaultSlots;
  };

  const applyDateSlots = (key, slots) => {
    setCfg(prev => {
      const closedDates = (prev.closedDates || []).filter(d => d !== key);
      const customSlots = { ...(prev.customSlots || {}) };
      delete customSlots[key];
      if (slots.length === 0) {
        closedDates.push(key);
      } else {
        const allSame = slots.length === prev.defaultSlots.length && slots.every(s => prev.defaultSlots.includes(s));
        if (!allSame) customSlots[key] = [...slots].sort();
      }
      return { ...prev, closedDates, customSlots };
    });
  };

  const toggleSlotForDate = (key, slot) => {
    const current = getActiveSlotsForDate(key);
    const next = current.includes(slot) ? current.filter(s => s !== slot) : [...current, slot];
    applyDateSlots(key, next);
  };

  const resetDateToDefault = (key) => {
    setCfg(prev => {
      const closedDates = (prev.closedDates || []).filter(d => d !== key);
      const customSlots = { ...(prev.customSlots || {}) };
      delete customSlots[key];
      return { ...prev, closedDates, customSlots };
    });
  };

  const closeEntireDay = (key) => applyDateSlots(key, []);

  return (
    <div className="text-left mt-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-white font-bold">⚙ Admin — ตารางนัดหมาย</h4>
        <button onClick={onClose} className="text-neutral-500 hover:text-white text-sm">ปิด</button>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('slots')} className={`px-3 py-1 rounded-lg text-sm font-bold transition-colors ${tab === 'slots' ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}>ตั้งค่า Slot</button>
        <button onClick={() => setTab('bookings')} className={`px-3 py-1 rounded-lg text-sm font-bold transition-colors ${tab === 'bookings' ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}>การจองทั้งหมด ({bookings.filter(b => b.status === 'confirmed').length})</button>
      </div>

      {tab === 'slots' && (
        <div className="space-y-5">
          <div>
            <label className="text-sm text-neutral-400 block mb-1">จองล่วงหน้าได้ (วัน)</label>
            <input type="number" min={1} max={90} value={cfg.advanceDays} onChange={e => setCfg(p => ({ ...p, advanceDays: +e.target.value }))} className="w-24 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" />
          </div>

          <div>
            <label className="text-sm text-neutral-400 block mb-2">Slot เวลาเริ่มต้น (ใช้กับทุกวันที่ไม่ได้กำหนดพิเศษ)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {cfg.defaultSlots.map(t => (
                <span key={t} className="flex items-center gap-1 bg-neutral-800 rounded-lg px-3 py-1 text-sm text-white">
                  {t}
                  <button onClick={() => removeDefaultSlot(t)} className="text-neutral-500 hover:text-red-400 ml-1"><XCircle size={13} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="time" value={newSlot} onChange={e => setNewSlot(e.target.value)} className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" />
              <button onClick={addDefaultSlot} className="bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-2 rounded-lg text-sm font-bold transition-colors"><Plus size={14} /></button>
            </div>
          </div>

          {/* Per-date slot config */}
          <div>
            <label className="text-sm text-neutral-400 block mb-1">ปรับ Slot รายวัน (30 วันข้างหน้า)</label>
            <div className="flex gap-3 text-xs text-neutral-500 mb-2">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-neutral-600 inline-block" /> ปกติ</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> กำหนดพิเศษ</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-600 inline-block" /> ปิดทั้งวัน</span>
            </div>
            <div className="grid grid-cols-4 gap-1 mb-2">
              {futureDates.map(key => {
                const state = getDateState(key);
                const isEditing = editingDate === key;
                return (
                  <button key={key}
                    onClick={() => setEditingDate(isEditing ? null : key)}
                    className={`text-xs py-2 px-1 rounded-lg font-bold transition-colors leading-tight ${
                      state === 'closed' ? 'bg-red-600/20 border border-red-600/50 text-red-400' :
                      state === 'custom' ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400' :
                      'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    } ${isEditing ? 'ring-1 ring-white/30' : ''}`}>
                    {formatDate(key)}
                  </button>
                );
              })}
            </div>

            {/* Slot editor for selected date */}
            {editingDate && (
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4 mt-1">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white text-sm font-bold">{formatDate(editingDate)}</p>
                  <div className="flex gap-2">
                    <button onClick={() => resetDateToDefault(editingDate)} className="text-xs text-neutral-400 hover:text-white border border-neutral-700 rounded-lg px-2 py-1 transition-colors">ใช้ค่าเริ่มต้น</button>
                    <button onClick={() => { closeEntireDay(editingDate); }} className="text-xs text-red-400 hover:text-red-300 border border-red-900/50 rounded-lg px-2 py-1 transition-colors">ปิดทั้งวัน</button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {cfg.defaultSlots.map(slot => {
                    const active = getActiveSlotsForDate(editingDate).includes(slot);
                    const isClosed = getDateState(editingDate) === 'closed';
                    return (
                      <button key={slot}
                        onClick={() => { if (isClosed) { applyDateSlots(editingDate, [slot]); } else { toggleSlotForDate(editingDate, slot); } }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                          active && !isClosed ? 'bg-green-600/20 border border-green-600/50 text-green-400' : 'bg-neutral-800 border border-neutral-700 text-neutral-500'
                        }`}>
                        <span className={`w-3 h-3 rounded-full border flex-shrink-0 ${active && !isClosed ? 'bg-green-500 border-green-400' : 'border-neutral-600'}`} />
                        {slot}
                      </button>
                    );
                  })}
                </div>
                {getDateState(editingDate) === 'closed' && (
                  <p className="text-red-400 text-xs mt-3 text-center">ปิดรับจองทั้งวัน — กดที่ slot เพื่อเปิดบางช่วงเวลา</p>
                )}
                {getDateState(editingDate) === 'custom' && (
                  <p className="text-amber-400 text-xs mt-3 text-center">เปิด {getActiveSlotsForDate(editingDate).length} จาก {cfg.defaultSlots.length} slot</p>
                )}
                {getDateState(editingDate) === 'default' && (
                  <p className="text-neutral-500 text-xs mt-3 text-center">ใช้ค่าเริ่มต้น — เปิดทุก slot</p>
                )}
              </div>
            )}
          </div>

          {msg && <p className={`text-sm ${msg.includes('สำเร็จ') ? 'text-green-400' : 'text-red-400'}`}>{msg}</p>}
          <button onClick={saveConfig} disabled={saving} className="w-full bg-red-600 hover:bg-red-700 disabled:bg-neutral-700 text-white font-bold py-3 rounded-xl text-sm transition-colors">
            {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </button>
        </div>
      )}

      {tab === 'bookings' && (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {bookings.length === 0 && <p className="text-neutral-500 text-sm text-center py-4">ยังไม่มีการจอง</p>}
          {[...bookings].sort((a, b) => a.date > b.date ? 1 : -1).map(b => (
            <div key={b.id} className={`border rounded-xl p-4 text-sm ${b.status === 'cancelled' ? 'border-neutral-800 opacity-50' : 'border-neutral-700 bg-neutral-800/50'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-white font-bold">{b.date} เวลา {b.time}</p>
                  <p className="text-neutral-300">{b.name} — {b.phone}</p>
                  {b.carModel && <p className="text-neutral-400">{b.carModel} {b.carYear} {b.carColor}</p>}
                  {b.note && <p className="text-neutral-500 text-xs mt-1">{b.note}</p>}
                </div>
                {b.status === 'confirmed' && (
                  <button onClick={() => cancelBooking(b.id)} className="shrink-0 text-neutral-500 hover:text-red-400 transition-colors" title="ยกเลิก">
                    <XCircle size={18} />
                  </button>
                )}
                {b.status === 'cancelled' && <span className="shrink-0 text-xs text-red-500">ยกเลิก</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShiftupApp;
