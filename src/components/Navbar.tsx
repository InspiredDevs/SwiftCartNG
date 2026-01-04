import { Link } from "react-router-dom";
import { ShoppingCart, Menu, X, User } from "lucide-react";
import { Button } from "./ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

const Navbar = () => {
  const { getCartCount } = useCart();
  const { user, isCustomer, isSeller, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Only show customer-specific links to customers (not sellers/admins)
  const showCustomerLinks = !user || isCustomer;

  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-2xl font-bold text-primary">
              SwiftCart NG
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-foreground hover:text-primary transition-colors">
                Home
              </Link>
              <Link to="/shop" className="text-foreground hover:text-primary transition-colors">
                Shop
              </Link>
              {showCustomerLinks && (
                <>
                  <Link to="/about" className="text-foreground hover:text-primary transition-colors">
                    About
                  </Link>
                  <Link to="/contact" className="text-foreground hover:text-primary transition-colors">
                    Contact
                  </Link>
                </>
              )}
              {user && isCustomer && (
                <>
                  <Link to="/my-orders" className="text-foreground hover:text-primary transition-colors">
                    My Orders
                  </Link>
                  <Link to="/my-reviews" className="text-foreground hover:text-primary transition-colors">
                    My Reviews
                  </Link>
                </>
              )}
              {user ? (
                isCustomer ? (
                  <Link to="/profile" className="text-foreground hover:text-primary transition-colors flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                ) : isSeller ? (
                  <Link to="/seller/dashboard" className="text-foreground hover:text-primary transition-colors flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Dashboard
                  </Link>
                ) : isAdmin ? (
                  <Link to="/admin/dashboard" className="text-foreground hover:text-primary transition-colors flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Admin
                  </Link>
                ) : null
              ) : (
                <Link to="/auth/login" className="text-foreground hover:text-primary transition-colors">
                  Login
                </Link>
              )}
              <ThemeToggle />
              <Link to="/cart" className="relative">
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {getCartCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center font-medium">
                      {getCartCount()}
                    </span>
                  )}
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button and Cart */}
            <div className="md:hidden flex items-center gap-2">
              <Link to="/cart" className="relative">
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {getCartCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center font-medium">
                      {getCartCount()}
                    </span>
                  )}
                </Button>
              </Link>
              <button
                className="text-foreground"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-border">
              <div className="flex flex-col gap-4">
                <Link
                  to="/"
                  className="text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/shop"
                  className="text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Shop
                </Link>
                {showCustomerLinks && (
                  <>
                    <Link
                      to="/about"
                      className="text-foreground hover:text-primary transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      About
                    </Link>
                    <Link
                      to="/contact"
                      className="text-foreground hover:text-primary transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Contact
                    </Link>
                  </>
                )}
                {user && isCustomer && (
                  <>
                    <Link
                      to="/my-orders"
                      className="text-foreground hover:text-primary transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Orders
                    </Link>
                    <Link
                      to="/my-reviews"
                      className="text-foreground hover:text-primary transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Reviews
                    </Link>
                  </>
                )}
                {user ? (
                  isCustomer ? (
                    <Link
                      to="/profile"
                      className="text-foreground hover:text-primary transition-colors flex items-center gap-1"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  ) : isSeller ? (
                    <Link
                      to="/seller/dashboard"
                      className="text-foreground hover:text-primary transition-colors flex items-center gap-1"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      Dashboard
                    </Link>
                  ) : isAdmin ? (
                    <Link
                      to="/admin/dashboard"
                      className="text-foreground hover:text-primary transition-colors flex items-center gap-1"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      Admin
                    </Link>
                  ) : null
                ) : (
                  <Link
                    to="/auth/login"
                    className="text-foreground hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                )}
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">Theme:</span>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          )}
        </div>
    </nav>
  );
};

export default Navbar;
