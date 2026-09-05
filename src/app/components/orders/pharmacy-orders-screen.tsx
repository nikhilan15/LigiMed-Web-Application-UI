import { useState, useEffect } from "react";
import { 
  ClipboardList, Search, Filter, FileText, Download, Printer, 
  Building2, ShieldCheck, CheckCircle2, Clock, Truck, ChevronRight, X, ArrowUpRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Separator } from "../ui/separator";

interface OrderItem {
  id?: string;
  medicineName: string;
  dosage?: string;
  price: number;
  quantity: number;
  dealerName?: string;
}

interface WholesaleOrder {
  id: string;
  pharmacy?: string;
  dealerName?: string;
  items?: number | OrderItem[];
  total?: number;
  totalAmount?: number;
  status: string;
  time?: string;
  date?: string;
  gstin?: string;
  paymentMethod?: string;
}

export function PharmacyOrdersScreen() {
  const [orders, setOrders] = useState<WholesaleOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<WholesaleOrder | null>(null);

  // Load orders from localStorage ligimed_orders
  useEffect(() => {
    const saved = localStorage.getItem("ligimed_orders");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setOrders(parsed);
        }
      } catch (e) {}
    }
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === "all" || order.status.toLowerCase() === statusFilter.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === "" ||
      order.id.toLowerCase().includes(query) ||
      (order.pharmacy && order.pharmacy.toLowerCase().includes(query)) ||
      (order.dealerName && order.dealerName.toLowerCase().includes(query)) ||
      (order.gstin && order.gstin.toLowerCase().includes(query));

    return matchesStatus && matchesSearch;
  });

  const getItemsCount = (order: WholesaleOrder) => {
    if (typeof order.items === "number") return order.items;
    if (Array.isArray(order.items)) return order.items.reduce((sum, item) => sum + item.quantity, 0);
    return 1;
  };

  const getOrderTotal = (order: WholesaleOrder) => {
    return order.total || order.totalAmount || 1500;
  };

  // Print B2B Invoice Handler
  const handlePrintB2BInvoice = (order: WholesaleOrder) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const total = getOrderTotal(order);
    const subtotal = Math.round(total / 1.12);
    const totalGst = total - subtotal;
    const cgst = Math.round(totalGst / 2);
    const sgst = Math.round(totalGst / 2);

    const itemsList: OrderItem[] = Array.isArray(order.items) ? order.items : [
      { medicineName: "Wholesale Medicine Restock Package", quantity: getItemsCount(order), price: Math.round(subtotal / getItemsCount(order)) }
    ];

    const itemsRows = itemsList.map((item, idx) => `
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">${idx + 1}</td>
        <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">${item.medicineName}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">3004</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; font-family: monospace;">BT-2026-X${idx + 1}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">${item.quantity}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: right;">₹${item.price.toFixed(2)}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold;">12%</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold;">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>B2B Tax Invoice - ${order.id}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: Arial, Helvetica, sans-serif; color: #000; margin: 0; padding: 10px; font-size: 11px; }
            .invoice-box { border: 2px solid #000; padding: 15px; background: #fff; max-width: 800px; margin: auto; }
            .header-banner { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 12px; }
            .title { font-size: 18px; font-weight: bold; text-transform: uppercase; margin: 0; color: #0f172a; }
            .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
            .meta-table td { border: 1px solid #000; padding: 6px 10px; font-size: 11px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
            .items-table th { border: 1px solid #000; padding: 7px 6px; background-color: #e2e8f0 !important; font-weight: bold; font-size: 10px; }
            .totals-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
            .totals-table td { border: 1px solid #000; padding: 6px 10px; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header-banner">
              <div style="display: inline-block; background: #000; color: #fff; padding: 2px 10px; font-size: 10px; font-weight: bold; text-transform: uppercase; border-radius: 3px; margin-bottom: 4px;">
                OFFICIAL B2B WHOLESALE GST TAX INVOICE
              </div>
              <h1 class="title">${order.dealerName || "Vinayag Distributors Wholesale Pharma"}</h1>
              <div style="font-size: 10px; color: #333;">Central Pharma Wholesale Market, Mumbai, Maharashtra | Ph: +91 98765 00000</div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
              <tr>
                <td style="border: 1px solid #000; padding: 5px; text-align: center; background: #f1f5f9; font-weight: bold; font-size: 10px;">
                  SUPPLIER GSTIN: ${order.gstin || "27AAAAA9901A1Z5"}
                </td>
                <td style="border: 1px solid #000; padding: 5px; text-align: center; background: #f1f5f9; font-weight: bold; font-size: 10px;">
                  DRUG LICENSE (Form 20B/21B): MH-DIST-884920
                </td>
              </tr>
            </table>

            <table class="meta-table">
              <tr>
                <td style="width: 50%;">
                  <strong>Order Ref No:</strong> <span style="font-family: monospace; font-size: 12px; font-weight: bold;">${order.id}</span><br/>
                  <strong>Date:</strong> ${order.date || order.time || "Today"}<br/>
                  <strong>Payment Method:</strong> ${order.paymentMethod || "LigiMed Escrow / Razorpay"}
                </td>
                <td style="width: 50%;">
                  <strong>Billed To Pharmacy:</strong> ${order.pharmacy || "MediCare Pharmacy"}<br/>
                  <strong>Buyer GSTIN:</strong> 27AABCU9603R1ZM<br/>
                  <strong>Order Status:</strong> ${order.status}
                </td>
              </tr>
            </table>

            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 4%;">#</th>
                  <th style="width: 36%;">Medicine Product Description</th>
                  <th style="width: 10%;">HSN</th>
                  <th style="width: 12%;">Batch</th>
                  <th style="width: 8%;">Qty</th>
                  <th style="width: 10%; text-align: right;">B2B Rate</th>
                  <th style="width: 8%; text-align: right;">GST%</th>
                  <th style="width: 12%; text-align: right;">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>

            <table class="totals-table">
              <tr>
                <td style="width: 50%;">
                  <strong>Tax Breakdown:</strong><br/>
                  • Subtotal (Excl. Tax): ₹${subtotal.toLocaleString()}<br/>
                  • CGST (6%): ₹${cgst.toLocaleString()}<br/>
                  • SGST (6%): ₹${sgst.toLocaleString()}<br/>
                  • Total GST Amount: ₹${totalGst.toLocaleString()}
                </td>
                <td style="width: 50%; text-align: right; vertical-align: top;">
                  <span style="font-size: 11px; color: #555;">Grand Total Paid</span><br/>
                  <span style="font-size: 22px; font-weight: bold; color: #000;">₹${total.toLocaleString()}</span>
                </td>
              </tr>
            </table>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            <span>Wholesale Pharmacy Orders & GST Invoices</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Track your wholesale medicine purchase orders, status updates, and download B2B GST tax invoices.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setStatusFilter("all")}
            variant={statusFilter === "all" ? "default" : "outline"}
            className="text-xs h-9 font-bold rounded-xl"
          >
            All ({orders.length})
          </Button>
          <Button
            onClick={() => setStatusFilter("Pending")}
            variant={statusFilter === "Pending" ? "default" : "outline"}
            className="text-xs h-9 font-bold rounded-xl"
          >
            Pending
          </Button>
          <Button
            onClick={() => setStatusFilter("Processing")}
            variant={statusFilter === "Processing" ? "default" : "outline"}
            className="text-xs h-9 font-bold rounded-xl"
          >
            Processing
          </Button>
          <Button
            onClick={() => setStatusFilter("Delivered")}
            variant={statusFilter === "Delivered" ? "default" : "outline"}
            className="text-xs h-9 font-bold rounded-xl"
          >
            Delivered
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search orders by Order ID (e.g. ORD-2026-9708), dealer name, or GSTIN..."
              className="pl-10 h-11 bg-gray-50 border-gray-200 text-xs rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <Card className="border border-gray-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="p-5 border-b border-gray-100 bg-slate-50">
          <CardTitle className="text-base font-bold text-gray-900">Wholesale Purchase Orders List ({filteredOrders.length})</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-gray-700 font-bold border-b border-gray-200">
                <tr>
                  <th className="text-left p-4">Order ID & GST Ref</th>
                  <th className="text-left p-4">Wholesale Dealer / Supplier</th>
                  <th className="text-center p-4">Items / SKUs</th>
                  <th className="text-right p-4">Total Amount (₹)</th>
                  <th className="text-center p-4">Order Status</th>
                  <th className="text-center p-4">Tax Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400 font-medium">
                      No wholesale orders found matching your criteria. Place orders from the Marketplace to view orders and GST invoices here.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const total = getOrderTotal(order);
                    const itemsCount = getItemsCount(order);
                    return (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <p className="font-mono font-bold text-blue-900">{order.id}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{order.gstin || "27AAAAA9901A1Z5"}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-gray-900 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>{order.dealerName || "Vinayag Distributors Wholesale"}</span>
                          </p>
                          <p className="text-[10px] text-gray-400">{order.date || order.time || "Recently Placed"}</p>
                        </td>
                        <td className="p-4 text-center font-bold text-gray-700">{itemsCount} items</td>
                        <td className="p-4 text-right font-extrabold text-emerald-700 text-sm">
                          ₹{total.toLocaleString()}
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant="outline" className={`text-[10px] font-bold ${
                            order.status === "Delivered" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            order.status === "Dispatched" ? "bg-blue-50 text-blue-700 border-blue-200" :
                            order.status === "Processing" ? "bg-amber-50 text-amber-700 border-amber-200" :
                            "bg-slate-100 text-slate-700"
                          }`}>
                            {order.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          <Button
                            onClick={() => setSelectedOrderForInvoice(order)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs h-8 px-3 rounded-lg gap-1.5 border border-blue-200"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span>View GST Invoice</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* B2B GST Invoice Preview Modal Dialog */}
      {selectedOrderForInvoice && (
        <Dialog open={Boolean(selectedOrderForInvoice)} onOpenChange={() => setSelectedOrderForInvoice(null)}>
          <DialogContent className="max-w-3xl p-0 overflow-hidden bg-slate-900/5 rounded-2xl max-h-[90vh] flex flex-col">
            <DialogHeader className="p-4 bg-white border-b border-gray-200 shrink-0 flex flex-row items-center justify-between">
              <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span>Official B2B Wholesale GST Tax Invoice - {selectedOrderForInvoice.id}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center">
              <div className="w-full max-w-[700px] bg-white shadow-xl border border-gray-300 rounded-xl p-6 font-sans text-xs text-gray-900 space-y-4">
                
                {/* Header Banner */}
                <div className="text-center border-b-2 border-gray-900 pb-3 space-y-1">
                  <div className="inline-block bg-gray-900 text-white px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded mb-1">
                    OFFICIAL B2B WHOLESALE GST TAX INVOICE
                  </div>
                  <h2 className="text-xl font-extrabold uppercase text-blue-900 tracking-wide">{selectedOrderForInvoice.dealerName || "Vinayag Distributors Wholesale Pharma"}</h2>
                  <p className="text-[11px] font-medium text-gray-700">Central Pharma Wholesale Market, Mumbai, Maharashtra</p>
                  <p className="text-[11px] text-gray-600">Ph: +91 98765 00000 | GSTIN: {selectedOrderForInvoice.gstin || "27AAAAA9901A1Z5"}</p>
                </div>

                {/* Meta details table */}
                <div className="grid grid-cols-2 gap-4 border border-gray-900 p-3 rounded text-xs bg-slate-50/50">
                  <div className="space-y-1">
                    <p><strong>Order Ref No:</strong> <span className="font-mono font-bold text-blue-900">{selectedOrderForInvoice.id}</span></p>
                    <p><strong>Date & Time:</strong> {selectedOrderForInvoice.date || selectedOrderForInvoice.time || "Today"}</p>
                    <p><strong>Payment Method:</strong> <span className="font-bold text-emerald-700">{selectedOrderForInvoice.paymentMethod || "LigiMed BNPL Escrow"}</span></p>
                  </div>
                  <div className="space-y-1 text-right sm:text-left">
                    <p><strong>Pharmacy Customer:</strong> <span className="font-bold">{selectedOrderForInvoice.pharmacy || "MediCare Pharmacy"}</span></p>
                    <p><strong>Buyer GSTIN:</strong> 27AABCU9603R1ZM</p>
                    <p><strong>Order Status:</strong> <span className="font-bold text-blue-700">{selectedOrderForInvoice.status}</span></p>
                  </div>
                </div>

                {/* Items Summary Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-900 text-[11px]">
                    <thead>
                      <tr className="bg-slate-200 border-b border-gray-900 font-bold text-gray-900">
                        <th className="border border-gray-900 p-1.5 text-center">#</th>
                        <th className="border border-gray-900 p-1.5 text-left">Medicine Description</th>
                        <th className="border border-gray-900 p-1.5 text-center">HSN</th>
                        <th className="border border-gray-900 p-1.5 text-center">Qty</th>
                        <th className="border border-gray-900 p-1.5 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(selectedOrderForInvoice.items) ? (
                        selectedOrderForInvoice.items.map((item: any, idx: number) => (
                          <tr key={idx} className="border-b border-gray-800">
                            <td className="border border-gray-900 p-1.5 text-center font-bold">{idx + 1}</td>
                            <td className="border border-gray-900 p-1.5 font-semibold text-gray-900">{item.medicineName}</td>
                            <td className="border border-gray-900 p-1.5 text-center font-mono text-[10px]">3004</td>
                            <td className="border border-gray-900 p-1.5 text-center font-bold">{item.quantity}</td>
                            <td className="border border-gray-900 p-1.5 text-right font-bold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="border border-gray-900 p-1.5 text-center font-bold">1</td>
                          <td className="border border-gray-900 p-1.5 font-semibold text-gray-900">Wholesale B2B Restock Package</td>
                          <td className="border border-gray-900 p-1.5 text-center font-mono text-[10px]">3004</td>
                          <td className="border border-gray-900 p-1.5 text-center font-bold">{getItemsCount(selectedOrderForInvoice)}</td>
                          <td className="border border-gray-900 p-1.5 text-right font-bold text-gray-900">₹{Math.round(getOrderTotal(selectedOrderForInvoice) / 1.12).toFixed(2)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Tax Breakdown */}
                <div className="border border-gray-900 p-3 rounded bg-slate-50">
                  <div className="grid grid-cols-2 text-xs">
                    <div className="space-y-1">
                      <p><strong>Subtotal:</strong> ₹{Math.round(getOrderTotal(selectedOrderForInvoice) / 1.12).toLocaleString()}</p>
                      <p><strong>GST (12%):</strong> ₹{Math.round(getOrderTotal(selectedOrderForInvoice) - (getOrderTotal(selectedOrderForInvoice) / 1.12)).toLocaleString()}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-xs text-gray-600">Grand Total Billed</p>
                      <p className="text-2xl font-extrabold text-blue-900">₹{getOrderTotal(selectedOrderForInvoice).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <DialogFooter className="p-4 bg-white border-t border-gray-200 shrink-0 flex flex-row gap-3 items-center justify-between">
              <Button variant="outline" onClick={() => setSelectedOrderForInvoice(null)} className="rounded-xl h-10 text-xs">
                Close
              </Button>
              <Button
                onClick={() => handlePrintB2BInvoice(selectedOrderForInvoice)}
                className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl gap-2 shadow-md px-6"
              >
                <Printer className="w-4 h-4" />
                <span>Print B2B GST Invoice</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
