import { useState, useEffect, useCallback } from 'react';
import { productsApi, categoriesApi } from '../api/index.js';
import { exportProducts } from '../utils/csvExport.js';
import { useAuth } from '../context/AuthContext.jsx';

const fmt = n => '₹' + Number(n||0).toLocaleString('en-IN');
const qStatus = q => q===0?'out':q<=5?'low':'ok';
const EMPTY = { product_name:'', product_id:'', product_cost:'', quantity:'', category:'', description:'' };

const s = {
  statsGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 },
  statCard:  { background:'var(--white)', borderRadius:'var(--radius-lg)', padding:'14px 18px', border:'1px solid var(--slate-200)', boxShadow:'var(--shadow-sm)' },
  statLbl:   { fontSize:11, fontWeight:500, color:'var(--slate-500)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:5 },
  statVal:   { fontSize:22, fontWeight:500 },
  toolbar:   { display:'flex', gap:10, marginBottom:14, alignItems:'center', flexWrap:'wrap' },
  searchW:   { flex:1, minWidth:200, position:'relative' },
  searchI:   { position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--slate-400)', fontSize:15, pointerEvents:'none' },
  search:    { width:'100%', height:38, paddingLeft:34, paddingRight:12, fontSize:13, background:'var(--white)', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-md)', color:'var(--slate-800)', outline:'none' },
  select:    { height:38, padding:'0 12px', fontSize:13, background:'var(--white)', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-md)', color:'var(--slate-700)', outline:'none' },
  btnPri:    { display:'flex', alignItems:'center', gap:6, height:38, padding:'0 16px', background:'var(--teal-600)', border:'none', borderRadius:'var(--radius-md)', color:'var(--white)', fontSize:13, fontWeight:500, cursor:'pointer', whiteSpace:'nowrap' },
  btnSec:    { display:'flex', alignItems:'center', gap:6, height:38, padding:'0 14px', background:'transparent', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-md)', color:'var(--slate-600)', fontSize:13, cursor:'pointer', whiteSpace:'nowrap' },
  tblWrap:   { background:'var(--white)', borderRadius:'var(--radius-lg)', border:'1px solid var(--slate-200)', boxShadow:'var(--shadow-sm)', overflow:'hidden' },
  table:     { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th:        { padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:600, color:'var(--slate-500)', textTransform:'uppercase', letterSpacing:'.06em', background:'var(--slate-50)', borderBottom:'1px solid var(--slate-200)', whiteSpace:'nowrap', cursor:'pointer', userSelect:'none' },
  td:        { padding:'12px 14px', borderBottom:'1px solid var(--slate-100)', color:'var(--slate-800)', verticalAlign:'middle' },
  qBadge:    st => ({ display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'2px 10px', borderRadius:20, fontSize:12, fontWeight:500, minWidth:40, background:st==='out'?'var(--danger-bg)':st==='low'?'var(--warning-bg)':'var(--success-bg)', color:st==='out'?'var(--danger)':st==='low'?'var(--warning)':'var(--success)' }),
  pidBadge:  { fontFamily:'var(--mono)', fontSize:11, padding:'2px 7px', background:'var(--slate-100)', borderRadius:'var(--radius-sm)', color:'var(--slate-600)' },
  catBadge:  { fontSize:11, padding:'2px 8px', borderRadius:20, background:'var(--teal-50)', color:'var(--teal-700)', fontWeight:500 },
  actBtn:    { background:'transparent', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-sm)', padding:'4px 10px', fontSize:12, color:'var(--slate-600)', cursor:'pointer' },
  delBtn:    { background:'transparent', border:'1px solid rgba(226,75,74,.3)', borderRadius:'var(--radius-sm)', padding:'4px 10px', fontSize:12, color:'var(--danger)', cursor:'pointer' },
  foot:      { padding:'10px 14px', display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--slate-500)', borderTop:'1px solid var(--slate-100)', background:'var(--slate-50)' },
  empty:     { padding:'48px 20px', textAlign:'center', color:'var(--slate-400)' },
  backdrop:  { position:'fixed', inset:0, background:'rgba(15,25,35,.5)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
  modal:     { background:'var(--white)', borderRadius:'var(--radius-xl)', width:'100%', maxWidth:460, boxShadow:'var(--shadow-lg)', overflow:'hidden' },
  mHead:     { padding:'18px 22px 14px', borderBottom:'1px solid var(--slate-100)', display:'flex', justifyContent:'space-between', alignItems:'center' },
  mTitle:    { fontSize:15, fontWeight:500, color:'var(--slate-900)' },
  mClose:    { background:'none', border:'none', fontSize:20, color:'var(--slate-400)', cursor:'pointer' },
  mBody:     { padding:'18px 22px' },
  formGrid:  { display:'grid', gridTemplateColumns:'1fr 1fr', gap:13 },
  formFull:  { gridColumn:'1/-1' },
  fLabel:    { display:'block', fontSize:11, fontWeight:600, color:'var(--slate-500)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:5 },
  fInput:    err => ({ width:'100%', height:37, padding:'0 11px', fontSize:13, background:'var(--white)', border:`1px solid ${err?'var(--danger)':'var(--slate-200)'}`, borderRadius:'var(--radius-md)', color:'var(--slate-800)', outline:'none' }),
  fSelect:   { width:'100%', height:37, padding:'0 11px', fontSize:13, background:'var(--white)', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-md)', color:'var(--slate-800)', outline:'none' },
  fHint:     { fontSize:11, color:'var(--slate-400)', marginTop:3 },
  mFoot:     { padding:'14px 22px', borderBottom:'none', borderTop:'1px solid var(--slate-100)', display:'flex', justifyContent:'flex-end', gap:8 },
  btnCancel: { height:36, padding:'0 14px', background:'transparent', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-md)', color:'var(--slate-600)', fontSize:13, cursor:'pointer' },
  btnSave:   { height:36, padding:'0 18px', background:'var(--teal-600)', border:'none', borderRadius:'var(--radius-md)', color:'var(--white)', fontSize:13, fontWeight:500, cursor:'pointer' },
  btnDanger: { height:36, padding:'0 16px', background:'var(--danger)', border:'none', borderRadius:'var(--radius-md)', color:'var(--white)', fontSize:13, fontWeight:500, cursor:'pointer' },
  toast:     show => ({ position:'fixed', bottom:22, right:22, zIndex:200, padding:'11px 16px', borderRadius:'var(--radius-md)', fontSize:13, fontWeight:500, boxShadow:'var(--shadow-lg)', display:'flex', alignItems:'center', gap:8, background:'var(--slate-900)', color:'var(--white)', opacity:show?1:0, transform:show?'translateY(0)':'translateY(8px)', transition:'all .2s', pointerEvents:show?'auto':'none' }),
  delModal:  { background:'var(--white)', borderRadius:'var(--radius-lg)', width:'100%', maxWidth:340, padding:22, boxShadow:'var(--shadow-lg)' },
};

function ProductModal({ product, categories, onClose, onSaved }) {
  const [form, setForm] = useState(product ? { product_name:product.product_name, product_id:product.product_id, product_cost:product.product_cost, quantity:product.quantity, category:product.category||'', description:product.description||'' } : EMPTY);
  const [errs, setErrs] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setErrs(e=>({...e,[k]:''})); };

  const validate = () => {
    const e = {};
    if (!form.product_name.trim()) e.product_name='Required';
    if (!form.product_id.trim())   e.product_id='Required';
    if (form.product_cost===''||isNaN(form.product_cost)||Number(form.product_cost)<0) e.product_cost='Invalid';
    if (form.quantity===''||isNaN(form.quantity)||Number(form.quantity)<0) e.quantity='Invalid';
    setErrs(e); return !Object.keys(e).length;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {...form, product_cost:Number(form.product_cost), quantity:Number(form.quantity)};
      const res = product ? await productsApi.update(product.id, payload) : await productsApi.create(payload);
      onSaved(res.data, !product); onClose();
    } catch (err) { setErrs({_: err.response?.data?.error||'Save failed.'}); }
    finally { setSaving(false); }
  };

  return (
    <div style={s.backdrop} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={s.modal}>
        <div style={s.mHead}><div style={s.mTitle}>{product?'Edit product':'Add product'}</div><button style={s.mClose} onClick={onClose}>×</button></div>
        <div style={s.mBody}>
          {errs._&&<div style={{fontSize:12,color:'var(--danger)',marginBottom:12,padding:'8px 12px',background:'var(--danger-bg)',borderRadius:6}}>{errs._}</div>}
          <div style={s.formGrid}>
            <div style={s.formFull}><label style={s.fLabel}>Product name *</label><input style={s.fInput(errs.product_name)} value={form.product_name} onChange={e=>set('product_name',e.target.value)} placeholder="e.g. Below-Knee Prosthetic"/>{errs.product_name&&<div style={{...s.fHint,color:'var(--danger)'}}>{errs.product_name}</div>}</div>
            <div><label style={s.fLabel}>Product ID *</label><input style={s.fInput(errs.product_id)} value={form.product_id} onChange={e=>set('product_id',e.target.value)} placeholder="CV-PRO-001"/><div style={s.fHint}>Unique code</div></div>
            <div><label style={s.fLabel}>Category</label><select style={s.fSelect} value={form.category} onChange={e=>set('category',e.target.value)}><option value="">Select…</option>{categories.map(c=><option key={c.id||c} value={c.name||c}>{c.name||c}</option>)}</select></div>
            <div><label style={s.fLabel}>Unit cost (₹) *</label><input type="number" min="0" step="0.01" style={s.fInput(errs.product_cost)} value={form.product_cost} onChange={e=>set('product_cost',e.target.value)} placeholder="0.00"/></div>
            <div><label style={s.fLabel}>Quantity *</label><input type="number" min="0" style={s.fInput(errs.quantity)} value={form.quantity} onChange={e=>set('quantity',e.target.value)} placeholder="0"/></div>
            <div style={s.formFull}><label style={s.fLabel}>Description</label><input style={s.fInput(false)} value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Optional notes"/></div>
          </div>
        </div>
        <div style={s.mFoot}>
          <button style={s.btnCancel} onClick={onClose}>Cancel</button>
          <button style={{...s.btnSave,opacity:saving?.7:1}} onClick={save} disabled={saving}>{saving?'Saving…':product?'Save changes':'Add product'}</button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ product, onClose, onConfirm }) {
  const [del, setDel] = useState(false);
  const go = async () => { setDel(true); await onConfirm(product.id); setDel(false); onClose(); };
  return (
    <div style={s.backdrop} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={s.delModal}>
        <div style={{fontSize:15,fontWeight:500,marginBottom:8}}>Delete product?</div>
        <div style={{fontSize:13,color:'var(--slate-500)',marginBottom:18,lineHeight:1.5}}><strong>{product.product_name}</strong> ({product.product_id}) will be removed permanently.</div>
        <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
          <button style={s.btnCancel} onClick={onClose}>Cancel</button>
          <button style={{...s.btnDanger,opacity:del?.7:1}} onClick={go} disabled={del}>{del?'Deleting…':'Delete'}</button>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const { user } = useAuth();
  const canEdit   = ['admin','staff'].includes(user?.role);
  const canDelete = user?.role === 'admin';

  const [products,  setProducts]  = useState([]);
  const [stats,     setStats]     = useState(null);
  const [categories,setCategories]= useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [sortKey,   setSortKey]   = useState('serial_no');
  const [sortAsc,   setSortAsc]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProd,  setEditProd]  = useState(null);
  const [delProd,   setDelProd]   = useState(null);
  const [hovered,   setHovered]   = useState(null);
  const [toast,     setToast]     = useState({show:false,msg:''});

  const showToast = msg => { setToast({show:true,msg}); setTimeout(()=>setToast({show:false,msg:''}),2500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pr,sr,cr] = await Promise.all([productsApi.getAll({search,category:catFilter}), productsApi.getStats(), categoriesApi.getAll()]);
      setProducts(pr.data.products||[]); setStats(sr.data); setCategories(cr.data||[]);
    } finally { setLoading(false); }
  }, [search,catFilter]);

  useEffect(()=>{ load(); },[load]);

  const sort = key => { if(sortKey===key) setSortAsc(a=>!a); else{ setSortKey(key); setSortAsc(true); } };
  const sorted = [...products].sort((a,b) => {
    const av=a[sortKey], bv=b[sortKey];
    return (typeof av==='string'?av.localeCompare(bv):av-bv)*(sortAsc?1:-1);
  });

  const handleSaved = (data,isNew) => {
    setProducts(prev => isNew ? [...prev,data] : prev.map(p=>p.id===data.id?data:p));
    showToast(isNew?`${data.product_name} added.`:`${data.product_name} updated.`);
    load();
  };
  const handleDelete = async id => {
    await productsApi.delete(id);
    setProducts(prev=>prev.filter(p=>p.id!==id));
    showToast('Product deleted.'); load();
  };

  const si = k => sortKey===k?(sortAsc?' ↑':' ↓'):'';

  return (
    <>
      <div style={s.statsGrid}>
        {[['Total products',stats?.total_products??'—','var(--slate-900)'],['Stock value',fmt(stats?.total_value),'#239b8b'],['Low stock',stats?.low_stock??'—','var(--warning)'],['Out of stock',stats?.out_of_stock??'—','var(--danger)']].map(([l,v,c])=>(
          <div key={l} style={s.statCard}><div style={s.statLbl}>{l}</div><div style={{...s.statVal,color:c}}>{v}</div></div>
        ))}
      </div>

      <div style={s.toolbar}>
        <div style={s.searchW}>
          <span style={s.searchI}>🔍</span>
          <input style={s.search} placeholder="Search by name or product ID…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select style={s.select} value={catFilter} onChange={e=>setCatFilter(e.target.value)}>
          <option value="">All categories</option>
          {categories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        {canEdit && <button style={s.btnPri} onClick={()=>{setEditProd(null);setShowModal(true);}}>+ Add product</button>}
        <button style={s.btnSec} onClick={()=>exportProducts(sorted)}>↓ CSV</button>
      </div>

      <div style={s.tblWrap}>
        <table style={s.table}>
          <thead><tr>
            {[['serial_no','S.No'],['product_name','Product name'],['product_id','Product ID'],['category','Category'],['product_cost','Unit cost'],['quantity','Qty']].map(([k,l])=>(
              <th key={k} style={s.th} onClick={()=>sort(k)}>{l}{si(k)}</th>
            ))}
            <th style={s.th}>Actions</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={{...s.td,textAlign:'center',padding:40,color:'var(--slate-400)'}}>Loading…</td></tr>
            : sorted.length===0 ? <tr><td colSpan={7}><div style={s.empty}><div style={{fontSize:36,marginBottom:12}}>📦</div><div style={{fontSize:14,color:'var(--slate-500)',marginBottom:16}}>{search||catFilter?'No products match your filters.':'No products yet.'}</div>{canEdit&&!search&&!catFilter&&<button style={s.btnPri} onClick={()=>{setEditProd(null);setShowModal(true);}}>+ Add first product</button>}</div></td></tr>
            : sorted.map((p,i) => (
                <tr key={p.id} style={{background:hovered===p.id?'var(--slate-50)':'var(--white)'}} onMouseEnter={()=>setHovered(p.id)} onMouseLeave={()=>setHovered(null)}>
                  <td style={{...s.td,color:'var(--slate-400)',width:50}}>{i+1}</td>
                  <td style={{...s.td,fontWeight:500}}>{p.product_name}</td>
                  <td style={s.td}><span style={s.pidBadge}>{p.product_id}</span></td>
                  <td style={s.td}>{p.category?<span style={s.catBadge}>{p.category}</span>:<span style={{color:'var(--slate-300)'}}>—</span>}</td>
                  <td style={{...s.td,fontWeight:500}}>{fmt(p.product_cost)}</td>
                  <td style={s.td}><span style={s.qBadge(qStatus(p.quantity))}>{p.quantity}</span></td>
                  <td style={s.td}>
                    <div style={{display:'flex',gap:6}}>
                      {canEdit&&<button style={s.actBtn} onClick={()=>{setEditProd(p);setShowModal(true);}}>Edit</button>}
                      {canDelete&&<button style={s.delBtn} onClick={()=>setDelProd(p)}>Delete</button>}
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
        <div style={s.foot}>
          <span>{sorted.length} product{sorted.length!==1?'s':''}{(search||catFilter)?' (filtered)':''}</span>
          <span>CareVale — Empowering Life</span>
        </div>
      </div>

      {showModal&&<ProductModal product={editProd} categories={categories} onClose={()=>{setShowModal(false);setEditProd(null);}} onSaved={handleSaved}/>}
      {delProd&&<DeleteModal product={delProd} onClose={()=>setDelProd(null)} onConfirm={handleDelete}/>}
      <div style={s.toast(toast.show)}><span style={{color:'var(--teal-400)'}}>✓</span>{toast.msg}</div>
    </>
  );
}
