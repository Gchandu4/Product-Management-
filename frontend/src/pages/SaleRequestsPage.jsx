import { useState, useEffect, useCallback } from 'react';
import { saleRequestsApi, productsApi } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';

const STATUS_META = {
  pending:  { label:'Pending',  color:'#d97706', bg:'#fffbeb' },
  approved: { label:'Approved', color:'#16a34a', bg:'#f0fdf4' },
  rejected: { label:'Rejected', color:'#e24b4a', bg:'#fef2f2' },
};

const s = {
  statsGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 },
  statCard:  { background:'var(--white)', borderRadius:'var(--radius-lg)', padding:'14px 18px', border:'1px solid var(--slate-200)', boxShadow:'var(--shadow-sm)' },
  statLbl:   { fontSize:11, fontWeight:500, color:'var(--slate-500)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:5 },
  statVal:   { fontSize:22, fontWeight:500 },
  toolbar:   { display:'flex', gap:10, marginBottom:14, alignItems:'center', flexWrap:'wrap' },
  select:    { height:38, padding:'0 12px', fontSize:13, background:'var(--white)', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-md)', color:'var(--slate-700)', outline:'none' },
  btnPri:    { display:'flex', alignItems:'center', gap:6, height:38, padding:'0 16px', background:'var(--teal-600)', border:'none', borderRadius:'var(--radius-md)', color:'var(--white)', fontSize:13, fontWeight:500, cursor:'pointer' },
  cardList:  { display:'flex', flexDirection:'column', gap:10 },
  reqCard:   { background:'var(--white)', borderRadius:'var(--radius-lg)', border:'1px solid var(--slate-200)', padding:'16px 18px', boxShadow:'var(--shadow-sm)' },
  reqTop:    { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 },
  reqNo:     { fontFamily:'var(--mono)', fontSize:11, color:'var(--slate-400)', marginBottom:3 },
  reqProd:   { fontSize:14, fontWeight:500, color:'var(--slate-900)' },
  statusBadge: st => ({ display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:STATUS_META[st].bg, color:STATUS_META[st].color }),
  reqMeta:   { display:'flex', gap:16, flexWrap:'wrap', fontSize:12, color:'var(--slate-500)', marginBottom:10 },
  reqReason: { fontSize:12, color:'var(--slate-600)', background:'var(--slate-50)', padding:'8px 10px', borderRadius:'var(--radius-sm)', marginBottom:10 },
  actRow:    { display:'flex', gap:8 },
  btnApprove:{ flex:1, height:34, background:'var(--success)', border:'none', borderRadius:'var(--radius-sm)', color:'#fff', fontSize:12, fontWeight:500, cursor:'pointer' },
  btnReject: { flex:1, height:34, background:'transparent', border:'1px solid rgba(226,75,74,.4)', borderRadius:'var(--radius-sm)', color:'var(--danger)', fontSize:12, fontWeight:500, cursor:'pointer' },
  reviewNote:{ fontSize:11, color:'var(--slate-400)', marginTop:8, fontStyle:'italic' },
  empty:     { padding:'48px 20px', textAlign:'center', color:'var(--slate-400)' },
  backdrop:  { position:'fixed', inset:0, background:'rgba(15,25,35,.5)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
  modal:     { background:'var(--white)', borderRadius:'var(--radius-xl)', width:'100%', maxWidth:440, boxShadow:'var(--shadow-lg)' },
  mHead:     { padding:'18px 22px 14px', borderBottom:'1px solid var(--slate-100)', display:'flex', justifyContent:'space-between', alignItems:'center' },
  mClose:    { background:'none', border:'none', fontSize:20, color:'var(--slate-400)', cursor:'pointer' },
  mBody:     { padding:'18px 22px' },
  lbl:       { display:'block', fontSize:11, fontWeight:600, color:'var(--slate-500)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:5 },
  inp:       { width:'100%', height:37, padding:'0 11px', fontSize:13, background:'var(--white)', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-md)', outline:'none', marginBottom:14, color:'var(--slate-800)' },
  sel:       { width:'100%', height:37, padding:'0 11px', fontSize:13, background:'var(--white)', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-md)', outline:'none', marginBottom:14, color:'var(--slate-800)' },
  stockHint: { fontSize:11, color:'var(--slate-400)', marginTop:-10, marginBottom:14 },
  mFoot:     { padding:'14px 22px', borderTop:'1px solid var(--slate-100)', display:'flex', justifyContent:'flex-end', gap:8 },
  btnCan:    { height:36, padding:'0 14px', background:'transparent', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-md)', color:'var(--slate-600)', fontSize:13, cursor:'pointer' },
  btnSav:    { height:36, padding:'0 18px', background:'var(--teal-600)', border:'none', borderRadius:'var(--radius-md)', color:'var(--white)', fontSize:13, fontWeight:500, cursor:'pointer' },
  toast:     show => ({ position:'fixed', bottom:22, right:22, zIndex:200, padding:'11px 16px', borderRadius:'var(--radius-md)', fontSize:13, fontWeight:500, boxShadow:'var(--shadow-lg)', display:'flex', alignItems:'center', gap:8, background:'var(--slate-900)', color:'var(--white)', opacity:show?1:0, transform:show?'translateY(0)':'translateY(8px)', transition:'all .2s', pointerEvents:show?'auto':'none' }),
};

function NewRequestModal({ onClose, onSaved }) {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ product_id:'', quantity:'', patient_name:'', patient_phone:'', reason:'' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { productsApi.getAll().then(r => setProducts(r.data.products || [])); }, []);

  const selected = products.find(p => p.id === form.product_id);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const save = async () => {
    if (!form.product_id) { setErr('Select a product.'); return; }
    if (!form.quantity || isNaN(form.quantity) || Number(form.quantity)<=0) { setErr('Enter a valid quantity.'); return; }
    setSaving(true);
    try {
      const res = await saleRequestsApi.create({ ...form, quantity: Number(form.quantity) });
      onSaved(res.data); onClose();
    } catch (e) { setErr(e.response?.data?.error || 'Request failed.'); }
    finally { setSaving(false); }
  };

  return (
    <div style={s.backdrop} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={s.modal}>
        <div style={s.mHead}><div style={{fontSize:15,fontWeight:500}}>New product request</div><button style={s.mClose} onClick={onClose}>×</button></div>
        <div style={s.mBody}>
          {err && <div style={{fontSize:12,color:'var(--danger)',marginBottom:12,padding:'8px 12px',background:'var(--danger-bg)',borderRadius:6}}>{err}</div>}
          <label style={s.lbl}>Product *</label>
          <select style={s.sel} value={form.product_id} onChange={e=>set('product_id',e.target.value)}>
            <option value="">Select product…</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.product_name} ({p.product_id}) — {p.quantity} in stock</option>)}
          </select>
          {selected && <div style={s.stockHint}>Available stock: <strong>{selected.quantity}</strong> units</div>}
          <label style={s.lbl}>Quantity needed *</label>
          <input type="number" min="1" style={s.inp} value={form.quantity} onChange={e=>set('quantity',e.target.value)} placeholder="e.g. 1"/>
          <label style={s.lbl}>Patient name (optional)</label>
          <input style={s.inp} value={form.patient_name} onChange={e=>set('patient_name',e.target.value)} placeholder="Who is this for?"/>
          <label style={s.lbl}>Patient phone (optional)</label>
          <input style={s.inp} value={form.patient_phone} onChange={e=>set('patient_phone',e.target.value)} placeholder="+91 …"/>
          <label style={s.lbl}>Reason / notes</label>
          <input style={{...s.inp,marginBottom:0}} value={form.reason} onChange={e=>set('reason',e.target.value)} placeholder="Brief note for admin…"/>
        </div>
        <div style={s.mFoot}>
          <button style={s.btnCan} onClick={onClose}>Cancel</button>
          <button style={{...s.btnSav,opacity:saving?.7:1}} onClick={save} disabled={saving}>{saving?'Sending…':'Send request'}</button>
        </div>
      </div>
    </div>
  );
}

