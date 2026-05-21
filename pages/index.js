import { useState, useEffect } from 'react';
import Head from 'next/head';

const CO={"37943655705":"Caixa Economica Federal","34704952133":"Serasa Experian","43460547912":"Wildlife Studios","41926280476":"Pizzería Popular","34443680137":"Bepass","51297382658":"Didi","51367817475":"Wati","50571792907":"Idwall","35525473297":"Q2 Ingressos","40788964879":"Reserva","34346355307":"Mercado Bitcoin","34524408169":"VTEX","35376103337":"Certisign","34733463555":"Payface","51031989019":"Belvo","35606139673":"Web Summit","34445639072":"Inter","38285628673":"Grupo Vega","48561435187":"FRQTAL Argentina","15604001312":"Laptop Aid","38487383212":"Menos Cero SA","48487246465":"QUBA","9429505845":"Blockchain Summit Latam","17450061403":"ALAP","9503051266":"Crypstation","9512188989":"Del Patio Brokers","9256171166":"Intuitivo Tech","9381627751":"Buenos Aires City Gov.","9393620824":"IRSA","9116693507":"Univ. de los Andes","9401471604":"River Plate"};
const OW={"82408554":"Sebastian F.","92171634":"Bruno C.","203235164":"Martin M.","85111884":"Matias L.","89147863":"Roberto F.","80246179":"Juliana F.","86572223":"Nicolas M.","83119534":"Florencia C."};
const SO=["0. Targeted","1. Engaged","2. Qualified","3. Scoping","4. Proposal","5. Compliance","6. Contracting","7. Integrating","8. Live","9. Disengaged","10. Disqualified"];
const SS={"0. Targeted":{bg:"#F1EFE8",t:"#444441",d:"#888780"},"1. Engaged":{bg:"#E6F1FB",t:"#0C447C",d:"#378ADD"},"2. Qualified":{bg:"#EAF3DE",t:"#27500A",d:"#639922"},"3. Scoping":{bg:"#FAEEDA",t:"#633806",d:"#EF9F27"},"4. Proposal":{bg:"#EEEDFE",t:"#3C3489",d:"#7F77DD"},"5. Compliance":{bg:"#FDE8F5",t:"#6B1150",d:"#C248A0"},"6. Contracting":{bg:"#FBEAF0",t:"#72243E",d:"#D4537E"},"7. Integrating":{bg:"#E1F5EE",t:"#085041",d:"#1D9E75"},"8. Live":{bg:"#EAF3DE",t:"#173404",d:"#639922"},"9. Disengaged":{bg:"#F1EFE8",t:"#444441",d:"#888780"},"10. Disqualified":{bg:"#FCEBEB",t:"#791F1F",d:"#E24B4A"}};
const PS={"World ID Integrations":{bg:"#E6F1FB",t:"#0C447C"},"World ID Rewards":{bg:"#EAF3DE",t:"#085041"}};

function pip(id){return id==="766601375"?"World ID Rewards":"World ID Integrations";}
function stg(id){const m={"1286198832":"3. Scoping","1286198833":"4. Proposal","1286198834":"7. Integrating","1286198835":"8. Live","216637275":"1. Engaged","216637276":"1. Engaged","216637277":"2. Qualified","216637278":"2. Qualified","216637279":"2. Qualified","216637280":"2. Qualified","216637281":"2. Qualified","216637282":"3. Scoping","216637283":"3. Scoping","216637284":"4. Proposal","216637285":"4. Proposal","216591231":"6. Contracting","216591232":"8. Live","216591233":"10. Disqualified","1134632075":"1. Engaged","1134632076":"1. Engaged","1117209921":"3. Scoping","1121199287":"3. Scoping","1121199288":"6. Contracting","1117209922":"7. Integrating","1128872231":"7. Integrating","1121199289":"8. Live","1117209926":"10. Disqualified","1121199360":"10. Disqualified","1136897719":"0. Targeted","1136897720":"0. Targeted","1136897721":"1. Engaged","1136897792":"2. Qualified","appointmentscheduled":"1. Engaged","closedlost":"10. Disqualified","presentationscheduled":"2. Qualified","28660275":"3. Scoping","1136895810":"0. Targeted"};return m[id]||"0. Targeted";}
function cname(ci,dn){if(ci&&CO[ci])return CO[ci];if(dn){const p=dn.split(" - ");if(p.length>1)return p[0].trim();}return dn||"—";}

