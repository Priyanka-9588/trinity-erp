import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Building2, Package, Users, FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCompany } from "@/contexts/CompanyContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { selectedCompany, setSelectedCompany } = useCompany();
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("name");
    
    if (error) {
      toast.error("Failed to load companies");
      return;
    }

    setCompanies(data || []);
    if (data && data.length > 0 && !selectedCompany) {
      setSelectedCompany(data[0]);
    }
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: Building2 },
    { path: "/item-master", label: "Item Master", icon: Package },
    { path: "/party-master", label: "Party Master", icon: Users },
    { path: "/purchase-order", label: "Purchase Order", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-primary">ERP System</h1>
              <nav className="hidden md:flex gap-6">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <Select
              value={selectedCompany?.id}
              onValueChange={(value) => {
                const company = companies.find((c) => c.id === value);
                setSelectedCompany(company || null);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
