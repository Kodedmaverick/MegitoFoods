import React, { useEffect, useRef, useState } from 'react';
import { icons } from 'lucide-react';
import { PRODUCTS, CATS, naira } from './data/products.js';

// Delivery settings. Set VITE_GOOGLE_MAPS_KEY in .env to use Google address search and driving distance.
export const RATES = { baseFee: 3000, perKm: 200, perKg: 100, minOrder: 10000 };
const GOOGLE_KEY = ''; // distance uses OpenStreetMap (Nominatim search + OSRM routing)
const OFFICE = { address: '43 Diya Street, Ifako, Gbagada, Lagos, Nigeria', lat: 6.5559, lng: 3.3886 };
const WA = '2348037898104', EMAIL = 'megitofoods@yahoo.com';
const FREQS = [['weekly', 'Weekly', 4], ['fortnightly', 'Every 2 weeks', 2], ['monthly', 'Monthly', 1], ['custom', 'Custom days', 0]];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TYPES = ['Hotel', 'Supermarket', 'Restaurant', 'Caterer', 'Other business'];

const Icon = ({ name, size = 16 }) => { const C = icons[name.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join('')] || icons.Circle; return <C size={size} aria-hidden="true" />; };
export const kgOf = l => { if (!l) return null; const m = String(l).match(/(\d+(?:\.\d+)?)\s*(kg|g)\b/i); if (m) return m[2].toLowerCase() === 'kg' ? +m[1] : +m[1] / 1000; if (/per kg/i.test(l)) return 1; if (/pack of/i.test(l)) return 0.5; return null; };
const fmtKg = n => (Math.round(n * 100) / 100).toLocaleString('en-NG') + ' kg';
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const hav = (a, b) => { const t = x => x * Math.PI / 180; const d1 = t(b.lat - a.lat), d2 = t(b.lng - a.lng); const x = Math.sin(d1 / 2) ** 2 + Math.cos(t(a.lat)) * Math.cos(t(b.lat)) * Math.sin(d2 / 2) ** 2; return 2 * 6371 * Math.asin(Math.sqrt(x)); };

