/**
 * AKIN SOLAR — MASTER COMMAND V69.0 (GHOST JOB FIX)
 * STATUS: PLATINUM.
 * 1. ID FIX: If Job ID is blank, it uses the Row Number (prevents skipping).
 * 2. GPS FIX: Routes jobs with GPS even if Address text is missing.
 * 3. ROUTE SUMMARY: Includes "Route Value ($)".
 * 4. ALL BUTTONS: Fully active.
 */

/* ======================= 1. CORE & UI STARTUP ======================= */
function onOpen(){
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 Akin Solar Ops')
    .addItem('Open Command Center', 'showSidebar')
    .addItem('📍 Force Geocode Backlog', 'forceGeocodeBacklog')
    .addItem('🕵️‍♂️ Run Diagnostics', 'runDiagnostics')
    .addSeparator()
    .addItem('💰 Generate P&L Report', 'generateProfitLossReport')
    .addToUi();
  try { showSidebar(); } catch(e) {}
}

function onEdit(e) {
  try {
    const sheet = e.source.getActiveSheet();
    if (sheet.getName() !== 'Jobs') return;
    const r = e.range;
    if (r.getRow() < 2 || r.getColumn() > 5) return; 
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues();
    const idx = getColumnIndexes(headers);
    if (idx.status > -1) {
      const cell = sheet.getRange(r.getRow(), idx.status + 1);
      if (cell.getValue() === "") cell.setValue("Scheduled");
    }
    if (idx.dur > -1) {
      const cell = sheet.getRange(r.getRow(), idx.dur + 1);
      if (cell.getValue() === "") cell.setValue(0.5); 
    }
    if (idx.rev > -1) {
      const cell = sheet.getRange(r.getRow(), idx.rev + 1);
      if (cell.getValue() === "") cell.setValue(0);
    }
  } catch(err) {}
}

function showSidebar() {
  const html = HtmlService.createTemplateFromFile('Sidebar').evaluate().setTitle('Dispatch Command');
  SpreadsheetApp.getUi().showSidebar(html);
}

/* ======================= 2. ROUTING ENGINE ======================= */
function optimizeRoutes(startDate = null, endDate = null) {
  try {
    const s = getSettings();
    const ss = SpreadsheetApp.getActive();
    organizeTabs(ss); 

    const jobsSheet = ss.getSheetByName('Jobs');
    if (!jobsSheet) throw new Error("⚠️ Tab named 'Jobs' not found!");

    const data = jobsSheet.getDataRange().getValues();
    const idx = getColumnIndexes(data);

    let start = startDate ? parseDate(startDate) : null;
    let end = endDate ? parseDate(endDate) : (start ? parseDate(startDate) : null);
    if (start) start.setHours(0,0,0,0);
    if (end) end.setHours(23,59,59,999);

    const candidates = [];
    const seen = new Set();
    
    for (let r = 1; r < data.length; r++) {
      let lat = idx.lat > -1 ? parseFloat(data[r][idx.lat]) : 0;
      let lng = idx.lng > -1 ? parseFloat(data[r][idx.lng]) : 0;
      
      const status = String(data[r][idx.status] || '').toLowerCase();
      let jDate = idx.date > -1 ? parseDate(data[r][idx.date]) : new Date(); 

      let isDateMatch = (!start) ? true : (jDate && jDate >= start && jDate <= end);
      let isNotDone = !['complete', 'completed', 'archived', 'cancelled'].includes(status);
      
      // RELAXED RULE: Has Address OR Has GPS
      let hasAddress = (idx.addr > -1 && String(data[r][idx.addr]).length > 3);
      let hasGPS = (!isNaN(lat) && lat !== 0 && !isNaN(lng) && lng !== 0);

      if (isNotDone && isDateMatch && (hasAddress || hasGPS)) {
        
        // ID FIX: Generate ID if missing to prevent skipping
        let rawId = (idx.job > -1) ? data[r][idx.job] : "";
        let jobId = (rawId && String(rawId).trim() !== "") ? rawId : "Row-" + (r + 1);

        if (!seen.has(jobId)) {
          const cleanMoney = (val) => Number(String(val).replace(/[^0-9.-]+/g,"")) || 0;
          let rawDur = Number(data[r][idx.dur]) || 0;
          let svcMin = rawDur < 8 ? rawDur * 60 : rawDur; 
          if (svcMin === 0) svcMin = 30;

          // If no address text, use "GPS Pin"
          let addrText = hasAddress ? data[r][idx.addr] : `GPS Pin (${lat}, ${lng})`;

          candidates.push({ 
            job: jobId, 
            cust: data[r][idx.cust] || "Unknown", 
            addr: addrText,
            lat: lat, 
            lng: lng, 
            svc: svcMin,
            rev: cleanMoney(data[r][idx.rev]), 
            parts: 0, 
            consum: 0
          });
          seen.add(jobId);
        }
      }
    }

    if (!candidates.length) throw new Error("❌ No active jobs found.");

    // Geocode missing GPS
    let geoCount = 0;
    candidates.forEach(c => {
      if ((!c.lat || c.lat === 0) && geoCount < 15) {
        try {
          let res = Maps.newGeocoder().geocode(c.addr);
          if (res.status === 'OK') {
            c.lat = res.results[0].geometry.location.lat;
            c.lng = res.results[0].geometry.location.lng;
            geoCount++;
          }
        } catch(e) {}
      }
    });

    let routes = [];
    let remaining = candidates.filter(c => c.lat !== 0); 
    
    if (remaining.length === 0) throw new Error("❌ No jobs have GPS data. Run 'Force Geocode' first.");

    while (remaining.length > 0) {
      let route = [remaining.shift()];
      while (route.length < s.maxPerRoute && remaining.length > 0) {
        let last = route[route.length - 1];
        remaining.sort((a, b) => haversine(last.lat, last.lng, a.lat, a.lng) - haversine(last.lat, last.lng, b.lat, b.lng));
        route.push(remaining.shift());
      }
      routes.push(route);
    }
    return writeRoutes(routes, s);
  } catch (err) { throw new Error(err.message); }
}

