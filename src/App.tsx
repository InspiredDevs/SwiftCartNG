import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { CartProvider } from "./contexts/CartContext";
import { SavedItemsProvider } from "./contexts/SavedItemsContext";
import { CompareProvider } from "./contexts/CompareContext";
import { AuthProvider } from "./hooks/useAuth";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CompareFloatingButton from "./components/CompareFloatingButton";
import ProtectedRoute from "./components/ProtectedRoute";
import { ScrollToTop } from "./components/ScrollToTop";
import { lazy, Suspense } from "react";
import { Skeleton } from "./components/ui/skeleton";

// Eagerly load critical above-the-fold pages
import Home from "./pages/Home";

// Lazy load everything else
const Shop = lazy(() => import("./pages/Shop"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const Contact = lazy(() => import("./pages/Contact"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const MyReviews = lazy(() => import("./pages/MyReviews"));
const About = lazy(() => import("./pages/About"));
const Profile = lazy(() => import("./pages/Profile"));
const Compare = lazy(() => import("./pages/Compare"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Products = lazy(() => import("./pages/admin/Products"));
const Orders = lazy(() => import("./pages/admin/Orders"));
const Customers = lazy(() => import("./pages/admin/Customers"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const Messages = lazy(() => import("./pages/admin/Messages"));
const Sellers = lazy(() => import("./pages/admin/Sellers"));
const Login = lazy(() => import("./pages/auth/Login"));
const Signup = lazy(() => import("./pages/auth/Signup"));
const SellerDashboard = lazy(() => import("./pages/seller/SellerDashboard"));
const SellerLogin = lazy(() => import("./pages/seller/SellerLogin"));
const SellerProducts = lazy(() => import("./pages/seller/SellerProducts"));
const AddProduct = lazy(() => import("./pages/seller/AddProduct"));
const EditProduct = lazy(() => import("./pages/seller/EditProduct"));
const PendingApproval = lazy(() => import("./pages/seller/PendingApproval"));
const SellerSupport = lazy(() => import("./pages/seller/Support"));
const SellerEarnings = lazy(() => import("./pages/seller/Earnings"));
const SellerOrders = lazy(() => import("./pages/seller/SellerOrders"));
const SellerAnalytics = lazy(() => import("./pages/seller/Analytics"));
const PendingProducts = lazy(() => import("./pages/admin/PendingProducts"));
const SupportTickets = lazy(() => import("./pages/admin/SupportTickets"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));

const queryClient = new QueryClient();

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="space-y-4 w-full max-w-md px-4">
      <Skeleton className="h-8 w-3/4 mx-auto" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  </div>
);

const S = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageFallback />}>{children}</Suspense>
);

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
          <ScrollToTop />
          <AuthProvider>
            <CartProvider>
              <SavedItemsProvider>
              <CompareProvider>
              <Toaster />
              <Sonner />
              <CompareFloatingButton />
              <Routes>
                {/* Auth Routes */}
                <Route path="/auth/login" element={<S><Login /></S>} />
                <Route path="/auth/signup" element={<S><Signup /></S>} />
                <Route path="/auth/forgot-password" element={<S><ForgotPassword /></S>} />
                <Route path="/auth/reset-password" element={<S><ResetPassword /></S>} />
                
                {/* Admin Routes */}
                <Route path="/admin/login" element={<S><AdminLogin /></S>} />
                <Route path="/admin/dashboard" element={<ProtectedRoute requireAdmin><S><Dashboard /></S></ProtectedRoute>} />
                <Route path="/admin/products" element={<ProtectedRoute requireAdmin><S><Products /></S></ProtectedRoute>} />
                <Route path="/admin/orders" element={<ProtectedRoute requireAdmin><S><Orders /></S></ProtectedRoute>} />
                <Route path="/admin/customers" element={<ProtectedRoute requireAdmin><S><Customers /></S></ProtectedRoute>} />
                <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><S><Settings /></S></ProtectedRoute>} />
                <Route path="/admin/messages" element={<ProtectedRoute requireAdmin><S><Messages /></S></ProtectedRoute>} />
                <Route path="/admin/sellers" element={<ProtectedRoute requireAdmin><S><Sellers /></S></ProtectedRoute>} />
                <Route path="/admin/pending-products" element={<ProtectedRoute requireAdmin><S><PendingProducts /></S></ProtectedRoute>} />
                <Route path="/admin/support-tickets" element={<ProtectedRoute requireAdmin><S><SupportTickets /></S></ProtectedRoute>} />
                
                {/* Seller Routes */}
                <Route path="/seller/login" element={<S><SellerLogin /></S>} />
                <Route path="/seller/pending-approval" element={<ProtectedRoute requireAuth><S><PendingApproval /></S></ProtectedRoute>} />
                <Route path="/seller/dashboard" element={<ProtectedRoute requireSeller><S><SellerDashboard /></S></ProtectedRoute>} />
                <Route path="/seller/products" element={<ProtectedRoute requireSeller><S><SellerProducts /></S></ProtectedRoute>} />
                <Route path="/seller/products/new" element={<ProtectedRoute requireSeller><S><AddProduct /></S></ProtectedRoute>} />
                <Route path="/seller/products/:id/edit" element={<ProtectedRoute requireSeller><S><EditProduct /></S></ProtectedRoute>} />
                <Route path="/seller/support" element={<ProtectedRoute requireSeller><S><SellerSupport /></S></ProtectedRoute>} />
                <Route path="/seller/orders" element={<ProtectedRoute requireSeller><S><SellerOrders /></S></ProtectedRoute>} />
                <Route path="/seller/earnings" element={<ProtectedRoute requireSeller><S><SellerEarnings /></S></ProtectedRoute>} />
                <Route path="/seller/analytics" element={<ProtectedRoute requireSeller><S><SellerAnalytics /></S></ProtectedRoute>} />
                
                {/* Customer Routes */}
                <Route element={<LayoutWithNavbarAndFooter />}>
                  <Route index element={<Home />} />
                  <Route path="shop" element={<S><Shop /></S>} />
                  <Route path="product/:id" element={<S><ProductDetail /></S>} />
                  <Route path="cart" element={<S><Cart /></S>} />
                  <Route path="checkout" element={<ProtectedRoute requireAuth><S><Checkout /></S></ProtectedRoute>} />
                  <Route path="order-confirmation" element={<S><OrderConfirmation /></S>} />
                  <Route path="contact" element={<S><Contact /></S>} />
                  <Route path="my-orders" element={<ProtectedRoute requireCustomer><S><MyOrders /></S></ProtectedRoute>} />
                  <Route path="my-reviews" element={<ProtectedRoute requireCustomer><S><MyReviews /></S></ProtectedRoute>} />
                  <Route path="reviews" element={<ProtectedRoute requireCustomer><S><MyReviews /></S></ProtectedRoute>} />
                  <Route path="profile" element={<ProtectedRoute requireCustomer><S><Profile /></S></ProtectedRoute>} />
                  <Route path="about" element={<S><About /></S>} />
                  <Route path="compare" element={<S><Compare /></S>} />
                  <Route path="*" element={<S><NotFound /></S>} />
                </Route>
              </Routes>
              </CompareProvider>
              </SavedItemsProvider>
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
