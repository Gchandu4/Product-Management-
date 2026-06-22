import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const s = {
  page:  { minHeight:'100vh', display:'flex', fontFamily:'var(--font)' },
  left:  { flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'3rem', background:'var(--teal-800)', position:'relative', overflow:'hidden' },
  lc:    { position:'relative', zIndex:1, maxWidth:480 },
  brand: { display:'flex', alignItems:'center', gap:12, marginBottom:'3rem' },
  bdot:  { width:36, height:36, borderRadius:10, background:'var(--teal-300)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'var(--teal-900)' },
  bname: { fontSize:20, fontWeight:600, color:'var(--white)' },
  btag:  { fontSize:11, color:'var(--teal-300)', marginTop:1 },
  heroT: { fontSize:36, fontWeight:300, color:'var(--white)', lineHeight:1.2, marginBottom:'1rem', letterSpacing:'-0.5px' },
  heroA: { color:'var(--teal-300)', fontWeight:500 },
  heroS: { fontSize:15, color:'var(--teal-200)', lineHeight:1.6, marginBottom:'2.5rem' },
  stats: { display:'flex', gap:20, flexWrap:'wrap' },
  stat:  { padding:'12px 18px', background:'rgba(255,255,255,.07)', borderRadius:'var(--radius-md)' },
  sval:  { fontSize:20, fontWeight:500, color:'var(--teal-300)' },
  slbl:  { fontSize:11, color:'var(--teal-200)', marginTop:2 },
  dc1:   { position:'absolute', width:300, height:300, borderRadius:'50%', border:'1px solid rgba(94,208,191,.12)', top:-80, right:-80, pointerEvents:'none' },
  dc2:   { position:'absolute', width:500, height:500, borderRadius:'50%', border:'1px solid rgba(94,208,191,.07)', top:-180, right:-180, pointerEvents:'none' },
  right: { width:440, display:'flex', flexDirection:'column', justifyContent:'center', padding:'3rem', background:'var(--slate-900)' },
  card:  { width:'100%', maxWidth:360 },
  fT:    { fontSize:22, fontWeight:500, color:'var(--white)', marginBottom:6, letterSpacing:'-0.3px' },
  fS:    { fontSize:13, color:'var(--slate-400)', marginBottom:'2rem' },
  lbl:   { display:'block', fontSize:11, fontWeight:500, color:'var(--slate-400)', marginBottom:6, letterSpacing:'.05em', textTransform:'uppercase' },
  inp:   focus => ({ width:'100%', height:44, padding:'0 14px', fontSize:14, background:'var(--slate-800)', border:`1px solid ${focus?'var(--teal-500)':'var(--slate-700)'}`, borderRadius:'var(--radius-md)', color:'var(--white)', outline:'none', transition:'border-color .15s' }),
  fw:    { marginBottom:'1.25rem' },
  btn:   { width:'100%', height:46, background:'var(--teal-500)', border:'none', borderRadius:'var(--radius-md)', color:'var(--white)', fontSize:14, fontWeight:500, cursor:'pointer', marginTop:8 },
  err:   { padding:'10px 14px', background:'rgba(226,75,74,.12)', border:'1px solid rgba(226,75,74,.3)', borderRadius:'var(--radius-md)', color:'#f87171', fontSize:13, marginBottom:'1rem' },
  hint:  { marginTop:'1.5rem', padding:14, background:'var(--slate-800)', borderRadius:'var(--radius-md)', fontSize:12, color:'var(--slate-400)' },
  hT:    { color:'var(--slate-300)', fontWeight:500, marginBottom:4 },
};

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]   = useState({ email:'', password:'' });
  const [error, setError] = useState('');
  const [focus, setFocus] = useState('');

  const handleSubmit = async e => {
    e.preventDefault(); setError('');
    const res = await login(form.email, form.password);
    if (res.ok) navigate('/dashboard');
    else setError(res.error);
  };

  return (
    <div style={s.page}>
      <div style={s.left}>
        <div style={s.dc1}/><div style={s.dc2}/>
        <div style={s.lc}>
          <div style={s.brand}>
            <div style={s.bdot}>✦</div>
            <div><div style={s.bname}>CareVale</div><div style={s.btag}>Empowering Life</div></div>
          </div>
          <h1 style={s.heroT}>Product management,<br/><span style={s.heroA}>built for care.</span></h1>
          <p style={s.heroS}>Track every prosthetic, orthosis, and rehabilitation product in one place — from procurement to patient.</p>
          <div style={s.stats}>
            {[['Real-time','Stock tracking'],['Secure','Role-based access'],['100%','India hosted']].map(([v,l]) => (
              <div key={l} style={s.stat}><div style={s.sval}>{v}</div><div style={s.slbl}>{l}</div></div>
            ))}
          </div>
        </div>
      </div>
      <div style={s.right}>
        <div style={s.card}>
          <h2 style={s.fT}>Sign in</h2>
          <p style={s.fS}>CareVale internal team access only.</p>
          {error && <div style={s.err}>{error}</div>}
          <form onSubmit={handleSubmit}>
            {[['email','Email address','you@carevale.co.in','email'],['password','Password','••••••••','password']].map(([key,label,ph,type]) => (
              <div key={key} style={s.fw}>
                <label style={s.lbl}>{label}</label>
                <input
                  type={type} placeholder={ph} required
                  style={s.inp(focus===key)}
                  value={form[key]}
                  onChange={e => setForm(f=>({...f,[key]:e.target.value}))}
                  onFocus={() => setFocus(key)}
                  onBlur={() => setFocus('')}
                />
              </div>
            ))}
            <button type="submit" style={{...s.btn, opacity:loading?.7:1}} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>
          <div style={s.hint}>
            <div style={s.hT}>Demo credentials</div>
            admin@carevale.co.in / CareVale@2026
          </div>
        </div>
      </div>
    </div>
  );
}
