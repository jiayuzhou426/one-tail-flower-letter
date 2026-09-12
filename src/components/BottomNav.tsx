import type { Page } from '../types';

const Icon = ({ name }: { name: 'trip' | 'pond' | 'vase' }) => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">{name === 'trip' ? <path d="M4 15c3-5 6 5 10-2 2-3 4-3 6-4M5 7h1M18 16h1" /> : name === 'pond' ? <><ellipse cx="12" cy="13" rx="7" ry="3" /><path d="M5 13v3c2 3 12 3 14 0v-3M12 5v4" /></> : <><path d="M8 3h8v16H8zM8 9h8M5 20h14" /></>}</svg>;

export function BottomNav({ page, setPage }: { page: Page; setPage: (page: Page) => void }) {
  return <nav className="bottom-nav">{([
    ['explore', 'trip', '远游'],
    ['pond', 'pond', '收藏池'],
    ['arrange', 'vase', '花瓶'],
  ] as const).map(([nextPage, icon, label]) => <button key={nextPage} className={page === nextPage ? 'active' : ''} onClick={() => setPage(nextPage)}><Icon name={icon} /><span>{label}</span></button>)}</nav>;
}
