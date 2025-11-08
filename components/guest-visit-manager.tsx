"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Calendar, MapPin, User, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface GuestVisit {
  id: string;
  visitDate: string;
  serviceType: string | null;
  event: {
    id: string;
    title: string;
    startDate: string;
  } | null;
  notes: string | null;
  recordedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

interface GuestVisitManagerProps {
  guestId: string;
  initialVisits: GuestVisit[];
}

export function GuestVisitManager({
  guestId,
  initialVisits,
}: GuestVisitManagerProps) {
  const [visits, setVisits] = useState<GuestVisit[]>(initialVisits);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    visitDate: new Date().toISOString().split("T")[0],
    serviceType: "",
    eventId: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/guests/${guestId}/visits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newVisit = await response.json();
        setVisits([newVisit, ...visits]);
        setOpen(false);
        setFormData({
          visitDate: new Date().toISOString().split("T")[0],
          serviceType: "",
          eventId: "",
          notes: "",
        });
      } else {
        const data = await response.json();
        alert(data.error || "Failed to record visit");
      }
    } catch (error) {
      console.error("Error recording visit:", error);
      alert("Failed to record visit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Visit History</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Record Visit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Guest Visit</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="visitDate">Visit Date</Label>
                  <Input
                    id="visitDate"
                    type="date"
                    value={formData.visitDate}
                    onChange={(e) =>
                      setFormData({ ...formData, visitDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="serviceType">Service Type</Label>
                  <Select
                    value={formData.serviceType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, serviceType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service type (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sunday Service">Sunday Service</SelectItem>
                      <SelectItem value="Midweek Service">Midweek Service</SelectItem>
                      <SelectItem value="Special Event">Special Event</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Optional notes about this visit..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Recording...
                      </>
                    ) : (
                      "Record Visit"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {visits.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Service Type</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Recorded By</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visits.map((visit) => (
                <TableRow key={visit.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium">
                          {new Date(visit.visitDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(visit.visitDate), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {visit.serviceType ? (
                      <Badge variant="outline">{visit.serviceType}</Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {visit.event ? (
                      <div>
                        <p className="font-medium">{visit.event.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(visit.event.startDate).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>
                        {visit.recordedBy.firstName} {visit.recordedBy.lastName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {visit.notes ? (
                      <p className="text-sm text-gray-600">{visit.notes}</p>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No visits recorded yet</p>
            <p className="text-sm mt-1">Click "Record Visit" to add the first visit</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

