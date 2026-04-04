import { useMemo } from 'react';

export function useTenant() {
  const tenant = useMemo(() => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');

    if (parts.length >= 2 && !['www', 'localhost'].includes(parts[0])) {
      return { slug: parts[0], id: parts[0] };
    }

    return { slug: 'default', id: 'default' };
  }, []);

  return tenant;
}
