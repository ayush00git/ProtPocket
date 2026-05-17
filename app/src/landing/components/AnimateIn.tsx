import React, { useRef } from 'react';
import { motion, useInView, useReducedMotion, type Variants } from 'framer-motion';

type From = 'bottom' | 'scale' | 'fade';

interface Props {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  from?: From;
  amount?: number;
}

const VARIANTS: Record<From, Variants> = {
  bottom: { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } },
  scale:  { hidden: { opacity: 0, scale: 0.96 }, visible: { opacity: 1, scale: 1 } },
  fade:   { hidden: { opacity: 0 }, visible: { opacity: 1 } },
};

export function AnimateIn({
  children,
  delay = 0,
  className,
  style,
  from = 'bottom',
  amount = 0.2,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount });
  const reduced = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      variants={VARIANTS[from]}
      initial={reduced ? 'visible' : 'hidden'}
      animate={reduced || inView ? 'visible' : 'hidden'}
      transition={{
        duration: from === 'scale' ? 0.6 : 0.9,
        ease: [0.22, 1, 0.36, 1],
        delay: reduced ? 0 : delay,
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

interface StaggerProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  stagger?: number;
  delayChildren?: number;
}

export function StaggerGroup({
  children,
  className,
  style,
  stagger = 0.08,
  delayChildren = 0,
}: StaggerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const reduced = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={reduced || inView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: reduced ? 0 : stagger,
            delayChildren: reduced ? 0 : delayChildren,
          },
        },
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
};
