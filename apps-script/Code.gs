/**
 * Shiftup Performance — Google Apps Script Web App
 * Sheet ID: 1Su-nW33_bmmE-RUDy0xVf7ppiee4g9RuuA5HcIgyN6E
 *
 * วิธีใช้:
 * 1. เปิด https://script.google.com → New project
 * 2. วาง code นี้ทับ Code.gs เดิม
 * 3. กด Deploy → New deployment → Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy URL ที่ได้ → วางใน src/App.jsx ที่ GOOGLE_SCRIPT_URL = '...'
 * 5. กด setupSheets() ครั้งแรกเพื่อสร้าง Sheet headers + Dashboard
 */

const SPREADSHEET_ID = '1Su-nW33_bmmE-RUDy0xVf7ppiee4g9RuuA5HcIgyN6E';

// ★ ใส่ email ที่ต้องการรับการแจ้งเตือน (ใส่ได้มากกว่า 1 คั่นด้วย ,)
const NOTIFY_EMAIL = 'p2w.interplus@gmail.com';

// ── รับ GET request ───────────────────────────────────────────────────────────
function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const ss     = SpreadsheetApp.openById(SPREADSHEET_ID);

    // ★ Visit tracking จาก server (GET request = ไม่มี redirect issue)
    // server เรียก ?action=track&page=...&device=...&sid=...&province=...&city=...&browser=...&os=...&ref=...
    if (params.action === 'track') {
      migrateVisitsSheet(ss); // อัปเดต header ถ้ายังเป็น version เก่า
      appendRow(ss, 'Visits', [
        params.iso      || new Date().toISOString(),
        new Date().toLocaleString('th-TH'),
        params.page     || '',
        params.device   || '',
        params.sid      || '',
        params.province || '',
        params.city     || '',
        params.browser  || '',
        params.os       || '',
        params.ref      || '',
      ]);
      return ContentService.createTextOutput('ok');
    }

    // ── Default: ส่งข้อมูล Dashboard (leads + visits) ────────────────────────
    const remapSheet  = ss.getSheetByName('Remap Leads');
    const remapVals   = remapSheet ? remapSheet.getDataRange().getValues() : [[]];
    const remapLeads  = (remapVals.length > 1 ? remapVals.slice(1) : []).map(r => ({
      timestamp: r[0], name: r[1], contact: r[2], car: r[3], location: r[4], detail: r[5]
    }));

    const partnerSheet = ss.getSheetByName('Partner Applications');
    const partnerVals  = partnerSheet ? partnerSheet.getDataRange().getValues() : [[]];
    const partnerApplications = (partnerVals.length > 1 ? partnerVals.slice(1) : []).map(r => ({
      timestamp: r[0], shopName: r[1], contactName: r[2], phone: r[3],
      lineId: r[4], province: r[5], expertise: r[6], facebook: r[7]
    }));

    // ★ Visits จาก sheet (historical data) — server จะ merge กับ in-memory visits
    const visitsSheet = ss.getSheetByName('Visits');
    const visitsVals  = visitsSheet ? visitsSheet.getDataRange().getValues() : [[]];
    const sheetVisits = (visitsVals.length > 1 ? visitsVals.slice(1) : []).map(r => ({
      isoTimestamp: r[0] || '', timestamp: r[1] || '',
      page: r[2] || '', device: r[3] || '', sessionId: r[4] || '',
      province: r[5] || '', city: r[6] || '',
      browser: r[7] || '', os: r[8] || '', referrer: r[9] || '',
    }));

    return jsonResponse({
      remapLeads,
      partnerApplications,
      sheetVisits,
      counts: { remap: remapLeads.length, partner: partnerApplications.length }
    });
  } catch (err) {
    return jsonResponse({ error: err.toString(), remapLeads: [], partnerApplications: [], counts: { remap: 0, partner: 0 } });
  }
}

// ── อัปเดต header ของ Visits sheet เป็น version ใหม่ (มี province, city, browser, os, ref) ──
function migrateVisitsSheet(ss) {
  const sheet = ss.getSheetByName('Visits');
  if (!sheet) return;
  const lastCol = sheet.getLastColumn();
  if (lastCol < 12) {
    const newHeaders = ['ISO Timestamp','วันที่-เวลา','หน้า','อุปกรณ์','Session ID','จังหวัด','เมือง','Browser','OS','Referrer','ISP','ภาษา'];
    sheet.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders]);
    styleHeader(sheet, newHeaders.length, '#1a73e8');
    [180,160,100,80,200,150,130,90,90,200,200,80].forEach((w,i) => sheet.setColumnWidth(i+1, w));
    Logger.log('Visits sheet migrated to 12 columns (+ ISP, Language)');
  }
}

