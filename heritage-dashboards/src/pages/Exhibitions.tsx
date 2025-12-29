import { useState } from 'react';
import {
  CalendarDays,
  Plus,
  MapPin,
  Clock,
  Store,
  Package,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Exhibition {
  id: string;
  name: string;
  date: string;
  location: string;
  description: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  stores: number;
  featuredProducts: number;
}

const mockExhibitions: Exhibition[] = [
  {
    id: '1',
    name: 'Lagos Oil & Gas Expo 2024',
    date: '2024-03-15',
    location: 'Eko Convention Centre, Lagos',
    description: 'Annual gathering of oil and gas industry professionals',
    status: 'upcoming',
    stores: 25,
    featuredProducts: 120,
  },
  {
    id: '2',
    name: 'Industrial Lubricants Fair',
    date: '2024-02-20',
    location: 'Abuja Trade Centre',
    description: 'Showcase of industrial lubricants and machinery oils',
    status: 'ongoing',
    stores: 18,
    featuredProducts: 85,
  },
  {
    id: '3',
    name: 'Port Harcourt Energy Week',
    date: '2024-01-10',
    location: 'Port Harcourt Civic Centre',
    description: 'Week-long celebration of energy and petroleum products',
    status: 'completed',
    stores: 32,
    featuredProducts: 150,
  },
];

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Exhibitions() {
  const [exhibitions, setExhibitions] = useState(mockExhibitions);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: '',
    description: '',
  });

  const handleCreate = () => {
    if (!formData.name || !formData.date || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newExhibition: Exhibition = {
      id: String(Date.now()),
      ...formData,
      status: 'upcoming',
      stores: 0,
      featuredProducts: 0,
    };

    setExhibitions([newExhibition, ...exhibitions]);
    toast.success('Exhibition created successfully!');
    setIsDialogOpen(false);
    setFormData({ name: '', date: '', location: '', description: '' });
  };

  const handleDelete = (id: string) => {
    setExhibitions(exhibitions.filter((ex) => ex.id !== id));
    toast.success('Exhibition deleted successfully!');
  };

  const getStatusColor = (status: Exhibition['status']) => {
    switch (status) {
      case 'upcoming': return 'pending';
      case 'ongoing': return 'approved';
      case 'completed': return 'muted';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Exhibitions</h1>
          <p className="text-muted-foreground mt-1">Manage monthly exhibitions and events</p>
        </div>
        <Button variant="secondary" onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Exhibition
        </Button>
      </div>

      {/* Month Filter */}
      <div className="flex items-center gap-4">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {months.map((month, index) => (
              <SelectItem key={month} value={String(index + 1)}>{month}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Exhibition Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-chocolate">
                {exhibitions.filter((ex) => ex.status === 'upcoming').length}
              </p>
              <p className="text-sm text-muted-foreground">Upcoming</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-chocolate">
                {exhibitions.filter((ex) => ex.status === 'ongoing').length}
              </p>
              <p className="text-sm text-muted-foreground">Ongoing</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-chocolate">
                {exhibitions.filter((ex) => ex.status === 'completed').length}
              </p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Exhibitions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {exhibitions.map((exhibition) => (
          <div
            key={exhibition.id}
            className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-heading font-semibold text-lg">{exhibition.name}</h3>
                  <Badge variant={getStatusColor(exhibition.status)} className="mt-2">
                    {exhibition.status}
                  </Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(exhibition.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <p className="text-sm text-muted-foreground mb-4">{exhibition.description}</p>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-orange" />
                  <span>{exhibition.date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-orange" />
                  <span>{exhibition.location}</span>
                </div>
              </div>

              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">{exhibition.stores}</span> Stores
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">{exhibition.featuredProducts}</span> Products
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Exhibition Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Exhibition</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Exhibition Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter exhibition name"
              />
            </div>
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Enter venue and city"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter exhibition description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button variant="secondary" onClick={handleCreate}>Create Exhibition</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
