import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, FileText, Download, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCompany } from "@/contexts/CompanyContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface POLineItem {
  id: string;
  item_description: string;
  make: string;
  quantity: number;
  unit: string;
  unit_rate: number;
  discount: number;
  amount: number;
}

const FROM_COMPANIES = [
  {
    id: "wasco",
    name: "WASCO INDUSTRIES",
    address: "#Khasra No. 4/2/2/2/4, Harpala Road, Sikri Industrial Area, Ballabhgarh, Faridabad – 121004, Haryana, India.",
    contact_number: "+91 9266776884",
    contact_person: "Mr. Narendra Kumar Srivastava",
    email: "profileautomation@gmail.com",
    gstin: "",
    pan_no: "",
    code: "WASCO"
  },
  {
    id: "profile",
    name: "PROFILE AUTOMATION",
    address: "#Plot No. C-128, Naraina Industrial Area, Phase-1, New Delhi – 110028, India.",
    contact_number: "+91 9266776884",
    contact_person: "Mr. Narendra Kumar Srivastava",
    email: "profileautomation@gmail.com",
    gstin: "",
    pan_no: "",
    code: "PROFILE"
  },
  {
    id: "kaveri",
    name: "KAVERI INDUSTRIES",
    address: "#Khasra No. 4/2/2/2/4, Harpala Road, Sikri Industrial Area, Ballabhgarh, Faridabad – 121004, Haryana, India.",
    contact_number: "+91 9266776884",
    contact_person: "Mr. Narendra Kumar Srivastava",
    email: "accounts@kaverinks.in",
    gstin: "",
    pan_no: "",
    code: "KAVERI"
  }
];

