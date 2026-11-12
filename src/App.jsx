import React, { useEffect, useMemo, useState } from 'react';
import { icons } from 'lucide-react';
import { PRODUCTS, CATS, naira } from './data/products.js';
import QuoteBuilder, { addLineTo } from './QuoteBuilder.jsx';
import { ProductDetail, CartDrawer } from './Cart.jsx';

const ADDRESS = '43 Diya Street, Ifako, Gbagada, Lagos, Nigeria';
const MAPS = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(ADDRESS);
const EMBED = 'https://maps.google.com/maps?q=' + encodeURIComponent(ADDRESS) + '&z=16&output=embed';
const PHONE = '+2348023004612', PHONE_LABEL = '+234 802 300 4612', EMAIL = 'megitofoods@yahoo.com';
const PAGES = [['home', 'Home'], ['products', 'Products'], ['supply', 'Business supply'], ['about', 'About'], ['contact', 'Contact']];
const FIELDS = ['name', 'company', 'email', 'phone', 'type', 'products', 'qty', 'area', 'message'];
const SHOW_SNAILS = false; // set true once snails are confirmed in the current range

function Icon({ name, size = 18 }) {
  const key = name.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join('');
  const C = icons[key] || icons.Circle;
  return <C size={size} strokeWidth={2} aria-hidden="true" />;
}
const catLabel = id => (CATS.find(c => c.id === id) || { label: 'Other' }).label;
const visible = PRODUCTS.filter(p => SHOW_SNAILS || p.availability !== 'pending');

const SECTORS = [
  { icon: 'hotel', label: 'Hotels', text: 'Seafood and poultry for restaurants, banquets and room service.' },
  { icon: 'shopping-cart', label: 'Supermarkets', text: 'Packed frozen products for your freezers.' },
  { icon: 'utensils-crossed', label: 'Restaurants', text: 'Fish, chicken, seafood and sausages for your kitchen.' },
  { icon: 'chef-hat', label: 'Caterers', text: 'Supply for events and contract catering.' }
];
const STANDARDS = [
  ['shield-check', 'Hygiene comes first', 'Our team wears hairnets, face masks, gloves and clean white coats whenever food is handled.'],
  ['sparkles', 'Clean preparation', 'Products are sorted and prepared on clean surfaces with clean utensils, so they arrive ready to use.'],
  ['package-check', 'Sealed and labelled', 'Every product is wrapped or heat-sealed in food-grade packs and clearly labelled before storage.'],
  ['snowflake', 'Kept frozen', 'Products are kept frozen until they leave us, so quality holds right up to your kitchen or shelves.']
];

function validate(f) {
  const e = {};
  if (!f.name.trim()) e.name = 'Enter your name.';
  if (!f.company.trim()) e.company = 'Enter your company or business name.';
  if (!f.email.trim()) e.email = 'Enter your email address.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = "That email doesn't look right. Check and try again.";
  if (!f.type) e.type = 'Choose your type of business.';
  if (!f.products.trim()) e.products = 'Select at least one product.';
  if (!f.area.trim()) e.area = 'Tell us where you need delivery.';
  return e;
}

function ProductImage({ p }) {
  if (!p.image) return <div className="placeholder" role="img" aria-label={'Photo of ' + p.name + ' coming soon'}><Icon name="image" size={24} />Photo coming soon</div>;
  return (
    <figure style={{ margin: 0 }}>
      <img className="photo" src={p.image} alt={p.alt} loading="lazy" width="640" height="480" style={{ objectPosition: p.imagePos || 'center', objectFit: p.fit || 'cover', background: p.fit ? '#7499b8' : undefined }} />
    </figure>
  );
}

function priceText(p, size) {
  if (!p.sizes.length) return '';
  if (p.sizes.length === 1) return naira(p.sizes[0].price) + ' · ' + p.sizes[0].label.toLowerCase();
  const s = p.sizes.find(z => z.label === size);
  return s ? naira(s.price) + ' · ' + s.label : 'From ' + naira(Math.min(...p.sizes.map(z => z.price)));
}

