"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode, Smartphone } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { QRCodeDialog } from "@/components/qr-code-dialog";
import { formatCurrency } from "@/lib/currency";
import { formatCurrencyWithConversionSync } from "@/lib/currency-converter";
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import { initializeCurrency, setExchangeRate } from "@/lib/store/slices/currencySlice";

interface Donation {
  id: string;
  amount: number;
  category: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  } | null;
}

export default function DonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [mpesaLoading, setMpesaLoading] = useState(false);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAmount, setTotalAmount] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({});
  const currency = useAppSelector((state) => state.currency);
  const [formData, setFormData] = useState({
    amount: "",
    category: "TITHE",
    paymentMethod: "CASH",
    status: "pending",
    notes: "",
  });

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(categoryFilter && { category: categoryFilter }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await fetch(`/api/donations?${params}`);
      const data = await res.json();
      setDonations(data.donations || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalAmount(Number(data.totalAmount) || 0);
    } catch (error) {
      console.error("Error fetching donations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryStats = async () => {
    try {
      const categories = ["TITHE", "OFFERING", "MISSIONS", "BUILDING_FUND", "SPECIAL_PROJECT", "OTHER"];
      const stats: Record<string, number> = {};
      
      await Promise.all(
        categories.map(async (category) => {
          const res = await fetch(`/api/donations?category=${category}&status=completed&limit=1000`);
          const data = await res.json();
          const total = data.donations?.reduce((sum: number, d: Donation) => sum + Number(d.amount), 0) || 0;
          stats[category] = total;
        })
      );
      
      setCategoryStats(stats);
    } catch (error) {
      console.error("Error fetching category stats:", error);
    }
  };

  const dispatch = useAppDispatch();

  useEffect(() => {
    fetchDonations();
    fetchCategoryStats();
    
    // Initialize currency from API if not already initialized in Redux
    if (!currency.initialized) {
      Promise.all([
        fetch("/api/currency").then((res) => res.json()),
        fetch(`/api/currency/rates?currency=${currency.currency || "KES"}`).then((res) => res.json()),
      ])
        .then(([currencyData, rateData]) => {
          dispatch(
            initializeCurrency({
              currency: currencyData.currency,
              currencySymbol: currencyData.currencySymbol,
              exchangeRate: rateData.rate,
            })
          );
        })
        .catch((error) => {
          console.error("Error fetching currency:", error);
        });
    } else if (currency.currency && !currency.exchangeRate) {
      // Fetch exchange rate if currency is set but rate is missing
      fetch(`/api/currency/rates?currency=${currency.currency}`)
        .then((res) => res.json())
        .then((data) => {
          dispatch(setExchangeRate(data.rate));
        })
        .catch((error) => {
          console.error("Error fetching exchange rate:", error);
        });
    }
  }, [page, categoryFilter, statusFilter, currency.initialized, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingDonation
        ? `/api/donations/${editingDonation.id}`
        : "/api/donations";
      const method = editingDonation ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });

      if (res.ok) {
        setOpen(false);
        setEditingDonation(null);
        setFormData({
          amount: "",
          category: "TITHE",
          paymentMethod: "CASH",
          status: "pending",
          notes: "",
        });
        fetchDonations();
        fetchCategoryStats();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save donation");
      }
    } catch (error) {
      console.error("Error saving donation:", error);
      alert("Failed to save donation");
    }
  };

  const handleEdit = (donation: Donation) => {
    setEditingDonation(donation);
    setFormData({
      amount: donation.amount.toString(),
      category: donation.category,
      paymentMethod: donation.paymentMethod,
      status: donation.status,
      notes: "",
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this donation?")) return;

    try {
      const res = await fetch(`/api/donations/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchDonations();
        fetchCategoryStats();
      } else {
        alert("Failed to delete donation");
      }
    } catch (error) {
      console.error("Error deleting donation:", error);
      alert("Failed to delete donation");
    }
  };

  const formatCategoryName = (category: string) => {
    return category
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10 xl:p-12 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Donations</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage church donations and giving
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingDonation(null);
                setFormData({
                  amount: "",
                  category: "TITHE",
                  paymentMethod: "CASH",
                  status: "pending",
                  notes: "",
                });
              }}
            >
              Add Donation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingDonation ? "Edit Donation" : "Create New Donation"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TITHE">Tithe</SelectItem>
                      <SelectItem value="OFFERING">Offering</SelectItem>
                      <SelectItem value="MISSIONS">Missions</SelectItem>
                      <SelectItem value="BUILDING_FUND">Building Fund</SelectItem>
                      <SelectItem value="SPECIAL_PROJECT">Special Project</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) =>
                      setFormData({ ...formData, paymentMethod: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="CARD">Card</SelectItem>
                      <SelectItem value="MPESA">M-Pesa</SelectItem>
                      <SelectItem value="PAYPAL">PayPal</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="CHECK">Check</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
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
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  className="w-full min-h-[80px] px-3 py-2 border rounded-md"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(categoryStats).map(([category, amount]) => (
          <Card key={category}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {formatCategoryName(category)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrencyWithConversionSync(
                  amount, // Amount is stored in USD internally
                  currency.currency || "KES",
                  currency.currencySymbol || "KSh",
                  currency.exchangeRate
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>All Donations</CardTitle>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Select value={categoryFilter || "all"} onValueChange={(value) => setCategoryFilter(value === "all" ? "" : value)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="TITHE">Tithe</SelectItem>
                  <SelectItem value="OFFERING">Offering</SelectItem>
                  <SelectItem value="MISSIONS">Missions</SelectItem>
                  <SelectItem value="BUILDING_FUND">Building Fund</SelectItem>
                  <SelectItem value="SPECIAL_PROJECT">Special Project</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
            Total: {formatCurrencyWithConversionSync(
              totalAmount, // Amount is stored in USD internally
              currency.currency || "KES",
              currency.currencySymbol || "KSh",
              currency.exchangeRate
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Donor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donations.map((donation) => (
                    <TableRow key={donation.id}>
                      <TableCell>
                        {donation.user
                          ? `${donation.user.firstName} ${donation.user.lastName}`
                          : "Anonymous"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrencyWithConversionSync(
                          donation.amount, // Amount is stored in USD internally
                          currency.currency || "KES",
                          currency.currencySymbol || "KSh",
                          currency.exchangeRate
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{donation.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{donation.paymentMethod}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            donation.status === "completed"
                              ? "default"
                              : donation.status === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {donation.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(donation.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(donation)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(donation.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-between items-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

