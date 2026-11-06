import {useEffect,useState} from 'react'
import {Waves,ShieldCheck,Activity,AlertTriangle} from 'lucide-react'
import {getMetrics} from '../services/api'
export default function AdversarialLab(){
 const [m,setM]=useState(null)
 useEffect(()=>{getMetrics().then(setM).catch(()=>{})},[])
 const r=m?.robustness
 return <div className="page"><div className="page-heading"><div><div className="eyebrow">ROBUSTNESS / ADVERSARIAL TESTING</div><h1>Adversarial lab</h1><p>Inspect how AIS + HHO-style responds to perturbed phishing feature vectors.</p></div><span className="section-tag">GAUSSIAN MUTATION</span></div>
 <div className="notice"><AlertTriangle size={17}/><div><b>Controlled feature perturbation</b><p>This experiment adds Gaussian noise (mean 0, standard deviation 0.2) to scaled phishing test samples, then clips features to [0, 1]. It is a feature-space robustness test, not a live attacker simulation.</p></div></div>
 {r?<><div className="metric-grid"><div className="metric-card"><div className="metric-top"><span>MUTATED SAMPLE COUNT</span><div className="metric-icon blue"><Waves size={17}/></div></div><div className="metric-value">{r.clean_phishing_samples.toLocaleString()}</div><div className="metric-sub">Phishing test samples perturbed</div></div><div className="metric-card"><div className="metric-top"><span>ROBUSTNESS ACCURACY</span><div className="metric-icon cyan"><ShieldCheck size={17}/></div></div><div className="metric-value">{(r.accuracy*100).toFixed(2)}%</div><div className="metric-sub">Mutated phishing samples</div></div><div className="metric-card"><div className="metric-top"><span>ROBUSTNESS F1</span><div className="metric-icon violet"><Activity size={17}/></div></div><div className="metric-value">{(r.f1*100).toFixed(2)}%</div><div className="metric-sub">Positive-class F1</div></div></div>
 <div className="panel"><h3>Mutation protocol</h3><div className="config-list"><div><span>Noise distribution</span><b>Normal (μ = 0, σ = 0.2)</b></div><div><span>Random seed</span><b>123</b></div><div><span>Feature clipping</span><b>[0, 1]</b></div><div><span>Classifier</span><b>AIS + HHO-style</b></div><div><span>True label</span><b>Phishing (1)</b></div></div></div>
 <div className="panel"><h3>Mutated phishing confusion counts</h3><div className="matrix"><div><small>TRUE POSITIVE</small><b>{r.confusion.tp.toLocaleString()}</b></div><div><small>FALSE NEGATIVE</small><b>{r.confusion.fn.toLocaleString()}</b></div></div></div></>:<div className="notice">Train models to load adversarial robustness results.</div>}
 </div>
}