function ProductCard({ p, onOpen }) {
  return (
    <article className="card">
      <div onClick={() => onOpen(p)} style={{ cursor: 'pointer' }}><ProductImage p={p} /></div>
      <div className="info">
        <span className="muted">{catLabel(p.category)}</span>
        <h3>{p.name}</h3>
        <p className="body" style={{ fontSize: 14 }}>{p.description}</p>
        {p.sizes.length > 0 && <span style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{priceText(p)}</span>}
        {!p.sizes.length && p.packSize && <span style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{p.packSize}</span>}
      </div>
      <button type="button" className="btn btn-secondary btn-block" onClick={() => onOpen(p)}><Icon name="shopping-bag" />Add to cart</button>
    </article>
  );
}

function Field({ id, label, optional, error, help, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label} {optional && <small>Optional</small>}</label>
      {children}
      {error ? <span className="err" id={id + '-err'}>{error}</span> : help ? <span className="help">{help}</span> : null}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState(() => (PAGES.some(p => p[0] === location.hash.slice(1)) ? location.hash.slice(1) : 'home'));
  const [menu, setMenu] = useState(false);
  const [cat, setCat] = useState('all');
  const [query, setQuery] = useState('');
  const [vars, setVars] = useState({});
  const [sizes, setSizes] = useState({});
  const [form, setForm] = useState(Object.fromEntries(FIELDS.map(f => [f, ''])));
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = { home: 'Megito Foods — Frozen food supply for Nigerian businesses', products: 'Products — Megito Foods', supply: 'Business supply — Megito Foods', about: 'About — Megito Foods', contact: 'Request a quote — Megito Foods' };
    document.title = t[page];
    const onHash = () => { const h = location.hash.slice(1); if (PAGES.some(p => p[0] === h)) setPage(h); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [page]);

  const go = (p) => { setPage(p); setMenu(false); history.replaceState(null, '', '#' + p); window.scrollTo(0, 0); };
  const splitP = s => (s ? s.split('; ') : []);
  const [lines, setLines] = useState([]);
  const [detail, setDetail] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState('');
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 4000); return () => clearTimeout(t); }, [toast]);
  const addToCart = (p, v, size, qty) => { setLines(ls => { let out = ls; for (let i = 0; i < qty; i++) out = addLineTo(out, p.id, v || '', size || ''); return out; }); setDetail(null); setToast(qty + ' × ' + p.name + ' added to your cart'); };
  const setVariation = (id, v) => setVars(s => ({ ...s, [id]: v }));
  const update = k => e => { const f = { ...form, [k]: e.target.value }; setForm(f); setReady(false); if (submitted) setErrors(validate(f)); };
  const submit = e => { e.preventDefault(); const er = validate(form); setSubmitted(true); setErrors(er); setReady(Object.keys(er).length === 0); };

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visible.filter(p => (cat === 'all' || p.category === cat) && (!q || [p.name, p.description, catLabel(p.category), ...p.variations.map(v => v.name)].join(' ').toLowerCase().includes(q)));
  }, [cat, query]);
  const featured = visible.filter(p => p.image && p.sizes.length).slice(0, 8);
  const f = form;
  const mailto = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Quote request' + (f.company ? ' from ' + f.company : '')) + '&body=' + encodeURIComponent(`Name: ${f.name}\nCompany: ${f.company}\nEmail: ${f.email}\nPhone: ${f.phone}\nBusiness type: ${f.type}\nProducts: ${f.products}\nQuantities: ${f.qty}\nDelivery area: ${f.area}\n\n${f.message}`);
  const inv = k => (errors[k] ? { 'aria-invalid': 'true', 'aria-describedby': k + '-err' } : {});
  const card = p => <ProductCard key={p.id} p={p} onOpen={setDetail} />;
  const packs = lines.reduce((t, l) => t + l.qty, 0);

  return (
    <>
      <header className="top">
        <div className="wrap top-row">
          <button className="brand" onClick={() => go('home')} aria-label="Megito Foods home"><img src="/assets/logo-mf.png" alt="" /><span>Megito foods</span></button>
          <nav className="nav" aria-label="Main">
            {PAGES.map(([id, label]) => <button key={id} aria-current={page === id ? 'page' : undefined} onClick={() => go(id)}>{label}</button>)}
          </nav>
          <button className="btn btn-primary desk-cta" onClick={() => go('contact')}>Request a quote</button>
          <button className="cart-btn" aria-label={'Cart, ' + packs + (packs === 1 ? ' item' : ' items')} onClick={() => { setCartOpen(true); setToast(''); setMenu(false); }}><Icon name="shopping-bag" size={18} /><span>Cart</span>{packs > 0 && <span className="cart-count" aria-hidden="true">{packs}</span>}</button>
          <button className="menu-btn" aria-expanded={menu} aria-controls="mobile-menu" onClick={() => setMenu(m => !m)}><Icon name={menu ? 'x' : 'menu'} />Menu</button>
        </div>
        {menu && (
          <nav id="mobile-menu" className="mobile-menu" aria-label="Mobile">
            {PAGES.map(([id, label]) => <button key={id} className="item" aria-current={page === id ? 'page' : undefined} style={{ fontWeight: page === id ? 600 : 500 }} onClick={() => go(id)}>{label}</button>)}
            <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={() => go('contact')}>Request a quote</button>
          </nav>
        )}
      </header>

      <main>
        {page === 'home' && (
          <>
            <section className="wrap" style={{ paddingTop: 32 }}>
              <div className="hero">
                <img src="/assets/hero-crab-lobster.jpg" alt="Crabs, jumbo prawns and a lobster on crushed ice" />
                <div className="hero-card">
                  <h1 className="h1">Frozen food supply for Nigerian businesses</h1>
                  <p className="body">Seafood, fish, chicken, gizzard and sausages for hotels, supermarkets, restaurants and caterers.</p>
                  <form className="search" role="search" onSubmit={e => { e.preventDefault(); setCat('all'); go('products'); }}>
                    <input type="search" aria-label="Search products" placeholder="Search fish, chicken, crab" value={query} onChange={e => setQuery(e.target.value)} />
                    <button className="orb" type="submit" aria-label="Search products"><Icon name="search" /></button>
                  </form>
                  <div style={{ display: 'flex', gap: '8px 20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button className="link" onClick={() => go('products')}>Explore products</button>
                    <button className="link" onClick={() => go('contact')}>Request a quote</button>
                  </div>
                </div>
              </div>
              <div className="chips" role="group" aria-label="Browse by category" style={{ marginTop: 20 }}>
                {CATS.filter(c => c.id !== 'all').map(c => <button key={c.id} className="chip" onClick={() => { setCat(c.id); setQuery(''); go('products'); }}><Icon name={c.icon} />{c.label}</button>)}
              </div>
            </section>

            <section className="wrap band">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
                <h2 className="h2">Explore our range</h2>
                <button className="link" onClick={() => go('products')}>See all products</button>
              </div>
              <div className="grid" style={{ '--min': '220px' }}>{featured.map(card)}</div>
            </section>

            <section style={{ marginTop: 64, background: 'var(--fill)' }}>
              <div className="wrap split" style={{ padding: 'clamp(40px,7vw,64px) 24px' }}>
                <img className="photo" src="/assets/delivery.jpg" alt="Megito Foods staff weighing frozen fish at a delivery truck" loading="lazy" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
                  <h2 className="h2">Supply for your business</h2>
                  <p className="body">Tell us the products, quantities and how often you order. We'll confirm availability and delivery.</p>
                  <button className="btn btn-primary" onClick={() => go('supply')}>Business supply</button>
                </div>
              </div>
            </section>

            <section className="wrap band">
              <h2 className="h2" style={{ marginBottom: 24 }}>Who we supply</h2>
              <div className="grid" style={{ '--min': '220px', gap: 16 }}>
                {SECTORS.map(s => <div key={s.label} className="tile"><Icon name={s.icon} size={24} /><strong>{s.label}</strong><span className="muted">{s.text}</span></div>)}
              </div>
            </section>
          </>
        )}

        {page === 'products' && (
          <section className="wrap" style={{ paddingTop: 32 }}>
            <h1 className="h2" style={{ marginBottom: 8 }}>Products</h1>
            <p className="body" style={{ marginBottom: 20, maxWidth: 640 }}>Browse our frozen range. Pick a size to see its price, then send an enquiry.</p>
            <form className="search" role="search" onSubmit={e => e.preventDefault()} style={{ maxWidth: 520, marginBottom: 16 }}>
              <input type="search" aria-label="Search products" placeholder="Search products" value={query} onChange={e => setQuery(e.target.value)} />
              <span className="orb" aria-hidden="true"><Icon name="search" /></span>
            </form>
            <div className="chips" role="group" aria-label="Filter by category" style={{ marginBottom: 16 }}>
              {CATS.map(c => <button key={c.id} className="chip" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>{c.label}</button>)}
            </div>
            <p className="muted" aria-live="polite" style={{ marginBottom: 16 }}>{list.length === 1 ? '1 product' : list.length + ' products'}</p>
            {list.length ? <div className="grid" style={{ '--min': '250px', rowGap: 32 }}>{list.map(card)}</div> : (
              <div style={{ padding: '48px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                <strong>No products match that search</strong>
                <span className="muted">Try another word, or tell us what you need and we'll let you know if we can supply it.</span>
                <button className="link" onClick={() => { setQuery(''); setCat('all'); }}>Clear search</button>
              </div>
            )}
          </section>
        )}

        {page === 'supply' && (
          <section className="wrap narrow" style={{ paddingTop: 32 }}>
            <div className="split" style={{ alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h1 className="h2">Business supply</h1>
                <p className="body">We work with hotels, supermarkets, restaurants and caterers in Lagos, supplying frozen fish, seafood, chicken, gizzard and sausages. Every business buys differently, so we start with a conversation about what you need.</p>
                <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 8 }}>To help us prepare a quote, tell us</h2>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', borderTop: '1px solid var(--line-soft)' }}>
                  {[['Products', 'which items and types you need'], ['Quantities', 'how much per order'], ['Frequency', 'how often you order'], ['Delivery location', 'where in Lagos']].map(([t, d]) => (
                    <li key={t} style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--line-soft)' }}><Icon name="check" /><span><strong>{t}</strong> <span className="muted">{d}</span></span></li>
                  ))}
                </ul>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={() => go('contact')}>Request a quote</button>
                  <button className="btn btn-secondary" onClick={() => go('products')}>Explore products</button>
                </div>
              </div>
              <img className="photo" src="/assets/delivery.jpg" alt="Megito Foods staff checking the weight of a frozen fish at a delivery truck" />
            </div>
          </section>
        )}

        {page === 'about' && (
          <section className="wrap narrow" style={{ paddingTop: 32 }}>
            <div className="split">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h1 className="h2">About Megito Foods</h1>
                <p className="body">Megito Foods is a frozen food company based in Lagos, Nigeria. We supply frozen fish, seafood, chicken, gizzard and sausages to businesses that cook, serve and sell food.</p>
                <p className="body">Our team handles, sorts and packs products by hand so they arrive ready for your kitchen or shelves. We take time to understand what each customer needs, then talk through products, quantities and pack sizes before anything is agreed.</p>
              </div>
              <img className="photo" src="/assets/team-sorting.jpg" alt="Two Megito Foods team members in hairnets and gloves sorting peeled shrimps" />
            </div>
            <div className="grid" style={{ '--min': '260px', marginTop: 48 }}>
              <img className="photo" src="/assets/team-processing.jpg" alt="Team members peeling prawns at a preparation table" loading="lazy" />
              <img className="photo" src="/assets/sealing.jpg" alt="A team member packing shrimps beside a bag sealer" loading="lazy" style={{ objectPosition: 'center 30%' }} />
              <img className="photo" src="/assets/cold-room.jpg" alt="A team member stacking packed sacks in a cold room" loading="lazy" />
            </div>
            <div className="panel" style={{ marginTop: 64 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 680 }}>
                <h2 className="h2">Cleanliness and standards</h2>
                <p className="body">Frozen food is only as good as the way it's handled. We keep our preparation area clean and follow careful hygiene habits at every step, from sorting to packing to storage.</p>
              </div>
              <div className="grid" style={{ '--min': '220px', gap: 16 }}>
                {STANDARDS.map(([i, t, d]) => <div key={t} className="tile soft"><Icon name={i} size={24} /><h3 style={{ fontSize: 16, fontWeight: 600 }}>{t}</h3><p className="body" style={{ fontSize: 14 }}>{d}</p></div>)}
              </div>
            </div>
          </section>
        )}

        {page === 'contact' && (
          <>
            <section className="wrap" style={{ paddingTop: 32 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 680, marginBottom: 32 }}>
                <h1 className="h2">Build your quote</h1>
                <p className="body">Add products and the number of packs you need, choose a one-off or repeat order, and we'll add it up with an estimated delivery charge.</p>
              </div>
              <QuoteBuilder lines={lines} setLines={setLines} showSnails={SHOW_SNAILS} />
            </section>
            <section className="wrap band" aria-labelledby="talk">
              <h2 id="talk" style={{ fontSize: 22, fontWeight: 600, marginBottom: 16 }}>Prefer to talk to us?</h2>
              <div style={{ maxWidth: 720 }}>
                <dl className="facts">
                  <div><dt>Address</dt><dd>{ADDRESS}</dd></div>
                  <div><dt>Phone</dt><dd><a href={'tel:' + PHONE}>{PHONE_LABEL}</a></dd></div>
                  <div><dt>Email</dt><dd><a href={'mailto:' + EMAIL}>{EMAIL}</a></dd></div>
                  <div><dt>Orders</dt><dd>Mrs Margaret Udoh<br /><span className="muted">Orders, key accounts and WhatsApp orders</span><br /><a href="https://wa.me/2348037898104">WhatsApp +234 803 789 8104</a></dd></div>
                  <div><dt>Hours</dt><dd>Orders and deliveries 7 days a week</dd></div>
                  <div><dt>Company</dt><dd>Startup (Nigeria) Limited, trading as Megito Foods<br /><span className="muted">RC 152536</span></dd></div>
                </dl>
              </div>
            </section>
          </>
        )}

        {(page === 'home' || page === 'contact') && (
          <section className="wrap band" aria-labelledby="find-us">
            <div className="split" style={{ gap: 24, alignItems: 'stretch' }}>
              <div className="tile" style={{ justifyContent: 'center', alignItems: 'flex-start', gap: 16 }}>
                <h2 id="find-us" className="h2">Find us</h2>
                <address style={{ fontStyle: 'normal' }}>43 Diya Street, Ifako<br />Gbagada, Lagos<br />Nigeria</address>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}><a href={'tel:' + PHONE}>{PHONE_LABEL}</a><a href={'mailto:' + EMAIL}>{EMAIL}</a></div>
                <a className="btn btn-secondary" href={MAPS} target="_blank" rel="noopener noreferrer"><Icon name="navigation" />Get directions</a>
              </div>
              <iframe className="map" title="Map showing 43 Diya Street, Ifako, Gbagada, Lagos" src={EMBED} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
          </section>
        )}

        <section className="wrap band">
          <div className="cta">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 520 }}>
              <span style={{ fontSize: 22, fontWeight: 600 }}>Planning your next order?</span>
              <span style={{ color: '#ebebeb' }}>Tell us the products, quantities and delivery area, and we'll confirm your order.</span>
            </div>
            <button className="btn btn-primary" onClick={() => go('contact')}>Request a quote</button>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <img src="/assets/logo-mf.png" alt="" style={{ height: 32 }} />
            <strong style={{ fontWeight: 800 }}>Megito foods</strong>
            <span className="muted">· {ADDRESS}</span>
          </div>
          <nav aria-label="Footer">
            {PAGES.map(([id, label]) => <button key={id} onClick={() => go(id)}>{label}</button>)}
            <a href={'mailto:' + EMAIL} style={{ fontSize: 14, alignSelf: 'center' }}>{EMAIL}</a>
          </nav>
        </div>
      </footer>
      {detail && <ProductDetail p={detail} onClose={() => setDetail(null)} onAdd={addToCart} />}
      {cartOpen && <CartDrawer lines={lines} setLines={setLines} onClose={() => setCartOpen(false)} onCheckout={() => { setCartOpen(false); go('contact'); }} />}
      {toast && <div className="toast" role="status"><Icon name="check" /><span>{toast}</span><button type="button" onClick={() => { setCartOpen(true); setToast(''); }}>View cart</button></div>}
    </>
  );
}
