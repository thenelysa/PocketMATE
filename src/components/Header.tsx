import { useLocation } from 'react-router-dom';
import { Menu, Search, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';

export function useSidebarPadding() {
  const [padding, setPadding] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    // Default to collapsed (pl-20) if no preference saved
    if (saved === null || saved === undefined) {
      return 'lg:pl-20';
    }
    return saved === 'true' ? 'lg:pl-20' : 'lg:pl-64';
  });

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('sidebar_collapsed');
      if (saved === null || saved === undefined) {
        setPadding('lg:pl-20');
      } else {
        setPadding(saved === 'true' ? 'lg:pl-20' : 'lg:pl-64');
      }
    };

    window.addEventListener('storage', handleStorage);
    // Also listen for custom event for same-tab updates
    window.addEventListener('sidebarToggle', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('sidebarToggle', handleStorage);
    };
  }, []);

  return padding;
}
import { useAuth } from '@/contexts/AuthContext';
import { getBills, getCreditCards, getReminders } from '@/lib/dataStore';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui';

const pageTitles: Record<string, string> = {
  '/app/dashboard': 'Dashboard',
  '/app/bills': 'Bills',
  '/app/cards': 'Credit Cards',
  '/app/reminders': 'Reminders',
  '/app/reports': 'Reports',
  '/app/settings': 'Settings',
};

interface SearchResult {
  type: 'bill' | 'card' | 'reminder';
  id: string;
  title: string;
  subtitle: string;
  link: string;
}

export function Header() {
  const location = useLocation();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const title = pageTitles[location.pathname] || 'PocketMATE';
  const sidebarPadding = useSidebarPadding();

  useEffect(() => {
    if (!user || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const bills = getBills(user.id);
    const cards = getCreditCards(user.id);
    const reminders = getReminders(user.id);
    const query = searchQuery.toLowerCase();

    const results: SearchResult[] = [];

    // Search bills
    bills.forEach(bill => {
      if (bill.name.toLowerCase().includes(query) || bill.provider?.toLowerCase().includes(query)) {
        results.push({
          type: 'bill',
          id: bill.id,
          title: bill.name,
          subtitle: `₨${bill.amount.toLocaleString()} - ${bill.status}`,
          link: `/app/bills/${bill.id}`,
        });
      }
    });

    // Search cards
    cards.forEach(card => {
      if (card.bankName.toLowerCase().includes(query) || card.cardName.toLowerCase().includes(query)) {
        results.push({
          type: 'card',
          id: card.id,
          title: card.cardName || card.bankName,
          subtitle: `Limit: ₨${card.creditLimit.toLocaleString()}`,
          link: `/app/cards/${card.id}`,
        });
      }
    });

    // Search reminders
    reminders.forEach(reminder => {
      if (reminder.title.toLowerCase().includes(query) || reminder.message?.toLowerCase().includes(query)) {
        results.push({
          type: 'reminder',
          id: reminder.id,
          title: reminder.title,
          subtitle: reminder.message || '',
          link: `/app/reminders`,
        });
      }
    });

    setSearchResults(results.slice(0, 10));
  }, [searchQuery, user]);

  // Close search on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <div className={`sticky top-0 z-30 flex h-16 items-center border-b border-gray-200 bg-[#F7F8F5] px-4 ${sidebarPadding}`}>
        <button
          className="lg:hidden p-2 rounded-md border border-[#D5ECEB] text-[#071936] hover:bg-[#F1FAFA] mr-4"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search Bar - Right */}
        <div ref={searchRef} className="flex-none ml-auto">
          {searchOpen ? (
            <div className="flex items-center bg-gray-200 rounded-full border border-gray-300 px-4 py-2 w-96">
              <Search className="h-4 w-4 text-gray-500 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bills, cards, reminders..."
                className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-500"
                autoFocus
              />
              <button onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>
                <X className="h-4 w-4 text-gray-500 hover:text-gray-800" />
              </button>
            </div>
          ) : (
            <div className="flex items-center bg-gray-100 rounded-full border border-gray-300 px-4 py-2 w-80">
              <Search className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-gray-400 text-sm flex-1" onClick={() => setSearchOpen(true)}>Search...</span>
            </div>
          )}
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#F7F8F5] rounded-lg border border-[#D5ECEB] shadow-lg max-h-80 overflow-y-auto z-50">
              {searchResults.map((result, idx) => (
                <Link
                  key={`${result.type}-${result.id}`}
                  to={result.link}
                  onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#F1FAFA] border-b border-[#D5ECEB] last:border-b-0"
                >
                  <Badge className={
                    result.type === 'bill' ? 'bg-[#DFF5F2] text-[#078D88]' :
                    result.type === 'card' ? 'bg-[#EDE9FE] text-[#7C3AED]' :
                    'bg-[#FEF3C7] text-[#D97706]'
                  }>
                    {result.type}
                  </Badge>
                  <div>
                    <p className="font-medium text-[#071936] text-sm">{result.title}</p>
                    <p className="text-xs text-[#4B5D7A]">{result.subtitle}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      {mobileOpen && <Sidebar />}
    </>
  );
}
