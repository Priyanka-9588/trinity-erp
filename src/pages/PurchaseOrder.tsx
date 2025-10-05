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
import { Plus, Trash2, FileText, Download } from "lucide-react";
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

export default function PurchaseOrder() {
  const { selectedCompany } = useCompany();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [poNumber, setPoNumber] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [paymentTerms, setPaymentTerms] = useState<string>("100% against delivery of the material.");
  const [otherInstructions, setOtherInstructions] = useState<string>("");
  const [lineItems, setLineItems] = useState<POLineItem[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);

  useEffect(() => {
    if (selectedCompany) {
      loadSuppliers();
      loadPurchaseOrders();
      generatePONumber();
    }
  }, [selectedCompany]);

  const generatePONumber = async () => {
    if (!selectedCompany) return;

    const year = new Date().getFullYear();
    const nextYear = year + 1;
    
    const { count } = await supabase
      .from("purchase_orders")
      .select("*", { count: "exact", head: true })
      .eq("company_id", selectedCompany.id);

    const nextNumber = (count || 0) + 1;
    const poNum = `PO/${selectedCompany.code}/${year}-${nextYear.toString().slice(-2)}/${String(nextNumber).padStart(4, "0")}`;
    setPoNumber(poNum);
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
    if (!selectedCompany || !selectedSupplier) {
      toast.error("Please select company and supplier");
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

    const company = selectedCompany;
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
    doc.text(
      `Dear ${contactPerson}, we are pleased to issue this purchase order in your favor, please supply ordered SSR`,
      12,
      greetingY
    );
    doc.text(
      `& HSR as per the under mentioned items strictly as per terms & conditions as per below.`,
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
                <Label>From (Company)</Label>
                <Input value={selectedCompany?.name || ""} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">To (Supplier) *</Label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Supplier" />
                  </SelectTrigger>
                  <SelectContent>
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
                          <Input
                            value={item.item_description}
                            onChange={(e) =>
                              updateLineItem(item.id, "item_description", e.target.value)
                            }
                            required
                          />
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
                <TableHead>Status</TableHead>
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
                    <span className="px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground">
                      {po.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadPDF(po)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