function writeRoutes(routes, s) {
  const ss = SpreadsheetApp.getActive();
  
  let rSheet = ss.getSheetByName('Routes') || ss.insertSheet('Routes');
  rSheet.clearContents();
  
  const output = [['Route', 'Seq', 'Job#', 'Customer', 'Address', 'Est Mi', 'Drive', 'Work', 'Total', 'Warning', 'MAP LINK', '|', 'Tech', 'Rev $', 'True Cost', 'PROFIT', 'Verdict', 'Lat', 'Lng']];
  const summaryData = [['Route ID', '# Jobs', 'Total Miles', 'Total Drive (min)', 'Route Value ($)', 'Map Link']]; 
  const jobUpdates = {};

  routes.forEach((route, i) => {
    const rid = 'R' + (i + 1);
    let prev = { lat: s.depotLat, lng: s.depotLng };
    let totalMin = 0;
    let routeMiles = 0;
    let routeDrive = 0;
    let routeRev = 0; 
    
    const techName = s.getTechForRoute(rid);
    const hourlyRate = s.getTechRate(techName);

    let mapUrl = `https://www.google.com/maps/dir/${s.depotLat},${s.depotLng}`;
    route.forEach(rStop => { mapUrl += `/${rStop.lat},${rStop.lng}`; });
    mapUrl += `/${s.depotLat},${s.depotLng}/`; 

    route.forEach((stop, seq) => {
      let d = haversine(prev.lat, prev.lng, stop.lat, stop.lng);
      let leg = { miles: d, minutes: Math.round(d/35*60) };
      
      totalMin += (leg.minutes + stop.svc);
      routeMiles += leg.miles;
      routeDrive += leg.minutes;
      routeRev += stop.rev; 

      const techPay = ((leg.minutes + stop.svc) / 60) * hourlyRate;
      const fuelCost = leg.miles * s.fuelPerMile;
      const trueCost = techPay + fuelCost + stop.parts + stop.consum + s.adminCost + s.generacOverhead + s.qaCost;
      const profit = stop.rev - trueCost;
      let verdict = profit < 0 ? "❌" : (profit < stop.rev * s.riskBuffer ? "⚠️" : "✅");

      output.push([rid, seq + 1, stop.job, stop.cust, stop.addr, leg.miles.toFixed(2), leg.minutes, stop.svc, totalMin, (totalMin > s.workDayLimit ? "OT!" : "OK"), mapUrl, '|', techName, stop.rev, trueCost.toFixed(2), profit.toFixed(2), verdict, stop.lat, stop.lng]);
      
      jobUpdates[stop.job] = { rid: rid, seq: seq + 1, mi: leg.miles.toFixed(2), link: mapUrl };
      prev = stop;
    });

    let returnDist = haversine(prev.lat, prev.lng, s.depotLat, s.depotLng);
    routeMiles += returnDist;
    routeDrive += Math.round(returnDist/35*60);

    summaryData.push([rid, route.length, routeMiles.toFixed(2), routeDrive, '$' + routeRev.toLocaleString(), mapUrl]);
  });

  rSheet.getRange(1, 1, output.length, 19).setValues(output);
  rSheet.getRange(1, 1, 1, 19).setBackground('#1a73e8').setFontColor('white').setFontWeight('bold');
  rSheet.hideColumns(18, 2);
  
  let sumSheet = ss.getSheetByName('Route Summary') || ss.insertSheet('Route Summary');
  sumSheet.clearContents();
  sumSheet.clearFormats(); 
  sumSheet.getRange(1, 1, summaryData.length, 6).setValues(summaryData);
  sumSheet.getRange(1, 1, 1, 6).setBackground('#34a853').setFontColor('white').setFontWeight('bold');
  sumSheet.setColumnWidth(6, 300);

  createDashboard();
  generateProfitLossReport(); 
  syncBackToJobs(jobUpdates);
  
  ss.setActiveSheet(rSheet);
  return `Success! Built ${routes.length} routes & Generated P&L.`;
}

