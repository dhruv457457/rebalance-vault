'use client';

interface StatusBadgeProps {
  status: 'online' | 'warning' | 'danger' | 'paused';
  label?: string;
}

const statusStyles = {
  online: { dot: 'bg-emerald-400', text: 'text-emerald-400', label: 'Live' },
  warning: { dot: 'bg-yellow-400', text: 'text-yellow-400', label: 'Warning' },
  danger: { dot: 'bg-rose-500', text: 'text-rose-500', label: 'Alert' },
  paused: { dot: 'bg-slate-500', text: 'text-slate-400', label: 'Paused' },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const styles = statusStyles[status];
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium">
      <span
        className={`h-2 w-2 rounded-full ${styles.dot} animate-pulse`}
        style={{ animationDuration: '1.5s' }}
      />
      <span className={styles.text}>{label ?? styles.label}</span>
    </span>
  );
}
