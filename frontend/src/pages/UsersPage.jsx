import { useState, useEffect } from 'react';
import { usersApi } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';

const ROLE_META = {
  admin:     { label:'Admin',     color:'#533AB7', bg:'#eeedfe', desc:'Full access — manage everything' },
  staff:     { label:'Staff',     color:'#185FA5', bg:'#e6f1fb', desc:'Add/edit products, adjust stock, approve nothing' },
  reception: { label:'Reception', color:'#d97706', bg:'#fffbeb', desc:'View products only, submit requests for admin approval' },
  viewer:    { label:'Viewer',    color:'#6B8FA3', bg:'#f4f7fa', desc:'Read-only access to dashboard and reports' },
};

const s = {
  toolbar:   { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  pageT:     { fontSize:16, fontWeight:500, color:'var(--slate-900)' },
  pageSub:   { fontSize:13, color:'var(--slate-500)', marginTop:2 },
  btnPri:    { display:'flex', alignItems:'center', gap:6, height:38, padding:'0 16px', background:'var(--teal-600)', border:'none', borderRadius:'var(--radius-md)', color:'var(--white)', fontSize:13, fontWeight:500, cursor:'pointer' },
  tblWrap:   { background:'var(--white)', borderRadius:'var(--radius-lg)', border:'1px solid var(--slate-200)', boxShadow:'var(--shadow-sm)', overflow:'hidden' },
  table:     { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th:        { padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:600, color:'var(--slate-500)', textTransform:'uppercase', letterSpacing:'.06em', background:'var(--slate-50)', borderBottom:'1px solid var(--slate-200)' },
  td:        { padding:'12px 14px', borderBottom:'1px solid var(--slate-100)', color:'var(--slate-800)', verticalAlign:'middle' },
  avatar:    { width:30, height:30, borderRadius:'50%', background:'var(--teal-50)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600, color:'var(--teal-700)', flexShrink:0 },
  nameRow:   { display:'flex', alignItems:'center', gap:10 },
  roleBadge: role => ({ display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:ROLE_META[role]?.bg, color:ROLE_META[role]?.color }),
  statusBadge: active => ({ display:'inline-flex', alignItems:'center', padding:'2px 9px', borderRadius:20, fontSize:11, fontWeight:500, background: active?'var(--success-bg)':'var(--danger-bg)', color: active?'var(--success)':'var(--danger)' }),
  actBtn:    { background:'transparent', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-sm)', padding:'4px 10px', fontSize:12, color:'var(--slate-600)', cursor:'pointer', marginRight:6 },
  delBtn:    { background:'transparent', border:'1px solid rgba(226,75,74,.3)', borderRadius:'var(--radius-sm)', padding:'4px 10px', fontSize:12, color:'var(--danger)', cursor:'pointer' },
  youTag:    { fontSize:10, color:'var(--teal-500)', marginLeft:6, fontWeight:600 },
  roleGrid:  { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 },
  roleCard:  sel => ({ padding:'10px 12px', borderRadius:'var(--radius-md)', border:`1.5px solid ${sel?'var(--teal-500)':'var(--slate-200)'}`, background: sel?'var(--teal-50)':'var(--white)', cursor:'pointer' }),
  roleCardLabel: { fontSize:12, fontWeight:600, marginBottom:2 },
  roleCardDesc:  { fontSize:10, color:'var(--slate-500)', lineHeight:1.4 },
  backdrop:  { position:'fixed', inset:0, background:'rgba(15,25,35,.5)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
  modal:     { background:'var(--white)', borderRadius:'var(--radius-xl)', width:'100%', maxWidth:460, boxShadow:'var(--shadow-lg)' },
  mHead:     { padding:'18px 22px 14px', borderBottom:'1px solid var(--slate-100)', display:'flex', justifyContent:'space-between', alignItems:'center' },
  mClose:    { background:'none', border:'none', fontSize:20, color:'var(--slate-400)', cursor:'pointer' },
  mBody:     { padding:'18px 22px' },
  lbl:       { display:'block', fontSize:11, fontWeight:600, color:'var(--slate-500)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:5 },
  inp:       { width:'100%', height:37, padding:'0 11px', fontSize:13, background:'var(--white)', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-md)', outline:'none', marginBottom:14, color:'var(--slate-800)' },
  mFoot:     { padding:'14px 22px', borderTop:'1px solid var(--slate-100)', display:'flex', justifyContent:'flex-end', gap:8 },
  btnCan:    { height:36, padding:'0 14px', background:'transparent', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-md)', color:'var(--slate-600)', fontSize:13, cursor:'pointer' },
  btnSav:    { height:36, padding:'0 18px', background:'var(--teal-600)', border:'none', borderRadius:'var(--radius-md)', color:'var(--white)', fontSize:13, fontWeight:500, cursor:'pointer' },
  btnDanger: { height:36, padding:'0 16px', background:'var(--danger)', border:'none', borderRadius:'var(--radius-md)', color:'var(--white)', fontSize:13, fontWeight:500, cursor:'pointer' },
  toast:     show => ({ position:'fixed', bottom:22, right:22, zIndex:200, padding:'11px 16px', borderRadius:'var(--radius-md)', fontSize:13, fontWeight:500, boxShadow:'var(--shadow-lg)', display:'flex', alignItems:'center', gap:8, background:'var(--slate-900)', color:'var(--white)', opacity:show?1:0, transform:show?'translateY(0)':'translateY(8px)', transition:'all .2s', pointerEvents:show?'auto':'none' }),
  hint:      { fontSize:11, color:'var(--slate-400)', marginTop:-10, marginBottom:14 },
};

function RolePicker({ value, onChange }) {
  return (
    <div style={s.roleGrid}>
      {Object.entries(ROLE_META).map(([role, meta]) => (
        <div key={role} style={s.roleCard(value===role)} onClick={()=>onChange(role)}>
          <div style={{...s.roleCardLabel, color:meta.color}}>{meta.label}</div>
          <div style={s.roleCardDesc}>{meta.desc}</div>
        </div>
      ))}
    </div>
  );
}

function UserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState(user
    ? { name:user.name, email:user.email, role:user.role, password:'' }
    : { name:'', email:'', role:'reception', password:'' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const save = async () => {
    if (!form.name.trim()) { setErr('Name is required.'); return; }
    if (!form.email.trim()) { setErr('Email is required.'); return; }
    if (!user && (!form.password || form.password.length < 8)) { setErr('Password must be at least 8 characters.'); return; }

    setSaving(true);
    try {
      let res;
      if (user) {
        res = await usersApi.update(user.id, { name:form.name, email:form.email, role:form.role, is_active:user.is_active });
      } else {
        res = await usersApi.create(form);
      }
      onSaved(res.data, !user); onClose();
    } catch (e) { setErr(e.response?.data?.error || 'Save failed.'); }
    finally { setSaving(false); }
  };

  return (
    <div style={s.backdrop} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={s.modal}>
        <div style={s.mHead}><div style={{fontSize:15,fontWeight:500}}>{user?'Edit user':'New staff account'}</div><button style={s.mClose} onClick={onClose}>×</button></div>
        <div style={s.mBody}>
          {err && <div style={{fontSize:12,color:'var(--danger)',marginBottom:12,padding:'8px 12px',background:'var(--danger-bg)',borderRadius:6}}>{err}</div>}
          <label style={s.lbl}>Full name *</label>
          <input style={s.inp} value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Priya Sharma"/>
          <label style={s.lbl}>Email address *</label>
          <input style={s.inp} type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="staff@carevale.co.in"/>
          {!user && (
            <>
              <label style={s.lbl}>Temporary password *</label>
              <input style={s.inp} type="text" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="Min 8 characters"/>
              <div style={s.hint}>Share this with the staff member — they can use it to log in.</div>
            </>
          )}
          <label style={s.lbl}>Role *</label>
          <RolePicker value={form.role} onChange={r=>set('role',r)} />
        </div>
        <div style={s.mFoot}>
          <button style={s.btnCan} onClick={onClose}>Cancel</button>
          <button style={{...s.btnSav,opacity:saving?.7:1}} onClick={save} disabled={saving}>{saving?'Saving…':user?'Save changes':'Create account'}</button>
        </div>
      </div>
    </div>
  );
}

function ResetPasswordModal({ user, onClose, onDone }) {
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    if (!password || password.length < 8) { setErr('Password must be at least 8 characters.'); return; }
    setSaving(true);
    try {
      await usersApi.resetPassword(user.id, password);
      onDone(); onClose();
    } catch (e) { setErr(e.response?.data?.error || 'Reset failed.'); }
    finally { setSaving(false); }
  };

  return (
    <div style={s.backdrop} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{...s.modal,maxWidth:380}}>
        <div style={s.mHead}><div style={{fontSize:15,fontWeight:500}}>Reset password</div><button style={s.mClose} onClick={onClose}>×</button></div>
        <div style={s.mBody}>
          {err && <div style={{fontSize:12,color:'var(--danger)',marginBottom:12,padding:'8px 12px',background:'var(--danger-bg)',borderRadius:6}}>{err}</div>}
          <div style={{fontSize:13,color:'var(--slate-600)',marginBottom:14}}>New password for <strong>{user.name}</strong> ({user.email})</div>
          <label style={s.lbl}>New password *</label>
          <input style={{...s.inp,marginBottom:0}} type="text" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 8 characters"/>
        </div>
        <div style={s.mFoot}>
          <button style={s.btnCan} onClick={onClose}>Cancel</button>
          <button style={{...s.btnSav,opacity:saving?.7:1}} onClick={save} disabled={saving}>{saving?'Saving…':'Reset password'}</button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser]   = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [toast, setToast] = useState({show:false,msg:''});

  const showToast = msg => { setToast({show:true,msg}); setTimeout(()=>setToast({show:false,msg:''}),2500); };

  const load = () => { setLoading(true); usersApi.getAll().then(r=>setUsers(r.data)).finally(()=>setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleSaved = (data, isNew) => {
    showToast(isNew ? `${data.name} added as ${ROLE_META[data.role]?.label}.` : `${data.name} updated.`);
    load();
  };

  const handleDeactivate = async (u) => {
    if (!window.confirm(`Deactivate ${u.name}'s account? They will no longer be able to log in.`)) return;
    try { await usersApi.delete(u.id); showToast(`${u.name} deactivated.`); load(); }
    catch (e) { alert(e.response?.data?.error || 'Failed.'); }
  };

  const handleReactivate = async (u) => {
    try { await usersApi.update(u.id, { name:u.name, email:u.email, role:u.role, is_active:true }); showToast(`${u.name} reactivated.`); load(); }
    catch (e) { alert(e.response?.data?.error || 'Failed.'); }
  };

  return (
    <>
      <div style={s.toolbar}>
        <div><div style={s.pageT}>Staff accounts</div><div style={s.pageSub}>{users.length} account{users.length!==1?'s':''}</div></div>
        <button style={s.btnPri} onClick={()=>{setEditUser(null);setShowModal(true);}}>+ Add staff account</button>
      </div>

      <div style={s.tblWrap}>
        <table style={s.table}>
          <thead><tr>
            {['Name','Email','Role','Status','Joined','Actions'].map(h=><th key={h} style={s.th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} style={{...s.td,textAlign:'center',padding:40,color:'var(--slate-400)'}}>Loading…</td></tr>
            : users.map(u => {
                const initials = u.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
                const isMe = u.id === me?.id;
                return (
                  <tr key={u.id}>
                    <td style={s.td}>
                      <div style={s.nameRow}>
                        <div style={s.avatar}>{initials}</div>
                        <span style={{fontWeight:500}}>{u.name}{isMe && <span style={s.youTag}>YOU</span>}</span>
                      </div>
                    </td>
                    <td style={{...s.td,color:'var(--slate-500)'}}>{u.email}</td>
                    <td style={s.td}><span style={s.roleBadge(u.role)}>{ROLE_META[u.role]?.label || u.role}</span></td>
                    <td style={s.td}><span style={s.statusBadge(u.is_active)}>{u.is_active?'Active':'Deactivated'}</span></td>
                    <td style={{...s.td,fontSize:12,color:'var(--slate-500)'}}>{new Date(u.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
                    <td style={s.td}>
                      <button style={s.actBtn} onClick={()=>{setEditUser(u);setShowModal(true);}}>Edit</button>
                      <button style={s.actBtn} onClick={()=>setResetUser(u)}>Reset PW</button>
                      {u.is_active
                        ? !isMe && <button style={s.delBtn} onClick={()=>handleDeactivate(u)}>Deactivate</button>
                        : <button style={s.actBtn} onClick={()=>handleReactivate(u)}>Reactivate</button>
                      }
                    </td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
      </div>

      {showModal && <UserModal user={editUser} onClose={()=>{setShowModal(false);setEditUser(null);}} onSaved={handleSaved}/>}
      {resetUser && <ResetPasswordModal user={resetUser} onClose={()=>setResetUser(null)} onDone={()=>showToast('Password reset.')}/>}
      <div style={s.toast(toast.show)}><span style={{color:'var(--teal-400)'}}>✓</span>{toast.msg}</div>
    </>
  );
}