// ── รับ POST request จากเว็บ ──────────────────────────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss   = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (data.source === 'remap') {
      appendRow(ss, 'Remap Leads', [
        data.timestamp || new Date().toLocaleString('th-TH'),
        data.name     || '',
        data.contact  || '',
        data.car      || '',
        data.location || '',
        data.detail   || '',
      ]);

      // ── แจ้งเตือน Email — Remap ──────────────────────────────────────────
      sendEmail(
        '🔧 [Shiftup] ลูกค้าใหม่ขอประเมิน Remap!',
        '📋 ข้อมูลลูกค้าใหม่ — ECU Remap\n' +
        '─────────────────────────────────\n' +
        '⏰ เวลา     : ' + (data.timestamp || new Date().toLocaleString('th-TH')) + '\n' +
        '👤 ชื่อ     : ' + (data.name     || '-') + '\n' +
        '📞 ติดต่อ   : ' + (data.contact  || '-') + '\n' +
        '🚗 รุ่นรถ   : ' + (data.car      || '-') + '\n' +
        '📍 สถานที่  : ' + (data.location || '-') + '\n' +
        '📝 รายละเอียด: ' + (data.detail  || '-') + '\n' +
        '─────────────────────────────────\n' +
        '→ ดูข้อมูลทั้งหมด: https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID
      );

    } else if (data.source === 'visit') {
      migrateVisitsSheet(ss); // อัปเกรด header เป็น 12 column ถ้ายังเป็นแบบเก่า
      appendRow(ss, 'Visits', [
        data.isoTimestamp || new Date().toISOString(),
        data.timestamp    || new Date().toLocaleString('th-TH'),
        data.page         || '',
        data.device       || '',
        data.sessionId    || '',
        data.province     || '',
        data.city         || '',
        data.browser      || '',
        data.os           || '',
        data.referrer     || '',
        data.isp          || '',
        data.language     || '',
      ]);

    } else if (data.source === 'partner') {
      appendRow(ss, 'Partner Applications', [
        data.timestamp   || new Date().toLocaleString('th-TH'),
        data.shopName    || '',
        data.contactName || '',
        data.phone       || '',
        data.lineId      || '',
        data.province    || '',
        data.expertise   || '',
        data.facebook    || '',
      ]);

      // ── แจ้งเตือน Email — Partner ────────────────────────────────────────
      sendEmail(
        '🤝 [Shiftup] มีผู้สมัคร Partner ใหม่!',
        '📋 ข้อมูลผู้สมัคร Partner\n' +
        '─────────────────────────────────\n' +
        '⏰ เวลา      : ' + (data.timestamp   || new Date().toLocaleString('th-TH')) + '\n' +
        '🏪 ชื่อร้าน  : ' + (data.shopName    || '-') + '\n' +
        '👤 ผู้ติดต่อ : ' + (data.contactName || '-') + '\n' +
        '📞 เบอร์โทร  : ' + (data.phone       || '-') + '\n' +
        '💬 LINE ID   : ' + (data.lineId      || '-') + '\n' +
        '📍 จังหวัด   : ' + (data.province    || '-') + '\n' +
        '🔧 ความถนัด  : ' + (data.expertise   || '-') + '\n' +
        '📘 Facebook  : ' + (data.facebook    || '-') + '\n' +
        '─────────────────────────────────\n' +
        '→ ดูข้อมูลทั้งหมด: https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID
      );
    }

    return jsonResponse({ success: true });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// ── ส่ง Email แจ้งเตือน ───────────────────────────────────────────────────────
function sendEmail(subject, body) {
  if (!NOTIFY_EMAIL || NOTIFY_EMAIL === 'your@email.com') return;
  try {
    MailApp.sendEmail({
      to:      NOTIFY_EMAIL,
      subject: subject,
      body:    body,
    });
  } catch (err) {
    Logger.log('Email error: ' + err.toString());
  }
}

function appendRow(ss, sheetName, values) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    setupSheets(); // สร้าง sheets ถ้ายังไม่มี
    sheet = ss.getSheetByName(sheetName);
  }
  sheet.appendRow(values);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── สร้าง Sheets + หัวคอลัมน์ (รันครั้งแรกครั้งเดียว) ────────────────────────
function setupSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // ── Remap Leads ──────────────────────────────────────────────────────────────
  let remapSheet = ss.getSheetByName('Remap Leads');
  if (!remapSheet) {
    remapSheet = ss.insertSheet('Remap Leads');
    const headers = ['วันที่-เวลา', 'ชื่อ-นามสกุล', 'เบอร์/LINE ID', 'รุ่นรถ', 'สถานที่', 'รายละเอียด'];
    remapSheet.appendRow(headers);
    styleHeader(remapSheet, headers.length, '#cc2200');
    [150, 140, 140, 150, 120, 280].forEach((w, i) => remapSheet.setColumnWidth(i + 1, w));
    remapSheet.setFrozenRows(1);
  }

  // ── Partner Applications ──────────────────────────────────────────────────────
  let partnerSheet = ss.getSheetByName('Partner Applications');
  if (!partnerSheet) {
    partnerSheet = ss.insertSheet('Partner Applications');
    const headers = ['วันที่-เวลา', 'ชื่อร้าน/อู่', 'ชื่อผู้ติดต่อ', 'เบอร์โทร', 'LINE ID', 'จังหวัด', 'ความถนัด', 'Facebook'];
    partnerSheet.appendRow(headers);
    styleHeader(partnerSheet, headers.length, '#cc5500');
    [150, 150, 130, 120, 120, 120, 200, 200].forEach((w, i) => partnerSheet.setColumnWidth(i + 1, w));
    partnerSheet.setFrozenRows(1);
  }

  // ── Dashboard ────────────────────────────────────────────────────────────────
  let dash = ss.getSheetByName('Dashboard');
  if (!dash) {
    dash = ss.insertSheet('Dashboard', 0); // วางไว้หน้าแรก
    buildDashboard(dash);
  }

  // ── Visits (10 columns) ───────────────────────────────────────────────────────
  let visitsSheet = ss.getSheetByName('Visits');
  if (!visitsSheet) {
    visitsSheet = ss.insertSheet('Visits');
    const h = ['ISO Timestamp','วันที่-เวลา','หน้า','อุปกรณ์','Session ID','จังหวัด','เมือง','Browser','OS','Referrer','ISP','ภาษา'];
    visitsSheet.appendRow(h);
    styleHeader(visitsSheet, h.length, '#1a73e8');
    [180,160,100,80,200,150,130,90,90,200,200,80].forEach((w, i) => visitsSheet.setColumnWidth(i + 1, w));
    visitsSheet.setFrozenRows(1);
  }

  return '✅ Setup complete!';
}

function styleHeader(sheet, colCount, bgColor) {
  const range = sheet.getRange(1, 1, 1, colCount);
  range.setBackground(bgColor)
       .setFontColor('#ffffff')
       .setFontWeight('bold')
       .setFontSize(11);
}

function buildDashboard(dash) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Layout: Remap cols A-F (1-6) | spacer G (7) | Partner cols H-O (8-15)
  const R = 1, P = 8;

  // ── Title ─────────────────────────────────────────────────────
  dash.getRange(1, 1, 1, 15).merge();
  dash.getRange('A1')
    .setValue('📊  Shiftup Performance — Dashboard')
    .setFontSize(16).setFontWeight('bold').setFontColor('#ffffff')
    .setHorizontalAlignment('center').setBackground('#1a1a1a');
  dash.getRange('A2')
    .setValue('🔄 อัปเดตล่าสุด: ' + new Date().toLocaleString('th-TH'))
    .setFontColor('#666666').setFontSize(9);

  // ── อ่านข้อมูล ─────────────────────────────────────────────────
  const remapSheet  = ss.getSheetByName('Remap Leads');
  const remapRows   = remapSheet && remapSheet.getLastRow() > 1
    ? remapSheet.getRange(2, 1, remapSheet.getLastRow() - 1, 6).getValues()
        .filter(r => r[0] !== '').reverse()
    : [];

  const partnerSheet = ss.getSheetByName('Partner Applications');
  const partnerRows  = partnerSheet && partnerSheet.getLastRow() > 1
    ? partnerSheet.getRange(2, 1, partnerSheet.getLastRow() - 1, 8).getValues()
        .filter(r => r[0] !== '').reverse()
    : [];

  // ── Row 4: Section titles (ซ้าย-ขวา) ─────────────────────────
  dash.getRange(4, R).setValue('🔧  Remap Leads  (' + remapRows.length + ' รายการ)')
    .setFontSize(12).setFontWeight('bold').setFontColor('#ff5533');
  dash.getRange(4, P).setValue('🤝  Partner Applications  (' + partnerRows.length + ' รายการ)')
    .setFontSize(12).setFontWeight('bold').setFontColor('#ff8c00');

  // ── Row 5: Column headers ──────────────────────────────────────
  const remapH   = ['วันที่-เวลา','ชื่อ-นามสกุล','เบอร์/LINE','รุ่นรถ','สถานที่','รายละเอียด'];
  const partnerH = ['วันที่-เวลา','ชื่อร้าน/อู่','ผู้ติดต่อ','เบอร์โทร','LINE','จังหวัด','ความถนัด','Facebook'];

  dash.getRange(5, R, 1, remapH.length).setValues([remapH])
    .setBackground('#cc2200').setFontColor('#ffffff').setFontWeight('bold');
  dash.getRange(5, P, 1, partnerH.length).setValues([partnerH])
    .setBackground('#cc5500').setFontColor('#ffffff').setFontWeight('bold');

  // ── Row 6+: Data เรียงซ้าย-ขวาพร้อมกัน ────────────────────────
  const D = 6;

  if (remapRows.length > 0) {
    dash.getRange(D, R, remapRows.length, 6).setValues(remapRows);
    remapRows.forEach((_, i) => {
      if (i % 2 === 0) dash.getRange(D + i, R, 1, 6).setBackground('#141414');
    });
  } else {
    dash.getRange(D, R).setValue('ยังไม่มีข้อมูล').setFontColor('#555555').setFontStyle('italic');
  }

  if (partnerRows.length > 0) {
    dash.getRange(D, P, partnerRows.length, 8).setValues(partnerRows);
    partnerRows.forEach((_, i) => {
      if (i % 2 === 0) dash.getRange(D + i, P, 1, 8).setBackground('#141414');
    });
  } else {
    dash.getRange(D, P).setValue('ยังไม่มีข้อมูล').setFontColor('#555555').setFontStyle('italic');
  }

  // ── Column widths ──────────────────────────────────────────────
  [155,140,120,115,115,185].forEach((w, i) => dash.setColumnWidth(R + i, w)); // A-F
  dash.setColumnWidth(7, 18);                                                   // G spacer
  [130,130,115,105,105,110,140,150].forEach((w, i) => dash.setColumnWidth(P + i, w)); // H-O
  dash.setFrozenRows(1);
}