function ReviewModal({ request, action, onClose, onDone }) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    setSaving(true);
    try {
      const res = action === 'approve' ? await saleRequestsApi.approve(request.id, note) : await saleRequestsApi.reject(request.id, note);
      onDone(res.data); onClose();
    } catch (e) { setErr(e.response?.data?.error || 'Action failed.'); }
    finally { setSaving(false); }
  };

  return (
    <div style={s.backdrop} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={s.modal}>
        <div style={s.mHead}>
          <div style={{fontSize:15,fontWeight:500}}>{action==='approve' ? 'Approve request' : 'Reject request'}</div>
          <button style={s.mClose} onClick={onClose}>×</button>
        </div>
        <div style={s.mBody}>
          {err && <div style={{fontSize:12,color:'var(--danger)',marginBottom:12,padding:'8px 12px',background:'var(--danger-bg)',borderRadius:6}}>{err}</div>}
          <div style={{fontSize:13,color:'var(--slate-600)',marginBottom:14,lineHeight:1.6}}>
            <strong>{request.product_name}</strong> × {request.quantity}
            {request.patient_name && <> — for {request.patient_name}</>}
            {action==='approve' && <div style={{marginTop:6,color:'var(--success)',fontSize:12}}>✓ Stock will be deducted immediately upon approval.</div>}
          </div>
          <label style={s.lbl}>Note (optional)</label>
          <input style={{...s.inp,marginBottom:0}} value={note} onChange={e=>setNote(e.target.value)} placeholder={action==='approve' ? 'Approval note…' : 'Reason for rejection…'}/>
        </div>
        <div style={s.mFoot}>
          <button style={s.btnCan} onClick={onClose}>Cancel</button>
          <button style={{...s.btnSav, background: action==='approve' ? 'var(--success)' : 'var(--danger)', opacity:saving?.7:1}} onClick={submit} disabled={saving}>
            {saving ? 'Processing…' : action==='approve' ? 'Confirm approval' : 'Confirm rejection'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SaleRequestsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canRequest = ['admin','staff','reception'].includes(user?.role);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('pending');
  const [showNew, setShowNew]   = useState(false);
  const [reviewing, setReviewing] = useState(null); // { request, action }
  const [toast, setToast]       = useState({show:false,msg:''});

  const showToast = msg => { setToast({show:true,msg}); setTimeout(()=>setToast({show:false,msg:''}),2500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter ? { status: filter } : {};
      const res = await saleRequestsApi.getAll(params);
      setRequests(res.data.requests || []);
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const counts = {
    pending:  requests.filter(r=>r.status==='pending').length,
    approved: requests.filter(r=>r.status==='approved').length,
    rejected: requests.filter(r=>r.status==='rejected').length,
  };

  const handleNewSaved = () => { showToast('Request sent to admin.'); load(); };
  const handleReviewed = (updated) => {
    showToast(updated.status==='approved' ? 'Request approved — stock updated.' : 'Request rejected.');
    load();
  };

  const fmtDate = d => new Date(d).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});

  return (
    <>
      <div style={s.statsGrid}>
        <div style={s.statCard}><div style={s.statLbl}>Pending</div><div style={{...s.statVal,color:'var(--warning)'}}>{counts.pending}</div></div>
        <div style={s.statCard}><div style={s.statLbl}>Approved</div><div style={{...s.statVal,color:'var(--success)'}}>{counts.approved}</div></div>
        <div style={s.statCard}><div style={s.statLbl}>Rejected</div><div style={{...s.statVal,color:'var(--danger)'}}>{counts.rejected}</div></div>
      </div>

      <div style={s.toolbar}>
        <select style={s.select} value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </select>
        {canRequest && <button style={s.btnPri} onClick={()=>setShowNew(true)}>+ New request</button>}
      </div>

      {loading ? <div style={{color:'var(--slate-400)',padding:40,textAlign:'center'}}>Loading…</div>
      : requests.length === 0 ? (
        <div style={s.empty}>
          <div style={{fontSize:36,marginBottom:12}}>✅</div>
          <div style={{fontSize:14,color:'var(--slate-500)'}}>No {filter || ''} requests.</div>
        </div>
      ) : (
        <div style={s.cardList}>
          {requests.map(r => (
            <div key={r.id} style={s.reqCard}>
              <div style={s.reqTop}>
                <div>
                  <div style={s.reqNo}>{r.request_no}</div>
                  <div style={s.reqProd}>{r.product_name} × {r.quantity}</div>
                </div>
                <span style={s.statusBadge(r.status)}>{STATUS_META[r.status].label}</span>
              </div>
              <div style={s.reqMeta}>
                <span>📦 Stock: {r.current_stock}</span>
                {r.patient_name && <span>👤 {r.patient_name}{r.patient_phone ? ` (${r.patient_phone})` : ''}</span>}
                <span>🧑 Requested by {r.requested_by_name}</span>
                <span>🕐 {fmtDate(r.requested_at)}</span>
              </div>
              {r.reason && <div style={s.reqReason}>{r.reason}</div>}
              {r.status==='pending' && isAdmin && (
                <div style={s.actRow}>
                  <button style={s.btnApprove} onClick={()=>setReviewing({request:r,action:'approve'})}>✓ Approve</button>
                  <button style={s.btnReject} onClick={()=>setReviewing({request:r,action:'reject'})}>✕ Reject</button>
                </div>
              )}
              {r.status!=='pending' && r.reviewed_by_name && (
                <div style={s.reviewNote}>
                  {STATUS_META[r.status].label} by {r.reviewed_by_name} on {fmtDate(r.reviewed_at)}
                  {r.review_note && <> — "{r.review_note}"</>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showNew && <NewRequestModal onClose={()=>setShowNew(false)} onSaved={handleNewSaved}/>}
      {reviewing && <ReviewModal request={reviewing.request} action={reviewing.action} onClose={()=>setReviewing(null)} onDone={handleReviewed}/>}
      <div style={s.toast(toast.show)}><span style={{color:'var(--teal-400)'}}>✓</span>{toast.msg}</div>
    </>
  );
}
