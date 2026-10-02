import {useStore} from '../store.jsx';
export default function useStaleRecord(initial){
 const {state}=useStore();
 if(!initial?.id)return false;
 const current=['projects','clients','tasks','expenses','notes','proposals','invoices'].flatMap(key=>state[key]).find(r=>r.id===initial.id);
 return !current||JSON.stringify(current)!==JSON.stringify(initial);
}
