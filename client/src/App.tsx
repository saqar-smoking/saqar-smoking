/* AL SAQAR design reminder — keep the application light, editorial, and adult-gated. */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { AgeGateGuard } from "./components/CommerceShell";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ShopPage from "./pages/ShopPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderPage from "./pages/OrderPage";
import AdminPage from "./pages/AdminPage";
import { CommerceProvider } from "./contexts/CommerceContext";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return <Switch><Route path="/" component={Home} />
      <Route path="/shop/:category?" component={ShopPage} />
      <Route path="/product/:id" component={ProductPage} />
      <Route path="/cart" component={CartPage} />
      <Route path="/order" component={OrderPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><CommerceProvider><TooltipProvider><Toaster /><AgeGateGuard><Router /></AgeGateGuard></TooltipProvider></CommerceProvider></ThemeProvider></ErrorBoundary>;
}

export default App;
