import React, { useEffect, useState } from 'react';
import { icons } from 'lucide-react';
import { PRODUCTS, CATS, naira } from './data/products.js';
import { RATES } from './QuoteBuilder.jsx';

const Icon = ({ name, size = 16 }) => { const C = icons[name.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join('')] || icons.Circle; return <C size={size} aria-hidden="true" />; };
const catLabel = id => (CATS.find(c => c.id === id) || {}).label || '';
const unitOf = (p, size) => { const z = p.sizes.find(x => x.label === size); return z ? z.price : null; };

function useEscape(onClose) {
  useEffect(() => { const k = e => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); const o = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { window.removeEventListener('keydown', k); document.body.style.overflow = o; }; }, [onClose]);
}

function Stepper({ qty, setQty }) {
  return (
    <div className="qb-step" role="group" aria-label="Number of packs">
      <button type="button" aria-label="Fewer packs" onClick={() => setQty(Math.max(1, qty - 1))}><Icon name="minus" /></button>
      <input type="number" inputMode="numeric" min="1" aria-label="Number of packs" value={qty} onChange={e => { const n = parseInt(e.target.value, 10); setQty(n > 0 ? Math.min(n, 9999) : 1); }} />
      <button type="button" aria-label="More packs" onClick={() => setQty(qty + 1)}><Icon name="plus" /></button>
    </div>
  );
}

export function ProductDetail({ p, onClose, onAdd }) {
  const [v, setV] = useState(p.variations[0]?.name || '');
  const [size, setSize] = useState(p.sizes[0]?.label || '');
  const [qty, setQty] = useState(1);
  useEscape(onClose);
  const unit = unitOf(p, size);
  return (
    <div className="overlay sheet" onClick={onClose}>
      <div className="pd" role="dialog" aria-modal="true" aria-labelledby="pd-title" onClick={e => e.stopPropagation()}>
        <button type="button" className="pd-close" aria-label="Close" onClick={onClose}><Icon name="x" size={18} /></button>
        {p.image
          ? <img className="pd-img" src={p.image} alt={p.alt} style={{ objectFit: p.fit || 'cover', objectPosition: p.imagePos || 'center', background: p.fit ? '#7499b8' : '#e6dfd6' }} />
          : <div className="pd-img placeholder" role="img" aria-label="Photo coming soon"><Icon name="image" size={24} />Photo coming soon</div>}
        <div className="pd-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingRight: 40 }}>
            <span className="muted">{catLabel(p.category)}</span>
            <h2 id="pd-title" style={{ fontSize: 22, fontWeight: 600 }}>{p.name}</h2>
            <p className="body" style={{ fontSize: 14 }}>{p.description}</p>
          </div>
          <span style={{ fontSize: 18, fontWeight: 700 }}>{unit != null ? naira(unit) + ' per pack' : (p.packSize ? p.packSize + ' · ' : '') + 'Price on request'}</span>
          {p.variations.length > 0 && (
            <div className="pd-group"><span id="pd-type" className="qb-lab">Type</span>
              <div className="vars" role="radiogroup" aria-labelledby="pd-type">{p.variations.map(x => <button key={x.id} type="button" role="radio" className="pd-opt pill" aria-checked={v === x.name} onClick={() => setV(x.name)}>{x.name}</button>)}</div>
            </div>
          )}
          {p.sizes.length > 1 && (
            <div className="pd-group"><span id="pd-size" className="qb-lab">Pack size</span>
              <div className="pd-sizes" role="radiogroup" aria-labelledby="pd-size">{p.sizes.map(z => <button key={z.label} type="button" role="radio" className="pd-opt" aria-checked={size === z.label} onClick={() => setSize(z.label)}><strong>{z.label}</strong><span className="muted">{naira(z.price)}</span></button>)}</div>
            </div>
          )}
          <div className="pd-group"><span className="qb-lab">Quantity</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Stepper qty={qty} setQty={setQty} />
              <span className="muted">{qty === 1 ? 'pack' : 'packs'}</span>
              {unit != null && <strong style={{ marginLeft: 'auto' }}>{naira(unit * qty)}</strong>}
            </div>
          </div>
          <button type="button" className="btn btn-primary btn-block" onClick={() => onAdd(p, v, size, qty)}><Icon name="shopping-bag" />Add to cart</button>
        </div>
      </div>
    </div>
  );
}

export function CartDrawer({ lines, setLines, onClose, onCheckout }) {
  useEscape(onClose);
  const rows = lines.map(l => { const p = PRODUCTS.find(x => x.id === l.pid); const unit = unitOf(p, l.size); return { l, p, unit }; });
  const sub = rows.reduce((t, r) => t + (r.unit != null ? r.unit * r.l.qty : 0), 0);
  const setQty = (id, qty) => setLines(ls => ls.map(x => (x.id === id ? { ...x, qty } : x)));
  return (
    <div className="overlay" onClick={onClose} style={{ justifyContent: 'flex-end' }}>
      <div className="cart" role="dialog" aria-modal="true" aria-labelledby="cart-title" onClick={e => e.stopPropagation()}>
        <div className="cart-head"><h2 id="cart-title" style={{ fontSize: 20, fontWeight: 600 }}>Your cart</h2><button type="button" className="icon-btn" aria-label="Close cart" onClick={onClose}><Icon name="x" size={18} /></button></div>
        <div className="cart-body">
          {!rows.length && <div className="cart-empty"><Icon name="shopping-bag" size={28} /><strong>Your cart is empty</strong><span className="muted">Open a product, choose a size and quantity, then add it here.</span></div>}
          <ul aria-label="Cart items" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {rows.map(({ l, p, unit }) => (
              <li key={l.id} className="cart-line">
                <div className="qb-line-top"><div><strong>{p.name}{l.variation ? ' — ' + l.variation : ''}</strong><span className="muted" style={{ fontSize: 13 }}>{(l.size ? l.size + ' · ' : '') + (unit != null ? naira(unit) + ' per pack' : 'Price on request')}</span></div><strong>{unit != null ? naira(unit * l.qty) : 'On request'}</strong></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Stepper qty={l.qty} setQty={q => setQty(l.id, q)} /><button type="button" className="link" style={{ marginLeft: 'auto' }} aria-label={'Remove ' + p.name} onClick={() => setLines(ls => ls.filter(x => x.id !== l.id))}>Remove</button></div>
              </li>
            ))}
          </ul>
        </div>
        <div className="cart-foot">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><strong>Subtotal</strong><span style={{ fontSize: 20, fontWeight: 700 }}>{naira(sub)}</span></div>
          <span className="muted" style={{ fontSize: 13 }}>Delivery is added when you build your quote.</span>
          {sub > 0 && sub < RATES.minOrder && <span className="err" style={{ fontSize: 13 }}>Minimum order is {naira(RATES.minOrder)} in products. Add {naira(RATES.minOrder - sub)} more.</span>}
          <button type="button" className="btn btn-primary btn-block" onClick={onCheckout}>Build your quote</button>
          <button type="button" className="link" style={{ alignSelf: 'center' }} onClick={onClose}>Continue shopping</button>
        </div>
      </div>
    </div>
  );
}
