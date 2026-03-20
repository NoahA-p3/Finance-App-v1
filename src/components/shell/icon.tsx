interface IconProps {
  className?: string;
}

function BaseIcon({ className, path }: IconProps & { path: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

export const DashboardIcon = ({ className }: IconProps) => <BaseIcon className={className} path="M3 13h8V3H3v10Zm10 8h8V11h-8v10ZM3 21h8v-6H3v6Zm10-10h8V3h-8v8Z" />;
export const TransactionsIcon = ({ className }: IconProps) => <BaseIcon className={className} path="M4 7h16M4 12h16M4 17h10" />;
export const ReceiptIcon = ({ className }: IconProps) => <BaseIcon className={className} path="M7 3h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-3-2V5a2 2 0 0 1 2-2Z" />;
export const ReportIcon = ({ className }: IconProps) => <BaseIcon className={className} path="M5 19V8m7 11V5m7 14v-7" />;
export const SettingsIcon = ({ className }: IconProps) => <BaseIcon className={className} path="M10.3 4.3a2 2 0 0 1 3.4 0l.6 1a2 2 0 0 0 1.5 1l1.1.2a2 2 0 0 1 1.7 2l-.1 1.2a2 2 0 0 0 .6 1.6l.8.8a2 2 0 0 1 0 2.8l-.8.8a2 2 0 0 0-.6 1.6l.1 1.2a2 2 0 0 1-1.7 2l-1.1.2a2 2 0 0 0-1.5 1l-.6 1a2 2 0 0 1-3.4 0l-.6-1a2 2 0 0 0-1.5-1L7 21a2 2 0 0 1-1.7-2l.1-1.2a2 2 0 0 0-.6-1.6l-.8-.8a2 2 0 0 1 0-2.8l.8-.8a2 2 0 0 0 .6-1.6L5.3 9a2 2 0 0 1 1.7-2l1.1-.2a2 2 0 0 0 1.5-1l.7-1ZM12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />;