/* ======================= 3. BUTTONS & UI FUNCTIONS ======================= */
function showQuickMap() {
  try {
    const s = getSettings();
    const ss = SpreadsheetApp.getActive();
    const rSheet = ss.getSheetByName('Routes');
    if (!rSheet) return SpreadsheetApp.getUi().alert("No routes found.");
    if (!s.apiKey) return SpreadsheetApp.getUi().alert("No API Key found in Settings.");
    const data = rSheet.getDataRange().getValues();
    let markers = [];
    const colors = ['red', 'blue', 'green', 'orange', 'purple', 'yellow'];
    for (let i = 1; i < Math.min(data.length, 30); i++) {
      let lat = data[i][17]; 
      let lng = data[i][18];
      if (lat && lng && !isNaN(lat)) {
        let rId = String(data[i][0]).replace(/\D/g, '') || 1;
        let color = colors[(rId - 1) % colors.length] || 'red';
        let label = data[i][1]; 
        markers.push(`markers=color:${color}|label:${label}|${lat},${lng}`);
      }
    }
    if (markers.length === 0) return SpreadsheetApp.getUi().alert("No stops found.");
    const url = `https://maps.googleapis.com/maps/api/staticmap?size=600x400&${markers.join('&')}&key=${s.apiKey}`;
    const html = HtmlService.createHtmlOutput(`<div style="text-align:center;"><img src="${url}" style="width:100%; border:1px solid #ccc;"><br><br><button onclick="google.script.host.close()" style="padding:10px 20px;">Close Map</button></div>`).setWidth(650).setHeight(500);
    SpreadsheetApp.getUi().showModalDialog(html, 'Route Preview');
  } catch(e) { SpreadsheetApp.getUi().alert("Map Error: " + e.message); }
}

