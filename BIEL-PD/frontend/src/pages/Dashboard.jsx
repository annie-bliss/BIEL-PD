import { useEffect,useState } from 'react'
import { ShieldCheck,Target,Activity,Database,ArrowUpRight,RefreshCw } from 'lucide-react'
import MetricCard from '../components/MetricCard'
import PipelineFlow from '../components/PipelineFlow'
import DetectionChart from '../components/DetectionChart'
import {getMetrics,getModelInfo} from '../services/api'
export default function Dashboard({health}) {
 const [metrics,setMetrics]=useState(null),[info,setInfo]=useState(null),[error,setError]=useState('')
 useEffect(()=>{Promise.all([getMetrics(),getModelInfo()]).then(([m,i])=>{setMetrics(m);setInfo(i)}).catch(e=>setError(e.response?.data?.detail||'Connect the backend and train the models to load live metrics.'))},[])
 const best=metrics?.models?.find(m=>m.key==='ais_hho')
 return <div className="page">
  <div className="page-heading"><div><div className="eyebrow">SECURITY OPERATIONS / OVERVIEW</div><h1>Phishing intelligence</h1><p>Monitor model performance and inspect the bio-inspired detection workflow.</p></div><div className="live-pill"><span className="pulse-dot"/> {health?.trained?'SYSTEM OPERATIONAL':'AWAITING MODEL ARTIFACTS'}</div></div>
  {error&&!metrics&&<div className="notice"><Activity size={17}/><div><b>ML backend not connected yet</b><p>{error}</p></div></div>}
  <div className="metric-grid">
   <MetricCard label="AIS + HHO ACCURACY" value={best?(best.accuracy*100).toFixed(2)+'%':'—'} sub="Held-out test set" icon={ShieldCheck}/>
   <MetricCard label="F1 SCORE" value={best?(best.f1*100).toFixed(2)+'%':'—'} sub="AIS + HHO model" icon={Target} accent="violet"/>
   <MetricCard label="TRAINING FEATURES" value={info?.feature_count??'—'} sub="Numeric dataset features" icon={Database} accent="blue"/>
   <MetricCard label="AIS DETECTORS" value={info?.ais_detectors??'—'} sub="Phishing detector bank" icon={Activity} accent="green"/>
  </div>
  <div className="section-head"><div><h2>Detection architecture</h2><p>From dataset preparation to threat classification</p></div><span className="section-tag">RESEARCH PIPELINE</span></div>
  <div className="panel"><PipelineFlow/></div>
  <div className="two-col">
   <div className="panel"><div className="panel-head"><div><h3>Model comparison</h3><p>Held-out test performance</p></div><span className="section-tag">LIVE METRICS</span></div>{metrics?<DetectionChart models={metrics.models}/>:<div className="empty-chart">Train the models to populate this chart.</div>}</div>
   <div className="panel"><div className="panel-head"><div><h3>Training configuration</h3><p>Experiment parameters</p></div></div>
    <div className="config-list">
     <div><span>Dataset</span><b>UCI PhiUSIIL · #967</b></div><div><span>Data split</span><b>60 / 20 / 20</b></div><div><span>Random Forest</span><b>200 estimators</b></div><div><span>AIS detector bank</span><b>300 detectors</b></div><div><span>Threshold candidates</span><b>26 · 0.10–0.60</b></div><div><span>Optimized threshold</span><b>{metrics?.training?.best_threshold?.toFixed(3)??'—'}</b></div>
    </div>
   </div>
  </div>
  <div className="footnote">Research prototype · Metrics are loaded from your locally trained model artifacts. This interface does not claim live URL inspection.</div>
 </div>
}
