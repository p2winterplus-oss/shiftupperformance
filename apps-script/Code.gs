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

// ── รับ GET request — ส่งข้อมูลกลับให้ Dashboard ────────────────────────────
function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

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

    const visitsSheet = ss.getSheetByName('Visits');
    const visitsVals  = visitsSheet ? visitsSheet.getDataRange().getValues() : [[]];
    const visits = (visitsVals.length > 1 ? visitsVals.slice(1) : []).map(r => ({
      isoTimestamp: r[0], timestamp: r[1], page: r[2], device: r[3], sessionId: r[4]
    }));

    return jsonResponse({
      remapLeads,
      partnerApplications,
      visits,
      counts: { remap: remapLeads.length, partner: partnerApplications.length, visits: visits.length }
    });
  } catch (err) {
    return jsonResponse({ error: err.toString(), remapLeads: [], partnerApplications: [], counts: { remap: 0, partner: 0 } });
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
      appendRow(ss, 'Visits', [
        data.isoTimestamp || new Date().toISOString(),
        data.timestamp    || new Date().toLocaleString('th-TH'),
        data.page         || '',
        data.device       || '',
        data.sessionId    || '',
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

  // ── Visits ───────────────────────────────────────────────────────────────────
  let visitsSheet = ss.getSheetByName('Visits');
  if (!visitsSheet) {
    visitsSheet = ss.insertSheet('Visits');
    const h = ['ISO Timestamp', 'วันที่-เวลา', 'หน้า', 'อุปกรณ์', 'Session ID'];
    visitsSheet.appendRow(h);
    styleHeader(visitsSheet, h.length, '#1a73e8');
    [180, 160, 100, 80, 200].forEach((w, i) => visitsSheet.setColumnWidth(i + 1, w));
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
  dash.getRange('A1').setValue('📊  Shiftup Performance — Dashboard');
  dash.getRange('A1').setFontSize(18).setFontWeight('bold').setFontColor('#ffffff');
  dash.getRange('A1:E1').merge().setBackground('#1a1a1a');

  // Summary cards
  const summaryData = [
    ['', 'หมวด', 'จำนวน (Leads/สมัคร)', 'Link'],
    ['🔧', 'Remap Leads',         "=COUNTA('Remap Leads'!A:A)-1",         "=HYPERLINK(\"#gid=\"&'Remap Leads'!A1,\"→ ดูข้อมูล\")"],
    ['🤝', 'Partner Applications', "=COUNTA('Partner Applications'!A:A)-1", "=HYPERLINK(\"#gid=\"&'Partner Applications'!A1,\"→ ดูข้อมูล\")"],
    ['📈', 'รวมทั้งหมด',           '=B3+B4',                                ''],
  ];
  dash.getRange(3, 1, summaryData.length, summaryData[0].length).setValues(summaryData);
  dash.getRange('A3:D3').setBackground('#333333').setFontColor('#ffffff').setFontWeight('bold');
  dash.getRange('B4:B6').setFontSize(20).setFontWeight('bold').setFontColor('#ff5533');

  // Monthly breakdown header
  dash.getRange('A9').setValue('📅  รายการล่าสุด (Remap Leads)');
  dash.getRange('A9').setFontSize(13).setFontWeight('bold');
  dash.getRange('A10:F10').setValues([['วันที่', 'ชื่อ', 'เบอร์/LINE', 'รุ่นรถ', 'สถานที่', 'รายละเอียด']]);
  dash.getRange('A10:F10').setBackground('#cc2200').setFontColor('#ffffff').setFontWeight('bold');
  dash.getRange('A11').setFormula("=IFERROR(SORT('Remap Leads'!A2:F,1,FALSE),\"\")");

  dash.getRange('A20').setValue('📅  รายการล่าสุด (Partner)');
  dash.getRange('A20').setFontSize(13).setFontWeight('bold');
  dash.getRange('A21:H21').setValues([['วันที่', 'ร้าน', 'ผู้ติดต่อ', 'เบอร์', 'LINE', 'จังหวัด', 'ความถนัด', 'Facebook']]);
  dash.getRange('A21:H21').setBackground('#cc5500').setFontColor('#ffffff').setFontWeight('bold');
  dash.getRange('A22').setFormula("=IFERROR(SORT('Partner Applications'!A2:H,1,FALSE),\"\")");

  dash.setColumnWidth(1, 30);
  dash.setColumnWidth(2, 160);
  dash.setColumnWidth(3, 100);
  dash.setColumnWidth(4, 100);
}
