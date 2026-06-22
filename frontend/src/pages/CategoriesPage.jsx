import { useState, useEffect } from 'react';
import { categoriesApi } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';

const PRESETS = ['#239b8b','#185FA5','#d97706','#533AB7','#993556','#16a34a','#e24b4a','#6B8FA3'];

const s = {
  toolbar: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  pageT:   { fontSize:16, fontWeight:500, color:'var(--slate-900)' },
  pageSub: { fontSize:13, color:'var(--slate-500)', marginTop:2 },
  btnPri:  { display:'flex', alignItems:'center', gap:6, height:38, padding:'0 16px', background:'var(--teal-600)', border:'none', borderRadius:'var(--radius-md)', color:'var(--white)', fontSize:13, fontWeight:500, cursor:'pointer' },
  grid:    { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))', gap:14 },
  card:    { background:'var(--white)', borderRadius:'var(--radius-lg)', border:'1px solid var(--slate-200)', padding:'16px 18px', position:'relative', boxShadow:'var(--shadow-sm)' },
  bar:     c => ({ position:'absolute', left:0, top:0, bottom:0, width:4, background:c, borderRadius:'4px 0 0 4px' }),
  cName:   { fontSize:14, fontWeight:500, color:'var(--slate-900)', marginBottom:3 },
  cDesc:   { fontSize:12, color:'var(--slate-500)', marginBottom:10, minHeight:16 },
  badge:   c => ({ display:'inline-flex', alignItems:'center', gap:4, fontSize:12, fontWeight:500, padding:'2px 10px', borderRadius:20, background:c+'18', color:c }),
  acts:    { display:'flex', gap:8, marginTop:12 },
  btnE:    { flex:1, height:30, background:'transparent', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-sm)', color:'var(--slate-600)', fontSize:12, cursor:'pointer' },
  btnD:    { height:30, padding:'0 12px', background:'transparent', border:'1px solid rgba(226,75,74,.3)', borderRadius:'var(--radius-sm)', color:'var(--danger)', fontSize:12, cursor:'pointer' },
  addCard: { background:'var(--slate-50)', borderRadius:'var(--radius-lg)', border:'2px dashed var(--slate-200)', padding:'18px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', minHeight:110 },
  backdrop:{ position:'fixed', inset:0, background:'rgba(15,25,35,.5)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
  modal:   { background:'var(--white)', borderRadius:'var(--radius-xl)', width:'100%', maxWidth:380, boxShadow:'var(--shadow-lg)' },
  mHead:   { padding:'18px 22px 14px', borderBottom:'1px solid var(--slate-100)', display:'flex', justifyContent:'space-between', alignItems:'center' },
  mClose:  { background:'none', border:'none', fontSize:20, color:'var(--slate-400)', cursor:'pointer' },
  mBody:   { padding:'18px 22px' },
  lbl:     { display:'block', fontSize:11, fontWeight:600, color:'var(--slate-500)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:5 },
  inp:     { width:'100%', height:37, padding:'0 11px', fontSize:13, background:'var(--white)', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-md)', color:'var(--slate-800)', outline:'none', marginBottom:14 },
  clrRow:  { display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 },
  mFoot:   { padding:'14px 22px', borderTop:'1px solid var(--slate-100)', display:'flex', justifyContent:'flex-end', gap:8 },
  btnCan:  { height:36, padding:'0 14px', background:'transparent', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-md)', color:'var(--slate-600)', fontSize:13, cursor:'pointer' },
  btnSav:  { height:36, padding:'0 16px', background:'var(--teal-600)', border:'none', borderRadius:'var(--radius-md)', color:'var(--white)', fontSize:13, fontWeight:500, cursor:'pointer' },
  toast:   show => ({ position:'fixed', bottom:22, right:22, zIndex:200, padding:'11px 16px', borderRadius:'var(--radius-md)', fontSize:13, fontWeight:500, boxShadow:'var(--shadow-lg)', display:'flex', alignItems:'center', gap:8, background:'var(--slate-900)', color:'var(--white)', opacity:show?1:0, transform:show?'translateY(0)':'translateY(8px)', transition:'all .2s', pointerEvents:show?'auto':'none' }),
};

function CatModal({ cat, onClose, onSaved }) {
  const [form, setForm] = useState({ name:cat?.name||'', color:cat?.color||PRESETS[0], description:cat?.description||'' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    if (!form.name.trim()) { setErr('Name is required.'); return; }
    setSaving(true);
    try {
      const res = cat ? await categoriesApi.update(cat.id,form) : await categoriesApi.create(form);
      onSaved(res.data, !cat); onClose();
    } catch (e) { setErr(e.response?.data?.error||'Save failed.'); }
    finally { setSaving(false); }
  };

  return (
    <div style={s.backdrop} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={s.modal}>
        <div style={s.mHead}><div style={{fontSize:15,fontWeight:500}}>{cat?'Edit category':'New category'}</div><button style={s.mClose} onClick={onClose}>×</button></div>
        <div style={s.mBody}>
          {err&&<div style={{fontSize:12,color:'var(--danger)',marginBottom:12}}>{err}</div>}
          <label style={s.lbl}>Name *</label>
          <input style={s.inp} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Prosthetics"/>
          <label style={s.lbl}>Description</label>
          <input style={s.inp} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Optional"/>
          <label style={s.lbl}>Colour</label>
          <div style={s.clrRow}>
            {PRESETS.map(c=>(
              <div key={c} onClick={()=>setForm(f=>({...f,color:c}))} style={{width:24,height:24,borderRadius:'50%',background:c,cursor:'pointer',border:form.color===c?`3px solid ${c}`:'3px solid transparent',outline:form.color===c?`2px solid ${c}`:'none',outlineOffset:2}}/>
            ))}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <input type="color" value={form.color} onChange={e=>setForm(f=>({...f,color:e.target.value}))} style={{width:36,height:36,borderRadius:8,border:'1px solid var(--slate-200)',cursor:'pointer',padding:2}}/>
            <span style={{fontSize:12,color:'var(--slate-500)'}}>Custom colour</span>
          </div>
        </div>
        <div style={s.mFoot}>
          <button style={s.btnCan} onClick={onClose}>Cancel</button>
          <button style={{...s.btnSav,opacity:saving?.7:1}} onClick={save} disabled={saving}>{saving?'Saving…':cat?'Save':'Add category'}</button>
        </div>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role==='admin';
  const [cats,    setCats]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [toast,   setToast]   = useState({show:false,msg:''});

  const showToast = msg => { setToast({show:true,msg}); setTimeout(()=>setToast({show:false,msg:''}),2500); };

  useEffect(()=>{ categoriesApi.getAll().then(r=>setCats(r.data)).finally(()=>setLoading(false)); },[]);

  const handleSaved = (data,isNew) => {
    setCats(prev=>isNew?[...prev,data]:prev.map(c=>c.id===data.id?data:c));
    showToast(isNew?`"${data.name}" added.`:`"${data.name}" updated.`);
  };

  const handleDelete = async cat => {
    if (!window.confirm(`Delete "${cat.name}"?`)) return;
    try { await categoriesApi.delete(cat.id); setCats(prev=>prev.filter(c=>c.id!==cat.id)); showToast(`"${cat.name}" deleted.`); }
    catch (e) { alert(e.response?.data?.error||'Delete failed.'); }
  };

  if (loading) return <div style={{color:'var(--slate-400)',padding:40,textAlign:'center'}}>Loading…</div>;

  return (
    <>
      <div style={s.toolbar}>
        <div><div style={s.pageT}>Categories</div><div style={s.pageSub}>{cats.length} categor{cats.length!==1?'ies':'y'}</div></div>
        {isAdmin&&<button style={s.btnPri} onClick={()=>{setEditCat(null);setModal(true);}}>+ Add category</button>}
      </div>
      <div style={s.grid}>
        {cats.map(cat=>(
          <div key={cat.id} style={s.card}>
            <div style={s.bar(cat.color)}/>
            <div style={{paddingLeft:12}}>
              <div style={s.cName}>{cat.name}</div>
              <div style={s.cDesc}>{cat.description||<span style={{color:'var(--slate-300)'}}>No description</span>}</div>
              <span style={s.badge(cat.color)}>{cat.product_count} product{cat.product_count!=='1'?'s':''}</span>
              {isAdmin&&<div style={s.acts}>
                <button style={s.btnE} onClick={()=>{setEditCat(cat);setModal(true);}}>Edit</button>
                <button style={s.btnD} onClick={()=>handleDelete(cat)}>Delete</button>
              </div>}
            </div>
          </div>
        ))}
        {isAdmin&&<div style={s.addCard} onClick={()=>{setEditCat(null);setModal(true);}}>
          <div style={{textAlign:'center',color:'var(--slate-400)'}}>
            <div style={{fontSize:24,marginBottom:6}}>＋</div><div style={{fontSize:13}}>New category</div>
          </div>
        </div>}
      </div>
      {modal&&<CatModal cat={editCat} onClose={()=>setModal(false)} onSaved={handleSaved}/>}
      <div style={s.toast(toast.show)}><span style={{color:'var(--teal-400)'}}>✓</span>{toast.msg}</div>
    </>
  );
}
