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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCard,
  Plus,
  Loader2,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Subscription {
  id: string;
  churchId: string;
  church: {
    name: string;
  };
  plan: string;
  status: string;
  startDate: string;
  endDate: string;
  maxMembers: number;
  maxAdmins: number;
  maxCampuses: number;
  maxStorage: number;
  nextBillingDate: string | null;
  paymentMethod: string | null;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [churches, setChurches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    churchId: "",
    plan: "BASIC",
    status: "TRIAL",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    maxMembers: 100,
    maxAdmins: 5,
    maxCampuses: 1,
    maxStorage: 1,
    nextBillingDate: "",
    paymentMethod: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subsResponse, churchesResponse] = await Promise.all([
        fetch("/api/admin/subscriptions"),
        fetch("/api/admin/churches"),
      ]);

      if (!subsResponse.ok || !churchesResponse.ok) {
        throw new Error("Failed to fetch data");
      }

      const subsData = await subsResponse.json();
      const churchesData = await churchesResponse.json();

      setSubscriptions(subsData);
      setChurches(churchesData);
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
      const url = editingSubscription
        ? `/api/admin/subscriptions/${editingSubscription.id}`
        : "/api/admin/subscriptions";

      const method = editingSubscription ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          maxMembers: parseInt(formData.maxMembers.toString()),
          maxAdmins: parseInt(formData.maxAdmins.toString()),
          maxCampuses: parseInt(formData.maxCampuses.toString()),
          maxStorage: parseInt(formData.maxStorage.toString()),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save subscription");
      }

      toast({
        title: "Success",
        description: editingSubscription
          ? "Subscription updated successfully"
          : "Subscription created successfully",
      });

      setDialogOpen(false);
      resetForm();
      fetchData();
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

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setFormData({
      churchId: subscription.churchId,
      plan: subscription.plan,
      status: subscription.status,
      startDate: new Date(subscription.startDate).toISOString().split("T")[0],
      endDate: new Date(subscription.endDate).toISOString().split("T")[0],
      maxMembers: subscription.maxMembers,
      maxAdmins: subscription.maxAdmins,
      maxCampuses: subscription.maxCampuses,
      maxStorage: subscription.maxStorage,
      nextBillingDate: subscription.nextBillingDate
        ? new Date(subscription.nextBillingDate).toISOString().split("T")[0]
        : "",
      paymentMethod: subscription.paymentMethod || "",
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingSubscription(null);
    setFormData({
      churchId: "",
      plan: "BASIC",
      status: "TRIAL",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      maxMembers: 100,
      maxAdmins: 5,
      maxCampuses: 1,
      maxStorage: 1,
      nextBillingDate: "",
      paymentMethod: "",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "TRIAL":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "PAST_DUE":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "CANCELLED":
      case "EXPIRED":
      case "SUSPENDED":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
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
            Subscription Management
          </h1>
          <p className="text-gray-500 mt-1">
            Manage church subscriptions and billing
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              New Subscription
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingSubscription ? "Edit Subscription" : "Create Subscription"}
                </DialogTitle>
                <DialogDescription>
                  {editingSubscription
                    ? "Update subscription details and limits"
                    : "Create a new subscription for a church"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="churchId">Church *</Label>
                  <Select
                    value={formData.churchId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, churchId: value })
                    }
                    disabled={!!editingSubscription}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select church" />
                    </SelectTrigger>
                    <SelectContent>
                      {churches.map((church) => (
                        <SelectItem key={church.id} value={church.id}>
                          {church.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan">Plan *</Label>
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
                        <SelectItem value="PRO">Pro</SelectItem>
                        <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRIAL">Trial</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="PAST_DUE">Past Due</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        <SelectItem value="EXPIRED">Expired</SelectItem>
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Subscription Limits</h3>
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
                        min="0"
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

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Billing Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nextBillingDate">Next Billing Date</Label>
                      <Input
                        id="nextBillingDate"
                        type="date"
                        value={formData.nextBillingDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            nextBillingDate: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">Payment Method</Label>
                      <Input
                        id="paymentMethod"
                        value={formData.paymentMethod}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            paymentMethod: e.target.value,
                          })
                        }
                        placeholder="e.g., M-PESA, Card ending in 1234"
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
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {editingSubscription ? "Update" : "Create"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Subscriptions</CardTitle>
          <CardDescription>
            View and manage all church subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Church</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Limits</TableHead>
                <TableHead>Billing</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No subscriptions found
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{subscription.church.name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(subscription.startDate).toLocaleDateString()} -{" "}
                          {new Date(subscription.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge>{subscription.plan}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(subscription.status)}
                        <span className="text-sm">{subscription.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="space-y-1">
                        <p>Members: {subscription.maxMembers}</p>
                        <p>Admins: {subscription.maxAdmins}</p>
                        <p>Campuses: {subscription.maxCampuses}</p>
                        <p>Storage: {subscription.maxStorage}GB</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {subscription.nextBillingDate ? (
                        <div>
                          <p>Next: {new Date(subscription.nextBillingDate).toLocaleDateString()}</p>
                          {subscription.paymentMethod && (
                            <p className="text-xs text-gray-500">{subscription.paymentMethod}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">No billing</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(subscription)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