// ── ทดสอบการเขียน visit ลง Sheet โดยตรง ─────────────────────────────────────
// รันจาก editor เพื่อเช็คว่า appendRow ทำงานได้ไหม
// ถ้า run แล้ว Sheet Visits ได้แถวใหม่ → ปัญหาอยู่ที่ deployment URL ไม่ได้รับ request
function testVisitPost() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  migrateVisitsSheet(ss);
  appendRow(ss, 'Visits', [
    new Date().toISOString(),
    new Date().toLocaleString('th-TH'),
    'home',
    'desktop',
    'TEST-' + Date.now(),
    '',            // province (server เท่านั้น)
    '',            // city
    'Chrome',
    'Windows',
    '',            // referrer
    '',            // isp
    'th-TH',
  ]);
  Logger.log('✅ testVisitPost สำเร็จ — เช็ค Sheet Visits tab ได้เลย');
}

// ── ลบ Dashboard เก่า → สร้างใหม่สะอาด ──────────────────────────────────────
// วิธีใช้: เปิด Apps Script editor → เลือก rebuildDashboard → กด ▶ Run
function rebuildDashboard() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // ถ้ามี Dashboard เก่า → rename เป็น _old ก่อน
  const old = ss.getSheetByName('Dashboard');
  if (old) {
    const prev = ss.getSheetByName('Dashboard_old');
    if (prev) ss.deleteSheet(prev);
    old.setName('Dashboard_old');
  }

  // สร้าง Dashboard ใหม่ถูกต้อง
  const newDash = ss.insertSheet('Dashboard', 0);
  buildDashboard(newDash);

  // ลบ _old ทิ้ง
  const toDelete = ss.getSheetByName('Dashboard_old');
  if (toDelete) ss.deleteSheet(toDelete);

  Logger.log('✅ Dashboard rebuilt! ตรวจสอบใน Sheet ได้เลย');
}

// ── ล้าง Visits เก่า ตั้ง 12-column header ใหม่ ───────────────────────────────
// ข้อมูลเก่าย้ายไป Visits_backup (ไม่ลบ)
// วิธีใช้: เปิด Apps Script editor → เลือก resetVisitsSheet → กด ▶ Run
function resetVisitsSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // ย้ายของเก่าไป backup
  const old = ss.getSheetByName('Visits');
  if (old) {
    const prev = ss.getSheetByName('Visits_backup');
    if (prev) ss.deleteSheet(prev);
    old.setName('Visits_backup');
  }

  // สร้าง Visits ใหม่ 12 columns
  const sheet = ss.insertSheet('Visits');
  const h = ['ISO Timestamp','วันที่-เวลา','หน้า','อุปกรณ์','Session ID','จังหวัด','เมือง','Browser','OS','Referrer','ISP','ภาษา'];
  sheet.appendRow(h);
  styleHeader(sheet, h.length, '#1a73e8');
  [180,160,100,80,200,150,130,90,90,200,200,80].forEach((w, i) => sheet.setColumnWidth(i+1, w));
  sheet.setFrozenRows(1);

  Logger.log('✅ Visits reset! header 12 columns พร้อมแล้ว  |  ข้อมูลเก่าอยู่ใน Visits_backup');
}
