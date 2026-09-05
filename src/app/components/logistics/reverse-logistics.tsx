import { useState, useEffect } from "react";
import { 
  Calendar, Package, RotateCcw, AlertCircle, CheckCircle2, 
  Clock, Plus, Search, FileText, X, Truck, ShieldCheck, ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";

interface ReturnItem {
  id: string;
  date: string;
  boxCount: number;
  reason: string;
  status: "Pickup Scheduled" | "Picked Up" | "In Transit" | "Completed" | "Cancelled";
  pickupDate: string;
  timeSlot: string;
  itemsListText: string;
  notes?: string;
  createdAt: string;
}

export function ReverseLogistics() {
  const [returnsList, setReturnsList] = useState<ReturnItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ReturnItem | null>(null);

  // Form State
  const [reason, setReason] = useState("Expired Stock");
  const [boxCount, setBoxCount] = useState("1");
  const [pickupDate, setPickupDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState("Morning (9 AM - 12 PM)");
  const [itemsText, setItemsText] = useState("");
  const [notes, setNotes] = useState("");

  // Load from localStorage
  const loadReturns = () => {
    const saved = localStorage.getItem("ligimed_returns");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setReturnsList(parsed);
        } else {
          setReturnsList([]);
        }
      } catch (e) {
        setReturnsList([]);
      }
    } else {
      setReturnsList([]);
    }
  };

  useEffect(() => {
    loadReturns();
    const handleStorageChange = () => loadReturns();
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const saveReturns = (updated: ReturnItem[]) => {
    setReturnsList(updated);
    localStorage.setItem("ligimed_returns", JSON.stringify(updated));
  };

  // Submit New Return Request
  const handleSubmitReturn = (e: React.FormEvent) => {
    e.preventDefault();

    const newReturn: ReturnItem = {
      id: `RET-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toLocaleDateString(),
      boxCount: parseInt(boxCount) || 1,
      reason: reason || "Expired Stock",
      status: "Pickup Scheduled",
      pickupDate: pickupDate,
      timeSlot: timeSlot,
      itemsListText: itemsText || "Standard Expired / Damaged Medicine Restock Batch",
      notes: notes,
      createdAt: new Date().toISOString()
    };

    const updated = [newReturn, ...returnsList];
    saveReturns(updated);

    // Reset Form
    setShowForm(false);
    setBoxCount("1");
    setItemsText("");
    setNotes("");
  };

  const handleCancelReturn = (id: string) => {
    const updated = returnsList.map(r => r.id === id ? { ...r, status: "Cancelled" as const } : r);
    saveReturns(updated);
    if (selectedReturn?.id === id) {
      setSelectedReturn({ ...selectedReturn, status: "Cancelled" });
    }
  };

  // Stats calculation
  const pendingCount = returnsList.filter(r => r.status === "Pickup Scheduled").length;
  const inProgressCount = returnsList.filter(r => r.status === "Picked Up" || r.status === "In Transit").length;
  const completedCount = returnsList.filter(r => r.status === "Completed").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pickup Scheduled":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">Pickup Scheduled</Badge>;
      case "Picked Up":
      case "In Transit":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">In Transit</Badge>;
      case "Completed":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">Completed</Badge>;
      case "Cancelled":
        return <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-blue-600" />
            <span>Reverse Logistics & Medicine Returns</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Submit pickup requests for expired or damaged stock for supplier credit & eco-safe disposal.
          </p>
        </div>

        <Button 
          onClick={() => setShowForm(!showForm)} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-11 px-4 rounded-xl gap-2 shadow-md"
        >
          <RotateCcw className="w-4 h-4" />
          <span>+ Create New Return Request</span>
        </Button>
      </div>

      {/* New Return Request Form */}
      {showForm && (
        <Card className="border-blue-500 shadow-lg rounded-2xl bg-white overflow-hidden">
          <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-4">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <span>Create Medicine Return Pickup Request</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmitReturn} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-xs">
                  <Label className="font-semibold text-gray-700">Return Reason</Label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full h-10 px-3 text-xs rounded-xl border border-gray-300 bg-white text-gray-800 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Expired Stock">Expired Stock (Form 20/21 Return)</option>
                    <option value="Damaged Packaging">Damaged Outer Packaging</option>
                    <option value="Defective / Quality Issue">Defective / Quality Discrepancy</option>
                    <option value="Product Recall">Manufacturer Product Recall</option>
                    <option value="Overstock">Excess Unsold Overstock</option>
                  </select>
                </div>

                <div className="space-y-1.5 text-xs">
                  <Label className="font-semibold text-gray-700">Number of Boxes / Sealed Containers</Label>
                  <Input
                    type="number"
                    min="1"
                    value={boxCount}
                    onChange={(e) => setBoxCount(e.target.value)}
                    placeholder="Enter box count"
                    className="h-10 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-xs">
                  <Label className="font-semibold text-gray-700">Preferred Pickup Date</Label>
                  <Input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="h-10 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5 text-xs">
                  <Label className="font-semibold text-gray-700">Preferred Pickup Time Slot</Label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full h-10 px-3 text-xs rounded-xl border border-gray-300 bg-white text-gray-800 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                    <option value="Afternoon (12 PM - 3 PM)">Afternoon (12 PM - 3 PM)</option>
                    <option value="Evening (3 PM - 6 PM)">Evening (3 PM - 6 PM)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <Label className="font-semibold text-gray-700">Medicines / Batch Details (Optional)</Label>
                <Textarea
                  value={itemsText}
                  onChange={(e) => setItemsText(e.target.value)}
                  placeholder="e.g. Paracetamol 650mg (Batch DL-2026-88, 50 strips), Amoxicillin (Batch AM-2026-05, 20 strips)..."
                  rows={3}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5 text-xs">
                <Label className="font-semibold text-gray-700">Additional Instructions / Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special instructions for courier pickup agent..."
                  rows={2}
                  className="text-xs"
                />
              </div>

              {/* Notice Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-950">Reverse Logistics Guidelines:</p>
                  <ul className="list-disc list-inside text-amber-800 space-y-0.5">
                    <li>Pack all items securely in sealed, labeled boxes.</li>
                    <li>Ensure batch numbers and expiry dates match the submitted return manifest.</li>
                    <li>Upon pickup verification, credit refund will be processed to your Escrow account.</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  type="button" 
                  onClick={() => setShowForm(false)} 
                  variant="outline" 
                  className="flex-1 h-10 text-xs font-bold rounded-xl"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 h-10 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow"
                >
                  Submit Pickup Request
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Dynamic Summary Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-gray-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Pending Scheduled Pickups</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Awaiting courier arrival</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">In Transit Pickups</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{inProgressCount}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">En route to supplier</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Completed Returns</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{completedCount}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Refund & Credit issued</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Return Requests History Table */}
      <Card className="rounded-2xl border-gray-200 shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-3">
          <CardTitle className="text-base font-bold text-gray-900 flex items-center justify-between">
            <span>Return Request History</span>
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-semibold">{returnsList.length} Total Requests</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {returnsList.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-14 h-14 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto">
                <RotateCcw className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-gray-900">No Return Requests Found</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                You haven't requested any medicine pickups yet. Click "+ Create New Return Request" above to submit expired stock or damaged packages.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="p-3.5 pl-5">Return Ref</th>
                    <th className="p-3.5">Request Date</th>
                    <th className="p-3.5">Reason</th>
                    <th className="p-3.5">Quantity / Boxes</th>
                    <th className="p-3.5">Scheduled Pickup</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right pr-5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-800">
                  {returnsList.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="p-3.5 pl-5 font-bold font-mono text-blue-600">{item.id}</td>
                      <td className="p-3.5 text-gray-600">{item.date}</td>
                      <td className="p-3.5 font-medium">{item.reason}</td>
                      <td className="p-3.5">{item.boxCount} Box(es)</td>
                      <td className="p-3.5 font-medium text-gray-700">
                        {item.pickupDate} <span className="text-[11px] text-gray-400 block">{item.timeSlot}</span>
                      </td>
                      <td className="p-3.5">{getStatusBadge(item.status)}</td>
                      <td className="p-3.5 text-right pr-5">
                        <Button 
                          onClick={() => setSelectedReturn(item)} 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-[11px] font-bold rounded-lg border-gray-300"
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Return Request Details Modal */}
      <Dialog open={!!selectedReturn} onOpenChange={() => setSelectedReturn(null)}>
        <DialogContent className="max-w-md p-6 rounded-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center justify-between">
              <span>Return Details: {selectedReturn?.id}</span>
              {selectedReturn && getStatusBadge(selectedReturn.status)}
            </DialogTitle>
          </DialogHeader>

          {selectedReturn && (
            <div className="space-y-4 my-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <p className="text-gray-500">Request Date</p>
                  <p className="font-bold text-gray-900 mt-0.5">{selectedReturn.date}</p>
                </div>
                <div>
                  <p className="text-gray-500">Return Reason</p>
                  <p className="font-bold text-gray-900 mt-0.5">{selectedReturn.reason}</p>
                </div>
                <div>
                  <p className="text-gray-500">Scheduled Pickup</p>
                  <p className="font-bold text-gray-900 mt-0.5">{selectedReturn.pickupDate}</p>
                </div>
                <div>
                  <p className="text-gray-500">Time Slot</p>
                  <p className="font-bold text-gray-900 mt-0.5">{selectedReturn.timeSlot}</p>
                </div>
              </div>

              <div>
                <p className="font-bold text-gray-800 mb-1">Medicines / Package Manifest</p>
                <div className="p-3 bg-gray-50 rounded-xl text-gray-700 font-mono text-[11px] border border-gray-100">
                  {selectedReturn.itemsListText}
                </div>
              </div>

              {selectedReturn.notes && (
                <div>
                  <p className="font-bold text-gray-800 mb-1">Additional Notes</p>
                  <p className="p-2.5 bg-gray-50 rounded-xl text-gray-600 text-[11px]">{selectedReturn.notes}</p>
                </div>
              )}

              {/* Progress Timeline */}
              <div className="space-y-2 pt-2">
                <p className="font-bold text-gray-800">Return Processing Steps:</p>
                <div className="space-y-2.5 pl-2">
                  <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>1. Return Request Authorized</span>
                  </div>
                  <div className={`flex items-center gap-2 ${selectedReturn.status !== "Cancelled" ? "text-blue-600 font-semibold" : "text-gray-400"}`}>
                    <Clock className="w-4 h-4" />
                    <span>2. Express Courier Pickup ({selectedReturn.pickupDate})</span>
                  </div>
                  <div className={`flex items-center gap-2 ${selectedReturn.status === "Completed" ? "text-emerald-600 font-semibold" : "text-gray-400"}`}>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>3. Supplier Receipt & Escrow Credit Refund</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            {selectedReturn && selectedReturn.status === "Pickup Scheduled" && (
              <Button 
                onClick={() => handleCancelReturn(selectedReturn.id)} 
                variant="destructive" 
                className="text-xs h-9 font-bold rounded-xl"
              >
                Cancel Return Request
              </Button>
            )}
            <Button onClick={() => setSelectedReturn(null)} variant="outline" className="text-xs h-9 font-bold rounded-xl">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