let gPromise;
function loadGoogle() {
  if (!GOOGLE_KEY) return Promise.resolve(null);
  gPromise ||= new Promise((res, rej) => {
    if (window.google?.maps?.importLibrary) return res();
    const s = document.createElement('script'); s.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(GOOGLE_KEY) + '&loading=async&libraries=places'; s.async = true; s.onload = res; s.onerror = rej; document.head.appendChild(s);
  }).then(() => window.google.maps.importLibrary('places'));
  return gPromise;
}
const osmSearch = async q => { const r = await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=ng&limit=5&q=' + encodeURIComponent(q)); return (await r.json()).map(x => ({ label: x.display_name, lat: +x.lat, lng: +x.lon })); };

export function addLineTo(lines, pid, variation, size) {
  const i = lines.findIndex(l => l.pid === pid && l.variation === variation && l.size === size);
  if (i >= 0) return lines.map((l, j) => (j === i ? { ...l, qty: l.qty + 1 } : l));
  return lines.concat({ id: 'l' + Date.now() + Math.round(Math.random() * 1e4), pid, variation, size, qty: 1 });
}

function calc(lines, km, orderType, freq, days) {
  let sub = 0, kg = 0, por = 0, noKg = 0, packs = 0;
  const rows = lines.map(l => {
    const p = PRODUCTS.find(x => x.id === l.pid); const z = p.sizes.find(x => x.label === l.size);
    const unit = z ? z.price : null; const w = kgOf(l.size) ?? kgOf(p.packSize);
    packs += l.qty; if (unit != null) sub += unit * l.qty; else por++; if (w != null) kg += w * l.qty; else noKg++;
    return { l, p, unit, total: unit != null ? unit * l.qty : null };
  });
  const delivery = km != null && rows.length ? Math.round(RATES.baseFee + RATES.perKm * km + RATES.perKg * kg) : null;
  const perMonth = orderType === 'repeat' ? (freq === 'custom' ? days.length * 4 : FREQS.find(f => f[0] === freq)[2]) : 0;
  return { rows, sub, kg, por, noKg, packs, km, delivery, total: sub + (delivery || 0), perMonth, belowMin: sub > 0 && sub < RATES.minOrder, short: RATES.minOrder - sub };
}

export default function QuoteBuilder({ lines, setLines, showSnails }) {
  const [orderType, setOrderType] = useState('once');
  const [freq, setFreq] = useState('weekly');
  const [days, setDays] = useState([]);
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', type: '', message: '' });
  const [addr, setAddr] = useState('');
  const [sugs, setSugs] = useState([]);
  const [picked, setPicked] = useState(null);
  const [km, setKm] = useState(null);
  const [approx, setApprox] = useState(false);
  const [status, setStatus] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [ref, setRef] = useState(null);
  const tok = useRef(0), deb = useRef();

  useEffect(() => setRef(null), [lines, orderType, freq, days, form, addr, km]);
  useEffect(() => () => clearTimeout(deb.current), []);

  const q = calc(lines, km, orderType, freq, days);
  const orderLine = orderType !== 'repeat' ? 'One-off order' : 'Repeat order · ' + (freq === 'custom' ? (days.length ? DAYS.filter(d => days.includes(d)).join(', ') + ' each week' : 'choose days') : FREQS.find(f => f[0] === freq)[1]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Enter your name.';
    if (!form.company.trim()) e.company = 'Enter your company or business name.';
    if (!form.email.trim() && !form.phone.trim()) e.email = 'Enter an email or phone number so we can reach you.';
    else if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "That email doesn't look right. Check and try again.";
    if (!form.type) e.type = 'Choose your type of business.';
    if (!lines.length) e.lines = 'Add at least one product.'; else if (q.belowMin) e.lines = 'Add a little more to reach the minimum order.';
    if (orderType === 'repeat' && freq === 'custom' && !days.length) e.days = 'Choose at least one delivery day.';
    if (!addr.trim()) e.addr = 'Enter your delivery address.'; else if (!picked) e.addr = 'Search and choose your address from the list.';
    return e;
  };
  const errors = submitted ? validate() : {};

  const sess = useRef(null);
  const search = async text => {
    text = (text || '').trim(); if (text.length < 3) { setStatus('short'); return; }
    const t = ++tok.current; setStatus('searching'); setSugs([]);
    let list = [];
    try {
      const places = await loadGoogle();
      if (places) {
        sess.current ||= new places.AutocompleteSessionToken();
        const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({ input: text, includedRegionCodes: ['ng'], sessionToken: sess.current });
        list = (suggestions || []).filter(s => s.placePrediction).slice(0, 5).map(s => ({ label: s.placePrediction.text.toString(), prediction: s.placePrediction }));
      }
    } catch { list = []; }
    try { if (!list.length) list = await osmSearch(text); } catch { if (t === tok.current) setStatus('error'); return; }
    if (t !== tok.current) return; setSugs(list); setStatus(list.length ? 'results' : 'none');
  };
  const pick = async g => {
    setPicked(g); setSugs([]); setAddr(g.label); setStatus('measuring'); setKm(null); setApprox(false);
    let pt = g.lat != null ? { lat: g.lat, lng: g.lng } : null;
    try { if (!pt && g.prediction) { const place = g.prediction.toPlace(); await place.fetchFields({ fields: ['location', 'formattedAddress'] }); pt = { lat: place.location.lat(), lng: place.location.lng() }; sess.current = null; } } catch {}
    if (!pt) { setStatus('distError'); return; }
    let d = null;
    if (GOOGLE_KEY) {
      try {
        const r = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': GOOGLE_KEY, 'X-Goog-FieldMask': 'routes.distanceMeters' }, body: JSON.stringify({ origin: { location: { latLng: { latitude: OFFICE.lat, longitude: OFFICE.lng } } }, destination: { location: { latLng: { latitude: pt.lat, longitude: pt.lng } } }, travelMode: 'DRIVE' }) });
        const j = await r.json(); if (j.routes?.[0]?.distanceMeters != null) d = j.routes[0].distanceMeters / 1000;
      } catch {}
    }
    if (d == null) { try { const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${OFFICE.lng},${OFFICE.lat};${pt.lng},${pt.lat}?overview=false`); const j = await r.json(); if (j.routes?.[0]) d = j.routes[0].distance / 1000; } catch {} }
    if (d != null) setKm(Math.round(d * 10) / 10); else { setKm(Math.round(hav(OFFICE, pt) * 1.3 * 10) / 10); setApprox(true); }
    setStatus('done');
  };

  const text = () => {
    const L = ['Megito Foods quote ' + (ref || ''), '', 'Name: ' + form.name, 'Company: ' + form.company + (form.type ? ' (' + form.type + ')' : '')];
    if (form.phone) L.push('Phone: ' + form.phone); if (form.email) L.push('Email: ' + form.email);
    L.push('Order: ' + orderLine, '', 'Products:');
    q.rows.forEach(r => L.push('- ' + r.p.name + (r.l.variation ? ' (' + r.l.variation + ')' : '') + (r.l.size ? ', ' + r.l.size : '') + ' x ' + r.l.qty + (r.unit != null ? ' @ ' + naira(r.unit) + ' = ' + naira(r.total) : ': price on request')));
    L.push('', 'Products subtotal: ' + naira(q.sub), 'Total weight: ' + fmtKg(q.kg) + (q.noKg ? ' (plus items to weigh)' : ''));
    L.push('Deliver to: ' + addr + (km != null ? ' (' + km + ' km' + (approx ? ', approx.' : '') + ')' : ''));
    L.push('Delivery estimate: ' + (q.delivery != null ? naira(q.delivery) : 'to be confirmed'), 'Total per delivery: ' + naira(q.total) + (q.por ? ' + items priced on request' : ''));
    if (q.perMonth) L.push('About ' + naira(q.total * q.perMonth) + ' per month (' + q.perMonth + ' deliveries)');
    if (form.message.trim()) L.push('', 'Notes: ' + form.message.trim());
    return L.join('\n');
  };

  const print = () => {
    const rows = q.rows.map(r => `<tr><td>${esc(r.p.name + (r.l.variation ? ' (' + r.l.variation + ')' : ''))}<br><small>${esc(r.l.size || '')}</small></td><td class="n">${r.l.qty}</td><td class="n">${r.unit != null ? naira(r.unit) : 'On request'}</td><td class="n">${r.total != null ? naira(r.total) : '-'}</td></tr>`).join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Megito Foods quote ${esc(ref)}</title><style>body{font-family:"Plus Jakarta Sans",system-ui,sans-serif;color:#222;margin:40px;font-size:13px}h1{font-size:22px;margin:0}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{text-align:left;padding:8px 6px;border-bottom:1px solid #ddd;vertical-align:top}th{font-size:11px;text-transform:uppercase;color:#6a6a6a}.n{text-align:right}.tot td{border:0;padding:4px 6px}.big td{font-size:16px;font-weight:700;border-top:2px solid #222;padding-top:10px}small{color:#6a6a6a}.meta{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;margin-top:20px}.top{display:flex;justify-content:space-between;border-bottom:2px solid #222;padding-bottom:16px}p{margin:4px 0}</style></head><body>
<div class="top"><div><h1>Megito Foods</h1><p>43 Diya Street, Ifako, Gbagada, Lagos</p><p>+234 802 300 4612 · ${EMAIL}</p></div><div style="text-align:right"><p><small>Quote reference</small></p><h1>${esc(ref)}</h1><p>${new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div></div>
<div class="meta"><p><small>For</small><br>${esc(form.name)}<br>${esc(form.company)}${form.type ? ' (' + esc(form.type) + ')' : ''}<br>${esc([form.phone, form.email].filter(Boolean).join(' · '))}</p><p><small>Order</small><br>${esc(orderLine)}<br><small>Deliver to</small><br>${esc(addr)}</p></div>
<table><thead><tr><th>Product</th><th class="n">Packs</th><th class="n">Price per pack</th><th class="n">Amount</th></tr></thead><tbody>${rows}</tbody></table>
<table class="tot"><tr><td>Products subtotal</td><td class="n">${naira(q.sub)}</td></tr><tr><td>Total weight</td><td class="n">${fmtKg(q.kg)}</td></tr><tr><td>Delivery estimate${km != null ? ' (' + km + ' km)' : ''}</td><td class="n">${q.delivery != null ? naira(q.delivery) : 'To be confirmed'}</td></tr><tr class="big"><td>Total per delivery</td><td class="n">${naira(q.total)}</td></tr>${q.perMonth ? `<tr><td colspan="2" class="n"><small>About ${naira(q.total * q.perMonth)} per month (${q.perMonth} deliveries)</small></td></tr>` : ''}</table>
${q.por ? '<p>Items priced on request will be confirmed by our team.</p>' : ''}<p><small>Delivery is an estimate based on driving distance and total weight, and will be confirmed before dispatch. This quote is not an invoice.</small></p></body></html>`;
    const fr = document.createElement('iframe'); fr.style.cssText = 'position:fixed;width:0;height:0;border:0'; document.body.appendChild(fr);
    fr.contentDocument.open(); fr.contentDocument.write(html); fr.contentDocument.close();
    setTimeout(() => { fr.contentWindow.focus(); fr.contentWindow.print(); setTimeout(() => fr.remove(), 1000); }, 300);
  };

  const submit = e => {
    e.preventDefault(); setSubmitted(true);
    if (Object.keys(validate()).length) { setRef(null); return; }
    const d = new Date();
    setTimeout(() => setRef('MF-' + String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()));
  };

  const setLine = (id, patch) => setLines(ls => ls.map(l => (l.id === id ? { ...l, ...patch } : l)));
  const visible = PRODUCTS.filter(p => showSnails || p.availability !== 'pending');
  const groups = CATS.filter(c => c.id !== 'all').map(c => ({ ...c, items: visible.filter(p => p.category === c.id).flatMap(p => (p.variations.length ? p.variations.map(v => v.name) : ['']).flatMap(v => (p.sizes.length ? p.sizes : [null]).map(z => ({ value: [p.id, v, z ? z.label : ''].join('|'), label: p.name + (v ? ' — ' + v : '') + (z ? ', ' + z.label + ' · ' + naira(z.price) : ' · price on request') })))) })).filter(g => g.items.length);
  const help = { searching: 'Searching…', measuring: 'Working out the distance…', none: 'No matching addresses. Try adding the area and city.', error: "Address search isn't available right now. Try again, or send us your address with the quote.", distError: "We couldn't work out the distance. We'll confirm delivery with you.", short: 'Type at least 3 characters.', results: 'Choose your address from the list.' }[status] || (GOOGLE_KEY ? 'Start typing and choose your address.' : 'Type your address and press Search.');
  const field = k => ({ value: form[k], onChange: e => setForm(f => ({ ...f, [k]: e.target.value })), 'aria-invalid': errors[k] ? 'true' : undefined, 'aria-describedby': errors[k] ? 'qe-' + k : undefined });

  return (
    <form className="qb" onSubmit={submit} noValidate aria-label="Build your quote">
      <div className="qb-main">
        <section className="qb-card" aria-labelledby="q-products">
          <h2 id="q-products" className="qb-h"><span className="qb-n">1</span>Products</h2>
          <div className="field">
            <label htmlFor="add-product">Add a product</label>
            <select id="add-product" value="" onChange={e => { const v = e.target.value; if (!v) return; const [pid, vr, sz] = v.split('|'); setLines(ls => addLineTo(ls, pid, vr, sz)); }}>
              <option value="">Choose a product and pack size</option>
              {groups.map(g => <optgroup key={g.id} label={g.label}>{g.items.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</optgroup>)}
            </select>
          </div>
          {!lines.length && <p className="qb-empty">No products yet. Choose one above, or press Enquire on any product.</p>}
          <ul className="qb-lines" aria-label="Products in your quote">
            {q.rows.map(({ l, p, unit, total }) => (
              <li key={l.id}>
                <div className="qb-line-top">
                  <div><strong>{p.name}{l.variation ? ' — ' + l.variation : ''}</strong><span className="muted">{unit != null ? (p.sizes.length > 1 ? naira(unit) + ' per pack' : l.size + ' · ' + naira(unit) + ' per pack') : (p.packSize ? p.packSize + ' · ' : '') + 'Price on request'}</span></div>
                  <strong>{total != null ? naira(total) : 'On request'}</strong>
                </div>
                <div className="qb-line-ctl">
                  {p.sizes.length > 1 && <select aria-label={'Pack size for ' + p.name} value={l.size} onChange={e => setLine(l.id, { size: e.target.value })}>{p.sizes.map(z => <option key={z.label} value={z.label}>{z.label} · {naira(z.price)}</option>)}</select>}
                  <div className="qb-step" role="group" aria-label={'Packs of ' + p.name}>
                    <button type="button" aria-label="Fewer packs" onClick={() => setLine(l.id, { qty: Math.max(1, l.qty - 1) })}><Icon name="minus" /></button>
                    <input type="number" inputMode="numeric" min="1" aria-label="Number of packs" value={l.qty} onChange={e => { const n = parseInt(e.target.value, 10); setLine(l.id, { qty: n > 0 ? Math.min(n, 9999) : 1 }); }} />
                    <button type="button" aria-label="More packs" onClick={() => setLine(l.id, { qty: l.qty + 1 })}><Icon name="plus" /></button>
                  </div>
                  <span className="muted">{l.qty === 1 ? 'pack' : 'packs'}</span>
                  <button type="button" className="link" style={{ marginLeft: 'auto' }} aria-label={'Remove ' + p.name} onClick={() => setLines(ls => ls.filter(x => x.id !== l.id))}>Remove</button>
                </div>
              </li>
            ))}
          </ul>
          {errors.lines && <span className="err">{errors.lines}</span>}
        </section>

        <section className="qb-card" aria-labelledby="q-type">
          <h2 id="q-type" className="qb-h"><span className="qb-n">2</span>Order type</h2>
          <div className="qb-types" role="radiogroup" aria-labelledby="q-type">
            {[['once', 'One-off order', 'A single delivery'], ['repeat', 'Repeat order', 'Regular deliveries']].map(([id, label, sub]) => (
              <button key={id} type="button" role="radio" aria-checked={orderType === id} className="qb-type" onClick={() => setOrderType(id)}><strong>{label}</strong><span className="muted">{sub}</span></button>
            ))}
          </div>
          {orderType === 'repeat' && (
            <>
              <span id="q-freq" className="qb-lab">How often?</span>
              <div className="vars" role="radiogroup" aria-labelledby="q-freq">{FREQS.map(([id, label]) => <button key={id} type="button" role="radio" className="chip" aria-checked={freq === id} onClick={() => setFreq(id)}>{label}</button>)}</div>
              {freq === 'custom' && (
                <>
                  <span id="q-days" className="qb-lab">Delivery days each week</span>
                  <div className="vars" role="group" aria-labelledby="q-days">{DAYS.map(d => <button key={d} type="button" role="checkbox" className="chip" style={{ minWidth: 56 }} aria-checked={days.includes(d)} onClick={() => setDays(ds => (ds.includes(d) ? ds.filter(x => x !== d) : ds.concat(d)))}>{d}</button>)}</div>
                  {errors.days && <span className="err">{errors.days}</span>}
                </>
              )}
            </>
          )}
        </section>

        <section className="qb-card" aria-labelledby="q-addr">
          <h2 id="q-addr" className="qb-h"><span className="qb-n">3</span>Delivery address</h2>
          <div className="field">
            <label htmlFor="addr">Where should we deliver?</label>
            <div className="qb-row">
              <input id="addr" type="text" autoComplete="street-address" placeholder="Street, area and city" value={addr} aria-invalid={errors.addr ? 'true' : undefined}
                onChange={e => { const v = e.target.value; setAddr(v); setPicked(null); setKm(null); setStatus(''); if (GOOGLE_KEY) { clearTimeout(deb.current); deb.current = setTimeout(() => search(v), 350); } }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); search(addr); } }} />
              <button type="button" className="btn btn-secondary" onClick={() => search(addr)}>Search</button>
            </div>
            <span aria-live="polite" className={['error', 'distError', 'none'].includes(status) ? 'err' : 'help'}>{help}</span>
          </div>
          {sugs.length > 0 && <ul className="qb-sugs" aria-label="Matching addresses">{sugs.map(g => <li key={g.label}><button type="button" onClick={() => pick(g)}><Icon name="map-pin" />{g.label}</button></li>)}</ul>}
          {picked && km != null && <div className="qb-picked"><Icon name="truck" size={20} /><div><strong>{approx ? 'About ' : ''}{km} km by road from our Gbagada office</strong><span>{picked.label}</span></div></div>}
          {errors.addr && <span className="err">{errors.addr}</span>}
        </section>

        <section className="qb-card" aria-labelledby="q-you">
          <h2 id="q-you" className="qb-h"><span className="qb-n">4</span>Your details</h2>
          <div className="two">
            {[['name', 'Your name', 'name', 'text'], ['company', 'Company', 'organization', 'text'], ['email', 'Email', 'email', 'email'], ['phone', 'Phone', 'tel', 'tel']].map(([k, label, ac, type]) => (
              <div className="field" key={k}><label htmlFor={'q-' + k}>{label}</label><input id={'q-' + k} type={type} autoComplete={ac} {...field(k)} />{errors[k] && <span className="err" id={'qe-' + k}>{errors[k]}</span>}</div>
            ))}
          </div>
          <div className="field"><label htmlFor="q-type-sel">Type of business</label><select id="q-type-sel" {...field('type')}><option value="" disabled>Choose one</option>{TYPES.map(t => <option key={t}>{t}</option>)}</select>{errors.type && <span className="err" id="qe-type">{errors.type}</span>}</div>
          <div className="field"><label htmlFor="q-msg">Notes <small>Optional</small></label><textarea id="q-msg" rows={3} {...field('message')} /></div>
        </section>
      </div>

      <aside className="qb-sum" aria-labelledby="q-sum">
        <div><h2 id="q-sum" style={{ fontSize: 22, fontWeight: 600 }}>Your quote</h2><span className="muted">{orderLine}</span></div>
        <dl>
          <div><dt>Products ({q.packs} {q.packs === 1 ? 'pack' : 'packs'})</dt><dd>{naira(q.sub)}</dd></div>
          <div><dt>Total weight</dt><dd>{fmtKg(q.kg)}{q.noKg ? ' +' : ''}</dd></div>
          <div><dt>Delivery estimate</dt><dd>{q.delivery != null ? naira(q.delivery) : lines.length ? 'Add your address' : '—'}</dd></div>
          {q.delivery != null && <small className="muted" style={{ textAlign: 'right', fontSize: 12 }}>{naira(RATES.baseFee)} + {km} km × {naira(RATES.perKm)} + {Math.round(q.kg * 100) / 100} kg × {naira(RATES.perKg)}</small>}
        </dl>
        <div className="qb-total"><div><strong>{orderType === 'repeat' ? 'Total per delivery' : 'Total'}</strong><span>{naira(q.total)}</span></div>{q.perMonth > 0 && q.total > 0 && <small>About {naira(q.total * q.perMonth)} per month ({q.perMonth} {q.perMonth === 1 ? 'delivery' : 'deliveries'})</small>}</div>
        {q.por > 0 && <p className="note">Plus {q.por} {q.por === 1 ? 'item' : 'items'} priced on request. We'll confirm {q.por === 1 ? 'it' : 'them'} with your quote.{q.noKg ? " Their weight isn't included in delivery yet." : ''}</p>}
        {q.belowMin && <p role="status" className="err">Minimum order is {naira(RATES.minOrder)} in products. Add {naira(q.short)} more.</p>}
        <button type="submit" className="btn btn-primary btn-block">Get my quote</button>
        {submitted && Object.keys(errors).length > 0 && <p role="alert" className="err">Please fix the highlighted parts of the form.</p>}
        <small className="muted" style={{ fontSize: 12 }}>Delivery is an estimate based on driving distance from our Gbagada office and total weight. We'll confirm it with you.</small>
        {ref && (
          <div role="status" className="qb-ready">
            <div><span className="muted">Quote reference</span><strong className="qb-ref">{ref}</strong></div>
            <span className="body" style={{ fontSize: 14 }}>Your quote is ready but hasn't been sent. Send it to us to confirm your order.</span>
            <a className="btn btn-primary btn-block" href={'https://wa.me/' + WA + '?text=' + encodeURIComponent(text())} target="_blank" rel="noopener noreferrer"><Icon name="message-circle" />Send on WhatsApp</a>
            <a className="btn btn-secondary btn-block" href={'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Quote ' + ref + (form.company ? ' from ' + form.company : '')) + '&body=' + encodeURIComponent(text())}><Icon name="mail" />Send by email</a>
            <button type="button" className="btn btn-secondary btn-block" onClick={print}><Icon name="download" />Download PDF</button>
          </div>
        )}
      </aside>
    </form>
  );
}
