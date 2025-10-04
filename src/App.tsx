import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CompanyProvider } from "./contexts/CompanyContext";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import ItemMaster from "./pages/ItemMaster";
import PartyMaster from "./pages/PartyMaster";
import PurchaseOrder from "./pages/PurchaseOrder";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CompanyProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/item-master" element={<ItemMaster />} />
              <Route path="/party-master" element={<PartyMaster />} />
              <Route path="/purchase-order" element={<PurchaseOrder />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </CompanyProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
