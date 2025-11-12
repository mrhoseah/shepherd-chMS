"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  DollarSign,
  Users,
  Tag,
  Calendar,
  Phone,
  User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface Donation {
  id: string;
  amount: number;
  transactionId: string | null;
  paybillAccountRef: string | null;
  createdAt: string;
  metadata: any;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  } | null;
  group: {
    id: string;
    name: string;
    groupCode: string | null;
  } | null;
  fundCategory: {
    id: string;
    name: string;
    code: string;
  } | null;
}

interface Group {
  id: string;
  name: string;
  groupCode: string | null;
}

interface FundCategory {
  id: string;
  name: string;
  code: string;
}

export default function UnallocatedDonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [fundCategories, setFundCategories] = useState<FundCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState<string | null>(null);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [allocationData, setAllocationData] = useState({
    groupId: "",
    fundCategoryId: "",
    category: "OFFERING",
    notes: "",
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUnallocated();
    fetchGroups();
    fetchFundCategories();
  }, []);

  const fetchUnallocated = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/donations/unallocated");
      const data = await response.json();
      if (response.ok) {
        setDonations(data.donations || []);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch unallocated donations",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching unallocated donations:", error);
      toast({
        title: "Error",
        description: "Failed to fetch unallocated donations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/groups");
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const fetchFundCategories = async () => {
    try {
      const response = await fetch("/api/fund-categories?activeOnly=true");
      if (response.ok) {
        const data = await response.json();
        setFundCategories(data.fundCategories || []);
      }
    } catch (error) {
      console.error("Error fetching fund categories:", error);
    }
  };

  const handleAllocate = async (donation: Donation) => {
    setSelectedDonation(donation);
    setAllocationData({
      groupId: donation.group?.id || "",
      fundCategoryId: donation.fundCategory?.id || "",
      category: "OFFERING",
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmitAllocation = async () => {
    if (!selectedDonation) return;

    setAllocating(selectedDonation.id);
    try {
      const response = await fetch(`/api/donations/${selectedDonation.id}/allocate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: allocationData.groupId || null,
          fundCategoryId: allocationData.fundCategoryId || null,
          category: allocationData.category,
          notes: allocationData.notes,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Donation allocated successfully",
        });
        setIsDialogOpen(false);
        setSelectedDonation(null);
        fetchUnallocated();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to allocate donation",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error allocating donation:", error);
      toast({
        title: "Error",
        description: "Failed to allocate donation",
        variant: "destructive",
      });
    } finally {
      setAllocating(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getErrorReason = (donation: Donation) => {
    const metadata = donation.metadata || {};
    return metadata.allocationError || metadata.error || "Unknown error";
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Unallocated Donations</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Review and manually allocate M-Pesa Paybill donations that couldn't be automatically processed
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            Unallocated Transactions
          </CardTitle>
          <CardDescription>
            These donations were received but couldn't be automatically allocated to a group or fund category
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : donations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p>No unallocated donations</p>
              <p className="text-sm mt-2">All donations have been successfully allocated</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Account Number</TableHead>
                  <TableHead>Donor</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donations.map((donation) => (
                  <TableRow key={donation.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(donation.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 font-semibold">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        KES {Number(donation.amount).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {donation.paybillAccountRef ? (
                        <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">
                          {donation.paybillAccountRef}
                        </code>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {donation.user ? (
                        <div>
                          <div className="font-medium">
                            {donation.user.firstName} {donation.user.lastName}
                          </div>
                          {donation.user.phone && (
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {donation.user.phone}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {donation.transactionId ? (
                        <code className="text-xs">{donation.transactionId}</code>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive" className="text-xs">
                        {getErrorReason(donation)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleAllocate(donation)}
                        disabled={allocating === donation.id}
                      >
                        {allocating === donation.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Allocate"
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Allocate Donation</DialogTitle>
            <DialogDescription>
              Manually assign this donation to a group and/or fund category
            </DialogDescription>
          </DialogHeader>
          {selectedDonation && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Amount</span>
                  <span className="font-semibold">KES {Number(selectedDonation.amount).toLocaleString()}</span>
                </div>
                {selectedDonation.paybillAccountRef && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Account Number</span>
                    <code className="font-mono text-sm">{selectedDonation.paybillAccountRef}</code>
                  </div>
                )}
                {selectedDonation.transactionId && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Transaction ID</span>
                    <code className="font-mono text-xs">{selectedDonation.transactionId}</code>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="groupId">Group (Optional)</Label>
                <Select
                  value={allocationData.groupId}
                  onValueChange={(value) => setAllocationData({ ...allocationData, groupId: value })}
                >
                  <SelectTrigger id="groupId">
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name} {group.groupCode && `(${group.groupCode})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fundCategoryId">Fund Category (Optional)</Label>
                <Select
                  value={allocationData.fundCategoryId}
                  onValueChange={(value) =>
                    setAllocationData({ ...allocationData, fundCategoryId: value })
                  }
                >
                  <SelectTrigger id="fundCategoryId">
                    <SelectValue placeholder="Select a fund category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {fundCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name} ({category.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={allocationData.category}
                  onValueChange={(value) => setAllocationData({ ...allocationData, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OFFERING">Offering</SelectItem>
                    <SelectItem value="TITHE">Tithe</SelectItem>
                    <SelectItem value="MISSIONS">Missions</SelectItem>
                    <SelectItem value="BUILDING_FUND">Building Fund</SelectItem>
                    <SelectItem value="SPECIAL_PROJECT">Special Project</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={allocationData.notes}
                  onChange={(e) => setAllocationData({ ...allocationData, notes: e.target.value })}
                  placeholder="Add any notes about this allocation"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitAllocation} disabled={allocating !== null}>
              {allocating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Allocate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

