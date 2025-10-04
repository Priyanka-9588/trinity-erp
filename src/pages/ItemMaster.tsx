import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCompany } from "@/contexts/CompanyContext";

interface ItemFormData {
  item_name: string;
  description: string;
  item_type: string;
  machine_name: string;
  item_group: string;
  uom: string;
  hsn_code: string;
  tax: string;
  lead_time: string;
  price: string;
  unit_price: string;
  currency: string;
}

const initialFormData: ItemFormData = {
  item_name: "",
  description: "",
  item_type: "",
  machine_name: "",
  item_group: "",
  uom: "",
  hsn_code: "",
  tax: "",
  lead_time: "",
  price: "",
  unit_price: "",
  currency: "INR",
};

export default function ItemMaster() {
  const { selectedCompany } = useCompany();
  const [activeTab, setActiveTab] = useState<"sale" | "purchase">("sale");
  const [formData, setFormData] = useState<ItemFormData>(initialFormData);
  const [items, setItems] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedCompany) {
      loadItems();
    }
  }, [activeTab, selectedCompany]);

  const generateItemCode = async () => {
    const year = new Date().getFullYear();
    const table = activeTab === "sale" ? "sale_item_master" : "purchase_item_master";
    
    const { count } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    const nextNumber = (count || 0) + 1;
    return `ITM/${String(nextNumber).padStart(3, "0")}/${year}`;
  };

  const loadItems = async () => {
    if (!selectedCompany) return;

    const table = activeTab === "sale" ? "sale_item_master" : "purchase_item_master";
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("company_id", selectedCompany.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load items");
      return;
    }

    setItems(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) {
      toast.error("Please select a company first");
      return;
    }

    const table = activeTab === "sale" ? "sale_item_master" : "purchase_item_master";
    const itemCode = editingId ? undefined : await generateItemCode();

    const itemData = {
      ...formData,
      company_id: selectedCompany.id,
      item_code: itemCode,
      tax: parseFloat(formData.tax) || 0,
      price: parseFloat(formData.price) || 0,
      unit_price: parseFloat(formData.unit_price) || 0,
    };

    if (editingId) {
      const { error } = await supabase
        .from(table)
        .update(itemData)
        .eq("id", editingId);

      if (error) {
        toast.error("Failed to update item");
        return;
      }
      toast.success("Item updated successfully");
      setEditingId(null);
    } else {
      const { error } = await supabase.from(table).insert(itemData);

      if (error) {
        toast.error("Failed to create item");
        return;
      }
      toast.success("Item created successfully");
    }

    setFormData(initialFormData);
    loadItems();
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      item_name: item.item_name,
      description: item.description || "",
      item_type: item.item_type || "",
      machine_name: item.machine_name || "",
      item_group: item.item_group || "",
      uom: item.uom || "",
      hsn_code: item.hsn_code || "",
      tax: item.tax?.toString() || "",
      lead_time: item.lead_time || "",
      price: item.price?.toString() || "",
      unit_price: item.unit_price?.toString() || "",
      currency: item.currency || "INR",
    });
  };

  const handleDelete = async (id: string) => {
    const table = activeTab === "sale" ? "sale_item_master" : "purchase_item_master";
    const { error } = await supabase.from(table).delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete item");
      return;
    }

    toast.success("Item deleted successfully");
    loadItems();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Item Master</h1>
        <p className="text-muted-foreground">Manage sale and purchase items</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "sale" | "purchase")}>
        <TabsList>
          <TabsTrigger value="sale">Sale</TabsTrigger>
          <TabsTrigger value="purchase">Purchase</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? "Edit" : "Add"} {activeTab === "sale" ? "Sale" : "Purchase"} Item</CardTitle>
              <CardDescription>
                Enter item details below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="item_name">Item Name *</Label>
                    <Input
                      id="item_name"
                      value={formData.item_name}
                      onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="item_type">Item Type</Label>
                    <Select
                      value={formData.item_type}
                      onValueChange={(value) => setFormData({ ...formData, item_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Capital Goods">Capital Goods</SelectItem>
                        <SelectItem value="Consumables">Consumables</SelectItem>
                        <SelectItem value="General Item">General Item</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="machine_name">Machine Name</Label>
                    <Input
                      id="machine_name"
                      value={formData.machine_name}
                      onChange={(e) => setFormData({ ...formData, machine_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="item_group">Item Group</Label>
                    <Input
                      id="item_group"
                      value={formData.item_group}
                      onChange={(e) => setFormData({ ...formData, item_group: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uom">UoM</Label>
                    <Select
                      value={formData.uom}
                      onValueChange={(value) => setFormData({ ...formData, uom: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select UoM" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nos">Nos</SelectItem>
                        <SelectItem value="Kgs">Kgs</SelectItem>
                        <SelectItem value="Sq. Meter">Sq. Meter</SelectItem>
                        <SelectItem value="Meter">Meter</SelectItem>
                        <SelectItem value="Liter">Liter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hsn_code">HSN Code</Label>
                    <Input
                      id="hsn_code"
                      value={formData.hsn_code}
                      onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tax">Tax (%)</Label>
                    <Input
                      id="tax"
                      type="number"
                      step="0.01"
                      value={formData.tax}
                      onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lead_time">Lead Time</Label>
                    <Input
                      id="lead_time"
                      value={formData.lead_time}
                      onChange={(e) => setFormData({ ...formData, lead_time: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit_price">Unit Price</Label>
                    <Input
                      id="unit_price"
                      type="number"
                      step="0.01"
                      value={formData.unit_price}
                      onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData({ ...formData, currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-3">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    {editingId ? "Update" : "Add"} Item
                  </Button>
                  {editingId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingId(null);
                        setFormData(initialFormData);
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{activeTab === "sale" ? "Sale" : "Purchase"} Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Code</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>UoM</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.item_code}</TableCell>
                      <TableCell>{item.item_name}</TableCell>
                      <TableCell>{item.item_type}</TableCell>
                      <TableCell>{item.uom}</TableCell>
                      <TableCell>
                        {item.currency} {item.price}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
