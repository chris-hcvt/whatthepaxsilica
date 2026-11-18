import { useEffect, useState } from 'react';

const QUERY = '(max-width: 899px)';

/** true on phone-width screens (the same breakpoint as the stylesheet's phone layout) */
export function usePhone() {
  const [phone, setPhone] = useState(() => window.matchMedia?.(QUERY).matches ?? false);
  useEffect(() => {
    const mq = window.matchMedia?.(QUERY);
    if (!mq) return;
    const on = () => setPhone(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return phone;
}
