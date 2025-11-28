"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import {
  CreditCard,
  Plus,
  Loader2,
  Edit,
  Trash2,
  Star,
  Check,
  Users,
  Shield,
  Database,
  Building,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  plan: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  maxMembers: number;
  maxAdmins: number;
  maxCampuses: number;
  maxStorage: number;
  features: string[];
  premiumFeatures: string[];
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
  trialDays: number;
}

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    plan: "BASIC",
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: "KES",
    maxMembers: 100,
    maxAdmins: 5,
    maxCampuses: 1,
    maxStorage: 5,
    features: "",
    isActive: true,
    isPopular: false,
    sortOrder: 0,
    trialDays: 14,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/subscription-plans?includeInactive=true");
      if (!response.ok) throw new Error("Failed to fetch plans");
      const data = await response.json();
      setPlans(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const featuresArray = formData.features
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      const url = editingPlan
        ? `/api/admin/subscription-plans/${editingPlan.id}`
        : "/api/admin/subscription-plans";
      const method = editingPlan ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          monthlyPrice: parseFloat(formData.monthlyPrice.toString()),
          yearlyPrice: parseFloat(formData.yearlyPrice.toString()),
          maxMembers: parseInt(formData.maxMembers.toString()),
          maxAdmins: parseInt(formData.maxAdmins.toString()),
          maxCampuses: parseInt(formData.maxCampuses.toString()),
          maxStorage: parseInt(formData.maxStorage.toString()),
          features: featuresArray,
          premiumFeatures: [], // Can be extended later
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save plan");
      }

      toast({
        title: "Success",
        description: editingPlan ? "Plan updated successfully" : "Plan created successfully",
      });

      setDialogOpen(false);
      resetForm();
      fetchPlans();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      displayName: plan.displayName,
      description: plan.description || "",
      plan: plan.plan,
      monthlyPrice: Number(plan.monthlyPrice),
      yearlyPrice: Number(plan.yearlyPrice),
      currency: plan.currency,
      maxMembers: plan.maxMembers,
      maxAdmins: plan.maxAdmins,
      maxCampuses: plan.maxCampuses,
      maxStorage: plan.maxStorage,
      features: plan.features.join("\n"),
      isActive: plan.isActive,
      isPopular: plan.isPopular,
      sortOrder: plan.sortOrder,
      trialDays: plan.trialDays,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the ${name} plan?`)) return;

    try {
      const response = await fetch(`/api/admin/subscription-plans/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete plan");

      toast({
        title: "Success",
        description: "Plan deleted successfully",
      });

      fetchPlans();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingPlan(null);
    setFormData({
      name: "",
      displayName: "",
      description: "",
      plan: "BASIC",
      monthlyPrice: 0,
      yearlyPrice: 0,
      currency: "KES",
      maxMembers: 100,
      maxAdmins: 5,
      maxCampuses: 1,
      maxStorage: 5,
      features: "",
      isActive: true,
      isPopular: false,
      sortOrder: 0,
      trialDays: 14,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CreditCard className="w-8 h-8" />
            Subscription Plan Templates
          </h1>
          <p className="text-gray-500 mt-1">
            Manage subscription plans and pricing for churches
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? "Edit Subscription Plan" : "Create Subscription Plan"}
                </DialogTitle>
                <DialogDescription>
                  {editingPlan
                    ? "Update plan details and pricing"
                    : "Create a new subscription plan template"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Plan ID *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="basic"
                      required
                    />
                    <p className="text-xs text-gray-500">Lowercase, no spaces</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name *</Label>
                    <Input
                      id="displayName"
                      value={formData.displayName}
                      onChange={(e) =>
                        setFormData({ ...formData, displayName: e.target.value })
                      }
                      placeholder="Basic Plan"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Brief description of the plan..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan">Plan Type *</Label>
                    <Select
                      value={formData.plan}
                      onValueChange={(value) =>
                        setFormData({ ...formData, plan: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FREE">Free</SelectItem>
                        <SelectItem value="BASIC">Basic</SelectItem>
                        <SelectItem value="STANDARD">Standard</SelectItem>
                        <SelectItem value="PRO">Pro/Premium</SelectItem>
                        <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                      id="currency"
                      value={formData.currency}
                      onChange={(e) =>
                        setFormData({ ...formData, currency: e.target.value })
                      }
                      placeholder="KES"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Pricing</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="monthlyPrice">Monthly Price (KES) *</Label>
                      <Input
                        id="monthlyPrice"
                        type="number"
                        value={formData.monthlyPrice}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            monthlyPrice: parseFloat(e.target.value),
                          })
                        }
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="yearlyPrice">Yearly Price (KES) *</Label>
                      <Input
                        id="yearlyPrice"
                        type="number"
                        value={formData.yearlyPrice}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            yearlyPrice: parseFloat(e.target.value),
                          })
                        }
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Plan Limits</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxMembers">Max Members *</Label>
                      <Input
                        id="maxMembers"
                        type="number"
                        value={formData.maxMembers}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxMembers: parseInt(e.target.value),
                          })
                        }
                        required
                        min="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxAdmins">Max Admins *</Label>
                      <Input
                        id="maxAdmins"
                        type="number"
                        value={formData.maxAdmins}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxAdmins: parseInt(e.target.value),
                          })
                        }
                        required
                        min="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxCampuses">Max Campuses *</Label>
                      <Input
                        id="maxCampuses"
                        type="number"
                        value={formData.maxCampuses}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxCampuses: parseInt(e.target.value),
                          })
                        }
                        required
                        min="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxStorage">Max Storage (GB) *</Label>
                      <Input
                        id="maxStorage"
                        type="number"
                        value={formData.maxStorage}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxStorage: parseInt(e.target.value),
                          })
                        }
                        required
                        min="1"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="features">Features (one per line) *</Label>
                  <Textarea
                    id="features"
                    value={formData.features}
                    onChange={(e) =>
                      setFormData({ ...formData, features: e.target.value })
                    }
                    placeholder="Member management&#10;Event registration&#10;SMS notifications"
                    rows={6}
                    required
                  />
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Additional Settings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="trialDays">Trial Days</Label>
                      <Input
                        id="trialDays"
                        type="number"
                        value={formData.trialDays}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            trialDays: parseInt(e.target.value),
                          })
                        }
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sortOrder">Sort Order</Label>
                      <Input
                        id="sortOrder"
                        type="number"
                        value={formData.sortOrder}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            sortOrder: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="isActive">Active Plan</Label>
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, isActive: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="isPopular">Mark as Popular</Label>
                      <Switch
                        id="isPopular"
                        checked={formData.isPopular}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, isPopular: checked })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      {editingPlan ? "Update" : "Create"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={plan.isPopular ? "border-blue-500 border-2" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {plan.displayName}
                    {plan.isPopular && (
                      <Badge className="bg-blue-500">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Popular
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </div>
                <Badge variant={plan.isActive ? "default" : "secondary"}>
                  {plan.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-3xl font-bold">
                  {plan.currency} {plan.monthlyPrice.toLocaleString()}
                  <span className="text-sm font-normal text-gray-500">/month</span>
                </div>
                <div className="text-sm text-gray-500">
                  or {plan.currency} {plan.yearlyPrice.toLocaleString()}/year
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span>{plan.maxMembers.toLocaleString()} members</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <span>{plan.maxAdmins} admins</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-500" />
                  <span>{plan.maxCampuses} campus{plan.maxCampuses > 1 ? "es" : ""}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-gray-500" />
                  <span>{plan.maxStorage}GB storage</span>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-xs text-gray-500 mb-2">
                  {plan.features.length} features • {plan.trialDays} day trial
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleEdit(plan)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(plan.id, plan.displayName)}
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
