import React, { createContext, useContext, useState, useEffect } from "react";

interface Company {
  id: string;
  name: string;
  code: string;
  address?: string;
  gstin?: string;
  pan_no?: string;
  cin_no?: string;
  email?: string;
  contact_number?: string;
  website?: string;
}

interface CompanyContextType {
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company | null) => void;
  companies: Company[];
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    // Companies will be loaded from database in the main app
    // This is just the context provider
  }, []);

  return (
    <CompanyContext.Provider value={{ selectedCompany, setSelectedCompany, companies }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
};
