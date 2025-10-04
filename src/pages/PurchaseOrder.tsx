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
import { Plus, Trash2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCompany } from "@/contexts/CompanyContext";

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
        ...totals,
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