function exportFleetPDFs() {
  try {
    const ss = SpreadsheetApp.getActive();
    const rSheet = ss.getSheetByName('Routes');
    if (!rSheet) return "No routes generated yet.";
    const data = rSheet.getDataRange().getValues();
    const routes = {};
    for (let i = 1; i < data.length; i++) {
      const rId = data[i][0];
      if (!rId) continue;
      if (!routes[rId]) routes[rId] = [];
      routes[rId].push(data[i]);
    }
    let html = `<h1 style="text-align:center;">DAILY FLEET MANIFEST</h1><hr>`;
    for (const [rId, stops] of Object.entries(routes)) {
      const tech = stops[0][12] || "Unassigned"; 
      html += `<h2>${rId} — ${tech}</h2><table border="1" cellpadding="5" style="border-collapse:collapse;width:100%"><tr><th>Seq</th><th>Customer</th><th>Address</th><th>Link</th></tr>`;
      stops.forEach(s => { html += `<tr><td>${s[1]}</td><td>${s[3]}</td><td>${s[4]}</td><td><a href="${s[10]}">Map</a></td></tr>`; });
      html += `</table><br>`;
    }
    const blob = Utilities.newBlob(html, MimeType.HTML).getAs(MimeType.PDF).setName("Fleet_Routes.pdf");
    DriveApp.createFile(blob);
    return `✅ PDF Saved to Drive!`;
  } catch (e) { return "Error: " + e.message; }
}

function findBestFitForJob(addressInput) {
  if (!addressInput) return JSON.stringify({ error: "Please enter an address." });
  const geo = Maps.newGeocoder().geocode(addressInput);
  if (geo.status !== 'OK') return JSON.stringify({ error: "❌ Address not found." });
  const loc = geo.results[0].geometry.location;
  const ss = SpreadsheetApp.getActive();
  const rSheet = ss.getSheetByName('Routes');
  if (!rSheet) return JSON.stringify({ error: "❌ Build routes first." });
  const data = rSheet.getDataRange().getValues();
  let bestRoute = "None", minDistance = 9999, bestTech = "Unknown";
  for (let i = 1; i < data.length; i++) {
    const rLat = data[i][17], rLng = data[i][18];
    if (rLat && rLng) {
      const dist = haversine(loc.lat, loc.lng, rLat, rLng);
      if (dist < minDistance) { minDistance = dist; bestRoute = data[i][0]; bestTech = data[i][12]; }
    }
  }
  return JSON.stringify({ success: true, message: `✅ BEST FIT: ${bestRoute} (${bestTech})\n📍 ~${minDistance.toFixed(1)} miles.`, route: bestRoute, address: addressInput, lat: loc.lat, lng: loc.lng });
}

function addJobToRoute(customerName, address, targetDate) {
  const ss = SpreadsheetApp.getActive();
  const jSheet = ss.getSheetByName('Jobs');
  const headers = jSheet.getRange(1,1,1,jSheet.getLastColumn()).getValues()[0];
  const idx = getColumnIndexes([headers]);
  let newRow = new Array(headers.length).fill("");
  if (idx.job > -1) newRow[idx.job] = 'J-' + Math.floor(Math.random()*9999);
  if (idx.cust > -1) newRow[idx.cust] = customerName || "New Customer";
  if (idx.addr > -1) newRow[idx.addr] = address;
  if (idx.date > -1) newRow[idx.date] = targetDate || new Date();
  if (idx.status > -1) newRow[idx.status] = 'Scheduled';
  try {
    const geo = Maps.newGeocoder().geocode(address);
    if (geo.status === 'OK') {
      const loc = geo.results[0].geometry.location;
      if (idx.lat > -1) newRow[idx.lat] = loc.lat;
      if (idx.lng > -1) newRow[idx.lng] = loc.lng;
    }
  } catch(e) {}
  jSheet.appendRow(newRow);
  return `✅ Added ${customerName} to the schedule!`;
}

/* ======================= 4. HELPERS & CONFIG ======================= */
function getColumnIndexes(data) {
  const hdr = data[0].map(x => String(x || '').toLowerCase().trim());
  const find = (options) => {
    for (let opt of options) { if (hdr.indexOf(opt) > -1) return hdr.indexOf(opt); }
    return -1;
  };
  return {
    job: find(['hcp #', 'hcp', 'case #', 'case', 'job#', 'job']),
    cust: find(['customer name', 'customer']),
    addr: find(['service address', 'site address', 'address', 'street', 'location', 'ship to address', 'street address']), 
    date: find(['job completed date', 'date', 'requested date']), 
    status: find(['status', 'tags']), 
    dur: find(['labor hr approved', 'labor', 'hours', 'duration']), 
    rev: find(['total amount approve', 'total amount', 'revenue', 'rev']), 
    lat: find(['lat', 'latitude']),
    lng: find(['lng', 'longitude']),
    parts: find(['parts needed', 'parts']),
    consum: find(['consumables'])
  };
}

