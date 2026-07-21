import * as React from "react";

// Simple hook to detect if the viewport is "mobile" based on a width breakpoint.
// Defaults to 768px, which you can adjust if needed.
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const update = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    update();
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("resize", update);
    };
  }, [breakpoint]);

  return isMobile;
}

