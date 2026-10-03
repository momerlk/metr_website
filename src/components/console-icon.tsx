type IconName = "stores" | "keys" | "guide" | "arrow" | "plus" | "close" | "more" | "logout" | "check";

export default function ConsoleIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    stores: <><path d="M3 9h18l-2-5H5L3 9Z" /><path d="M4 9v11h16V9M9 20v-7h6v7M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /></>,
    keys: <><circle cx="8" cy="9" r="5" /><path d="m12 13 8 8m-4-4 3-3m-6 0 3-3" /></>,
    guide: <><path d="M12 5v15M3 4h5a4 4 0 0 1 4 2 4 4 0 0 1 4-2h5v15h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3V4Z" /></>,
    arrow: <><path d="M5 12h14m-5-5 5 5-5 5" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    logout: <><path d="M9 4H4v16h5m0-8h12m-4-4 4 4-4 4" /></>,
    check: <path d="m5 12 4 4L19 6" />,
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
