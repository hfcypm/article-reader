import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/authStore';
import { t } from '@/lib/i18n';
import type { TabPage } from '@/types';

const tabs: { key: TabPage; labelKey: string; icon: string; path: string }[] = [
  { key: 'home', labelKey: 'home.title', icon: 'home', path: '/' },
  { key: 'bookshelf', labelKey: 'bookshelf', icon: 'bookshelf', path: '/bookshelf' },
  { key: 'profile', labelKey: 'profile', icon: 'profile', path: '/profile' },
];

function TabIcon({ name, active }: { name: string; active: boolean }) {
  const color = active ? 'var(--color-primary)' : 'var(--color-text-muted)';

  switch (name) {
    case 'home':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case 'bookshelf':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <line x1="8" y1="7" x2="16" y2="7" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      );
    case 'profile':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    default:
      return null;
  }
}

export function TabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeTab, setActiveTab, setSlideDirection } = useAppStore();

  const currentPath = location.pathname;
  const currentKey: TabPage = currentPath === '/' ? 'home' : currentPath === '/bookshelf' ? 'bookshelf' : 'profile';

  const handleTabClick = (tab: TabPage, path: string) => {
    const tabOrder = ['home', 'bookshelf', 'profile'];
    const currentIdx = tabOrder.indexOf(currentKey);
    const targetIdx = tabOrder.indexOf(tab);

    if (targetIdx > currentIdx) setSlideDirection('left');
    else if (targetIdx < currentIdx) setSlideDirection('right');

    setActiveTab(tab);
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-lg border-t border-border">
      <div className="w-full mx-auto flex items-center justify-around h-16 px-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key, tab.path)}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[64px] transition-all duration-200 ${
                isActive ? 'text-primary scale-105' : 'text-text-muted'
              }`}
            >
              <TabIcon name={tab.icon} active={isActive} />
              <span className="text-[10px] font-medium">{t(tab.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
