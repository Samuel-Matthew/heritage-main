import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export interface Product {
  id: string;
  name: string;
  // optional image (products may not include images anymore)
  image?: string;
  category: string;
  price?: number;
  wholesalePrice?: number;
  store: {
    name: string;
    id: string;
    phone?: string;
  };
  inStock: boolean;
  // brief description of the product
  description?: string;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  // prepare whatsapp link using seller phone
  const sellerPhoneDigits = product.store?.phone
    ? product.store.phone.replace(/\D/g, "")
    : "";
  const waHref = sellerPhoneDigits
    ? `https://wa.me/${sellerPhoneDigits}?text=${encodeURIComponent(
        `Hi, I'm interested in ${product.name}`
      )}`
    : "#";

  return (
    <Card className="group overflow-hidden">
      <div className="relative aspect-square overflow-hidden bg-muted flex items-center justify-center">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4 text-sm text-muted-foreground">
            <div className="text-center">
              <div className="font-medium">{product.category}</div>
              <div className="text-xs mt-1">No image available</div>
            </div>
          </div>
        )}
        <div className="absolute top-2 left-2">
          {!product.inStock && (
            <Badge variant="destructive" className="text-[10px]">
              Out of Stock
            </Badge>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button
              size="sm"
              className="w-full h-8 text-xs"
              disabled={!product.inStock}
            >
              <MessageCircle className="w-3 h-3 mr-1" />
              Chat on WhatsApp
            </Button>
          </a>
        </div>
      </div>
      <CardContent className="p-3">
        <Link
          to={`/store/${product.store.id}`}
          className="text-xs text-muted-foreground hover:text-secondary transition-colors"
        >
          {product.store.name}
        </Link>
        <Link to={`/product/${product.id}`}>
          <h3 className="font-medium text-sm mt-1 line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        {product.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {product.description}
          </p>
        )}
        {/* Price Display */}
        {(product.price || product.wholesalePrice) && (
          <div className="mt-2 flex items-baseline gap-2">
            {product.price && (
              <span className="text-sm font-semibold text-primary">
                ₦{product.price.toLocaleString()}
              </span>
            )}
            {product.wholesalePrice &&
              product.wholesalePrice > 0 &&
              product.wholesalePrice !== product.price && (
                <span className="text-xs text-muted-foreground line-through">
                  ₦{product.wholesalePrice.toLocaleString()}
                </span>
              )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
