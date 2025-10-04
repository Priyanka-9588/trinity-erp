import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCompany } from "@/contexts/CompanyContext";

interface PartyFormData {
  party_name: string;
  category: string;
  party_type: string;
  contact_person: string;
  contact_number: string;
  email_address: string;
  website: string;
  party_address: string;
  gstin: string;
  pan_no: string;
  cin_no: string;
  msme_id: string;
  credit_limit: string;
  credit_period: string;
  created_by: string;
}

const initialFormData: PartyFormData = {
  party_name: "",
  category: "",
  party_type: "",
  contact_person: "",
  contact_number: "",
  email_address: "",
  website: "",
  party_address: "",
  gstin: "",
  pan_no: "",
  cin_no: "",
  msme_id: "",
  credit_limit: "",
  credit_period: "",
  created_by: "",
};

export default function PartyMaster() {
  const { selectedCompany } = useCompany();
  const [activeTab, setActiveTab] = useState<"supplier" | "buyer">("supplier");
  const [formData, setFormData] = useState<PartyFormData>(initialFormData);
  const [parties, setParties] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedCompany) {
      loadParties();
    }
  }, [activeTab, selectedCompany]);

  const generatePartyCode = async () => {
    const table = activeTab === "supplier" ? "supplier_master" : "buyer_master";
    
    const { count } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    const nextNumber = (count || 0) + 1;
    const prefix = activeTab === "supplier" ? "SUP" : "BUY";
    return `${prefix}/${String(nextNumber).padStart(3, "0")}`;
  };

  const loadParties = async () => {
    if (!selectedCompany) return;

    const table = activeTab === "supplier" ? "supplier_master" : "buyer_master";
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("company_id", selectedCompany.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load parties");
      return;
    }

    setParties(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) {
      toast.error("Please select a company first");
      return;
    }

    const table = activeTab === "supplier" ? "supplier_master" : "buyer_master";
    const partyCode = editingId ? undefined : await generatePartyCode();

    const partyData = {
      ...formData,
      company_id: selectedCompany.id,
      party_code: partyCode,
      credit_limit: parseFloat(formData.credit_limit) || 0,
    };

    if (editingId) {
      const { error } = await supabase
        .from(table)
        .update(partyData)
        .eq("id", editingId);

      if (error) {
        toast.error("Failed to update party");
        return;
      }
      toast.success("Party updated successfully");
      setEditingId(null);
    } else {
      const { error } = await supabase.from(table).insert(partyData);

      if (error) {
        toast.error("Failed to create party");
        return;
      }
      toast.success("Party created successfully");
    }

    setFormData(initialFormData);
    loadParties();
  };

  const handleEdit = (party: any) => {
    setEditingId(party.id);
    setFormData({
      party_name: party.party_name,
      category: party.category || "",
      party_type: party.party_type || "",
      contact_person: party.contact_person || "",
      contact_number: party.contact_number || "",
      email_address: party.email_address || "",
      website: party.website || "",
      party_address: party.party_address || "",
      gstin: party.gstin || "",
      pan_no: party.pan_no || "",
      cin_no: party.cin_no || "",
      msme_id: party.msme_id || "",
      credit_limit: party.credit_limit?.toString() || "",
      credit_period: party.credit_period || "",
      created_by: party.created_by || "",
    });
  };

  const handleDelete = async (id: string) => {
    const table = activeTab === "supplier" ? "supplier_master" : "buyer_master";
    const { error } = await supabase.from(table).delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete party");
      return;
    }

    toast.success("Party deleted successfully");
    loadParties();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Party Master</h1>
        <p className="text-muted-foreground">Manage suppliers and buyers</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "supplier" | "buyer")}>
        <TabsList>
          <TabsTrigger value="supplier">Supplier</TabsTrigger>
          <TabsTrigger value="buyer">Buyer</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? "Edit" : "Add"} {activeTab === "supplier" ? "Supplier" : "Buyer"}</CardTitle>
              <CardDescription>Enter party details below</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="party_name">Party Name *</Label>
                    <Input
                      id="party_name"
                      value={formData.party_name}
                      onChange={(e) => setFormData({ ...formData, party_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="party_type">Party Type</Label>
                    <Input
                      id="party_type"
                      value={formData.party_type}
                      onChange={(e) => setFormData({ ...formData, party_type: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_person">Contact Person</Label>
                    <Input
                      id="contact_person"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_number">Contact Number</Label>
                    <Input
                      id="contact_number"
                      value={formData.contact_number}
                      onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email_address">Email Address</Label>
                    <Input
                      id="email_address"
                      type="email"
                      value={formData.email_address}
                      onChange={(e) => setFormData({ ...formData, email_address: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gstin">GSTIN</Label>
                    <Input
                      id="gstin"
                      value={formData.gstin}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pan_no">PAN No.</Label>
                    <Input
                      id="pan_no"
                      value={formData.pan_no}
                      onChange={(e) => setFormData({ ...formData, pan_no: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cin_no">CIN No.</Label>
                    <Input
                      id="cin_no"
                      value={formData.cin_no}
                      onChange={(e) => setFormData({ ...formData, cin_no: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="msme_id">MSME ID</Label>
                    <Input
                      id="msme_id"
                      value={formData.msme_id}
                      onChange={(e) => setFormData({ ...formData, msme_id: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="credit_limit">Credit Limit</Label>
                    <Input
                      id="credit_limit"
                      type="number"
                      step="0.01"
                      value={formData.credit_limit}
                      onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="credit_period">Credit Period</Label>
                    <Input
                      id="credit_period"
                      value={formData.credit_period}
                      onChange={(e) => setFormData({ ...formData, credit_period: e.target.value })}
                      placeholder="e.g., 30 days"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="created_by">Created By</Label>
                    <Input
                      id="created_by"
                      value={formData.created_by}
                      onChange={(e) => setFormData({ ...formData, created_by: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-3">
                    <Label htmlFor="party_address">Party Address</Label>
                    <Textarea
                      id="party_address"
                      value={formData.party_address}
                      onChange={(e) => setFormData({ ...formData, party_address: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    {editingId ? "Update" : "Add"} Party
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
              <CardTitle>{activeTab === "supplier" ? "Suppliers" : "Buyers"}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Party Code</TableHead>
                    <TableHead>Party Name</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Contact Number</TableHead>
                    <TableHead>GSTIN</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parties.map((party) => (
                    <TableRow key={party.id}>
                      <TableCell className="font-medium">{party.party_code}</TableCell>
                      <TableCell>{party.party_name}</TableCell>
                      <TableCell>{party.contact_person}</TableCell>
                      <TableCell>{party.contact_number}</TableCell>
                      <TableCell>{party.gstin}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(party)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(party.id)}
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
