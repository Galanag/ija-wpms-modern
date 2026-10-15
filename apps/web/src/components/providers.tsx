'use client';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {useState} from 'react';
import {HydrationFix} from './hydration-fix';
export function Providers({children}:{children:React.ReactNode}){
  const [qc]=useState(()=>new QueryClient({defaultOptions:{queries:{staleTime:30_000,retry:1}}}));
  return <HydrationFix><QueryClientProvider client={qc}>{children}</QueryClientProvider></HydrationFix>;
}
