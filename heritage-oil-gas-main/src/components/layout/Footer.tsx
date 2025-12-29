import { Link } from "react-router-dom";
import { Fuel, Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Newsletter */}
      <div className="border-b border-primary-foreground/10">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-heading font-semibold">Subscribe to our Newsletter</h3>
              <p className="text-primary-foreground/70 text-sm">Get the latest deals and industry updates</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Input 
                type="email" 
                placeholder="Enter your email" 
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 max-w-xs"
              />
              <Button variant="secondary">Subscribe</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 lg:col-span-2">
             {/* Desktop Logo */}
                <img
                  src="/images/light-theme.png"
                  alt="Heritage Energy"
                  className="hidden md:block w-32 h-32 object-contain rounded-md mb-0"
                />

                {/* Mobile Logo */}
                <img
                  src="/images/favicon-heritage.png"
                  alt="Heritage Energy Mobile"
                  className="block md:hidden w-12 h-12 object-contain rounded-md mb-4"
                />
            <p className="text-primary-foreground/70 text-sm mb-4 max-w-xs">
              Nigeria's premier multi-vendor marketplace for oil & gas products. Connect with trusted suppliers nationwide.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-secondary transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-secondary transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-secondary transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-secondary transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/products" className="hover:text-secondary transition-colors">All Products</Link></li>
              <li><Link to="/stores" className="hover:text-secondary transition-colors">Browse Stores</Link></li>
              <li><Link to="/deals" className="hover:text-secondary transition-colors">Hot Deals</Link></li>
              <li><Link to="/wholesale" className="hover:text-secondary transition-colors">Wholesale</Link></li>
              <li><Link to="/about" className="hover:text-secondary transition-colors">About Us</Link></li>
            </ul>
          </div>

          {/* Seller */}
          <div>
            <h4 className="font-heading font-semibold mb-4">For Sellers</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/seller/register" className="hover:text-secondary transition-colors">Become a Seller</Link></li>
              <li><Link to="/pricing" className="hover:text-secondary transition-colors">Pricing Plans</Link></li>
              <li><Link to="/seller/login" className="hover:text-secondary transition-colors">Seller Login</Link></li>
              <li><Link to="/help/seller" className="hover:text-secondary transition-colors">Seller Guide</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Lagos, Nigeria</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>+234 800 000 0000</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>support@heriglob.com</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-primary-foreground/10">
        <div className="container py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-primary-foreground/60">
          <p>© 2025 Heritage Energy. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-primary-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-primary-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
