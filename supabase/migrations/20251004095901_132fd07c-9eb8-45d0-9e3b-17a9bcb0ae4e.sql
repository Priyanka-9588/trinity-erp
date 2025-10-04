-- Create companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  address TEXT,
  gstin TEXT,
  pan_no TEXT,
  cin_no TEXT,
  contact_number TEXT,
  email TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create sale_item_master table
CREATE TABLE public.sale_item_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_code TEXT NOT NULL UNIQUE,
  description TEXT,
  item_type TEXT CHECK (item_type IN ('Capital Goods', 'Consumables', 'General Item')),
  machine_name TEXT,
  item_group TEXT,
  uom TEXT,
  hsn_code TEXT,
  tax NUMERIC,
  lead_time TEXT,
  price NUMERIC,
  unit_price NUMERIC,
  currency TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create purchase_item_master table
CREATE TABLE public.purchase_item_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_code TEXT NOT NULL UNIQUE,
  description TEXT,
  item_type TEXT CHECK (item_type IN ('Capital Goods', 'Consumables', 'General Item')),
  machine_name TEXT,
  item_group TEXT,
  uom TEXT,
  hsn_code TEXT,
  tax NUMERIC,
  lead_time TEXT,
  price NUMERIC,
  unit_price NUMERIC,
  currency TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create supplier_master table
CREATE TABLE public.supplier_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  party_code TEXT NOT NULL UNIQUE,
  party_name TEXT NOT NULL,
  category TEXT,
  party_type TEXT,
  contact_person TEXT,
  contact_number TEXT,
  email_address TEXT,
  website TEXT,
  party_address TEXT,
  gstin TEXT,
  pan_no TEXT,
  cin_no TEXT,
  msme_id TEXT,
  credit_limit NUMERIC,
  credit_period TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create buyer_master table
CREATE TABLE public.buyer_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  party_code TEXT NOT NULL UNIQUE,
  party_name TEXT NOT NULL,
  category TEXT,
  party_type TEXT,
  contact_person TEXT,
  contact_number TEXT,
  email_address TEXT,
  website TEXT,
  party_address TEXT,
  gstin TEXT,
  pan_no TEXT,
  cin_no TEXT,
  msme_id TEXT,
  credit_limit NUMERIC,
  credit_period TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create purchase_orders table
CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.supplier_master(id) ON DELETE SET NULL,
  po_number TEXT NOT NULL UNIQUE,
  po_date DATE DEFAULT CURRENT_DATE,
  delivery_date DATE,
  freight NUMERIC DEFAULT 0,
  sgst NUMERIC DEFAULT 0,
  cgst NUMERIC DEFAULT 0,
  igst NUMERIC DEFAULT 0,
  basic_amount NUMERIC DEFAULT 0,
  grand_total NUMERIC DEFAULT 0,
  payment_terms TEXT,
  other_instructions TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create purchase_order_items table
CREATE TABLE public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  item_description TEXT NOT NULL,
  make TEXT,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  unit_rate NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_item_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_item_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (you can modify these later for authentication)
CREATE POLICY "Allow all operations on companies" ON public.companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on sale_item_master" ON public.sale_item_master FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on purchase_item_master" ON public.purchase_item_master FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on supplier_master" ON public.supplier_master FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on buyer_master" ON public.buyer_master FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on purchase_orders" ON public.purchase_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on purchase_order_items" ON public.purchase_order_items FOR ALL USING (true) WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating updated_at
CREATE TRIGGER update_sale_item_master_updated_at BEFORE UPDATE ON public.sale_item_master FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_purchase_item_master_updated_at BEFORE UPDATE ON public.purchase_item_master FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_supplier_master_updated_at BEFORE UPDATE ON public.supplier_master FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_buyer_master_updated_at BEFORE UPDATE ON public.buyer_master FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default companies
INSERT INTO public.companies (name, code, address, gstin, pan_no) VALUES
  ('Kaveri Industries', 'KA', '#Khasra No. 4/2/2/2/4, Harpala Road, Sikri Industrial Area, Ballabhgarh, Faridabad - 121004, Haryana, India.', '07AAACP1595Q1ZU', 'AAACP1595Q'),
  ('Company B', 'CB', 'Company B Address', 'GST-B-12345', 'PAN-B-12345'),
  ('Company C', 'CC', 'Company C Address', 'GST-C-12345', 'PAN-C-12345');