import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
ChartJS.register(CategoryScale,LinearScale,BarElement,Tooltip,Legend)
export default function DetectionChart({models=[]}) {
 const data={labels:models.map(m=>m.name),datasets:[
  {label:'Accuracy',data:models.map(m=>+(m.accuracy*100).toFixed(2)),backgroundColor:'#38bdf8',borderRadius:5},
  {label:'F1-score',data:models.map(m=>+(m.f1*100).toFixed(2)),backgroundColor:'#a78bfa',borderRadius:5}
 ]}
 return <div className="chart-wrap"><Bar data={data} options={{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#9ba8bc',usePointStyle:true,boxWidth:8,font:{size:11}}}},scales:{x:{ticks:{color:'#9ba8bc',font:{size:10}},grid:{display:false}},y:{min:0,max:100,ticks:{color:'#718096',callback:v=>v+'%'},grid:{color:'rgba(148,163,184,.1)'}}}}}/></div>
}
