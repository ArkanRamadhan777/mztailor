import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
export function useSupabaseList<T>(table:string, select='*', order='created_at'){
 const [data,setData]=useState<T[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('')
 const load=useCallback(async()=>{setLoading(true);setError('');const {data:rows,error:e}=await supabase.from(table).select(select).order(order,{ascending:false});if(e)setError(e.message);else setData((rows??[]) as T[]);setLoading(false)},[table,select,order])
 useEffect(()=>{void load()},[load]);return {data,setData,loading,error,reload:load}
}