export default function Tracker() {
  const [deals,setDeals]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [lastSynced,setLastSynced]=useState(null);
  const [sortKey,setSortKey]=useState("lastmod");
  const [sortDir,setSortDir]=useState("desc");
  const [activeStage,setActiveStage]=useState("All");
  const [search,setSearch]=useState("");
  const [filterPipeline,setFilterPipeline]=useState("All");
  const [filterCountry,setFilterCountry]=useState("All");
  const [filterOwner,setFilterOwner]=useState("All");
  const [filterStage,setFilterStage]=useState("All");

  useEffect(()=>{ loadDeals(); },[]);

  async function loadDeals(){
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/sync");
      const data = await res.json();
      if(data.error) throw new Error(data.error);
      const seen=new Set();
      const mapped=(data.deals||[]).filter(d=>{if(seen.has(d.id))return false;seen.add(d.id);return true;}).map(d=>({...d,company:cname(d.companyId,d.dealname),pipeline:pip(d.pipeline),stage:stg(d.dealstage),ownerLabel:OW[d.owner]||("Owner "+d.owner)}));
      setDeals(mapped);
      setLastSynced(data.lastSynced);
    } catch(e){ setError(e.message); }
    finally{ setLoading(false); }
  }

  const owners=["All",...new Set(deals.map(d=>d.ownerLabel))].sort();
  const countries=["All",...new Set(deals.map(d=>d.country).filter(Boolean))].sort();
  const stages=["All",...SO.filter(s=>deals.some(d=>d.stage===s))];
  const stageCounts=SO.reduce((a,s)=>{a[s]=deals.filter(d=>d.stage===s).length;return a;},{});
  const active=deals.filter(d=>!["10. Disqualified","9. Disengaged"].includes(d.stage)).length;

  const filtered=deals
    .filter(d=>filterPipeline==="All"||d.pipeline===filterPipeline)
    .filter(d=>filterCountry==="All"||d.country===filterCountry)
    .filter(d=>filterOwner==="All"||d.ownerLabel===filterOwner)
    .filter(d=>(filterStage==="All"||d.stage===filterStage)&&(activeStage==="All"||d.stage===activeStage))
    .filter(d=>!search||[d.company,d.dealname,d.use_case,d.ownerLabel,d.description,d.country].join(" ").toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>{let av=sortKey==="stage"?SO.indexOf(a.stage):(a[sortKey]||""),bv=sortKey==="stage"?SO.indexOf(b.stage):(b[sortKey]||"");return av<bv?(sortDir==="asc"?-1:1):av>bv?(sortDir==="asc"?1:-1):0;});

  function handleSort(k){if(sortKey===k)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortKey(k);setSortDir("asc");}}

  function exportCSV(){
    const h=["Company","Deal name","Pipeline","Use case","Owner","Stage","Country","Region","Last activity","Notes","HubSpot URL"];
    const rows=filtered.map(d=>[`"${d.company}"`,`"${d.dealname}"`,d.pipeline,`"${d.use_case||""}"`,d.ownerLabel,d.stage,d.country||"",d.region||"",d.lastActivity||"",`"${(d.description||"").replace(/"/g,'""')}"`,`https://app.hubspot.com/contacts/22310328/record/0-3/${d.id}`]);
    const csv=[h,...rows].map(r=>r.join(",")).join("\n");
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    const a=document.createElement("a");a.href=url;a.download=`latam_bd_${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url);
  }

  const cols=[{k:"company",l:"Company",w:"14%"},{k:"pipeline",l:"Pipeline",w:"10%"},{k:"use_case",l:"Use case",w:"12%"},{k:"ownerLabel",l:"Owner",w:"9%"},{k:"stage",l:"Stage",w:"13%"},{k:"country",l:"Country",w:"8%"},{k:"region",l:"Region",w:"6%"},{k:"lastActivity",l:"Last activity",w:"9%"},{k:"description",l:"Notes",w:"19%"}];

  const fmtDate = d => { try { return new Date(d).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}); } catch { return d; }};

  return(<>
    <Head><title>LatAm BD Pipeline Tracker</title></Head>
    <style>{`*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8f8f6;color:#111;font-size:13px}.header{background:#fff;border-bottom:0.5px solid #e5e5e5;padding:16px 24px;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:10}button{display:inline-flex;align-items:center;gap:5px;font-size:12px;padding:6px 12px;border:0.5px solid #ccc;background:#fff;color:#111;border-radius:8px;cursor:pointer}button:hover{background:#f5f5f5}button:disabled{opacity:.4;cursor:default}.main{padding:20px 24px}.sbar{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:12px;padding:8px 10px;background:#fff;border-radius:8px;border:0.5px solid #e5e5e5}.sp{display:inline-flex;align-items:center;gap:4px;border-radius:99px;font-size:11px;font-weight:500;padding:2px 8px;cursor:pointer;border:0.5px solid transparent;background:transparent}.pc{min-width:16px;height:16px;border-radius:99px;font-size:10px;font-weight:600;display:flex;align-items:center;justify-content:center;color:#fff}.filters{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap}input,select{font-size:12px;padding:7px 10px;border:0.5px solid #ddd;border-radius:8px;background:#fff;color:#111}.tw{overflow-x:auto;border-radius:10px;border:0.5px solid #e5e5e5;background:#fff}table{width:100%;border-collapse:collapse;font-size:12px;table-layout:fixed;min-width:1000px}thead tr{background:#f9f9f9;border-bottom:0.5px solid #e5e5e5}th{padding:8px 10px;text-align:left;font-weight:500;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#666;white-space:nowrap;cursor:pointer;user-select:none}td{padding:8px 10px;border-bottom:0.5px solid #f0f0f0;vertical-align:middle}tr:last-child td{border-bottom:none}tr:hover td{background:#fafafa}.cp{font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cm,.ch,.cn{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cm{color:#555}.ch{color:#aaa;font-size:11px}.cn{color:#555;font-size:11px}.bdg{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:500;padding:2px 8px;border-radius:99px;white-space:nowrap}.dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}.pb{display:inline-block;font-size:10px;padding:2px 7px;border-radius:4px;white-space:nowrap;font-weight:500}.lnk{color:#0070f3;text-decoration:none;font-size:10px;margin-right:4px}.tally{font-size:11px;color:#aaa;text-align:right;margin-top:6px}.empty{text-align:center;padding:4rem 0;color:#aaa;font-size:14px}.err{background:#fff0f0;color:#a32d2d;border:0.5px solid #f09595;border-radius:8px;padding:12px 16px;font-size:13px;margin-bottom:12px}.skel{height:44px;border-radius:6px;margin-bottom:6px;background:#f0f0f0;animation:pulse 1.4s ease-in-out infinite}.notice{background:#fffbea;color:#7a5c00;border:0.5px solid #f0d060;border-radius:8px;padding:10px 14px;font-size:12px;margin-bottom:12px}@keyframes pulse{0%,100%{opacity:.4}50%{opacity:.8}}`}</style>

    <div className="header">
      <div>
        <p style={{fontSize:11,letterSpacing:'.07em',textTransform:'uppercase',color:'#999',marginBottom:2}}>LatAm · BD pipeline</p>
        <h1 style={{fontSize:18,fontWeight:500}}>Partner tracker</h1>
      </div>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        {lastSynced && <span style={{fontSize:11,color:'#999'}}>{deals.length} deals · {active} active · Updated {fmtDate(lastSynced)}</span>}
        <button onClick={exportCSV} disabled={!filtered.length}>↓ Export CSV</button>
      </div>
    </div>

    <div className="main">
      {!loading && deals.length === 0 && !error && (
        <div className="notice">
          ℹ️ No data yet — ask Sebastian to run a sync from Claude to populate the tracker.
        </div>
      )}

      <div className="sbar">
        {SO.filter(s=>stageCounts[s]>0).map(s=>{const sc=SS[s]||{bg:"#eee",t:"#444",d:"#999"};return<button key={s} className="sp" onClick={()=>{setActiveStage(activeStage===s?"All":s);setFilterStage("All");}} style={{color:sc.t,background:activeStage===s?sc.bg:'transparent',borderColor:activeStage===s?sc.d:'transparent'}}>{s}<span className="pc" style={{background:sc.d}}>{stageCounts[s]}</span></button>;})}
      </div>

      <div className="filters">
        <input style={{flex:'1 1 180px'}} type="text" placeholder="Search company, owner, use case…" value={search} onChange={e=>setSearch(e.target.value)}/>
        <select value={filterPipeline} onChange={e=>setFilterPipeline(e.target.value)}><option value="All">Both pipelines</option><option value="World ID Integrations">WID Integrations</option><option value="World ID Rewards">WID Rewards</option></select>
        <select value={filterCountry} onChange={e=>setFilterCountry(e.target.value)}>{countries.map(c=><option key={c} value={c}>{c==="All"?"All countries":c}</option>)}</select>
        <select value={filterOwner} onChange={e=>setFilterOwner(e.target.value)}>{owners.map(o=><option key={o} value={o}>{o==="All"?"All owners":o}</option>)}</select>
        <select value={filterStage} onChange={e=>{setFilterStage(e.target.value);setActiveStage("All");}}>{stages.map(s=><option key={s} value={s}>{s==="All"?"All stages":s}</option>)}</select>
      </div>

      {error && <div className="err"><strong>Error loading data</strong> — {error}</div>}

      {loading ? <div>{[...Array(8)].map((_,i)=><div key={i} className="skel" style={{animationDelay:`${i*.1}s`}}/>)}</div>
      : filtered.length===0 && deals.length > 0 ? <div className="empty">No deals match your filters.</div>
      : filtered.length > 0 ? <>
        <div className="tw">
          <table>
            <colgroup>{cols.map(c=><col key={c.k} style={{width:c.w}}/>)}</colgroup>
            <thead><tr>{cols.map(c=><th key={c.k} onClick={()=>handleSort(c.k)}>{c.l} {sortKey===c.k?(sortDir==="asc"?"↑":"↓"):"⇅"}</th>)}</tr></thead>
            <tbody>
              {filtered.map((d,i)=>{
                const sc=SS[d.stage]||{bg:"#eee",t:"#444",d:"#999"};
                const pc=PS[d.pipeline]||{bg:"#eee",t:"#444"};
                return<tr key={d.id||i}>
                  <td className="cp"><a className="lnk" href={`https://app.hubspot.com/contacts/22310328/record/0-3/${d.id}`} target="_blank" rel="noreferrer">↗</a>{d.company}</td>
                  <td><span className="pb" style={{background:pc.bg,color:pc.t}}>{d.pipeline==="World ID Integrations"?"Integrations":"Rewards"}</span></td>
                  <td className="cm" title={d.use_case||""}>{d.use_case||"—"}</td>
                  <td className="cm">{d.ownerLabel}</td>
                  <td><span className="bdg" style={{background:sc.bg,color:sc.t}}><span className="dot" style={{background:sc.d}}/>{d.stage}</span></td>
                  <td className="cm">{d.country||"—"}</td>
                  <td className="ch">{d.region||"—"}</td>
                  <td className="ch">{d.lastActivity||"—"}</td>
                  <td className="cn" title={d.description||""}>{d.description||"—"}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
        <p className="tally">Showing {filtered.length} of {deals.length} deals</p>
      </> : null}
    </div>
  </>);
}
