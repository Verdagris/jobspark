"use client";

import { useInView, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef } from "react";

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  precision?: number;
}

export default function AnimatedCounter({
  value,
  suffix = "",
  precision = 0,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 200,
  });
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [motionValue, isInView, value]);

  useEffect(
    () =>
      springValue.on("change", (latest) => {
        if (ref.current) {
          const formattedValue = precision > 0 
            ? latest.toFixed(precision)
            : Intl.NumberFormat("en-US").format(Math.round(latest));
          ref.current.textContent = `${formattedValue}${suffix}`;
        }
      }),
    [springValue, suffix, precision]
  );

  return <span ref={ref} suppressHydrationWarning />;
}