import Link from 'next/link';
import { 
  Home, 
  FolderOpen, 
  CreditCard, 
  PiggyBank, 
  Target, 
  TrendingUp,
  BarChart3,
  Settings,
  Database
} from 'lucide-react';

export function Navigation() {
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/categories', label: 'Categories', icon: FolderOpen },
    { href: '/transactions', label: 'Transactions', icon: CreditCard },
    { href: '/budgets', label: 'Budgets', icon: Target },
    { href: '/savings', label: 'Savings', icon: PiggyBank },
    { href: '/recurring-transactions', label: 'Recurring', icon: TrendingUp },
    { href: '/reports', label: 'Reports', icon: BarChart3 },
    { href: '/database-studio', label: 'Database Studio', icon: Database },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              FinanceApp
            </Link>
          </div>
          
          <div className="flex space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
