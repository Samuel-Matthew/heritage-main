import {
  Bell,
  Search,
  ChevronDown,
  Menu,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "super_admin";
  const isSeller = user?.role === "store_owner";

  return (
    <header className="h-16 bg-topbar text-topbar-foreground border-b border-chocolate-light/20 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-50">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-topbar-foreground hover:bg-chocolate-light/20"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-orange flex items-center justify-center font-heading font-bold text-sm">
            H
          </div>
          <div className="hidden sm:block">
            <h1 className="font-heading font-semibold text-lg leading-none">
              Heriglob
            </h1>
            <div className="h-0.5 w-full gradient-orange rounded-full mt-1" />
          </div>
        </div>
      </div>

      {/* Center - Global Search (Admin only) */}
      {isAdmin && (
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-topbar-foreground/50" />
            <Input
              placeholder="Search stores, products, users..."
              className="w-full pl-10 bg-chocolate-light/30 border-chocolate-light/30 text-topbar-foreground placeholder:text-topbar-foreground/50 focus:border-orange focus:ring-orange/30"
            />
          </div>
        </div>
      )}

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-topbar-foreground hover:bg-chocolate-light/20"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange rounded-full animate-pulse-orange" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-card">
            <div className="p-3 border-b">
              <h3 className="font-semibold">Notifications</h3>
            </div>
            <div className="max-h-80 overflow-y-auto">
              <NotificationItem
                title="New Store Registration"
                message="PetroMax Nigeria submitted for approval"
                time="5 min ago"
                type="info"
              />
              <NotificationItem
                title="Subscription Expiring"
                message="3 stores have subscriptions expiring this week"
                time="1 hour ago"
                type="warning"
              />
              <NotificationItem
                title="Store Verified"
                message="Lagos Oil Supplies has been verified"
                time="2 hours ago"
                type="success"
              />
            </div>
            <div className="p-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-orange hover:text-orange-dark"
              >
                View All Notifications
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu> */}

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-topbar-foreground hover:bg-chocolate-light/20 pl-2 pr-3"
            >
              <Avatar className="h-8 w-8">
                {user?.profile_image_path && (
                  <AvatarImage src={user.profile_image_path} alt={user.name} />
                )}
                <AvatarFallback className="bg-orange/20 text-orange text-sm font-medium">
                  {user?.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-medium">
                {user?.name}
              </span>
              <ChevronDown className="h-4 w-4 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card">
            <div className="p-3 border-b">
              <p className="font-semibold">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <Badge variant="secondary" className="mt-2 text-xs">
                {isAdmin ? "Super Admin" : isSeller ? "Store Owner" : "User"}
              </Badge>
            </div>
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <a href="/profile">Profile</a>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={() => logout()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function NotificationItem({
  title,
  message,
  time,
  type,
}: {
  title: string;
  message: string;
  time: string;
  type: "info" | "warning" | "success" | "error";
}) {
  const colors = {
    info: "bg-orange/10 text-orange",
    warning: "bg-warning/10 text-warning",
    success: "bg-success/10 text-success",
    error: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-2 h-2 rounded-full mt-2",
            colors[type].replace("bg-", "bg-").replace("/10", "")
          )}
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{title}</p>
          <p className="text-sm text-muted-foreground truncate">{message}</p>
          <p className="text-xs text-muted-foreground mt-1">{time}</p>
        </div>
      </div>
    </div>
  );
}
