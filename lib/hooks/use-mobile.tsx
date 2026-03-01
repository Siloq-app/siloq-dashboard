import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    // Ensure we're in a browser environment
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Use modern addEventListener if available, fallback to addListener for older browsers
    if (mql.addEventListener) {
      mql.addEventListener('change', onChange);
    } else {
      // Fallback for older browsers
      mql.addListener(onChange);
    }

    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    return () => {
      // Use modern removeEventListener if available, fallback to removeListener for older browsers
      if (mql.removeEventListener) {
        mql.removeEventListener('change', onChange);
      } else {
        // Fallback for older browsers
        mql.removeListener(onChange);
      }
    };
  }, []);

  return !!isMobile;
}