function organizeTabs(ss) {
  const visible = ['Jobs', 'Dashboard', 'Route Summary', 'Routes', 'Profit_Loss_Report'];
  visible.forEach((name, i) => {
    const s = ss.getSheetByName(name);
    if (s) { s.showSheet(); ss.setActiveSheet(s); ss.moveActiveSheet(i + 1); }
  });
}

function getSettings() {
  const s = SpreadsheetApp.getActive().getSheetByName('Settings');
  if (!s) return { depotLat: 35.9641, depotLng: -83.9201, fuelPerMile: 0.99, maxPerRoute: 6, workDayLimit: 480, riskBuffer: 0.1, qaCost: 85, adminCost: 315, generacOverhead: 0, getTechForRoute: () => 'Generic Tech', getTechRate: () => 160, apiKey: '' };
  
  const vals = s.getDataRange().getValues();
  const map = {};
  vals.forEach(r => { if (r[0]) map[String(r[0]).trim()] = r[1]; });
  const _get = (k, def) => (map[k] !== undefined ? map[k] : def);
  return {
    depotLat: Number(_get('Depot Latitude', 35.9641)),
    depotLng: Number(_get('Depot Longitude', -83.9201)),
    fuelPerMile: Number(String(_get('Fuel $/mile', 0.99)).replace(/[^0-9.]/g, '')),
    maxPerRoute: Number(_get('Max Jobs Per Route', 6)),
    workDayLimit: 480,
    riskBuffer: Number(_get('Risk buffer %', 0.1)),
    qaCost: Number(_get('QA cost per job', 85)),
    adminCost: Number(_get('Admin + Mgmt + Software per job', 315)),
    generacOverhead: Number(_get('Generac Overhead', 0)), 
    getTechForRoute: (rid) => _get(rid + ' Driver', 'Generic Tech'),
    getTechRate: (name) => Number(String(_get(name + ' Cost', 160)).replace(/[^0-9.]/g, '')),
    apiKey: String(_get('Google Maps API Key', '')).trim()
  };
}

function haversine(lat1, lon1, lat2, lon2) {
  const toRad = Math.PI/180;
  const a = Math.sin(((lat2-lat1)*toRad)/2)**2 + Math.cos(lat1*toRad) * Math.cos(lat2*toRad) * Math.sin(((lon2-lon1)*toRad)/2)**2;
  return 2 * 3958.8 * Math.asin(Math.sqrt(a));
}

