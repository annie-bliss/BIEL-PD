import { NavLink } from 'react-router-dom'
import { Shield, LayoutDashboard, ScanSearch, ChartNoAxesCombined, FlaskConical, Microscope, CircleHelp } from 'lucide-react'
const links = [
  {to:'/',label:'Overview',icon:LayoutDashboard},
  {to:'/scan',label:'Scan center',icon:ScanSearch},
  {to:'/analytics',label:'Model analytics',icon:ChartNoAxesCombined},
  {to:'/adversarial',label:'Adversarial lab',icon:FlaskConical},
]
export default function Sidebar({health}) {
 return <aside className="sidebar">
  <div className="brand"><div className="brand-mark"><Shield size={21}/></div><div><b>BIEL<span>-PD</span></b><small>THREAT INTELLIGENCE</small></div></div>
  <div className="nav-label">WORKSPACE</div>
  <nav>{links.map(({to,label,icon:Icon})=><NavLink end={to==='/'} to={to} key={to} className={({isActive})=>isActive?'nav-link active':'nav-link'}><Icon size={17}/>{label}</NavLink>)}</nav>
  <div className="sidebar-bottom">
    <div className="system-card"><div className="system-head"><span className="pulse-dot"/> API STATUS</div><b>{health?.trained?'Models online':'Backend not ready'}</b><small>{health?.trained?'ML artifacts loaded':'Start API + train models'}</small></div>
    <div className="side-foot"><Microscope size={15}/> Research prototype <span>v1.0</span></div>
  </div>
 </aside>
}
