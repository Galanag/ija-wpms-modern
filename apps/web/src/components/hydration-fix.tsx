'use client';
import {useEffect} from 'react';

export function HydrationFix({children}:{children:React.ReactNode}){
  useEffect(() => {
    // Remove browser extension injected attributes that cause hydration mismatches
    const extensions = ['bis_skin_checked', 'bis_register', 'data-newdetector', 'data-ext'];
    const removeAttrs = () => {
      extensions.forEach(attr => {
        document.querySelectorAll(`[${attr}]`).forEach(el => el.removeAttribute(attr));
      });
    };
    // Run after initial hydration
    setTimeout(removeAttrs, 100);
  }, []);
  return <>{children}</>;
}
