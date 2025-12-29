import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  ChevronDown,
  Fuel,
  Cog,
  ShieldCheck,
  Droplets,
  Package,
} from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const categories = [
  { name: "Automotive Lubricants", icon: Droplets },
  { name: "Industrial Lubricants", icon: Cog },
  { name: "Greases", icon: Package },
  { name: "Fuel Products", icon: Fuel },
  { name: "Machinery Parts", icon: Cog },
  { name: "Safety Equipment", icon: ShieldCheck },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    navigate(`/products?category=${encodeURIComponent(categoryName)}`);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      {/* Top bar */}
      <div className="gradient-primary text-primary-foreground">
        <div className="container flex h-8 items-center justify-between text-xs">
          <span>Nigeria's #1 Oil & Gas Marketplace</span>
          <div className="hidden md:flex items-center gap-4">
            <Link to="/seller/register" className="hover:underline">
              Become a Seller
            </Link>
            <Link to="/help" className="hover:underline">
              Help Center
            </Link>
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <div className="container">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            {/* Desktop Logo */}
            <img
              src="/images/Heritage_logo.png"
              alt="Heritage Energy"
              className="hidden md:block w-32 h-32 mt-4 object-contain rounded-md"
            />

            {/* Mobile Logo */}
            <img
              src="/images/favicon-heritage.png"
              alt="Heritage Energy Mobile"
              className="block md:hidden w-12 h-12 object-contain rounded-md"
            />
          </Link>

          {/* Search bar */}
          <div className="flex-1 max-w-2xl hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search lubricants, parts, equipment..."
                className="pl-10 pr-4 h-11 bg-muted/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* <Link to="/cart" className="hidden sm:flex">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground flex items-center justify-center">
                  0
                </span>
              </Button>
            </Link> */}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/login">Sign In</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/register">Create Account</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/seller/register">Become a Seller</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Category navigation */}
      <div className="w-full flex justify-center">
        <nav className="hidden md:flex items-center gap-1 py-2 overflow-x-auto mx-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                <Menu className="h-4 w-4" />
                All Categories
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {categories.map((cat) => (
                <DropdownMenuItem
                  key={cat.name}
                  onSelect={() => handleCategoryClick(cat.name)}
                >
                  <cat.icon className="h-4 w-4 text-secondary mr-2" />
                  {cat.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link to="/products">
            <Button
              variant={isActive("/products") ? "secondary" : "ghost"}
              size="sm"
            >
              All Products
            </Button>
          </Link>

          <Link to="/stores">
            <Button
              variant={isActive("/stores") ? "secondary" : "ghost"}
              size="sm"
            >
              Stores
            </Button>
          </Link>

          <Link to="/deals">
            <Button variant="ghost" size="sm" className="text-secondary">
              Hot Deals 🔥
            </Button>
          </Link>

          <Link to="/featured">
            <Button variant="ghost" size="sm">
              Featured products
            </Button>
          </Link>
        </nav>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-card animate-fade-in">
          <div className="container py-4 space-y-4">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => {
                    handleCategoryClick(cat.name);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-muted hover:bg-accent transition-colors"
                >
                  <cat.icon className="h-4 w-4 text-secondary" />
                  <span className="text-sm">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
