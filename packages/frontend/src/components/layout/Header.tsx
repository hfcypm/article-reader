import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  action?: React.ReactNode;
  transparent?: boolean;
}

export function Header({ title, showBack, onBack, action, transparent }: HeaderProps) {
  const navigate = useNavigate();

  const handleBack = onBack || (() => navigate(-1));

  return (
    <header
      className={`sticky top-0 z-30 flex items-center justify-between h-14 px-4 ${
        transparent ? 'bg-transparent' : 'bg-surface/95 backdrop-blur-lg border-b border-border'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {showBack && (
          <Button variant="ghost" size="sm" onClick={handleBack} className="!w-9 !h-9 !p-0 !rounded-full">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Button>
        )}
        <h1 className="text-lg font-semibold text-text truncate">{title}</h1>
      </div>
      {action && <div>{action}</div>}
    </header>
  );
}
