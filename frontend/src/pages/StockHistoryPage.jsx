import { useState, useEffect, useCallback } from 'react';
import { stockApi, productsApi } from '../api/index.js';
import { exportStockHistory } from '../utils/csvExport.js';
import { useAuth } from '../context/AuthContext.jsx';

const TYPE = { add:{label:'Added',color:'#16a34a',bg:'#f0fdf4'}, purchase:{label:'Purchase',color:'#16a34a',bg:'#f0fdf4'}, return:{label:'Return',color:'#185FA5',bg:'#e6f1fb'}, remove:{label:'Removed',color:'#e24b4a',bg:'#fef2f2'}, sale:{label:'Sale',color:'#d97706',bg:'#fffbeb'}, damage:{label:'Damage',color:'#e24b4a',bg:'#fef2f2'}, set:{label:'Set',color:'#533AB7',bg:'#eeedfe'} };

const s = {
  toolbar: { display:'flex', gap:10, marginBottom:14, flexWrap:'wrap', alignItems:'center' },
  select:  { height:38, padding:'0 12px', fontSize:13, background:'var(--white)', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-md)', color:'var(--slate-700)', outline:'none' },
  btnPri:  { display:'flex', alignItems:'center', gap:6, height:38, padding:'0 16px', background:'var(--teal-600)', border:'none', borderRadius:'var(--radius-md)', color:'var(--white)', fontSize:13, fontWeight:500, cursor:'pointer' },
  btnSec:  { display:'flex', alignItems:'center', gap:6, height:38, padding:'0 14px', background:'transparent', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-md)', color:'var(--slate-600)', fontSize:13, cursor:'pointer' },
  tblWrap: { background:'var(--white)', borderRadius:'var(--radius-lg)', border:'1px solid var(--slate-200)', boxShadow:'var(--shadow-sm)', overflow:'hidden' },
  table:   { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th:      { padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:600, color:'var(--slate-500)', textTransform:'uppercase', letterSpacing:'.06em', background:'var(--slate-50)', borderBottom:'1px solid var(--slate-200)', whiteSpace:'nowrap' },
  td:      { padding:'11px 14px', borderBottom:'1px solid var(--slate-100)', verticalAlign:'middle' },
  tBadge:  t => ({ display:'inline-flex', alignItems:'center', padding:'2px 9px', borderRadius:20, fontSize:11, fontWeight:600, background:(TYPE[t]?.bg||'#f4f7fa'), color:(TYPE[t]?.color||'#6B8FA3') }),
  chg:     c => ({ fontFamily:'var(--mono)', fontSize:13, fontWeight:600, color:c>0?'#16a34a':c<0?'#e24b4a':'#533AB7' }),
  foot:    { padding:'10px 14px', display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--slate-500)', borderTop:'1px solid var(--slate-100)', background:'var(--slate-50)' },
  empty:   { padding:'48px 20px', textAlign:'center', color:'var(--slate-400)', fontSize:13 },
  backdrop:{ position:'fixed', inset:0, background:'rgba(15,25,35,.5)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
  modal:   { background:'var(--white)', borderRadius:'var(--radius-xl)', width:'100%', maxWidth:400, boxShadow:'var(--shadow-lg)' },
  mHead:   { padding:'18px 22px 14px', borderBottom:'1px solid var(--slate-100)', display:'flex', justifyContent:'space-between', alignItems:'center' },
  mClose:  { background:'none', border:'none', fontSize:20, color:'var(--slate-400)', cursor:'pointer' },
  mBody:   { padding:'18px 22px' },
  lbl:     { display:'block', fontSize:11, fontWeight:600, color:'var(--slate-500)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:5 },
  inp:     { width:'100%', height:37, padding:'0 11px', fontSize:13, background:'var(--white)', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-md)', color:'var(--slate-800)', outline:'none', marginBottom:14 },
  mFoot:   { padding:'14px 22px', borderTop:'1px solid var(--slate-100)', display:'flex', justifyContent:'flex-end', gap:8 },
  btnCan:  { height:36, padding:'0 14px', background:'transparent', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-md)', color:'var(--slate-600)', fontSize:13, cursor:'pointer' },
  btnSav:  { height:36, padding:'0 16px', background:'var(--teal-600)', border:'none', borderRadius:'var(--radius-md)', color:'var(--white)', fontSize:13, fontWeight:500, cursor:'pointer' },
  toast:   show => ({ position:'fixed', bottom:22, right:22, zIndex:200, padding:'11px 16px', borderRadius:'var(--radius-md)', fontSize:13, fontWeight:500, boxShadow:'var(--shadow-lg)', display:'flex', alignItems:'center', gap:8, background:'var(--slate-900)', color:'var(--white)', opacity:show?1:0, transform:show?'translateY(0)':'translateY(8px)', transition:'all .2s', pointerEvents:show?'auto':'none' }),
};

function AdjustModal({ products, onClose, onSaved }) {
  const [form, setForm] = useState({ product_id:'', type:'add', quantity_change:'', note:'' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const save = async () => {
    if (!form.product_id) { setErr('Select a product.'); return; }
    if (!form.quantity_change||isNaN(form.quantity_change)||Number(form.quantity_change)<=0) { setErr('Enter a valid quantity.'); return; }
    setSaving(true);
    try {
      const res = await stockApi.adjust({...form,quantity_change:Number(form.quantity_change)});
      onSaved(res.data); onClose();
    } catch (e) { setErr(e.response?.data?.error||'Failed.'); }
    finally { setSaving(false); }
  };

  return (
    <div style={s.backdrop} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={s.modal}>
        <div style={s.mHead}><div style={{fontSize:15,fontWeight:500}}>Adjust stock</div><button style={s.mClose} onClick={onClose}>×</button></div>
        <div style={s.mBody}>
          {err&&<div style={{fontSize:12,color:'var(--danger)',marginBottom:12,padding:'8px 12px',background:'var(--danger-bg)',borderRadius:6}}>{err}</div>}
          <label style={s.lbl}>Product *</label>
          <select style={{...s.inp,appearance:'auto'}} value={form.product_id} onChange={e=>set('product_id',e.target.value)}>
            <option value="">Select product…</option>
            {products.map(p=><option key={p.id} value={p.id}>{p.product_name} ({p.product_id}) — stock: {p.quantity}</option>)}
          </select>
          <label style={s.lbl}>Type *</label>
          <select style={{...s.inp,appearance:'auto'}} value={form.type} onChange={e=>set('type',e.target.value)}>
            <option value="add">Add stock</option>
            <option value="purchase">Purchase / received</option>
            <option value="return">Return from patient</option>
            <option value="sale">Sale / dispensed</option>
            <option value="remove">Remove stock</option>
            <option value="damage">Damage / write-off</option>
            <option value="set">Set exact quantity</option>
          </select>
          <label style={s.lbl}>Quantity *</label>
          <input type="number" min="1" style={s.inp} placeholder={form.type==='set'?'New total':'Units'} value={form.quantity_change} onChange={e=>set('quantity_change',e.target.value)}/>
          <label style={s.lbl}>Note (optional)</label>
          <input style={{...s.inp,marginBottom:0}} placeholder="Reason or reference…" value={form.note} onChange={e=>set('note',e.target.value)}/>
        </div>
        <div style={s.mFoot}>
          <button style={s.btnCan} onClick={onClose}>Cancel</button>
          <button style={{...s.btnSav,opacity:saving?.7:1}} onClick={save} disabled={saving}>{saving?'Saving…':'Apply'}</button>
        </div>
      </div>
    </div>
  );
}

export default function StockHistoryPage() {
  const { user } = useAuth();
  const canAdjust = ['admin','staff'].includes(user?.role);
  const [history,  setHistory]  = useState([]);
  const [products, setProducts] = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [filterP,  setFilterP]  = useState('');
  const [filterT,  setFilterT]  = useState('');
  const [showAdj,  setShowAdj]  = useState(false);
  const [toast,    setToast]    = useState({show:false,msg:''});

  const showToast = msg => { setToast({show:true,msg}); setTimeout(()=>setToast({show:false,msg:''}),2500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {}; if(filterP) params.product_id=filterP;
      const [hr,pr] = await Promise.all([stockApi.getHistory(params), productsApi.getAll()]);
      let rows = hr.data.adjustments||[];
      if (filterT) rows = rows.filter(r=>r.type===filterT);
      setHistory(rows); setTotal(hr.data.total);
      setProducts(pr.data.products||[]);
    } finally { setLoading(false); }
  }, [filterP,filterT]);

  useEffect(()=>{ load(); },[load]);

  const fmtDate = d => new Date(d).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});

  return (
    <>
      <div style={s.toolbar}>
        <select style={s.select} value={filterP} onChange={e=>setFilterP(e.target.value)}>
          <option value="">All products</option>
          {products.map(p=><option key={p.id} value={p.id}>{p.product_name}</option>)}
        </select>
        <select style={s.select} value={filterT} onChange={e=>setFilterT(e.target.value)}>
          <option value="">All types</option>
          {Object.entries(TYPE).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
        {canAdjust&&<button style={s.btnPri} onClick={()=>setShowAdj(true)}>+ Adjust stock</button>}
        <button style={s.btnSec} onClick={()=>exportStockHistory(history)}>↓ CSV</button>
      </div>

      <div style={s.tblWrap}>
        <table style={s.table}>
          <thead><tr>
            {['Date & time','Product','Type','Before','Change','After','Note','By'].map(h=>(
              <th key={h} style={s.th}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={8} style={{...s.td,textAlign:'center',padding:40,color:'var(--slate-400)'}}>Loading…</td></tr>
            : history.length===0 ? <tr><td colSpan={8}><div style={s.empty}>No stock adjustments yet.<br/>Use "Adjust stock" to record a movement.</div></td></tr>
            : history.map(row => {
                const change = row.quantity_after - row.quantity_before;
                return (
                  <tr key={row.id} style={{background:'var(--white)'}}>
                    <td style={{...s.td,fontSize:12,color:'var(--slate-500)',whiteSpace:'nowrap'}}>{fmtDate(row.created_at)}</td>
                    <td style={s.td}><div style={{fontWeight:500}}>{row.product_name}</div><div style={{fontSize:11,fontFamily:'var(--mono)',color:'var(--slate-400)'}}>{row.pid}</div></td>
                    <td style={s.td}><span style={s.tBadge(row.type)}>{TYPE[row.type]?.label||row.type}</span></td>
                    <td style={{...s.td,fontFamily:'var(--mono)'}}>{row.quantity_before}</td>
                    <td style={s.td}><span style={s.chg(change)}>{change>0?'+':''}{change}</span></td>
                    <td style={{...s.td,fontFamily:'var(--mono)',fontWeight:500}}>{row.quantity_after}</td>
                    <td style={{...s.td,fontSize:12,color:'var(--slate-500)',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{row.note||<span style={{color:'var(--slate-300)'}}>—</span>}</td>
                    <td style={{...s.td,fontSize:12,color:'var(--slate-500)'}}>{row.adjusted_by_name||'—'}</td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
        <div style={s.foot}>
          <span>{history.length} record{history.length!==1?'s':''}</span>
          <span>Total: {total}</span>
        </div>
      </div>

      {showAdj&&<AdjustModal products={products} onClose={()=>setShowAdj(false)} onSaved={()=>{load();showToast('Stock adjusted.');}}/>}
      <div style={s.toast(toast.show)}><span style={{color:'var(--teal-400)'}}>✓</span>{toast.msg}</div>
    </>
  );
}
