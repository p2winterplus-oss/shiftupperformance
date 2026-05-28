import { useState, useEffect, useRef } from 'react';

/* ── Image constants ─────────────────────────────────────────── */
const LOGO_SRC = '/images/logo.png';
const HERO_BG  = 'https://drive.google.com/thumbnail?id=1G3y845m2OTvSpoDjUG4v59Tx6G--VMtY&sz=w2400';
const PROD_BG  = 'https://drive.google.com/thumbnail?id=1Fw5aLkbJZvHxIeu7NtegJnRSE_aO1UiA&sz=w2400';

/* ── Shared Navbar ───────────────────────────────────────────── */
function Navbar({ page, setPage }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Service',  section: '#services',  page: 'home' },
    { label: 'Product',  section: '#products',  page: 'home' },
    { label: 'Process',  section: '#process',   page: 'home' },
    { label: 'Contact',  section: '#contact',   page: 'home' },
  ];

  function handleNavClick(link) {
    setMenuOpen(false);
    if (page !== 'home') {
      setPage('home');
      // wait for home to mount then scroll
      setTimeout(() => {
        document.querySelector(link.section)?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    } else {
      document.querySelector(link.section)?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <header className="site-header">
      <nav className="nav-shell" aria-label="เมนูหลัก">
        {/* Logo */}
        <a
          className="brand"
          onClick={() => { setPage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          aria-label="Shiftup Performance หน้าแรก"
        >
          <img
            src={LOGO_SRC}
            alt="Shiftup Performance"
            className="brand-logo"
          />
        </a>

        {/* Mobile toggle */}
        <button
          className="menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span />
          <span />
          <span />
          <b className="sr-only">เปิดเมนู</b>
        </button>

        {/* Links */}
        <div className={`site-menu${menuOpen ? ' is-open' : ''}`} id="site-menu">
          {navLinks.map((link) => (
            <a key={link.label} onClick={() => handleNavClick(link)}>
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <a
          className="nav-cta"
          href="https://lin.ee/nZOMcph"
          target="_blank"
          rel="noreferrer"
        >
          คุยผ่าน LINE
        </a>
      </nav>
    </header>
  );
}

/* ── Shared Footer ───────────────────────────────────────────── */
function Footer({ setPage }) {
  function goSection(section) {
    setPage('home');
    setTimeout(() => {
      document.querySelector(section)?.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  }

  return (
    <footer className="footer">
      <div>
        <a
          className="brand footer-brand"
          onClick={() => { setPage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          style={{ cursor: 'pointer' }}
        >
          <img
            src={LOGO_SRC}
            alt="Shiftup Performance"
            style={{ height: '38px', width: 'auto', objectFit: 'contain' }}
          />
          <span>
            <small>Performance by P2W Interplus</small>
          </span>
        </a>
        <p>Performance tuning, exhaust selection, and the next sound experience for selected vehicles.</p>
      </div>
      <div className="footer-links">
        <a onClick={() => goSection('#services')} style={{ cursor: 'pointer' }}>บริการ</a>
        <a onClick={() => goSection('#products')} style={{ cursor: 'pointer' }}>สินค้า</a>
        <a onClick={() => goSection('#process')} style={{ cursor: 'pointer' }}>ขั้นตอน</a>
        <a href="https://lin.ee/nZOMcph" target="_blank" rel="noreferrer">LINE OA</a>
      </div>
    </footer>
  );
}

/* ── Home Page ───────────────────────────────────────────────── */
function HomePage({ setPage }) {
  return (
    <main id="top">
      {/* Hero */}
      <section className="hero" aria-labelledby="hero-title">
        <img
          className="hero-media"
          src={HERO_BG}
          alt="รถแต่งในอู่จูนพร้อมอุปกรณ์ตรวจสอบระบบรถยนต์"
        />
        <div className="hero-overlay" />
        <div className="hero-copy">
          <p className="eyebrow">ECU Remap via OBD2 / Exhaust Upgrade / EV Active Sound</p>
          <h1 id="hero-title">Shiftup Performance</h1>
          <p className="hero-lead">
            ไม่ใช่แค่การจูนรถ แต่คือการสร้างคาแรกเตอร์ใหม่ให้สอดรับกับสไตล์คุณ
            ปลดล็อกสมรรถนะที่ซ่อนอยู่ด้วยการทำ ECU Remap พร้อมยกระดับสุ้มเสียงด้วย
            HKS Exhaust และนวัตกรรม Active Sound สำหรับ EV
          </p>
          <div className="hero-actions">
            <a
              className="button primary"
              href="https://lin.ee/nZOMcph"
              target="_blank"
              rel="noreferrer"
            >
              ประเมินรถกับทีมงาน
            </a>
            <a
              className="button ghost"
              onClick={() => document.querySelector('#services')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ cursor: 'pointer' }}
            >
              ดูบริการของเรา
            </a>
          </div>
        </div>
        <div className="hero-rail" aria-label="จุดเด่น">
          <article>
            <strong>Mazda Specialist</strong>
            <span>เชี่ยวชาญพิเศษ เริ่มต้นจาก Mazda สู่สมรรถนะที่เหนือกว่า</span>
          </article>
          <article>
            <strong>Fit Before Flash</strong>
            <span>วิเคราะห์โจทย์และสภาพรถอย่างละเอียด ก่อนตัดสินใจจูน</span>
          </article>
          <article>
            <strong>One Contact</strong>
            <span>ดูแลเบ็ดเสร็จในที่เดียว จองคิว ปรึกษา จบผ่าน LINE</span>
          </article>
        </div>
      </section>

      {/* Intro */}
      <section className="intro band">
        <div className="section-head">
          <p className="eyebrow">What Shiftup Handles</p>
          <h2>บริการที่ออกแบบให้รถตอบสนองตรงกับเจ้าของ</h2>
        </div>
        <div className="intro-grid">
          <p>
            Shiftup Performance อยู่ในกลุ่มงานยานยนต์ของ P2W Interplus
            โดยโฟกัสการ Remap ผ่านพอร์ต OBD2, การแนะนำระบบไอเสียที่เหมาะกับรถ
            ด้วยแบรนด์ที่มีชื่อเสียงอย่าง HKS และกลุ่มรถ EV ที่ยังชื่นชมเสียง
            การทำงานของเครื่องยนต์ผ่าน Active Sound จาก Panthera
          </p>
          <div className="signal-list">
            <span>ขับใช้งานประจำวัน</span>
            <span>ต้องการคันเร่งตอบสนองดีขึ้น</span>
            <span>เลือกเสียงและบุคลิกรถให้ชัด</span>
            <span>ปรึกษาก่อนสั่งสินค้า</span>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="services band" id="services" aria-labelledby="services-title">
        <div className="section-head">
          <p className="eyebrow">Core Services</p>
          <h2 id="services-title">รถคันเดิม ประสบการณ์ใหม่.</h2>
          <p style={{ color: 'var(--muted)', fontSize: '17px', lineHeight: '1.7', marginTop: '14px', maxWidth: '640px' }}>
            บริการ 3 แกนหลักที่ออกแบบมาเพื่อตอบสนองความต้องการของคนรักรถ
            ที่ต้องการคาแรกเตอร์ที่ชัดเจน และสมรรถนะที่จับต้องได้
          </p>
        </div>
        <div className="service-grid">
          {/* 01 – ECU Remap */}
          <article className="service" onClick={() => setPage('remap')} style={{ cursor: 'pointer' }}>
            <p className="service-index">01</p>
            <h3>ECU Remap</h3>
            <p>
              เปลี่ยนความรู้สึกจากรถเดิมๆ ด้วยการปรับจูนผ่านพอร์ต OBD2
              ออกแบบกราฟเครื่องยนต์ใหม่ตามสภาพรถ และสไตล์การขับขี่ของคุณโดยเฉพาะ
            </p>
            <ul>
              <li>ออกแบบเฉพาะคัน ตามรูปแบบการขับขี่</li>
              <li>ดันเร่งตอบสนองไวขึ้น ขับสนุกขึ้น ไม่หน่วง</li>
              <li>แรงม้า แรงบิด เพิ่มขึ้น</li>
            </ul>
          </article>

          {/* 02 – HKS */}
          <article className="service" onClick={() => setPage('hks')} style={{ cursor: 'pointer' }}>
            <p className="service-index">02</p>
            <h3>HKS Exhaust</h3>
            <p>
              ยกระดับพลังเสียงและภาพลักษณ์ ด้วยระบบท่อไอเสียแบรนด์ระดับโลก HKS
              ที่เหมาะกับการขับใช้งานประจำวันและสายซิ่ง
            </p>
            <ul>
              <li>ท่อตรงรุ่น ติดตั้งง่าย ไม่ต้องดัดแปลง</li>
              <li>ของแท้ รับประกันจากทางโรงงาน 2 ปีเต็ม</li>
              <li>สินค้าของใหม่ จากโรงงานทุกใบ</li>
              <li>เช็คสต๊อคและรายละเอียดก่อนสั่งซื้อทุกครั้ง</li>
            </ul>
          </article>

          {/* 03 – Panthera */}
          <article className="service" onClick={() => setPage('panthera')} style={{ cursor: 'pointer' }}>
            <p className="service-index">03</p>
            <h3>Panthera EV Sound</h3>
            <p>
              เปิดมิติใหม่แห่งเสียงให้กับรถยนต์ไฟฟ้า (EV) ด้วยระบบ Active Sound จาก Panthera
              สร้างความเร้าใจในทุกอัตราเร่ง เหมือนกลับมาขับรถน้ำมันอีกครั้ง
            </p>
            <ul>
              <li>ติดตั้งง่าย ไม่ต้องตัดต่อสายไฟ</li>
              <li>ใช้ได้ทั้งรถน้ำมัน และ EV</li>
            </ul>
          </article>
        </div>
      </section>

      {/* Products */}
      <section className="products" id="products" aria-labelledby="products-title">
        <div className="product-media">
          <img
            src={PROD_BG}
            alt="ระบบท่อไอเสียและอุปกรณ์ active sound บนโต๊ะงาน"
          />
        </div>
        <div className="product-copy">
          <p className="eyebrow">Product Direction</p>
          <h2 id="products-title">รถคันเดียวกัน เปลี่ยนประสบการณ์ได้หลายมิติ</h2>
          <div className="product-rows">
            <article>
              <h3>Remap</h3>
              <p>เริ่มจากความต้องการด้านการตอบสนองและความเหมาะสมของรถคันนั้น</p>
            </article>
            <article>
              <h3>Exhaust</h3>
              <p>เลือกบุคลิกของเสียง รูปลักษณ์ และรุ่นสินค้าที่ใส่กับรถได้จริง</p>
            </article>
            <article>
              <h3>EV Sound</h3>
              <p>เปิดพื้นที่ใหม่ให้รถไฟฟ้ามีประสบการณ์ด้านเสียงที่สื่อสารได้ชัดขึ้น</p>
            </article>
          </div>
          <a
            className="text-link"
            href="https://www.facebook.com/shiftupperformance"
            target="_blank"
            rel="noreferrer"
          >
            ติดตามงานและประกาศล่าสุดบน Facebook
          </a>
        </div>
      </section>

      {/* Process */}
      <section className="process band" id="process" aria-labelledby="process-title">
        <div className="process-intro">
          <p className="eyebrow">Customer Flow</p>
          <h2 id="process-title">The Shiftup Experience.</h2>
          <p className="process-desc">
            เราเชื่อว่ารถทุกคันมีโจทย์ที่ไม่เหมือนกัน กระบวนการทำงานของเราจึงเน้นความเข้าใจที่ตรงกัน
            เพื่อให้คุณได้รับผลลัพธ์ที่ตรงใจ คุ้มค่า และปลอดภัยที่สุด
          </p>
          <a
            className="text-link"
            href="https://lin.ee/nZOMcph"
            target="_blank"
            rel="noreferrer"
          >
            ส่งข้อมูลรถของคุณให้เราประเมินตอนนี้ ›
          </a>
        </div>
        <ol className="process-timeline">
          <li>
            <span className="step-num">01</span>
            <div>
              <strong>ส่งข้อมูลเบื้องต้น</strong>
              <span>ทัก LINE ส่งยี่ห้อ รุ่น ปี เครื่องยนต์ รายการของแต่ง และความต้องการของคุณ</span>
            </div>
          </li>
          <li>
            <span className="step-num">02</span>
            <div>
              <strong>ประเมินแนวทาง (Fit Before Flash)</strong>
              <span>ทีมงานวิเคราะห์และแนะนำว่าควรจูนแบบไหน หรือควรอัปเกรดอะไหล่ส่วนใดก่อน</span>
            </div>
          </li>
          <li>
            <span className="step-num">03</span>
            <div>
              <strong>นัดหมาย &amp; ดำเนินการ</strong>
              <span>ตกลงคิวงาน แจ้งสิ่งที่ต้องเตรียม แล้วนำรถเข้ามาให้เราจัดการตามแผน</span>
            </div>
          </li>
          <li>
            <span className="step-num">04</span>
            <div>
              <strong>ส่งมอบ &amp; ติดตามผล</strong>
              <span>ทดสอบการขับขี่จริง และทีมงานคอยสอบถาม Feedback หลังการใช้งาน</span>
            </div>
          </li>
        </ol>
      </section>

      {/* FAQ */}
      <section className="faq band" aria-labelledby="faq-title">
        <div className="section-head">
          <p className="eyebrow">Quick Answers</p>
          <h2 id="faq-title">คำถามที่ควรถามก่อนตัดสินใจ</h2>
        </div>
        <div className="faq-list">
          <details>
            <summary>รถของฉัน Remap ได้หรือไม่</summary>
            <p>ส่งรุ่นรถ ปี เครื่องยนต์ และรายละเอียดการใช้งานมาทาง LINE เพื่อให้ทีมงานตรวจความเหมาะสมก่อนนัดหมาย</p>
          </details>
          <details>
            <summary>ควรเริ่มจาก Remap หรือท่อก่อน</summary>
            <p>ขึ้นอยู่กับเป้าหมายของรถแต่ละคัน หากต้องการเปลี่ยนฟีลตอบสนองและมีข้อมูลรถพร้อม ทีมงานจะช่วยเรียงลำดับให้</p>
          </details>
          <details>
            <summary>Panthera พร้อมจำหน่ายหรือยัง</summary>
            <p>ขณะนี้ Shiftup อยู่ในช่วงทดสอบสินค้าเบื้องต้น ลูกค้าที่สนใจสามารถลงชื่อไว้เพื่อรับข้อมูลเมื่อมีผลทดสอบและแผนเปิดตัว</p>
          </details>
        </div>
      </section>

      {/* Contact */}
      <section className="contact" id="contact" aria-labelledby="contact-title">
        <div className="contact-inner">
          <p className="eyebrow">Contact Shiftup</p>
          <h2 id="contact-title">พร้อมอัปเกรดรถคู่ใจหรือยัง?</h2>
          <p className="contact-desc">
            ประเมินฟรี ไม่มีค่าใช้จ่าย ส่งข้อมูลรถของคุณมาให้เรา
            แล้วมาคุยกันว่า Shiftup จะช่วยยกระดับการขับขี่ของคุณได้อย่างไร
          </p>
          <div className="contact-channels" style={{ textAlign: 'left' }}>
            <p>
              <span className="channel-label">โทร</span>
              <a href="tel:0830092554">083-009-2554</a>
              {' / '}
              <a href="tel:0887888364">088-788-8364</a>
              {' '}
              <span className="channel-note">(ปิง)</span>
            </p>
            <p>
              <span className="channel-label">LINE</span>
              <a href="https://lin.ee/nZOMcph" target="_blank" rel="noreferrer">lin.ee/nZOMcph</a>
            </p>
          </div>
          <aside className="lead-note">
            <h3>สิ่งที่ควรเตรียมก่อนทักหาเรา:</h3>
            <ul>
              <li>ยี่ห้อ รุ่น ปี และรหัสเครื่องยนต์</li>
              <li>รายการของแต่งที่มีอยู่ในปัจจุบัน</li>
              <li>สไตล์การขับขี่ และเป้าหมายที่ต้องการ</li>
            </ul>
            <a
              className="button primary"
              href="https://lin.ee/nZOMcph"
              target="_blank"
              rel="noreferrer"
              style={{ marginTop: '24px', width: '100%' }}
            >
              คุยผ่าน LINE @shiftup
            </a>
          </aside>
        </div>
      </section>
    </main>
  );
}

/* ── Remap Page ──────────────────────────────────────────────── */
function RemapPage({ setPage }) {
  useEffect(() => { window.scrollTo({ top: 0 }); }, []);
  return (
    <main>
      <section className="inner-hero">
        <div className="inner-hero-bg">
          <img src={HERO_BG} alt="ECU Remap" />
        </div>
        <div className="inner-hero-overlay" />
        <div className="inner-hero-copy">
          <button className="back-btn" onClick={() => setPage('home')}>← กลับหน้าหลัก</button>
          <p className="eyebrow">01 — Core Service</p>
          <h1>ECU Remap</h1>
          <p className="inner-lead">
            ปลดล็อกศักยภาพที่แท้จริงของเครื่องยนต์ผ่านการปรับค่า ECU ผ่านพอร์ต OBD2
            โดยไม่ต้องดัดแปลงฮาร์ดแวร์ ออกแบบเฉพาะตามสภาพรถและสไตล์การขับขี่ของคุณ
          </p>
          <a className="button primary" href="https://lin.ee/nZOMcph" target="_blank" rel="noreferrer">
            สอบถามราคา / นัดหมาย
          </a>
        </div>
      </section>

      <div className="band">
        <div className="section-head" style={{ marginBottom: '48px' }}>
          <p className="eyebrow">What You Get</p>
          <h2>สิ่งที่คุณจะได้รับจาก ECU Remap</h2>
        </div>
        <div className="specs-grid">
          <div className="spec-row">
            <div className="spec-label">วิธีการ</div>
            <div className="spec-value">Remap ผ่านพอร์ต OBD2 ไม่ต้องถอด ECU ออกจากตัวรถ</div>
          </div>
          <div className="spec-row">
            <div className="spec-label">ผลลัพธ์หลัก</div>
            <div className="spec-value">แรงม้าและแรงบิดเพิ่มขึ้น คันเร่งตอบสนองดีขึ้น ขับสนุกขึ้น</div>
          </div>
          <div className="spec-row">
            <div className="spec-label">การออกแบบ</div>
            <div className="spec-value">ออกแบบเฉพาะรายคัน ตามรูปแบบการขับขี่และสภาพรถในปัจจุบัน</div>
          </div>
          <div className="spec-row">
            <div className="spec-label">ขั้นตอน</div>
            <div className="spec-value">ประเมินรถ → วางแผน → ดำเนินการ → ทดสอบผล → ส่งมอบ</div>
          </div>
          <div className="spec-row">
            <div className="spec-label">ความเชี่ยวชาญ</div>
            <div className="spec-value">เริ่มต้นจาก Mazda — Skyactiv G / Skyactiv D และขยายสู่รุ่นอื่นๆ</div>
          </div>
          <div className="spec-row">
            <div className="spec-label">ก่อนตัดสินใจ</div>
            <div className="spec-value">ส่งข้อมูลรถมาก่อน ทีมงานจะประเมินว่าเหมาะสมหรือต้องอัปเกรดอะไหล่ก่อนหรือไม่</div>
          </div>
        </div>

        <div style={{ marginTop: '64px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <a className="button primary" href="https://lin.ee/nZOMcph" target="_blank" rel="noreferrer">
            ทักหาเราผ่าน LINE
          </a>
          <button className="button ghost" onClick={() => setPage('home')}>
            ← กลับหน้าหลัก
          </button>
        </div>
      </div>
    </main>
  );
}

/* ── HKS Page ────────────────────────────────────────────────── */
function HKSPage({ setPage }) {
  useEffect(() => { window.scrollTo({ top: 0 }); }, []);
  return (
    <main>
      <section className="inner-hero">
        <div className="inner-hero-bg">
          <img src={PROD_BG} alt="HKS Exhaust" />
        </div>
        <div className="inner-hero-overlay" />
        <div className="inner-hero-copy">
          <button className="back-btn" onClick={() => setPage('home')}>← กลับหน้าหลัก</button>
          <p className="eyebrow">02 — Core Service</p>
          <h1>HKS Exhaust</h1>
          <p className="inner-lead">
            ท่อไอเสียจากแบรนด์ระดับโลก HKS เหมาะกับทั้งการขับใช้งานประจำวันและสายซิ่ง
            ของแท้ตรงรุ่น พร้อมรับประกันจากโรงงาน
          </p>
          <a className="button primary" href="https://lin.ee/nZOMcph" target="_blank" rel="noreferrer">
            เช็คสต๊อค / สอบถาม
          </a>
        </div>
      </section>

      <div className="band">
        <div className="section-head" style={{ marginBottom: '48px' }}>
          <p className="eyebrow">Product Details</p>
          <h2>รายละเอียดสินค้า HKS Exhaust</h2>
        </div>
        <div className="specs-grid">
          <div className="spec-row">
            <div className="spec-label">แบรนด์</div>
            <div className="spec-value">HKS — ผู้นำด้านอุปกรณ์แต่งรถสมรรถนะสูงจากญี่ปุ่น</div>
          </div>
          <div className="spec-row">
            <div className="spec-label">ประเภทสินค้า</div>
            <div className="spec-value">ท่อตรงรุ่น (Cat-Back / Axle-Back) ติดตั้งง่าย ไม่ต้องดัดแปลง</div>
          </div>
          <div className="spec-row">
            <div className="spec-label">การรับประกัน</div>
            <div className="spec-value">รับประกันจากทางโรงงาน 2 ปีเต็ม ของใหม่จากโรงงานทุกชิ้น</div>
          </div>
          <div className="spec-row">
            <div className="spec-label">สต๊อค</div>
            <div className="spec-value">เช็คสต๊อคและรายละเอียดก่อนสั่งซื้อทุกครั้ง เพื่อความถูกต้อง</div>
          </div>
          <div className="spec-row">
            <div className="spec-label">เหมาะกับ</div>
            <div className="spec-value">รถที่ต้องการยกระดับเสียงและภาพลักษณ์ ทั้งสายสตรีทและสายแทร็ก</div>
          </div>
          <div className="spec-row">
            <div className="spec-label">ขั้นตอน</div>
            <div className="spec-value">ส่งรุ่นรถมาให้เราเช็คความเข้ากัน → ยืนยันออเดอร์ → รอสินค้า → ติดตั้ง</div>
          </div>
        </div>

        <div style={{ marginTop: '64px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <a className="button primary" href="https://lin.ee/nZOMcph" target="_blank" rel="noreferrer">
            ทักหาเราผ่าน LINE
          </a>
          <button className="button ghost" onClick={() => setPage('home')}>
            ← กลับหน้าหลัก
          </button>
        </div>
      </div>
    </main>
  );
}

/* ── Panthera Page ───────────────────────────────────────────── */
function PantheraPage({ setPage }) {
  useEffect(() => { window.scrollTo({ top: 0 }); }, []);
  return (
    <main>
      <section className="inner-hero" style={{ minHeight: '480px' }}>
        <div className="inner-hero-bg" style={{ background: 'linear-gradient(135deg, #0d1116, #07090c)' }} />
        <div className="inner-hero-overlay" style={{ background: 'linear-gradient(135deg, rgba(226,41,63,0.22), transparent 60%)' }} />
        <div className="inner-hero-copy">
          <button className="back-btn" onClick={() => setPage('home')}>← กลับหน้าหลัก</button>
          <p className="eyebrow">03 — Core Service</p>
          <h1>Panthera EV Sound</h1>
          <p className="inner-lead">
            ระบบ Active Exhaust Sound ที่เปิดมิติใหม่ด้านเสียงให้กับรถยนต์ไฟฟ้า
            สร้างประสบการณ์การขับขี่ที่สมบูรณ์ยิ่งขึ้น
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(226,41,63,0.12)', border: '1px solid rgba(226,41,63,0.3)', borderRadius: '8px', padding: '10px 18px', color: '#ff8f9e', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '20px' }}>
            🔬 อยู่ในช่วงทดสอบ — เปิดรับลงชื่อจอง
          </div>
          <br />
          <a className="button primary" href="https://lin.ee/nZOMcph" target="_blank" rel="noreferrer">
            ลงชื่อจองล่วงหน้า
          </a>
        </div>
      </section>

      <div className="band">
        <div className="section-head" style={{ marginBottom: '48px' }}>
          <p className="eyebrow">About Panthera</p>
          <h2>Active Sound สำหรับยุค EV</h2>
        </div>
        <div className="specs-grid">
          <div className="spec-row">
            <div className="spec-label">เทคโนโลยี</div>
            <div className="spec-value">Active Exhaust Sound System — จำลองเสียงเครื่องยนต์ผ่านลำโพงภายนอก</div>
          </div>
          <div className="spec-row">
            <div className="spec-label">ใช้ได้กับ</div>
            <div className="spec-value">รถยนต์ไฟฟ้า (EV) และรถยนต์น้ำมันที่ต้องการปรับแต่งเสียง</div>
          </div>
          <div className="spec-row">
            <div className="spec-label">การติดตั้ง</div>
            <div className="spec-value">ติดตั้งง่าย ไม่ต้องตัดต่อสายไฟ ไม่กระทบระบบรถเดิม</div>
          </div>
          <div className="spec-row">
            <div className="spec-label">ประสบการณ์</div>
            <div className="spec-value">เสียงตอบสนองต่ออัตราเร่ง ให้ความรู้สึกเหมือนขับรถน้ำมัน</div>
          </div>
          <div className="spec-row">
            <div className="spec-label">สถานะ</div>
            <div className="spec-value">อยู่ในช่วงทดสอบสินค้าเบื้องต้น — เปิดรับลงชื่อเพื่อรับข้อมูลเมื่อพร้อมเปิดตัว</div>
          </div>
        </div>

        <div style={{ marginTop: '64px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <a className="button primary" href="https://lin.ee/nZOMcph" target="_blank" rel="noreferrer">
            ลงชื่อจองผ่าน LINE
          </a>
          <button className="button ghost" onClick={() => setPage('home')}>
            ← กลับหน้าหลัก
          </button>
        </div>
      </div>
    </main>
  );
}

/* ── Partner Page ────────────────────────────────────────────── */
function PartnerPage({ setPage }) {
  useEffect(() => { window.scrollTo({ top: 0 }); }, []);
  return (
    <main>
      <section className="inner-hero" style={{ minHeight: '420px' }}>
        <div className="inner-hero-bg" style={{ background: 'linear-gradient(135deg, #0d1116, #07090c)' }} />
        <div className="inner-hero-overlay" style={{ background: 'linear-gradient(90deg, rgba(4,5,8,0.95), rgba(4,5,8,0.5))' }} />
        <div className="inner-hero-copy">
          <button className="back-btn" onClick={() => setPage('home')}>← กลับหน้าหลัก</button>
          <p className="eyebrow">About Us</p>
          <h1>P2W Interplus</h1>
          <p className="inner-lead">
            Shiftup Performance เป็นส่วนหนึ่งของกลุ่มยานยนต์ P2W Interplus
            ที่มุ่งมั่นนำเสนอโซลูชันด้านสมรรถนะและเสียงสำหรับรถยนต์
          </p>
        </div>
      </section>

      <div className="band">
        <div className="section-head" style={{ marginBottom: '48px' }}>
          <p className="eyebrow">Our Partners</p>
          <h2>แบรนด์ที่เราเชื่อมั่น</h2>
        </div>
        <div className="partner-grid">
          <div className="partner-card">
            <h3>HKS</h3>
            <p>ผู้นำด้านอุปกรณ์แต่งรถสมรรถนะสูงจากญี่ปุ่น มีประวัติยาวนานกว่า 50 ปีในวงการมอเตอร์สปอร์ต</p>
          </div>
          <div className="partner-card">
            <h3>Panthera</h3>
            <p>เทคโนโลยี Active Sound ชั้นนำสำหรับยานยนต์ไฟฟ้า นวัตกรรมที่เปลี่ยนประสบการณ์การขับขี่</p>
          </div>
          <div className="partner-card">
            <h3>P2W Interplus</h3>
            <p>บริษัทแม่ของ Shiftup Performance ดูแลด้านยานยนต์ครบวงจร ตั้งแต่ที่ปรึกษาจนถึงการติดตั้ง</p>
          </div>
        </div>

        <div style={{ marginTop: '64px' }}>
          <a className="button primary" href="https://lin.ee/nZOMcph" target="_blank" rel="noreferrer">
            ติดต่อเราผ่าน LINE
          </a>
        </div>
      </div>
    </main>
  );
}

/* ── Root App ────────────────────────────────────────────────── */
export default function App() {
  const [page, setPage] = useState('home');

  // Scroll to top on page change (except home handles its own scroll anchors)
  useEffect(() => {
    if (page === 'home') window.scrollTo({ top: 0 });
  }, [page]);

  const renderPage = () => {
    switch (page) {
      case 'remap':    return <RemapPage    setPage={setPage} />;
      case 'hks':      return <HKSPage      setPage={setPage} />;
      case 'panthera': return <PantheraPage setPage={setPage} />;
      case 'partner':  return <PartnerPage  setPage={setPage} />;
      default:         return <HomePage     setPage={setPage} />;
    }
  };

  return (
    <>
      <Navbar page={page} setPage={setPage} />
      {renderPage()}
      <Footer setPage={setPage} />
    </>
  );
}