export default function PurchaseOrder() {
  const { selectedCompany } = useCompany();
  const [fromCompany, setFromCompany] = useState<typeof FROM_COMPANIES[0] | null>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [supplierDetails, setSupplierDetails] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [poNumber, setPoNumber] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [paymentTerms, setPaymentTerms] = useState<string>("100% against delivery of the material.");
  const [otherInstructions, setOtherInstructions] = useState<string>("");
  const [lineItems, setLineItems] = useState<POLineItem[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [previewPO, setPreviewPO] = useState<any>(null);
  const [previewItems, setPreviewItems] = useState<any[]>([]);
  const [previewSupplier, setPreviewSupplier] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (selectedCompany) {
      loadSuppliers();
      loadPurchaseOrders();
      loadItems();
      // Set default from company
      if (!fromCompany) {
        setFromCompany(FROM_COMPANIES[0]);
      }
    }
  }, [selectedCompany]);

  useEffect(() => {
    if (fromCompany) {
      generatePONumber();
    }
  }, [fromCompany]);

  useEffect(() => {
    if (selectedSupplier) {
      const supplier = suppliers.find(s => s.id === selectedSupplier);
      setSupplierDetails(supplier);
    }
  }, [selectedSupplier, suppliers]);

  const generatePONumber = async () => {
    if (!fromCompany) return;

    const year = new Date().getFullYear();
    const nextYear = year + 1;
    
    const { count } = await supabase
      .from("purchase_orders")
      .select("*", { count: "exact", head: true });

    const nextNumber = (count || 0) + 1;
    const poNum = `PO/${fromCompany.code}/${year}-${nextYear.toString().slice(-2)}/${String(nextNumber).padStart(4, "0")}`;
    setPoNumber(poNum);
  };

  const loadItems = async () => {
    const { data, error } = await supabase
      .from("purchase_item_master")
      .select("*")
      .order("item_name");

    if (error) {
      toast.error("Failed to load items");
      return;
    }

    setItems(data || []);
  };

  const loadSuppliers = async () => {
    if (!selectedCompany) return;

    const { data, error } = await supabase
      .from("supplier_master")
      .select("*")
      .eq("company_id", selectedCompany.id)
      .order("party_name");

    if (error) {
      toast.error("Failed to load suppliers");
      return;
    }

    setSuppliers(data || []);
  };

  const loadPurchaseOrders = async () => {
    if (!selectedCompany) return;

    const { data, error } = await supabase
      .from("purchase_orders")
      .select(`
        *,
        supplier_master (party_name)
      `)
      .eq("company_id", selectedCompany.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load purchase orders");
      return;
    }

    setPurchaseOrders(data || []);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: crypto.randomUUID(),
        item_description: "",
        make: "",
        quantity: 0,
        unit: "Nos",
        unit_rate: 0,
        discount: 0,
        amount: 0,
      },
    ]);
  };

  const updateLineItem = (id: string, field: keyof POLineItem, value: any) => {
    setLineItems((items) =>
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          // Auto-calculate amount
          if (field === "quantity" || field === "unit_rate" || field === "discount") {
            updated.amount = (updated.quantity * updated.unit_rate) - updated.discount;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const removeLineItem = (id: string) => {
    setLineItems((items) => items.filter((item) => item.id !== id));
  };

  const calculateTotals = () => {
    const basicAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const sgst = basicAmount * 0.09; // 9%
    const cgst = basicAmount * 0.09; // 9%
    const igst = 0;
    const grandTotal = basicAmount + sgst + cgst + igst;

    return { basicAmount, sgst, cgst, igst, grandTotal };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromCompany || !selectedSupplier) {
      toast.error("Please select from company and supplier");
      return;
    }

    if (lineItems.length === 0) {
      toast.error("Please add at least one line item");
      return;
    }

    const totals = calculateTotals();

    const { data: poData, error: poError } = await supabase
      .from("purchase_orders")
      .insert({
        company_id: selectedCompany.id,
        supplier_id: selectedSupplier,
        po_number: poNumber,
        delivery_date: deliveryDate,
        payment_terms: paymentTerms,
        other_instructions: otherInstructions,
        basic_amount: totals.basicAmount,
        sgst: totals.sgst,
        cgst: totals.cgst,
        igst: totals.igst,
        grand_total: totals.grandTotal,
        status: "draft",
      })
      .select()
      .single();

    if (poError) {
      toast.error("Failed to create purchase order");
      return;
    }

    const itemsToInsert = lineItems.map((item) => ({
      po_id: poData.id,
      item_description: item.item_description,
      make: item.make,
      quantity: item.quantity,
      unit: item.unit,
      unit_rate: item.unit_rate,
      discount: item.discount,
      amount: item.amount,
    }));

    const { error: itemsError } = await supabase
      .from("purchase_order_items")
      .insert(itemsToInsert);

    if (itemsError) {
      toast.error("Failed to add line items");
      return;
    }

    toast.success("Purchase order created successfully");
    
    // Reset form
    setSelectedSupplier("");
    setDeliveryDate("");
    setLineItems([]);
    generatePONumber();
    loadPurchaseOrders();
  };

  const handlePreview = async (po: any) => {
    const { data: items } = await supabase
      .from("purchase_order_items")
      .select("*")
      .eq("po_id", po.id);

    const { data: supplier } = await supabase
      .from("supplier_master")
      .select("*")
      .eq("id", po.supplier_id)
      .single();

    setPreviewPO(po);
    setPreviewItems(items || []);
    setPreviewSupplier(supplier);
    setIsPreviewOpen(true);
  };

  const totals = calculateTotals();

  const downloadPDF = async (po: any) => {
    const { data: items } = await supabase
      .from("purchase_order_items")
      .select("*")
      .eq("po_id", po.id);

    const { data: supplier } = await supabase
      .from("supplier_master")
      .select("*")
      .eq("id", po.supplier_id)
      .single();

    // Get company from FROM_COMPANIES based on po details
    const company = fromCompany;
    const doc = new jsPDF();
    
    // Draw outer border for entire document
    doc.setLineWidth(0.5);
    doc.rect(10, 10, 190, 277);
    
    // Title - PURCHASE ORDER centered
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PURCHASE ORDER", 105, 18, { align: "center" });
    
    // Horizontal line under title
    doc.setLineWidth(0.3);
    doc.line(10, 21, 200, 21);
    
    // From Section (Left side)
    let yPos = 27;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("From", 12, yPos);
    
    yPos += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(company?.name?.toUpperCase() || "COMPANY NAME", 12, yPos);
    
    yPos += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    if (company?.address) {
      const addressLines = doc.splitTextToSize(company.address, 90);
      doc.text(addressLines, 12, yPos);
      yPos += addressLines.length * 4;
    }
    
    if (company?.contact_number) {
      doc.text(`Contact No. ${company.contact_number}`, 12, yPos);
      yPos += 4;
    }
    
    if (company?.email) {
      doc.text(`Email: ${company.email}`, 12, yPos);
      yPos += 4;
    }
    
    // Right side box with PO details and GST info
    const boxX = 115;
    const boxY = 27;
    const boxWidth = 83;
    const boxHeight = 35;
    
    doc.setLineWidth(0.3);
    doc.rect(boxX, boxY, boxWidth, boxHeight);
    
    // PO Details in top right
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Purchase Order", 155, boxY + 5, { align: "center" });
    
    // Horizontal line in box
    doc.line(boxX, boxY + 7, boxX + boxWidth, boxY + 7);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`P.O. No: ${po.po_number}`, boxX + 2, boxY + 12);
    doc.text(new Date(po.po_date).toLocaleDateString("en-GB"), boxX + boxWidth - 2, boxY + 12, { align: "right" });
    
    // Buyer Details section
    doc.line(boxX, boxY + 14, boxX + boxWidth, boxY + 14);
    doc.setFont("helvetica", "bold");
    doc.text("Buyer Details", boxX + 2, boxY + 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`GST No: ${company?.gstin || "N/A"}`, boxX + 2, boxY + 22);
    doc.text(`PAN No: ${company?.pan_no || "N/A"}`, boxX + 2, boxY + 25);
    
    // Seller Details section
    doc.line(boxX, boxY + 27, boxX + boxWidth, boxY + 27);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Seller Details", boxX + 2, boxY + 31);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`GST No: ${supplier?.gstin || "N/A"}`, boxX + 2, boxY + 35);
    doc.text(`PAN No: ${supplier?.pan_no || "N/A"}`, boxX + 2, boxY + 38);
    
    // To Section (Left side, below From)
    yPos = boxY + boxHeight + 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("To", 12, yPos);
    
    yPos += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(supplier?.party_name || "SUPPLIER NAME", 12, yPos);
    
    yPos += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    if (supplier?.party_address) {
      const supplierAddressLines = doc.splitTextToSize(supplier.party_address, 90);
      doc.text(supplierAddressLines, 12, yPos);
      yPos += supplierAddressLines.length * 3.5;
    }
    
    if (supplier?.contact_number) {
      doc.text(`Mobile No. ${supplier.contact_number}`, 12, yPos);
      yPos += 3.5;
    }
    
    if (supplier?.email_address) {
      doc.text(`Email: ${supplier.email_address}`, 12, yPos);
      yPos += 3.5;
    }
    
    if (supplier?.contact_person) {
      doc.text(`Contact Person: ${supplier.contact_person}`, 12, yPos);
      yPos += 3.5;
    }
    
    // Greeting message
    const greetingY = Math.max(yPos + 5, boxY + boxHeight + 33);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const contactPerson = supplier?.contact_person || "Sir/Madam";
    const firstName = contactPerson.replace(/^(Mr\.|Ms\.|Mrs\.)\s*/i, '').split(' ')[0];
    doc.text(
      `Dear Mr. ${firstName}, we are pleased to issue this purchase order in your favor, please supply ordered bearings`,
      12,
      greetingY
    );
    doc.text(
      `as per the under mentioned items strictly as per terms & conditions as per below.`,
      12,
      greetingY + 3.5
    );
    
    // Line Items Table
    const tableStartY = greetingY + 8;
    const tableData = items?.map((item: any, index: number) => [
      index + 1,
      item.item_description,
      item.make || "-",
      item.quantity.toFixed(2),
      item.unit,
      item.unit_rate.toFixed(2),
      item.discount.toFixed(2),
      item.amount.toFixed(2),
    ]) || [];

    // Add total row
    const totalQty = items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
    tableData.push([
      "",
      "",
      "Total",
      totalQty.toFixed(2),
      "Nos",
      "Basic Amount",
      "",
      po.basic_amount.toFixed(2)
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [["S. No.", "Item Description", "Make", "Quantity", "Unit", "Unit Rate", "Discount", "Amount"]],
      body: tableData,
      margin: { left: 12, right: 12 },
      theme: "grid",
      headStyles: { 
        fillColor: [255, 255, 255],
        textColor: 0,
        fontStyle: "bold",
        halign: "center",
        fontSize: 8,
        lineWidth: 0.3,
        lineColor: 0,
        cellPadding: 1.5
      },
      bodyStyles: {
        fontSize: 7,
        lineWidth: 0.3,
        lineColor: 0,
        cellPadding: 1.5
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 12 },
        1: { cellWidth: 55 },
        2: { cellWidth: 18, halign: "center" },
        3: { halign: "right", cellWidth: 20 },
        4: { halign: "center", cellWidth: 12 },
        5: { halign: "right", cellWidth: 24 },
        6: { halign: "right", cellWidth: 20 },
        7: { halign: "right", cellWidth: 25 }
      },
      didDrawCell: function(data) {
        // Add currency/percentage symbols after the cell content
        if (data.section === 'body') {
          if (data.column.index === 5 && data.row.index !== tableData.length - 1) {
            // Unit Rate - add ₹ prefix
            doc.setFontSize(7);
            doc.text('₹', data.cell.x + 2, data.cell.y + data.cell.height / 2 + 1);
          } else if (data.column.index === 6 && data.row.index !== tableData.length - 1 && data.cell.text[0] !== '') {
            // Discount - add % suffix
            doc.setFontSize(7);
            const textWidth = doc.getTextWidth(data.cell.text[0]);
            doc.text('%', data.cell.x + data.cell.width - 2 - textWidth - 3, data.cell.y + data.cell.height / 2 + 1);
          } else if (data.column.index === 7) {
            // Amount - add ₹ prefix
            doc.setFontSize(7);
            doc.text('₹', data.cell.x + 2, data.cell.y + data.cell.height / 2 + 1);
          }
        }
      },
      didParseCell: function(data) {
        // Make the total row bold
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 3;
    
    // Payment Terms and Tax Summary side by side
    const leftColX = 12;
    const rightColX = 120;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Payment Terms:", leftColX, finalY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(po.payment_terms || "100% against delivery of the material.", leftColX, finalY + 4);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Delivery Time:", leftColX, finalY + 9);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    const deliveryText = po.delivery_date 
      ? `Within one week time i.e. on or before ${new Date(po.delivery_date).toLocaleDateString("en-GB")}.`
      : "As per agreed terms.";
    doc.text(deliveryText, leftColX, finalY + 13);
    
    // Tax table on right side
    doc.setLineWidth(0.3);
    const taxTableX = rightColX;
    const taxTableY = finalY - 2;
    const taxTableWidth = 78;
    let taxRowHeight = 5;
    
    // Draw tax table
    doc.rect(taxTableX, taxTableY, taxTableWidth, taxRowHeight); // Freight row
    doc.rect(taxTableX, taxTableY + taxRowHeight, taxTableWidth, taxRowHeight); // SGST
    doc.rect(taxTableX, taxTableY + taxRowHeight * 2, taxTableWidth, taxRowHeight); // CGST
    doc.rect(taxTableX, taxTableY + taxRowHeight * 3, taxTableWidth, taxRowHeight); // IGST
    
    // Bold border for Grand Total
    doc.setLineWidth(0.5);
    doc.rect(taxTableX, taxTableY + taxRowHeight * 4, taxTableWidth, taxRowHeight);
    doc.setLineWidth(0.3);
    
    // Vertical lines for columns
    doc.line(taxTableX + 35, taxTableY, taxTableX + 35, taxTableY + taxRowHeight * 5);
    doc.line(taxTableX + 55, taxTableY, taxTableX + 55, taxTableY + taxRowHeight * 5);
    
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    
    // Freight
    doc.text("Freight", taxTableX + 2, taxTableY + 3.5);
    doc.text("Inclusive", taxTableX + 37, taxTableY + 3.5);
    doc.text((po.freight || 0).toFixed(2), taxTableX + taxTableWidth - 2, taxTableY + 3.5, { align: "right" });
    
    // SGST
    const sgstPercent = po.basic_amount > 0 ? ((po.sgst / po.basic_amount) * 100).toFixed(2) : "9.00";
    doc.text("SGST", taxTableX + 2, taxTableY + taxRowHeight + 3.5);
    doc.text(`${sgstPercent}%`, taxTableX + 37, taxTableY + taxRowHeight + 3.5);
    doc.text(po.sgst.toFixed(2), taxTableX + taxTableWidth - 2, taxTableY + taxRowHeight + 3.5, { align: "right" });
    
    // CGST
    const cgstPercent = po.basic_amount > 0 ? ((po.cgst / po.basic_amount) * 100).toFixed(2) : "9.00";
    doc.text("CGST", taxTableX + 2, taxTableY + taxRowHeight * 2 + 3.5);
    doc.text(`${cgstPercent}%`, taxTableX + 37, taxTableY + taxRowHeight * 2 + 3.5);
    doc.text(po.cgst.toFixed(2), taxTableX + taxTableWidth - 2, taxTableY + taxRowHeight * 2 + 3.5, { align: "right" });
    
    // IGST
    const igstPercent = po.basic_amount > 0 ? ((po.igst / po.basic_amount) * 100).toFixed(2) : "0.00";
    doc.text("IGST", taxTableX + 2, taxTableY + taxRowHeight * 3 + 3.5);
    doc.text(`${igstPercent}%`, taxTableX + 37, taxTableY + taxRowHeight * 3 + 3.5);
    doc.text(po.igst.toFixed(2), taxTableX + taxTableWidth - 2, taxTableY + taxRowHeight * 3 + 3.5, { align: "right" });
    
    // Grand Total (bold)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Grand Total", taxTableX + 2, taxTableY + taxRowHeight * 4 + 3.5);
    doc.text(`₹ ${po.grand_total.toFixed(2)}`, taxTableX + taxTableWidth - 2, taxTableY + taxRowHeight * 4 + 3.5, { align: "right" });
    
    // Additional terms
    let termsY = finalY + 20;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    
    const terms = [
      `All invoices shall be raised in the name of: ${company?.name || "Company Name"} ${company?.address || ""}`,
      "Transit Insurance: In supplier scope; Packing & Forwarding: In supplier scope",
      "Product Test Certificate: For traceability, please ensure the serial/batch numbers on the certificate match the products delivered."
    ];
    
    terms.forEach((term, index) => {
      const termLines = doc.splitTextToSize(term, 186);
      doc.text(termLines, 12, termsY);
      termsY += termLines.length * 3.5 + 1;
    });
    
    // Other Instructions / Terms & Conditions
    if (po.other_instructions) {
      termsY += 2;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("Other Instructions Terms & Conditions", 12, termsY);
      termsY += 4;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      const instructions = po.other_instructions.split('\n');
      instructions.forEach((instruction: string, index: number) => {
        const instructionLines = doc.splitTextToSize(`${index + 1}. ${instruction}`, 186);
        doc.text(instructionLines, 12, termsY);
        termsY += instructionLines.length * 3.5 + 1;
      });
    }
    
    // Footer with Authorized Signatory
    const pageHeight = doc.internal.pageSize.height;
    const footerY = pageHeight - 15;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(`For ${company?.name || "Company Name"}`, 155, footerY, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("Authorized Signatory", 155, footerY + 8, { align: "center" });

    doc.save(`PO_${po.po_number}.pdf`);
    toast.success("PDF downloaded successfully");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Purchase Order</h1>
        <p className="text-muted-foreground">Create and manage purchase orders</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Purchase Order</CardTitle>
          <CardDescription>Fill in the details below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromCompany">From (Company) *</Label>
                <Select 
                  value={fromCompany?.id || ""} 
                  onValueChange={(value) => {
                    const company = FROM_COMPANIES.find(c => c.id === value);
                    setFromCompany(company || null);
                  }} 
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Company" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {FROM_COMPANIES.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">To (Supplier) *</Label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Supplier" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.party_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>PO Number</Label>
                <Input value={poNumber} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_date">Delivery Date</Label>
                <Input
                  id="delivery_date"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>
            </div>

            {supplierDetails && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2">Supplier Details:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">Contact Person:</span> {supplierDetails.contact_person}</div>
                  <div><span className="font-medium">Contact:</span> {supplierDetails.contact_number}</div>
                  <div><span className="font-medium">Email:</span> {supplierDetails.email_address}</div>
                  <div><span className="font-medium">Address:</span> {supplierDetails.party_address}</div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Line Items</h3>
                <Button type="button" onClick={addLineItem} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S. No.</TableHead>
                      <TableHead>Item Description *</TableHead>
                      <TableHead>Make</TableHead>
                      <TableHead>Quantity *</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Unit Rate *</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Select
                            value={item.item_description}
                            onValueChange={(value) => {
                              const selectedItem = items.find(i => i.item_name === value);
                              if (selectedItem) {
                                updateLineItem(item.id, "item_description", selectedItem.item_name);
                                updateLineItem(item.id, "unit", selectedItem.uom || "Nos");
                                updateLineItem(item.id, "unit_rate", selectedItem.unit_price || 0);
                              } else {
                                updateLineItem(item.id, "item_description", value);
                              }
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select or type item" />
                            </SelectTrigger>
                            <SelectContent className="bg-background z-50">
                              {items.map((itm) => (
                                <SelectItem key={itm.id} value={itm.item_name}>
                                  {itm.item_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.make}
                            onChange={(e) => updateLineItem(item.id, "make", e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) =>
                              updateLineItem(item.id, "quantity", parseFloat(e.target.value) || 0)
                            }
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.unit}
                            onValueChange={(value) => updateLineItem(item.id, "unit", value)}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Nos">Nos</SelectItem>
                              <SelectItem value="Kgs">Kgs</SelectItem>
                              <SelectItem value="Meter">Meter</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unit_rate}
                            onChange={(e) =>
                              updateLineItem(item.id, "unit_rate", parseFloat(e.target.value) || 0)
                            }
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.discount}
                            onChange={(e) =>
                              updateLineItem(item.id, "discount", parseFloat(e.target.value) || 0)
                            }
                          />
                        </TableCell>
                        <TableCell>₹ {item.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeLineItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_terms">Payment Terms</Label>
                  <Textarea
                    id="payment_terms"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="other_instructions">Other Instructions</Label>
                  <Textarea
                    id="other_instructions"
                    value={otherInstructions}
                    onChange={(e) => setOtherInstructions(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Basic Amount:</span>
                  <span>₹ {totals.basicAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>SGST (9%):</span>
                  <span>₹ {totals.sgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>CGST (9%):</span>
                  <span>₹ {totals.cgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>IGST:</span>
                  <span>₹ {totals.igst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-primary">
                  <span className="font-bold text-lg">Grand Total:</span>
                  <span className="font-bold text-lg text-primary">₹ {totals.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit">
                <FileText className="h-4 w-4 mr-2" />
                Create Purchase Order
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Grand Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrders.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-medium">{po.po_number}</TableCell>
                  <TableCell>{po.supplier_master?.party_name}</TableCell>
                  <TableCell>{new Date(po.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>₹ {po.grand_total.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreview(po)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadPDF(po)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Order Preview</DialogTitle>
            <DialogDescription>
              {previewPO?.po_number} - {previewSupplier?.party_name}
            </DialogDescription>
          </DialogHeader>
          
          {previewPO && (
            <div className="space-y-4">
              {/* From Section */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">From</h3>
                  <div className="text-sm space-y-1">
                    <p className="font-bold">{fromCompany?.name}</p>
                    <p className="text-muted-foreground">{fromCompany?.address}</p>
                    <p>Contact: {fromCompany?.contact_number}</p>
                    <p>Contact Person: {fromCompany?.contact_person}</p>
                    <p>Email: {fromCompany?.email}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">PO Details</h3>
                  <div className="text-sm space-y-1 border p-3 rounded">
                    <p><span className="font-semibold">PO Number:</span> {previewPO.po_number}</p>
                    <p><span className="font-semibold">Date:</span> {new Date(previewPO.po_date).toLocaleDateString("en-GB")}</p>
                    <div className="border-t pt-2 mt-2">
                      <p className="font-semibold mb-1">Buyer Details</p>
                      <p className="text-xs">GST: {fromCompany?.gstin || "N/A"}</p>
                      <p className="text-xs">PAN: {fromCompany?.pan_no || "N/A"}</p>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <p className="font-semibold mb-1">Seller Details</p>
                      <p className="text-xs">GST: {previewSupplier?.gstin || "N/A"}</p>
                      <p className="text-xs">PAN: {previewSupplier?.pan_no || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* To Section */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">To</h3>
                <div className="text-sm space-y-1">
                  <p className="font-bold">{previewSupplier?.party_name}</p>
                  <p className="text-muted-foreground">{previewSupplier?.party_address}</p>
                  <p>Mobile: {previewSupplier?.contact_number}</p>
                  <p>Email: {previewSupplier?.email_address}</p>
                  <p>Contact Person: {previewSupplier?.contact_person}</p>
                </div>
              </div>

              {/* Greeting */}
              <div className="bg-muted/50 p-3 rounded text-sm">
                <p>
                  Dear Mr. {previewSupplier?.contact_person?.replace(/^(Mr\.|Ms\.|Mrs\.)\s*/i, '').split(' ')[0] || 'Sir/Madam'}, 
                  we are pleased to issue this purchase order in your favor, please supply ordered bearings 
                  as per the under mentioned items strictly as per terms & conditions as per below.
                </p>
              </div>

              {/* Items Table */}
              <div>
                <h3 className="font-semibold text-sm mb-2">Line Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">S.No.</TableHead>
                      <TableHead>Item Description</TableHead>
                      <TableHead>Make</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Discount</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewItems.map((item: any, index: number) => (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{item.item_description}</TableCell>
                        <TableCell>{item.make || "-"}</TableCell>
                        <TableCell className="text-right">{item.quantity.toFixed(2)}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell className="text-right">₹{item.unit_rate.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{item.discount.toFixed(2)}%</TableCell>
                        <TableCell className="text-right">₹{item.amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold border-t-2">
                      <TableCell colSpan={3} className="text-right">Total</TableCell>
                      <TableCell className="text-right">
                        {previewItems.reduce((sum: number, item: any) => sum + item.quantity, 0).toFixed(2)}
                      </TableCell>
                      <TableCell>Nos</TableCell>
                      <TableCell colSpan={2} className="text-right">Basic Amount</TableCell>
                      <TableCell className="text-right">₹{previewPO.basic_amount.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Tax Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Payment Terms</h3>
                  <p className="text-sm">{previewPO.payment_terms}</p>
                  
                  <h3 className="font-semibold text-sm mt-4">Delivery Time</h3>
                  <p className="text-sm">
                    {previewPO.delivery_date 
                      ? `Within one week time i.e. on or before ${new Date(previewPO.delivery_date).toLocaleDateString("en-GB")}.`
                      : "As per agreed terms."}
                  </p>
                </div>

                <div className="border rounded p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Freight:</span>
                    <span>Inclusive - ₹{(previewPO.freight || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>SGST (9%):</span>
                    <span>₹{previewPO.sgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>CGST (9%):</span>
                    <span>₹{previewPO.cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>IGST (0%):</span>
                    <span>₹{previewPO.igst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base border-t-2 pt-2">
                    <span>Grand Total:</span>
                    <span>₹{previewPO.grand_total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {previewPO.other_instructions && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Other Instructions Terms & Conditions</h3>
                  <div className="text-sm space-y-1">
                    {previewPO.other_instructions.split('\n').map((instruction: string, index: number) => (
                      <p key={index}>{index + 1}. {instruction}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  downloadPDF(previewPO);
                  setIsPreviewOpen(false);
                }}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
