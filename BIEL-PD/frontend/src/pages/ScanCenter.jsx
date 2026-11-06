import { useEffect, useState } from 'react'
import {
  ScanSearch, ShieldAlert, ShieldCheck, LoaderCircle, Info, Braces,
  Globe, AlertTriangle, ExternalLink
} from 'lucide-react'
import { getSample, getModelInfo, predict, scanUrl } from '../services/api'

export default function ScanCenter() {
  const [sample, setSample] = useState(null)
  const [info, setInfo] = useState(null)
  const [model, setModel] = useState('ais_hho')
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [url, setUrl] = useState('')
  const [urlResult, setUrlResult] = useState(null)
  const [urlBusy, setUrlBusy] = useState(false)
  const [urlError, setUrlError] = useState('')

  useEffect(() => {
    Promise.all([getSample(), getModelInfo()])
      .then(([s, i]) => { setSample(s); setInfo(i) })
      .catch(e => setError(e.response?.data?.detail || 'Backend unavailable. Train the model first.'))
  }, [])

  async function runFeatureInference() {
    if (!sample) return
    setBusy(true); setError(''); setResult(null)
    try { setResult(await predict(sample, model)) }
    catch (e) {
      setError(typeof e.response?.data?.detail === 'string'
        ? e.response.data.detail
        : JSON.stringify(e.response?.data?.detail || e.message))
    } finally { setBusy(false) }
  }

  async function runUrlPreflight(event) {
    event.preventDefault()
    setUrlBusy(true); setUrlError(''); setUrlResult(null)
    try { setUrlResult(await scanUrl(url)) }
    catch (e) {
      setUrlError(typeof e.response?.data?.detail === 'string'
        ? e.response.data.detail
        : JSON.stringify(e.response?.data?.detail || e.message))
    } finally { setUrlBusy(false) }
  }

  return <div className="page">
    <div className="page-heading">
      <div>
        <div className="eyebrow">THREAT ANALYSIS / SCAN CENTER</div>
        <h1>Detection workbench</h1>
        <p>Inspect a URL and run inference against a complete research feature record.</p>
      </div>
      <div className="section-tag">MODEL INFERENCE</div>
    </div>

    <div className="notice">
      <Info size={17} />
      <div>
        <b>Research-model compatibility</b>
        <p>The trained BIEL-PD models require all {info?.feature_count || 53} PhiUSIIL features. The notebook does not provide a raw-URL extraction method for that complete schema. URL preflight below is a separate, transparent heuristic check and does not claim a trained-model verdict.</p>
      </div>
    </div>

    <section className="panel url-panel">
      <div className="panel-head">
        <div><h3><Globe size={16} className="inline-icon" /> URL preflight</h3><p>URL-only indicators · no webpage fetched · no trained-model prediction</p></div>
        <span className="section-tag">PRELIMINARY CHECK</span>
      </div>
      <form onSubmit={runUrlPreflight}>
        <label className="field-label" htmlFor="url-input">URL TO INSPECT</label>
        <div className="url-entry">
          <input id="url-input" className="url-input" type="url" required maxLength={2048}
            placeholder="https://example.com/login" value={url}
            onChange={e => { setUrl(e.target.value); setUrlResult(null); setUrlError('') }} />
          <button className="primary-btn url-submit" type="submit" disabled={urlBusy || !url.trim()}>
            {urlBusy ? <><LoaderCircle className="spin" size={16}/> Checking...</> : <><ScanSearch size={16}/> Inspect URL</>}
          </button>
        </div>
      </form>
      {urlError && <div className="error-text">{urlError}</div>}
      {urlResult && <div className="url-result">
        <div className="url-result-head">
          <div><small>PRELIMINARY RESULT</small><b>{urlResult.risk_indicator_count === 0 ? 'No listed indicators detected' : `${urlResult.risk_indicator_count} indicator${urlResult.risk_indicator_count === 1 ? '' : 's'} detected`}</b></div>
          <span className="not-classified">NOT A MODEL VERDICT</span>
        </div>
        <div className="url-host"><ExternalLink size={13}/><span>{urlResult.observations.hostname}</span></div>
        {urlResult.indicators.length > 0 ? <div className="indicator-list">
          {urlResult.indicators.map(item => <div className="indicator-row" key={item.code}>
            <AlertTriangle size={15}/><div><b>{item.label}</b>{item.matches && <small>Matched terms: {item.matches.join(', ')}</small>}</div><span>{item.severity}</span>
          </div>)}
        </div> : <div className="no-indicators"><ShieldCheck size={16}/> No indicators from this limited rule set were found. This does not prove the URL is safe.</div>}
        <div className="url-observations">
          <div><span>Protocol</span><b>{urlResult.observations.scheme.toUpperCase()}</b></div>
          <div><span>URL length</span><b>{urlResult.observations.url_length}</b></div>
          <div><span>HTTPS</span><b>{urlResult.observations.uses_https ? 'Yes' : 'No'}</b></div>
          <div><span>Subdomain levels</span><b>{urlResult.observations.subdomain_label_count}</b></div>
        </div>
        <p className="url-disclaimer">{urlResult.disclaimer}</p>
      </div>}
    </section>

    <div className="section-head">
      <div><h2>Research model inference</h2><p>Uses a real feature record from the PhiUSIIL dataset, not the URL entered above.</p></div>
      <span className="section-tag">53-FEATURE INPUT</span>
    </div>
    <div className="scan-layout">
      <div className="panel scan-form">
        <div className="panel-head"><div><h3>Configure analysis</h3><p>Select the trained classifier</p></div><div className="mini-icon"><ScanSearch size={18}/></div></div>
        <label className="field-label">DETECTION MODEL</label>
        <select value={model} onChange={e => { setModel(e.target.value); setResult(null) }}>
          <option value="ais_hho">AIS + HHO-style (recommended)</option>
          <option value="ais">AIS only</option>
          <option value="random_forest">Baseline Random Forest</option>
        </select>
        <div className="sample-box">
          <div className="sample-title"><Braces size={16}/> DATASET FEATURE SAMPLE</div>
          <p>{info ? `${info.feature_count} numerical features loaded from the training schema.` : 'Waiting for backend...'}</p>
          <div className="sample-preview">{sample ? Object.entries(sample).slice(0, 5).map(([k, v]) => <div key={k}><span>{k}</span><b>{Number(v).toFixed(3)}</b></div>) : 'No feature sample loaded.'}</div>
        </div>
        <button className="primary-btn" disabled={!sample || busy} onClick={runFeatureInference}>
          {busy ? <><LoaderCircle className="spin" size={17}/> Running inference...</> : <><ScanSearch size={17}/> Run dataset-sample inference</>}
        </button>
        {error && <div className="error-text">{error}</div>}
      </div>
      <div className="panel result-panel">
        <div className="panel-head"><div><h3>Analysis result</h3><p>Prediction from the selected model</p></div><span className="section-tag">OUTPUT</span></div>
        {!result ? <div className="result-empty"><div className="result-empty-icon"><ShieldAlert size={27}/></div><b>Awaiting analysis</b><p>Run inference on the displayed dataset feature record.</p></div> : <div className="result-content">
          <div className={result.label === 1 ? 'verdict danger' : 'verdict safe'}>{result.label === 1 ? <ShieldAlert size={26}/> : <ShieldCheck size={26}/>}<div><small>CLASSIFICATION</small><strong>{result.prediction}</strong></div></div>
          <div className="result-details"><div><span>Model</span><b>{result.model.replace('_', ' ').toUpperCase()}</b></div><div><span>Distance / score</span><b>{result.score.toFixed(5)}</b></div>{result.threshold !== null && <div><span>Decision threshold</span><b>{result.threshold.toFixed(3)}</b></div>}</div>
          <p className="explanation">{result.explanation}</p>
        </div>}
      </div>
    </div>
  </div>
}
