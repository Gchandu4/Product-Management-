import { useState, useEffect, useRef } from 'react';
import { productsApi, stockApi } from '../api/index.js';

const fmt = n => '₹' + Number(n||0).toLocaleString('en-IN');
const COLORS = ['#239b8b','#185FA5','#d97706','#533AB7','#993556','#16a34a','#6B8FA3'];

const s = {
  statsGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 },
  statCard:  { background:'var(--white)', borderRadius:'var(--radius-lg)', padding:'16px 20px', border:'1px solid var(--slate-200)', boxShadow:'var(--shadow-sm)' },
  statLbl:   { fontSize:11, fontWeight:500, color:'var(--slate-500)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 },
  statVal:   { fontSize:24, fontWeight:500, letterSpacing:'-0.5px' },
  statSub:   { fontSize:11, color:'var(--slate-400)', marginTop:4 },
  row2:      { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 },
  card:      { background:'var(--white)', borderRadius:'var(--radius-lg)', border:'1px solid var(--slate-200)', boxShadow:'var(--shadow-sm)', padding:'18px 20px' },
  cardFull:  { background:'var(--white)', borderRadius:'var(--radius-lg)', border:'1px solid var(--slate-200)', boxShadow:'var(--shadow-sm)', padding:'18px 20px', marginBottom:24 },
  secLbl:    { fontSize:11, fontWeight:600, color:'var(--slate-500)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:12 },
  tblCard:   { background:'var(--white)', borderRadius:'var(--radius-lg)', border:'1px solid var(--slate-200)', boxShadow:'var(--shadow-sm)', overflow:'hidden' },
  tblHead:   { padding:'12px 16px', borderBottom:'1px solid var(--slate-100)', background:'var(--slate-50)' },
  tblRow:    i => ({ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', borderBottom: i?'1px solid var(--slate-100)':'none', fontSize:13 }),
  qDot:      q => ({ display:'inline-flex', alignItems:'center', justifyContent:'center', width:28, height:20, borderRadius:10, fontSize:11, fontWeight:600, background: q===0?'var(--danger-bg)':q<=5?'var(--warning-bg)':'var(--success-bg)', color: q===0?'var(--danger)':q<=5?'var(--warning)':'var(--success)' }),
};

function BarChart({ data, height=130 }) {
  const ref = useRef();
  useEffect(() => {
    if (!ref.current || !data?.length) return;
    const canvas = ref.current;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth, H = height;
    canvas.width = W*dpr; canvas.height = H*dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0,0,W,H);
    const bw = Math.floor((W-40)/data.length)-6;
    const max = Math.max(...data.map(d=>Math.max(d.added||0,d.removed||0)),1);
    const sh = (H-30)/max;
    data.forEach((d,i) => {
      const x = 20+i*(bw+6);
      const ah = Math.round((d.added||0)*sh), rh = Math.round((d.removed||0)*sh);
      ctx.fillStyle='#239b8bcc'; ctx.beginPath();
      ctx.roundRect(x, H-20-ah, bw/2-1, ah, [3,3,0,0]); ctx.fill();
      ctx.fillStyle='#d97706cc'; ctx.beginPath();
      ctx.roundRect(x+bw/2+1, H-20-rh, bw/2-1, rh, [3,3,0,0]); ctx.fill();
      ctx.fillStyle='#a8b4c0'; ctx.font='10px DM Sans,sans-serif'; ctx.textAlign='center';
      ctx.fillText(new Date(d.day).toLocaleDateString('en-IN',{weekday:'short'}), x+bw/2, H-6);
    });
  }, [data,height]);
  return <canvas ref={ref} style={{width:'100%',height}} />;
}

function DonutChart({ data, size=130 }) {
  const ref = useRef();
  useEffect(() => {
    if (!ref.current || !data?.length) return;
    const canvas = ref.current;
    const dpr = window.devicePixelRatio||1;
    canvas.width=size*dpr; canvas.height=size*dpr;
    const ctx=canvas.getContext('2d');
    ctx.scale(dpr,dpr);
    const cx=size/2,cy=size/2,r=size/2-10,ri=r*.62;
    const total=data.reduce((s,d)=>s+Number(d.total_value||0),0);
    let angle=-Math.PI/2;
    data.forEach((d,i)=>{ const sl=(Number(d.total_value)/total)*2*Math.PI; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,angle,angle+sl); ctx.closePath(); ctx.fillStyle=COLORS[i%COLORS.length]; ctx.fill(); angle+=sl; });
    ctx.beginPath(); ctx.arc(cx,cy,ri,0,2*Math.PI); ctx.fillStyle='white'; ctx.fill();
  }, [data,size]);
  return <canvas ref={ref} style={{width:size,height:size,flexShrink:0}} />;
}

function HBar({ data }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d=>Number(d.total_value)));
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      {data.map((d,i) => (
        <div key={i}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}>
            <span style={{color:'var(--slate-700)',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'60%'}}>{d.product_name}</span>
            <span style={{color:'var(--slate-500)'}}>{fmt(d.total_value)}</span>
          </div>
          <div style={{height:6,background:'var(--slate-100)',borderRadius:3,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${(Number(d.total_value)/max)*100}%`,background:COLORS[i%COLORS.length],borderRadius:3}} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [stats,  setStats]   = useState(null);
  const [sum,    setSum]     = useState(null);
  const [loading,setLoading] = useState(true);

  useEffect(() => {
    Promise.all([productsApi.getStats(), stockApi.getSummary()])
      .then(([s,sm]) => { setStats(s.data); setSum(sm.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{color:'var(--slate-400)',padding:40,textAlign:'center'}}>Loading dashboard…</div>;

  return (
    <div>
      <div style={s.statsGrid}>
        {[
          ['Total Products', stats?.total_products??'—', 'var(--slate-900)', 'Active SKUs'],
          ['Stock Value',    fmt(stats?.total_value),     '#239b8b',         'Cost × quantity'],
          ['Low Stock',      stats?.low_stock??'—',       'var(--warning)',   '≤ 5 units'],
          ['Out of Stock',   stats?.out_of_stock??'—',    'var(--danger)',    'Needs replenishment'],
        ].map(([lbl,val,color,sub]) => (
          <div key={lbl} style={s.statCard}>
            <div style={s.statLbl}>{lbl}</div>
            <div style={{...s.statVal,color}}>{val}</div>
            <div style={s.statSub}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={s.row2}>
        <div style={s.card}>
          <div style={s.secLbl}>Stock movements — last 7 days</div>
          {sum?.recentMovements?.length
            ? <><BarChart data={sum.recentMovements}/><div style={{display:'flex',gap:14,marginTop:8,fontSize:11,color:'var(--slate-500)'}}>
                <span><span style={{display:'inline-block',width:8,height:8,borderRadius:2,background:'#239b8b',marginRight:4}}/>Added</span>
                <span><span style={{display:'inline-block',width:8,height:8,borderRadius:2,background:'#d97706',marginRight:4}}/>Removed</span>
              </div></>
            : <div style={{height:130,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--slate-300)',fontSize:13}}>No movements yet</div>
          }
        </div>
        <div style={s.card}>
          <div style={s.secLbl}>Value by category</div>
          {sum?.byCategory?.length
            ? <div style={{display:'flex',gap:16,alignItems:'center'}}>
                <DonutChart data={sum.byCategory}/>
                <div style={{flex:1,display:'flex',flexDirection:'column',gap:7}}>
                  {sum.byCategory.slice(0,6).map((d,i) => (
                    <div key={d.category} style={{display:'flex',alignItems:'center',gap:6,fontSize:12}}>
                      <span style={{width:8,height:8,borderRadius:'50%',background:COLORS[i],flexShrink:0}}/>
                      <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'var(--slate-700)'}}>{d.category}</span>
                      <span style={{color:'var(--slate-400)'}}>{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            : <div style={{height:130,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--slate-300)',fontSize:13}}>No categories yet</div>
          }
        </div>
      </div>

      <div style={s.cardFull}>
        <div style={s.secLbl}>Top products by stock value</div>
        <HBar data={sum?.topByValue}/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={s.tblCard}>
          <div style={s.tblHead}><div style={s.secLbl}>⚠ Low stock alerts</div></div>
          {sum?.lowStock?.length
            ? sum.lowStock.map((p,i) => (
                <div key={p.id} style={s.tblRow(i<sum.lowStock.length-1)}>
                  <span style={s.qDot(p.quantity)}>{p.quantity}</span>
                  <span style={{flex:1,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.product_name}</span>
                  <span style={{fontSize:11,color:'var(--slate-400)',fontFamily:'var(--mono)'}}>{p.product_id}</span>
                </div>
              ))
            : <div style={{padding:'24px 16px',textAlign:'center',color:'var(--slate-400)',fontSize:13}}>All products well stocked ✓</div>
          }
        </div>
        <div style={s.tblCard}>
          <div style={s.tblHead}><div style={s.secLbl}>Categories overview</div></div>
          {sum?.byCategory?.length
            ? sum.byCategory.map((c,i) => (
                <div key={c.category} style={s.tblRow(i<sum.byCategory.length-1)}>
                  <span style={{width:10,height:10,borderRadius:'50%',background:COLORS[i],flexShrink:0}}/>
                  <span style={{flex:1,fontWeight:500}}>{c.category}</span>
                  <span style={{fontSize:12,color:'var(--slate-500)',marginRight:8}}>{c.count} products</span>
                  <span style={{fontSize:12,color:'#239b8b',fontWeight:500}}>{fmt(c.total_value)}</span>
                </div>
              ))
            : <div style={{padding:'24px 16px',textAlign:'center',color:'var(--slate-400)',fontSize:13}}>No data yet</div>
          }
        </div>
      </div>
    </div>
  );
}
