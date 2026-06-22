import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const TITLES = { '/dashboard':'Dashboard', '/products':'Products', '/categories':'Categories', '/stock':'Stock History' };
const NAV = [
  { to:'/dashboard',  icon:'◈', label:'Dashboard'    },
  { to:'/products',   icon:'📦', label:'Products'     },
  { to:'/categories', icon:'🏷', label:'Categories'   },
  { to:'/stock',      icon:'📋', label:'Stock History' },
];

const s = {
  shell:   { display:'flex', height:'100vh', overflow:'hidden', background:'var(--slate-50)' },
  sidebar: { width:220, background:'var(--slate-900)', display:'flex', flexDirection:'column', flexShrink:0 },
  sTop:    { padding:'20px 16px 8px' },
  brand:   { display:'flex', alignItems:'center', gap:10, paddingBottom:24 },
  dot:     { width:32, height:32, borderRadius:9, background:'var(--teal-500)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, color:'var(--teal-900)' },
  bName:   { fontSize:15, fontWeight:600, color:'var(--white)' },
  bSub:    { fontSize:10, color:'var(--teal-400)', marginTop:1 },
  navSec:  { fontSize:10, fontWeight:600, color:'var(--slate-600)', letterSpacing:'.08em', textTransform:'uppercase', padding:'0 20px 8px', marginTop:4 },
  navItem: active => ({ display:'flex', alignItems:'center', gap:10, padding:'9px 20px', fontSize:13, color: active?'var(--white)':'var(--slate-400)', background: active?'rgba(46,191,172,.10)':'transparent', borderLeft: active?'2px solid var(--teal-400)':'2px solid transparent', textDecoration:'none', transition:'all .12s' }),
  sBot:    { marginTop:'auto', padding:'12px 16px 20px', borderTop:'1px solid var(--slate-800)' },
  userRow: { display:'flex', alignItems:'center', gap:10, padding:'8px 4px 10px' },
  avatar:  { width:30, height:30, borderRadius:'50%', background:'var(--teal-800)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600, color:'var(--teal-300)' },
  uName:   { fontSize:13, fontWeight:500, color:'var(--white)' },
  uRole:   { fontSize:10, color:'var(--slate-500)', textTransform:'capitalize' },
  logBtn:  { width:'100%', padding:8, background:'transparent', border:'1px solid var(--slate-800)', borderRadius:'var(--radius-md)', color:'var(--slate-500)', fontSize:12, cursor:'pointer' },
  main:    { flex:1, overflow:'auto', display:'flex', flexDirection:'column' },
  topBar:  { height:56, padding:'0 28px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid var(--slate-200)', background:'var(--white)', flexShrink:0 },
  pageT:   { fontSize:16, fontWeight:500, color:'var(--slate-900)' },
  content: { flex:1, padding:'24px 28px', overflowY:'auto' },
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const initials = (user?.name || 'CV').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);

  return (
    <div style={s.shell}>
      <aside style={s.sidebar}>
        <div style={s.sTop}>
          <div style={s.brand}>
            <div style={s.dot}>✦</div>
            <div><div style={s.bName}>CareVale</div><div style={s.bSub}>Product Management</div></div>
          </div>
          <div style={s.navSec}>Menu</div>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} style={({isActive}) => s.navItem(isActive)}>
              <span style={{fontSize:15,width:18,textAlign:'center'}}>{n.icon}</span>{n.label}
            </NavLink>
          ))}
        </div>
        <div style={s.sBot}>
          <div style={s.userRow}>
            <div style={s.avatar}>{initials}</div>
            <div><div style={s.uName}>{user?.name}</div><div style={s.uRole}>{user?.role}</div></div>
          </div>
          <button style={s.logBtn} onClick={() => { logout(); navigate('/login'); }}>Sign out</button>
        </div>
      </aside>
      <div style={s.main}>
        <div style={s.topBar}>
          <span style={s.pageT}>{TITLES[location.pathname] || 'CareVale'}</span>
          <span style={{fontSize:12,color:'var(--slate-400)'}}>
            {new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
          </span>
        </div>
        <div style={s.content}><Outlet /></div>
      </div>
    </div>
  );
}
