import {useEffect,useState} from 'react'
import {getMetrics} from '../services/api'
import DetectionChart from '../components/DetectionChart'
export default function ModelAnalytics(){
 const [m,setM]=useState(null),[err,setErr]=useState('')
 useEffect(()=>{getMetrics().then(setM).catch(()=>setErr('Train models to view evaluation metrics.'))},[])
 return <div className="page"><div className="page-heading"><div><div className="eyebrow">EVALUATION / BENCHMARKS</div><h1>Model analytics</h1><p>Compare classification performance on the held-out test partition.</p></div><span className="section-tag">TEST SET</span></div>
 {err&&!m&&<div className="notice">{err}</div>}
 {m&&<><div className="panel"><div className="panel-head"><div><h3>Performance comparison</h3><p>All values are derived from the training run.</p></div></div><DetectionChart models={m.models}/></div>
 <div className="panel table-panel"><div className="panel-head"><div><h3>Evaluation report</h3><p>Accuracy, precision, recall, F1 and error rates</p></div></div><div className="table-scroll"><table><thead><tr><th>MODEL</th><th>ACCURACY</th><th>PRECISION</th><th>RECALL</th><th>F1 SCORE</th><th>FPR</th><th>FNR</th></tr></thead><tbody>{m.models.map(x=><tr key={x.key}><td className="model-name">{x.name}</td>{['accuracy','precision','recall','f1','fpr','fnr'].map(k=><td key={k}>{(x[k]*100).toFixed(2)}%</td>)}</tr>)}</tbody></table></div></div>
 <div className="two-col"><div className="panel"><h3>Confusion matrix · AIS + HHO</h3><div className="matrix"><div><small>TRUE NEGATIVE</small><b>{m.models[2].tn.toLocaleString()}</b></div><div><small>FALSE POSITIVE</small><b>{m.models[2].fp.toLocaleString()}</b></div><div><small>FALSE NEGATIVE</small><b>{m.models[2].fn.toLocaleString()}</b></div><div><small>TRUE POSITIVE</small><b>{m.models[2].tp.toLocaleString()}</b></div></div></div>
 <div className="panel"><h3>Experiment details</h3><div className="config-list"><div><span>Training records</span><b>{m.training.train_samples.toLocaleString()}</b></div><div><span>Validation records</span><b>{m.training.validation_samples.toLocaleString()}</b></div><div><span>Test records</span><b>{m.training.test_samples.toLocaleString()}</b></div><div><span>Features</span><b>{m.training.feature_count}</b></div><div><span>Best threshold</span><b>{m.training.best_threshold.toFixed(3)}</b></div><div><span>Validation F1</span><b>{(m.training.validation_f1*100).toFixed(2)}%</b></div></div></div></div></>}
 </div>
}
