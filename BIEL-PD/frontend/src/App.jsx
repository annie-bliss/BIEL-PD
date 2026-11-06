import {useEffect,useState} from 'react'
import {Routes,Route,useLocation} from 'react-router-dom'
import {Bell,Search,ChevronRight} from 'lucide-react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import ScanCenter from './pages/ScanCenter'
import ModelAnalytics from './pages/ModelAnalytics'
import AdversarialLab from './pages/AdversarialLab'
import {getHealth} from './services/api'
const titles={'/':'Overview','/scan':'Scan center','/analytics':'Model analytics','/adversarial':'Adversarial lab'}
export default function App(){
 const [health,setHealth]=useState(null)
 const location=useLocation()
 useEffect(()=>{getHealth().then(setHealth).catch(()=>setHealth({status:'offline',trained:false}))},[])
 return <div className="app-shell"><Sidebar health={health}/><main className="main-area"><header className="topbar"><div className="crumb">BIEL-PD <ChevronRight size={14}/><b>{titles[location.pathname]||'Workspace'}</b></div><div className="top-actions"><span className="top-status"><i/> Research environment</span><div className="avatar">BP</div></div></header>
 <Routes><Route path="/" element={<Dashboard health={health}/>}/><Route path="/scan" element={<ScanCenter/>}/><Route path="/analytics" element={<ModelAnalytics/>}/><Route path="/adversarial" element={<AdversarialLab/>}/></Routes>
 </main></div>
}
