import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { CartProvider } from "./contexts/CartContext";
import { SavedItemsProvider } from "./contexts/SavedItemsContext";
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
import MyOrders from "./pages/MyOrders";
import MyReviews from "./pages/MyReviews";
import About from "./pages/About";
import Profile from "./pages/Profile";
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
import EditProduct from "./pages/seller/EditProduct";
import PendingApproval from "./pages/seller/PendingApproval";
import SellerSupport from "./pages/seller/Support";
import SellerEarnings from "./pages/seller/Earnings";
import SellerOrders from "./pages/seller/SellerOrders";
import ProtectedRoute from "./components/ProtectedRoute";
import PendingProducts from "./pages/admin/PendingProducts";
import SupportTickets from "./pages/admin/SupportTickets";

const queryClient = new QueryClient();

const LayoutWithNavbarAndFooter = () => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <SavedItemsProvider>
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
                <Route path="/admin/pending-products" element={
                  <ProtectedRoute requireAdmin>
                    <PendingProducts />
                  </ProtectedRoute>
                } />
                <Route path="/admin/support-tickets" element={
                  <ProtectedRoute requireAdmin>
                    <SupportTickets />
                  </ProtectedRoute>
                } />
                
                {/* Seller Routes - No Navbar/Footer */}
                <Route path="/seller/pending-approval" element={
                  <ProtectedRoute requireAuth>
                    <PendingApproval />
                  </ProtectedRoute>
                } />
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
                <Route path="/seller/products/:id/edit" element={
                  <ProtectedRoute requireSeller>
                    <EditProduct />
                  </ProtectedRoute>
                } />
                <Route path="/seller/support" element={
                  <ProtectedRoute requireSeller>
                    <SellerSupport />
                  </ProtectedRoute>
                } />
                <Route path="/seller/orders" element={
                  <ProtectedRoute requireSeller>
                    <SellerOrders />
                  </ProtectedRoute>
                } />
                <Route path="/seller/earnings" element={
                  <ProtectedRoute requireSeller>
                    <SellerEarnings />
                  </ProtectedRoute>
                } />
                
                {/* Customer Routes - With Navbar/Footer */}
                <Route element={<LayoutWithNavbarAndFooter />}>
                  <Route index element={<Home />} />
                  <Route path="shop" element={<Shop />} />
                  <Route path="product/:id" element={<ProductDetail />} />
                  <Route path="cart" element={<Cart />} />
                  <Route path="checkout" element={
                    <ProtectedRoute requireAuth>
                      <Checkout />
                    </ProtectedRoute>
                  } />
                  <Route path="order-confirmation" element={<OrderConfirmation />} />
                  <Route path="contact" element={<Contact />} />
                  <Route path="my-orders" element={
                    <ProtectedRoute requireCustomer>
                      <MyOrders />
                    </ProtectedRoute>
                  } />
                  <Route path="my-reviews" element={
                    <ProtectedRoute requireCustomer>
                      <MyReviews />
                    </ProtectedRoute>
                  } />
                  {/* Alias for email deep-links */}
                  <Route path="reviews" element={
                    <ProtectedRoute requireCustomer>
                      <MyReviews />
                    </ProtectedRoute>
                  } />
                  <Route path="profile" element={
                    <ProtectedRoute requireCustomer>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  <Route path="about" element={<About />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
              </SavedItemsProvider>
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
