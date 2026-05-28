import React, { useState, useEffect } from 'react';
import {
  Menu, X, ChevronRight, Zap, Volume2, Settings, MessageCircle, Activity,
  ShieldCheck, Wrench, Star, PlayCircle, CheckCircle2, UserPlus, Send
} from 'lucide-react';

/* ── Image constants ─────────────────────────────────────────── */
const LOGO_SRC = '/images/logo.png';
const HERO_BG  = 'https://drive.google.com/thumbnail?id=1G3y845m2OTvSpoDjUG4v59Tx6G--VMtY&sz=w2400';
const PROD_BG  = 'https://drive.google.com/thumbnail?id=1Fw5aLkbJZvHxIeu7NtegJnRSE_aO1UiA&sz=w2400';

// --- MAIN APP COMPONENT (Handles Routing) ---
const ShiftupApp = () => {
  const [activePage, setActivePage] = useState('home');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activePage]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const lineUrl = "https://lin.ee/nZOMcph";

  const navigateTo = (page) => {
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-red-600 selection:text-white">

      {/* ── Shared Navigation ── */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800 shadow-lg' : 'bg-neutral-950/50 backdrop-blur-sm'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* Logo image */}
            <div className="flex-shrink-0 cursor-pointer" onClick={() => navigateTo('home')}>
              <img src={LOGO_SRC} alt="Shiftup Performance" className="h-10 w-auto" />
            </div>

            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-6 lg:space-x-8">
                <button onClick={() => navigateTo('home')} className={`hover:text-red-500 transition-colors px-3 py-2 text-sm font-medium tracking-wide ${activePage === 'home' ? 'text-red-500' : 'text-neutral-300'}`}>HOME</button>
                <button onClick={() => navigateTo('remap')} className={`hover:text-red-500 transition-colors px-3 py-2 text-sm font-medium tracking-wide ${activePage === 'remap' ? 'text-red-500' : 'text-neutral-300'}`}>REMAP</button>
                <button onClick={() => navigateTo('hks')} className={`hover:text-red-500 transition-colors px-3 py-2 text-sm font-medium tracking-wide ${activePage === 'hks' ? 'text-red-500' : 'text-neutral-300'}`}>HKS EXHAUST</button>
                <button onClick={() => navigateTo('panthera')} className={`hover:text-red-500 transition-colors px-3 py-2 text-sm font-medium tracking-wide ${activePage === 'panthera' ? 'text-red-500' : 'text-neutral-300'}`}>PANTHERA EV</button>
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
              <button onClick={() => navigateTo('panthera')} className="block px-3 py-2 text-base font-medium text-white text-left">Panthera EV Sound</button>
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
                <img src={LOGO_SRC} alt="Shiftup Performance" className="h-8 w-auto" />
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
                <li><button onClick={() => navigateTo('panthera')} className="hover:text-white transition-colors">Panthera EV Sound</button></li>
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
              <h3 className="text-white font-bold text-lg mb-1">Mazda Specialist</h3>
              <p className="text-sm text-neutral-400">เชี่ยวชาญพิเศษ เริ่มต้นจาก Mazda สู่สมรรถนะที่เหนือกว่า</p>
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
            <h3 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">รถคันเดิม ประสบการณ์ใหม่.</h3>
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
                ปรับจูนทะลุขีดจำกัดผ่านพอร์ต OBD2 ออกแบบกราฟเครื่องยนต์ใหม่ตามสภาพรถและสไตล์การขับขี่ของคุณโดยเฉพาะ (เน้นรถ Mazda ในระยะแรก)
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
                <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-green-500" /> ตรวจสอบ Fitment ก่อนสั่งซื้อ</li>
                <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-green-500" /> เชื่อมโยงสต็อกโดยตรงกับ Pingstores</li>
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
              <h4 className="text-2xl font-bold text-white mb-3">Panthera EV Sound</h4>
              <p className="text-neutral-400 mb-6 leading-relaxed">
                เปิดมิติใหม่แห่งเสียงให้กับรถน้ำมัน และรถ EV ด้วยระบบ Active Exhaust Sound จาก Panthera สร้างความเร้าใจในทุกอัตราเร่ง (ปัจจุบันอยู่ในช่วงทดสอบ)
              </p>
              <ul className="space-y-2 mb-8 text-sm text-neutral-300">
                <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-green-500" /> ลงชื่อสนใจรับข้อเสนอพิเศษตอนเปิดตัว</li>
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

// --- PAGE 2: ECU REMAP ---
const RemapPage = () => (
  <div className="pb-24">
    <div className="bg-neutral-900 border-b border-neutral-800 py-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <Zap className="text-red-500 w-16 h-16 mx-auto mb-6" />
        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">ECU Remap</h1>
        <p className="text-xl text-neutral-400">ปลดล็อกพลังแฝง ปรับจูนให้ตรงสไตล์คุณ ขับสนุกขึ้น ประหยัดขึ้น ในแบบที่คุณสัมผัสได้ทันที</p>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-24 mt-16">

      {/* Articles */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8 border-l-4 border-red-500 pl-4">บทความ & ความรู้ก่อนรีแมป</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 hover:border-neutral-600 transition-colors">
              <div className="h-48 bg-neutral-800 flex items-center justify-center">
                <span className="text-neutral-600">รูปภาพปกบทความ {i}</span>
              </div>
              <div className="p-6">
                <div className="text-red-500 text-xs font-bold mb-2">KNOWLEDGE</div>
                <h3 className="text-lg font-bold text-white mb-2">ทำไมต้อง Fit Before Flash? ขั้นตอนสำคัญที่หลายคนมองข้าม</h3>
                <p className="text-neutral-400 text-sm">การเช็คความพร้อมของฮาร์ดแวร์ก่อนปรับจูนซอฟต์แวร์ คือหัวใจสำคัญของความทนทาน...</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Portfolio */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8 border-l-4 border-red-500 pl-4">ผลงานรีแมป (Portfolio)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-square bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-center hover:border-red-500 transition-colors cursor-pointer group relative overflow-hidden">
              <span className="text-neutral-600 z-10 relative">ภาพผลงานรถที่ {i}</span>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 z-20">
                <span className="text-white font-bold text-sm">Mazda 3 Skyactiv-G</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8 border-l-4 border-red-500 pl-4">รีวิวจากผู้ใช้จริง</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-neutral-900 p-8 rounded-2xl border border-neutral-800">
              <div className="flex text-yellow-500 mb-4">
                {[...Array(5)].map((_, s) => <Star key={s} fill="currentColor" size={20} />)}
              </div>
              <p className="text-neutral-300 mb-6 font-medium italic">"คันเร่งเบาขึ้นชัดเจน อาการรอรอบตอนออกตัวหายไปเลย ช่างอธิบายละเอียดมากว่ากราฟเดิมเป็นยังไง คุ้มค่าครับ"</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-neutral-800 rounded-full" />
                <div>
                  <h4 className="text-white font-bold text-sm">คุณ K.</h4>
                  <p className="text-neutral-500 text-xs">Mazda 2 Diesel</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing + Contact Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <section className="bg-gradient-to-br from-neutral-900 to-neutral-950 p-8 rounded-3xl border border-neutral-800">
          <h2 className="text-3xl font-bold text-white mb-2">อัตราค่าบริการ (Pricing)</h2>
          <p className="text-neutral-400 mb-8">ราคามาตรฐาน พร้อมบริการเช็คความพร้อมก่อนและหลังจูน</p>
          <div className="space-y-4">
            <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">Stage 1 Remap</h3>
                <p className="text-sm text-neutral-500">สำหรับรถเดิมๆ ที่ต้องการอัตราเร่งที่ดีขึ้น</p>
              </div>
              <div className="text-2xl font-black text-red-500">฿ XX,XXX</div>
            </div>
            <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">Custom Tune</h3>
                <p className="text-sm text-neutral-500">สำหรับรถที่มีการอัปเกรดฮาร์ดแวร์มาแล้ว</p>
              </div>
              <div className="text-2xl font-black text-red-500">สอบถาม</div>
            </div>
          </div>
          <ul className="mt-8 space-y-2 text-sm text-neutral-400">
            <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> ฟรี! ตรวจเช็คค่าต่างๆ ก่อนจูน</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> รับประกันซอฟต์แวร์ตลอดอายุการใช้งาน</li>
          </ul>
        </section>

        <section className="bg-neutral-900 p-8 rounded-3xl border border-neutral-800 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <MessageCircle className="text-red-500" /> ประเมินรถของคุณฟรี
          </h2>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('ระบบจำลอง: ข้อมูลถูกส่งเรียบร้อยแล้ว'); }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">ชื่อ - นามสกุล *</label>
                <input type="text" required className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500" placeholder="ระบุชื่อ" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">เบอร์ติดต่อ / LINE ID *</label>
                <input type="text" required className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500" placeholder="เบอร์โทร หรือไอดีไลน์" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">รุ่นรถ และ ปี (เช่น Mazda 2 ดีเซล 2018) *</label>
              <input type="text" required className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500" placeholder="ยี่ห้อ / รุ่น / เครื่องยนต์ / ปี" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">สถานที่ / เขตที่พักอาศัย</label>
              <input type="text" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500" placeholder="เพื่อประเมินการเดินทาง" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">รายละเอียดที่ต้องการ / อาการปัจจุบัน</label>
              <textarea required className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 h-24 resize-none" placeholder="เช่น อยากได้ต้นจัดขึ้น, ปัจจุบันรถมีอาการอืดตอนออกตัว, มีของแต่งอะไรใส่มาบ้างแล้ว" />
            </div>
            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
              <Send size={18} /> ส่งข้อมูลเพื่อรับคำปรึกษา
            </button>
          </form>
        </section>
      </div>
    </div>
  </div>
);

// --- PAGE 3: HKS EXHAUST ---
const HKSPage = () => (
  <div className="pb-24">
    {/* Hero with product background image */}
    <div className="border-b border-neutral-800 py-20 px-6 relative overflow-hidden" style={{ background: '#0d1116' }}>
      <img
        src={PROD_BG}
        alt="HKS Exhaust Products"
        className="absolute inset-0 w-full h-full object-cover opacity-25"
      />
      {/* dark overlay to keep text readable */}
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/95 via-neutral-950/70 to-neutral-950/40" />
      <div className="absolute right-0 top-0 opacity-10 pointer-events-none w-1/2 h-full flex items-center justify-end">
        <div className="w-[500px] h-[200px] border-[20px] border-orange-500 rounded-l-[100px] mr-[-100px]" />
      </div>
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <Wrench className="text-orange-500 w-16 h-16 mx-auto mb-6" />
        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">HKS Exhaust Systems</h1>
        <p className="text-xl text-neutral-400 mb-8">
          นิยามใหม่ของเสียงและสมรรถนะระดับโลก ยกระดับภาพลักษณ์พร้อมปลดปล่อยความดุดันในสไตล์ที่เป็นคุณ <br />
          เราคือตัวกลางที่ช่วยคุณเลือกสเปคที่ตรงรุ่นแบบ <span className="text-orange-500 font-bold">100% Fitment</span>
        </p>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white mb-4">เลือกรุ่นรถเพื่อดูสินค้า</h2>
        <div className="flex flex-wrap justify-center gap-4">
          <button className="px-6 py-2 rounded-full bg-orange-600 text-white font-bold">Mazda</button>
          <button className="px-6 py-2 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600">Honda</button>
          <button className="px-6 py-2 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600">Toyota</button>
          <button className="px-6 py-2 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600">Subaru</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          { model: "Mazda 3 (BP)",  type: "Legamax Premium",    desc: "ปลายท่อคู่สแตนเลส เสียงนุ่มลึก ไม่หนวกหูตอนเดินทางไกล" },
          { model: "Mazda 2 (DJ)",  type: "Silent Hi-Power",    desc: "ดีไซน์สปอร์ตปลายคาร์บอน เพิ่มแรงม้าและแรงบิดชัดเจน" },
          { model: "Mazda CX-30",   type: "Legamax Sports",     desc: "ตรงรุ่นเป๊ะ ไม่ต้องดัดแปลง เสียงทุ้มแน่นสไตล์ SUV" },
          { model: "Mazda CX-5",    type: "Touring Spec-L",     desc: "หรูหรา เสียงผู้ดี เหมาะกับรถครอบครัวที่แอบซิ่ง" },
          { model: "MX-5 (ND)",     type: "Hi-Power SPEC-L II", desc: "น้ำหนักเบาพิเศษ เสียงลั่นเร้าใจสาย Track" },
          { model: "Mazda 3 (BM)",  type: "Legamax Premium",    desc: "รุ่นยอดฮิตของบอดี้เก่า อัปเกรดความหล่อได้ทันที" },
        ].map((item, idx) => (
          <div key={idx} className="bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 group hover:border-orange-500/50 transition-colors">
            <div className="h-64 bg-neutral-950 flex flex-col items-center justify-center p-4 relative">
              <div className="w-3/4 h-8 bg-neutral-800 rounded-full mb-2" />
              <div className="w-1/2 h-8 bg-neutral-800 rounded-full flex items-center justify-end pr-2">
                <div className="w-10 h-10 bg-orange-900/50 rounded-full" />
              </div>
              <span className="absolute bottom-4 right-4 text-neutral-700 font-mono text-xs">IMG_HKS_{idx + 1}.JPG</span>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-white group-hover:text-orange-500 transition-colors mb-1">{item.model}</h3>
              <p className="text-orange-400 text-sm font-bold mb-3">{item.type}</p>
              <p className="text-neutral-400 text-sm mb-6">{item.desc}</p>
              <button className="w-full py-3 rounded-lg border border-neutral-700 hover:bg-white hover:text-black transition-colors font-bold text-sm">
                เช็คสต็อกและราคา
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// --- PAGE 4: PANTHERA EV SOUND ---
const PantheraPage = () => (
  <div className="pb-24">
    <div className="bg-neutral-900 border-b border-neutral-800 py-20 px-6 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center opacity-5">
        <Volume2 size={400} />
      </div>
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <Volume2 className="text-blue-500 w-16 h-16 mx-auto mb-6" />
        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">Panthera Active Exhaust Sound</h1>
        <p className="text-xl text-neutral-400">
          เติมเต็มอรรถรสการขับขี่ให้รถน้ำมัน และยนตรกรรมไฟฟ้า (EV) ด้วยมิติแห่งเสียงที่เลือกได้ <br />
          สร้างคาแรกเตอร์ตั้งแต่เสียงยานอวกาศล้ำอนาคต ไปจนถึงเสียง V8 สุดดุดัน
        </p>
        <div className="mt-8 inline-block bg-blue-900/30 border border-blue-500/50 text-blue-400 px-4 py-2 rounded-full text-sm font-bold animate-pulse">
          ปัจจุบันอยู่ในช่วงทดสอบระบบ (Beta Phase)
        </div>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-16 space-y-24">
      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { title: "Custom Profiles", desc: "ปรับแต่งและสลับเสียงผ่านแอปพลิเคชันบนมือถือได้แบบ Real-time" },
          { title: "OBD2 Integration", desc: "อ่านค่าคันเร่งและความเร็วรถโดยตรง เพื่อความสมจริงในการไล่ระดับเสียง" },
          { title: "Safe Installation", desc: "ติดตั้งง่าย ไม่ต้องดัดแปลงโครงสร้างรถ ปลอดภัยต่อระบบไฟฟ้าเดิม" },
        ].map((f, i) => (
          <div key={i} className="bg-neutral-900 p-8 rounded-2xl border border-neutral-800">
            <h3 className="text-xl font-bold text-white mb-4">{f.title}</h3>
            <p className="text-neutral-400">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Video Reviews */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8 border-l-4 border-blue-500 pl-4">คลิปทดสอบ & รีวิวเสียงจริง</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { title: "ทดสอบเสียง V8 Muscle ในรถ BYD Seal",        length: "03:45" },
            { title: "Panthera App Walkthrough สอนปรับจูนเสียง",  length: "05:20" },
            { title: "รีวิวขับจริง อารมณ์เปลี่ยนไปแค่ไหน?",     length: "08:15" },
            { title: "เสียงสไตล์ Futuristic Hypercar",             length: "02:30" },
          ].map((video, idx) => (
            <div key={idx} className="group cursor-pointer">
              <div className="aspect-video bg-neutral-900 rounded-2xl border border-neutral-800 flex flex-col items-center justify-center relative overflow-hidden mb-4 group-hover:border-blue-500 transition-colors">
                <PlayCircle className="text-neutral-600 w-16 h-16 group-hover:text-blue-500 transition-colors group-hover:scale-110 duration-300" />
                <span className="absolute bottom-4 right-4 bg-black/80 px-2 py-1 rounded text-xs text-white font-mono">{video.length}</span>
                <span className="absolute top-4 left-4 text-neutral-700 font-mono text-xs">VIDEO_PLACEHOLDER_{idx + 1}.MP4</span>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{video.title}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Table */}
      <section className="bg-gradient-to-b from-neutral-900 to-neutral-950 p-8 md:p-12 rounded-3xl border border-neutral-800">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-4">ตารางราคาล่วงหน้า (Pre-Order Pricing)</h2>
          <p className="text-neutral-400">สำหรับลูกค้าที่ลงชื่อสนใจในช่วงทดสอบ จะได้รับสิทธิพิเศษราคาพิเศษ</p>
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
              <tr className="hover:bg-neutral-800/50 transition-colors">
                <td className="p-4 font-bold text-white">Single Speaker Unit</td>
                <td className="p-4">ลำโพงเดี่ยว + กล่องคอนโทรล + แอปพลิเคชัน (เหมาะสำหรับรถเก๋ง/SUV ทั่วไป)</td>
                <td className="p-4 text-right font-bold text-blue-400">XX,XXX.-</td>
              </tr>
              <tr className="hover:bg-neutral-800/50 transition-colors">
                <td className="p-4 font-bold text-white">Dual Speaker Unit (Pro)</td>
                <td className="p-4">ลำโพงคู่ + กล่องคอนโทรล + แอปพลิเคชัน (เพิ่มมิติและความดัง เหมาะสำหรับรถคันใหญ่)</td>
                <td className="p-4 text-right font-bold text-blue-400">XX,XXX.-</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-12 text-center">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all">
            ลงชื่อแสดงความสนใจ / จองคิวล่วงหน้า
          </button>
        </div>
      </section>
    </div>
  </div>
);

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
        <form className="space-y-6 max-w-2xl mx-auto" onSubmit={(e) => { e.preventDefault(); alert('ระบบจำลอง: ข้อมูลการสมัครถูกส่งเรียบร้อยแล้ว'); }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">ชื่อร้าน / อู่ (ถ้ามี)</label>
              <input type="text" className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500" placeholder="ระบุชื่อร้าน" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">ชื่อผู้ติดต่อ *</label>
              <input type="text" required className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500" placeholder="ระบุชื่อผู้ติดต่อ" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">เบอร์โทรศัพท์ *</label>
              <input type="text" required className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500" placeholder="เบอร์โทรติดต่อ" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">LINE ID</label>
              <input type="text" className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500" placeholder="ไอดีไลน์" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">จังหวัดที่ให้บริการ *</label>
              <input type="text" required className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500" placeholder="เช่น กรุงเทพฯ, เชียงใหม่" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">ความถนัดหลัก</label>
              <select className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 appearance-none">
                <option>รับรีแมป (มีเครื่องมือ/ไม่มีเครื่องมือ)</option>
                <option>ติดตั้งท่อไอเสีย</option>
                <option>ติดตั้งระบบไฟ/เครื่องเสียง (เหมาะกับ Panthera)</option>
                <option>ทำได้ทุกอย่างข้างต้น</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">ลิงก์เพจ Facebook ร้าน (ถ้ามี)</label>
            <input type="url" className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500" placeholder="https://facebook.com/..." />
          </div>
          <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl transition-colors mt-4 text-lg">
            ส่งข้อมูลการสมัคร
          </button>
        </form>
      </div>
    </div>
  </div>
);

export default ShiftupApp;
