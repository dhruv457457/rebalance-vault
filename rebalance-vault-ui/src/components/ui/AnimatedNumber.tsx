'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  duration?: number;
}

export function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  decimals = 2,
  className = '',
  duration = 1.5,
}: AnimatedNumberProps) {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) =>
    `${prefix}${v.toFixed(decimals)}${suffix}`
  );

  useEffect(() => {
    const controls = animate(motionVal, value, { duration, ease: 'easeOut' });
    return controls.stop;
  }, [value, motionVal, duration]);

  return <motion.span className={className}>{rounded}</motion.span>;
}
