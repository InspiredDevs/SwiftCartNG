import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./hooks/useAuth";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Contact from "./pages/Contact";
import OrderTracking from "./pages/OrderTracking";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Orders from "./pages/admin/Orders";
import Customers from "./pages/admin/Customers";
import Settings from "./pages/admin/Settings";
import Messages from "./pages/admin/Messages";
import Sellers from "./pages/admin/Sellers";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import SellerDashboard from "./pages/seller/SellerDashboard";
import SellerProducts from "./pages/seller/SellerProducts";
import AddProduct from "./pages/seller/AddProduct";
import ProtectedRoute from "./components/ProtectedRoute";
import PendingProducts from "./pages/admin/PendingProducts";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <Toaster />
              <Sonner />
              <Routes>
                {/* Auth Routes - No Navbar/Footer */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />
                
                {/* Admin Routes - No Navbar/Footer */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={
                  <ProtectedRoute requireAdmin>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/products" element={
                  <ProtectedRoute requireAdmin>
                    <Products />
                  </ProtectedRoute>
                } />
                <Route path="/admin/orders" element={
                  <ProtectedRoute requireAdmin>
                    <Orders />
                  </ProtectedRoute>
                } />
                <Route path="/admin/customers" element={
                  <ProtectedRoute requireAdmin>
                    <Customers />
                  </ProtectedRoute>
                } />
                <Route path="/admin/settings" element={
                  <ProtectedRoute requireAdmin>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="/admin/messages" element={
                  <ProtectedRoute requireAdmin>
                    <Messages />
                  </ProtectedRoute>
                } />
                <Route path="/admin/sellers" element={
                  <ProtectedRoute requireAdmin>
                    <Sellers />
                  </ProtectedRoute>
                } />
                
                {/* Seller Routes - With Navbar/Footer */}
                <Route path="/seller/dashboard" element={
                  <ProtectedRoute requireSeller>
                    <SellerDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/seller/products" element={
                  <ProtectedRoute requireSeller>
                    <SellerProducts />
                  </ProtectedRoute>
                } />
                <Route path="/seller/products/new" element={
                  <ProtectedRoute requireSeller>
                    <AddProduct />
                  </ProtectedRoute>
                } />
                <Route path="/admin/pending-products" element={
                  <ProtectedRoute requireAdmin>
                    <PendingProducts />
                  </ProtectedRoute>
                } />
                
                {/* Customer Routes - With Navbar/Footer */}
                <Route path="/*" element={
                  <div className="flex flex-col min-h-screen">
                    <Navbar />
                    <main className="flex-1">
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/shop" element={<Shop />} />
                        <Route path="/product/:id" element={<ProductDetail />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/order-confirmation" element={<OrderConfirmation />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/track-order" element={<OrderTracking />} />
                        <Route path="/about" element={<About />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                    <Footer />
                  </div>
                } />
              </Routes>
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
