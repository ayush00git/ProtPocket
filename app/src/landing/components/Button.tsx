import React from 'react';
import { Link } from 'react-router-dom';

type Variant = 'primary' | 'primary-inv' | 'ghost' | 'ghost-inv';

interface BaseProps {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}

interface LinkProps extends BaseProps {
  to: string;
  href?: never;
  onClick?: never;
}
interface AnchorProps extends BaseProps {
  href: string;
  to?: never;
  onClick?: never;
}
interface ButtonProps extends BaseProps {
  onClick?: () => void;
  to?: never;
  href?: never;
}

type Props = LinkProps | AnchorProps | ButtonProps;

const VARIANTS: Record<Variant, string> = {
  // dark pill on light bg
  primary:
    'bg-[#0d0d0b] text-[#f5f2ec] border-transparent hover:bg-[#2a2a26] hover:-translate-y-px hover:shadow-[0_10px_28px_rgba(13,13,11,0.18)]',
  // cream pill on dark bg
  'primary-inv':
    'bg-[#f5f2ec] text-[#0d0d0b] border-transparent hover:bg-white hover:-translate-y-px hover:shadow-[0_10px_28px_rgba(0,0,0,0.32)]',
  // outline on light bg
  ghost:
    'bg-transparent text-[#0d0d0b] border-[#0d0d0b]/20 hover:border-[#0d0d0b]/50 hover:bg-[#0d0d0b]/5',
  // outline on dark bg
  'ghost-inv':
    'bg-transparent text-[#f5f2ec] border-[#f5f2ec]/25 hover:border-[#f5f2ec]/60 hover:bg-[#f5f2ec]/5',
};

const BASE =
  "inline-flex items-center gap-2 font-['DM_Sans'] text-sm font-medium tracking-[0.02em] " +
  'px-7 py-3 rounded-full border whitespace-nowrap cursor-pointer ' +
  'transition-[background-color,color,border-color,transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]';

export function Button(props: Props) {
  const { children, variant = 'primary', className = '' } = props;
  const classes = `${BASE} ${VARIANTS[variant]} ${className}`;

  if ('to' in props && props.to) {
    return (
      <Link to={props.to} className={classes}>
        {children}
      </Link>
    );
  }
  if ('href' in props && props.href) {
    return (
      <a href={props.href} className={classes} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={'onClick' in props ? props.onClick : undefined}
      className={classes}
    >
      {children}
    </button>
  );
}

interface LinkCtaProps {
  to?: string;
  href?: string;
  children: React.ReactNode;
  tone?: 'teal' | 'inverse';
  className?: string;
}

export function LinkCta({ to, href, children, tone = 'teal', className = '' }: LinkCtaProps) {
  const color = tone === 'inverse' ? 'text-[#f5f2ec]' : 'text-[#1a5c52]';
  const cls =
    `group inline-flex items-center gap-2 font-['DM_Sans'] text-sm font-normal tracking-[0.02em] ` +
    `${color} relative ` +
    `after:content-[''] after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-px ` +
    `after:bg-current after:opacity-40 hover:after:opacity-100 ` +
    `after:transition-opacity after:duration-300 ${className}`;

  const inner = (
    <>
      {children}
      <span className="inline-block transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1">
        →
      </span>
    </>
  );

  if (to) return <Link to={to} className={cls}>{inner}</Link>;
  if (href) return <a href={href} className={cls} target="_blank" rel="noreferrer">{inner}</a>;
  return <span className={cls}>{inner}</span>;
}
