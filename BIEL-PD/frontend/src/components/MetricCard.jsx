import { ArrowUpRight } from 'lucide-react'
export default function MetricCard({label,value,sub,icon:Icon,accent='cyan'}) {
 return <div className="metric-card"><div className="metric-top"><span>{label}</span><div className={'metric-icon '+accent}><Icon size={17}/></div></div><div className="metric-value">{value}</div><div className="metric-sub">{sub}<ArrowUpRight size={13}/></div></div>
}
