import { useState } from 'react';
import {
  History,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  User,
  Settings,
  Store,
  Package,
  CreditCard,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface AuditLog {
  id: string;
  user: string;
  userEmail: string;
  action: string;
  category: 'user' | 'store' | 'product' | 'subscription' | 'settings' | 'security';
  details: string;
  ipAddress: string;
  timestamp: string;
}

const mockLogs: AuditLog[] = [
  {
    id: '1',
    user: 'Admin User',
    userEmail: 'admin@heriglob.com',
    action: 'Store Approved',
    category: 'store',
    details: 'Approved store "PetroMax Nigeria" for operation',
    ipAddress: '192.168.1.100',
    timestamp: '2024-02-15 14:32:45',
  },
  {
    id: '2',
    user: 'Admin User',
    userEmail: 'admin@heriglob.com',
    action: 'Subscription Activated',
    category: 'subscription',
    details: 'Activated Gold plan subscription for LubeKing Ltd',
    ipAddress: '192.168.1.100',
    timestamp: '2024-02-15 13:20:12',
  },
  {
    id: '3',
    user: 'John Adeyemi',
    userEmail: 'john@petromax.ng',
    action: 'Product Added',
    category: 'product',
    details: 'Added new product "Premium Engine Oil 5W-30"',
    ipAddress: '105.112.45.89',
    timestamp: '2024-02-15 11:45:30',
  },
  {
    id: '4',
    user: 'Admin User',
    userEmail: 'admin@heriglob.com',
    action: 'User Deactivated',
    category: 'user',
    details: 'Deactivated user account for David Obi',
    ipAddress: '192.168.1.100',
    timestamp: '2024-02-15 10:15:00',
  },
  {
    id: '5',
    user: 'Admin User',
    userEmail: 'admin@heriglob.com',
    action: 'Settings Updated',
    category: 'settings',
    details: 'Updated platform maintenance mode settings',
    ipAddress: '192.168.1.100',
    timestamp: '2024-02-14 16:45:22',
  },
  {
    id: '6',
    user: 'System',
    userEmail: 'system@heriglob.com',
    action: 'Security Alert',
    category: 'security',
    details: 'Multiple failed login attempts detected for user mary@lubeking.com',
    ipAddress: '41.58.122.45',
    timestamp: '2024-02-14 15:30:10',
  },
  {
    id: '7',
    user: 'Mary Okonkwo',
    userEmail: 'mary@lubeking.com',
    action: 'Store Updated',
    category: 'store',
    details: 'Updated store contact information and description',
    ipAddress: '105.112.78.234',
    timestamp: '2024-02-14 14:20:45',
  },
];

const categoryIcons = {
  user: User,
  store: Store,
  product: Package,
  subscription: CreditCard,
  settings: Settings,
  security: Shield,
};

const categoryColors = {
  user: 'bg-blue-500/10 text-blue-500',
  store: 'bg-orange/10 text-orange',
  product: 'bg-green-500/10 text-green-500',
  subscription: 'bg-purple-500/10 text-purple-500',
  settings: 'bg-slate-500/10 text-slate-500',
  security: 'bg-red-500/10 text-red-500',
};

export default function AuditLogs() {
  const [logs] = useState(mockLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">Track all platform activities and changes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange/10 flex items-center justify-center">
              <History className="h-5 w-5 text-orange" />
            </div>
            <div>
              <p className="text-2xl font-bold text-chocolate">{logs.length}</p>
              <p className="text-sm text-muted-foreground">Total Logs</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-chocolate">
                {logs.filter((l) => l.category === 'security').length}
              </p>
              <p className="text-sm text-muted-foreground">Security Events</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="store">Store</SelectItem>
            <SelectItem value="product">Product</SelectItem>
            <SelectItem value="subscription">Subscription</SelectItem>
            <SelectItem value="settings">Settings</SelectItem>
            <SelectItem value="security">Security</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {filteredLogs.map((log) => {
          const Icon = categoryIcons[log.category];
          const isExpanded = expandedId === log.id;

          return (
            <div
              key={log.id}
              className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden"
            >
              <button
                className="w-full p-4 flex items-center gap-4 text-left"
                onClick={() => setExpandedId(isExpanded ? null : log.id)}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${categoryColors[log.category]}`}>
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{log.action}</span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {log.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{log.details}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium">{log.user}</p>
                    <p className="text-xs text-muted-foreground">{log.timestamp}</p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-border">
                  <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">User</p>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-orange/10 text-orange">
                            {log.user.split(' ').map((n) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{log.user}</p>
                          <p className="text-xs text-muted-foreground">{log.userEmail}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">IP Address</p>
                      <p className="text-sm font-mono">{log.ipAddress}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Timestamp</p>
                      <p className="text-sm">{log.timestamp}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Details</p>
                    <p className="text-sm">{log.details}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