function parseDate(input) {
  if (!input) return null;
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

function runDiagnostics() {
  const s = SpreadsheetApp.getActive().getSheetByName('Jobs');
  if (!s) return SpreadsheetApp.getUi().alert("❌ No 'Jobs' tab found.");
  const idx = getColumnIndexes(s.getDataRange().getValues());
  let msg = "DIAGNOSTICS:\n";
  msg += `REVENUE Col: ${idx.rev > -1 ? "✅ Found" : "❌ MISSING"}\n`;
  msg += `ADDRESS Col: ${idx.addr > -1 ? "✅ Found" : "❌ MISSING"}\n`;
  SpreadsheetApp.getUi().alert(msg);
}

function forceGeocodeBacklog() {
  const sheet = SpreadsheetApp.getActive().getSheetByName('Jobs');
  const data = sheet.getDataRange().getValues();
  const idx = getColumnIndexes(data);
  
  if (idx.lat === -1) {
    sheet.getRange(1, sheet.getLastColumn()+1).setValue("Lat");
    sheet.getRange(1, sheet.getLastColumn()+1).setValue("Lng");
    SpreadsheetApp.getUi().alert("⚠️ Added 'Lat' and 'Lng' columns. Run this again to fill them.");
    return;
  }

  let updates = 0;
  for(let i=1; i<data.length; i++) {
    if(!data[i][idx.lat] && data[i][idx.addr]) {
      try {
        let res = Maps.newGeocoder().geocode(data[i][idx.addr]);
        if(res.status === 'OK') {
          let loc = res.results[0].geometry.location;
          sheet.getRange(i+1, idx.lat+1).setValue(loc.lat);
          sheet.getRange(i+1, idx.lng+1).setValue(loc.lng);
          updates++;
        }
      } catch(e) {}
    }
  }
  SpreadsheetApp.getUi().alert("Geocoded " + updates + " rows.");
}

function createDashboard() {
  const ss = SpreadsheetApp.getActive();
  const rSheet = ss.getSheetByName('Routes');
  if (!rSheet) return; 
  const data = rSheet.getDataRange().getValues();
  let totalMi = 0, totalRev = 0, totalProfit = 0;
  for (let r = 1; r < data.length; r++) {
    totalMi += Number(data[r][5]) || 0;
    totalRev += Number(data[r][13]) || 0;
    totalProfit += Number(data[r][15]) || 0;
  }
  
  let dash = ss.getSheetByName('Dashboard') || ss.insertSheet('Dashboard', 0);
  dash.clear();
  dash.getRange('A1:B1').setValues([['AKIN FLEET COMMAND', 'Updated: ' + new Date().toLocaleTimeString()]]);
  dash.getRange('A1:B1').setBackground('#20124d').setFontColor('white').setFontWeight('bold');
  dash.getRange(2, 1, 4, 2).setValues([
    ['Total Mileage', totalMi.toFixed(1) + ' mi'],
    ['Total Revenue', '$' + totalRev.toLocaleString()],
    ['Net Profit', '$' + totalProfit.toLocaleString()],
    ['Status', totalProfit > 0 ? 'PROFITABLE 🟢' : 'LOSS 🔴']
  ]);
  dash.setColumnWidth(1, 160); dash.setColumnWidth(2, 160);
}

function generateProfitLossReport() {
  const ss = SpreadsheetApp.getActive();
  const rSheet = ss.getSheetByName('Routes');
  if(!rSheet) return;
  const data = rSheet.getDataRange().getValues();
  const report = [['Job ID', 'Tech', 'Rev $', 'True Cost', 'Net Profit', 'Verdict']];
  for(let i=1; i<data.length; i++) {
    report.push([data[i][2], data[i][12], data[i][13], data[i][14], data[i][15], data[i][16]]);
  }
  let p = ss.getSheetByName('Profit_Loss_Report') || ss.insertSheet('Profit_Loss_Report');
  p.clear().getRange(1,1,report.length,6).setValues(report);
  p.getRange(1,1,1,6).setBackground('#6aa84f').setFontColor('white').setFontWeight('bold');
}

function syncBackToJobs(updates) {
  const ss = SpreadsheetApp.getActive();
  const jSheet = ss.getSheetByName('Jobs');
  const data = jSheet.getDataRange().getValues();
  const headers = data[0].map(x => String(x).toLowerCase().trim());
  const colIdx = {
    job: headers.indexOf('hcp #') > -1 ? headers.indexOf('hcp #') : headers.findIndex(h => h.includes('job') || h.includes('case')),
    assignedRoute: headers.findIndex(h => h.includes('route') || h.includes('assigned')),
    order: headers.findIndex(h => h.includes('order') || h.includes('seq')),
    miles: headers.findIndex(h => h.includes('one-way') || h.includes('miles')),
    link: headers.indexOf('map link')
  };
  if (colIdx.assignedRoute === -1) {
    jSheet.getRange(1, headers.length + 1).setValue("Assigned Route");
    jSheet.getRange(1, headers.length + 2).setValue("Order");
    jSheet.getRange(1, headers.length + 3).setValue("Map Link");
    return; 
  }
  for (let r = 1; r < data.length; r++) {
    const jobId = data[r][colIdx.job];
    const update = updates[jobId];
    if (update) {
      jSheet.getRange(r + 1, colIdx.assignedRoute + 1).setValue(update.rid);
      if (colIdx.order > -1) jSheet.getRange(r + 1, colIdx.order + 1).setValue(update.seq);
      if (colIdx.miles > -1) jSheet.getRange(r + 1, colIdx.miles + 1).setValue(update.mi);
      if (colIdx.link > -1) jSheet.getRange(r + 1, colIdx.link + 1).setValue(update.link);
    }
  }
}