import { useState, useEffect, useRef } from "react";
import { Search, Plus, Trash2, FileText, Send, Download, Smartphone, Printer, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../ui/dialog";
import { Badge } from "../ui/badge";

interface BillItem {
  id: string;
  name: string;
  batchNo: string;
  expDate: string;
  hsnCode: string;
  quantity: number;
  price: number;
  mrp: number;
  gst: number;
}

export function BillingScreen() {
  const [customerMobile, setCustomerMobile] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [items, setItems] = useState<BillItem[]>([]);
  const [searchMedicine, setSearchMedicine] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isSentNotification, setIsSentNotification] = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  const [availableMedicines, setAvailableMedicines] = useState<any[]>([]);

  // Sync availableMedicines with live shop inventory
  useEffect(() => {
    const savedInv = localStorage.getItem("registered_inventory");
    if (savedInv) {
      try {
        const parsed = JSON.parse(savedInv);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped = parsed.map((item: any, idx: number) => ({
            id: item.id || `inv-${idx}`,
            name: item.name,
            batchNo: item.batchNo || `PCM24${idx}`,
            expDate: item.expiryDate ? item.expiryDate.slice(2, 7).replace('-', '/') : "12/27",
            hsnCode: "3004",
            price: item.price || 30,
            mrp: Math.round((item.price || 30) * 1.25),
            stock: item.currentStock || 0,
            gst: 12
          }));
          setAvailableMedicines(mapped);
          return;
        }
      } catch (e) {}
    }

    setAvailableMedicines([]);
  }, [isInvoiceOpen]);

  const addItem = (medicine: any) => {
    const newItem: BillItem = {
      id: Date.now().toString(),
      name: medicine.name,
      batchNo: medicine.batchNo,
      expDate: medicine.expDate,
      hsnCode: medicine.hsnCode,
      quantity: 1,
      price: medicine.price,
      mrp: medicine.mrp,
      gst: medicine.gst,
    };
    setItems([...items, newItem]);
    setSearchMedicine("");
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
    } else {
      setItems(items.map(item => 
        item.id === id ? { ...item, quantity } : item
      ));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalGST = items.reduce((sum, item) => sum + (item.price * item.quantity * item.gst / 100), 0);
  const grandTotal = subtotal + totalGST;
  const cgst = totalGST / 2;
  const sgst = totalGST / 2;

  // Print tax invoice function with crisp explicit HTML/CSS table grid lines & auto stock reduction
  const handlePrintInvoice = () => {
    // AUTOMATIC STOCK DEDUCTION (STOCK OUT)
    try {
      const savedInv = localStorage.getItem("registered_inventory");
      let currentInv: any[] = savedInv ? JSON.parse(savedInv) : [
        { id: "inv-1", name: "Paracetamol 650mg (Dolo)", category: "Painkillers", manufacturer: "Micro Labs", currentStock: 120, minStock: 50, rackLocation: "Rack A-12", batchNo: "DL-2026-88", expiryDate: "2027-12-31", price: 30.00, requiresColdChain: false },
        { id: "inv-2", name: "Azithromycin 500mg", category: "Antibiotics", manufacturer: "Cipla Ltd", currentStock: 18, minStock: 40, rackLocation: "Rack B-04", batchNo: "AZ-2026-42", expiryDate: "2027-08-15", price: 120.00, requiresColdChain: false },
        { id: "inv-3", name: "Metformin 500mg", category: "Diabetes", manufacturer: "Sun Pharma", currentStock: 250, minStock: 100, rackLocation: "Rack C-08", batchNo: "MT-2026-19", expiryDate: "2027-10-30", price: 35.00, requiresColdChain: false },
        { id: "inv-4", name: "Insulin Glargine 100 IU/ml", category: "Diabetes", manufacturer: "Biocon", currentStock: 14, minStock: 10, rackLocation: "Fridge-01 (2-8°C)", batchNo: "IN-2026-90", expiryDate: "2027-11-20", price: 560.00, requiresColdChain: true },
        { id: "inv-5", name: "Amoxicillin 250mg", category: "Antibiotics", manufacturer: "GlaxoSmithKline", currentStock: 12, minStock: 30, rackLocation: "Rack B-06", batchNo: "AM-2026-05", expiryDate: "2026-10-15", price: 85.00, requiresColdChain: false },
        { id: "inv-6", name: "Pantoprazole 40mg", category: "Gastro", manufacturer: "Zydus Cadila", currentStock: 180, minStock: 50, rackLocation: "Rack A-05", batchNo: "PT-2026-11", expiryDate: "2027-09-01", price: 40.00, requiresColdChain: false },
        { id: "inv-7", name: "Cetirizine 10mg", category: "Allergy", manufacturer: "Dr. Reddy's", currentStock: 320, minStock: 80, rackLocation: "Rack A-02", batchNo: "CT-2026-77", expiryDate: "2028-01-15", price: 25.00, requiresColdChain: false }
      ];

      const savedMov = localStorage.getItem("registered_movements");
      let currentMov: any[] = savedMov ? JSON.parse(savedMov) : [];

      if (!currentMov.some((m: any) => m.reference === invoiceNumber)) {
        items.forEach((billedItem) => {
          const normBilledName = billedItem.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          const existingIdx = currentInv.findIndex(inv => {
            const normInvName = inv.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            return normInvName.includes(normBilledName) || normBilledName.includes(normInvName);
          });

          if (existingIdx !== -1) {
            currentInv[existingIdx].currentStock = Math.max(0, currentInv[existingIdx].currentStock - billedItem.quantity);
          }

          currentMov.unshift({
            id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            medicineName: billedItem.name,
            batchNo: billedItem.batchNo || "DL-2026-88",
            type: "OUT",
            quantity: billedItem.quantity,
            reason: `Customer Billing Sale (${customerName || "Walk-in"})`,
            reference: invoiceNumber,
            timestamp: "Just now"
          });
        });

        localStorage.setItem("registered_inventory", JSON.stringify(currentInv));
        localStorage.setItem("registered_movements", JSON.stringify(currentMov));
      }
    } catch (err) {
      console.error("Auto inventory stock out error:", err);
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = items.map((item, idx) => `
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">${idx + 1}</td>
        <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">${item.name}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">${item.hsnCode}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">${item.batchNo}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">${item.expDate}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">${item.quantity}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: right; color: #555;">₹${item.mrp.toFixed(2)}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: right;">₹${item.price.toFixed(2)}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold;">${item.gst}%</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold;">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>GST Tax Invoice - ${invoiceNumber}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: Arial, Helvetica, sans-serif; color: #000; margin: 0; padding: 10px; font-size: 11px; }
            .tax-invoice-box { border: 2px solid #000; padding: 15px; background: #fff; max-width: 800px; margin: auto; }
            .header-banner { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 12px; }
            .invoice-title { font-size: 18px; font-weight: bold; text-transform: uppercase; margin: 0; color: #0f172a; }
            .subtitle { font-size: 11px; margin: 3px 0; font-weight: 500; }
            .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
            .meta-table td { border: 1px solid #000; padding: 6px 10px; font-size: 11px; }
            .medicines-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
            .medicines-table th { border: 1px solid #000; padding: 7px 6px; background-color: #e2e8f0 !important; font-weight: bold; text-transform: uppercase; font-size: 10px; -webkit-print-color-adjust: exact; }
            .medicines-table td { border: 1px solid #000; padding: 6px; font-size: 11px; }
            .totals-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
            .totals-table td { border: 1px solid #000; padding: 6px 10px; font-size: 11px; }
            .disclaimer-box { border: 1px solid #000; padding: 8px; font-size: 9px; margin-top: 10px; background: #fafafa; }
            .sig-table { width: 100%; margin-top: 30px; }
            .sig-table td { vertical-align: bottom; font-size: 10px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="tax-invoice-box">
            
            <!-- Header Banner -->
            <div class="header-banner">
              <div style="display: inline-block; background: #000; color: #fff; padding: 2px 10px; font-size: 10px; font-weight: bold; text-transform: uppercase; border-radius: 3px; margin-bottom: 4px;">
                TAX INVOICE / CASH MEMO
              </div>
              <h1 class="invoice-title">LigiMed Healthcare Pharmacy Pvt. Ltd.</h1>
              <div class="subtitle">Plot 42, Bandra Medical Market, Bandra West, Mumbai, Maharashtra - 400050</div>
              <div style="font-size: 10px; color: #333;">Ph: +91 98765 43210 | Email: billing@ligimed.com | Web: www.ligimed.com</div>
            </div>

            <!-- Statutory License Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
              <tr>
                <td style="border: 1px solid #000; padding: 5px; text-align: center; background: #f1f5f9; font-weight: bold; font-size: 10px;">
                  DL NO (Form 20/21): MH-MZ2-482910
                </td>
                <td style="border: 1px solid #000; padding: 5px; text-align: center; background: #f1f5f9; font-weight: bold; font-size: 10px;">
                  GSTIN NO: 27AABCU9603R1ZM
                </td>
                <td style="border: 1px solid #000; padding: 5px; text-align: center; background: #f1f5f9; font-weight: bold; font-size: 10px;">
                  FSSAI LIC NO: 11521004000892
                </td>
              </tr>
            </table>

            <!-- Customer & Doctor Meta Details -->
            <table class="meta-table">
              <tr>
                <td style="width: 50%;">
                  <strong>Invoice No:</strong> <span style="font-family: monospace; font-size: 12px; font-weight: bold;">${invoiceNumber}</span><br/>
                  <strong>Date & Time:</strong> ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}<br/>
                  <strong>Prescribed By:</strong> ${doctorName || "Dr. S. Sharma, MBBS"}
                </td>
                <td style="width: 50%;">
                  <strong>Patient Name:</strong> ${customerName || "Walk-in Customer"}<br/>
                  <strong>Mobile No:</strong> +91 ${customerMobile || "N/A"}<br/>
                  <strong>Payment Mode:</strong> GST CASH / UPI
                </td>
              </tr>
            </table>

            <!-- Itemized Medicines Table with Solid Black Tabular Columns -->
            <table class="medicines-table">
              <thead>
                <tr>
                  <th style="width: 4%;">#</th>
                  <th style="width: 32%;">Medicine Description</th>
                  <th style="width: 8%;">HSN</th>
                  <th style="width: 10%;">Batch</th>
                  <th style="width: 8%;">Exp</th>
                  <th style="width: 6%;">Qty</th>
                  <th style="width: 8%; text-align: right;">MRP</th>
                  <th style="width: 8%; text-align: right;">Rate</th>
                  <th style="width: 6%; text-align: right;">GST%</th>
                  <th style="width: 10%; text-align: right;">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Tax Summary Table -->
            <table class="totals-table">
              <tr>
                <td style="width: 50%; vertical-align: top;">
                  <strong>Tax Breakdown:</strong><br/>
                  • Subtotal (Excl. Tax): ₹${subtotal.toFixed(2)}<br/>
                  • CGST (6%): ₹${cgst.toFixed(2)}<br/>
                  • SGST (6%): ₹${sgst.toFixed(2)}<br/>
                  • Total GST Amount (12%): ₹${totalGST.toFixed(2)}
                </td>
                <td style="width: 50%; text-align: right; vertical-align: top;">
                  <span style="font-size: 11px; color: #555;">Grand Total Payable</span><br/>
                  <span style="font-size: 22px; font-weight: bold; color: #000;">₹${grandTotal.toFixed(2)}</span><br/>
                  <div style="font-size: 10px; font-style: italic; font-weight: bold; margin-top: 4px;">
                    Amount in Words: Rupees Eighty-Five and Sixty-Eight Paise Only
                  </div>
                </td>
              </tr>
            </table>

            <!-- Statutory Disclaimers -->
            <div class="disclaimer-box">
              <strong>Statutory Disclaimers (Drug Rules 1945 & Drugs & Cosmetics Act 1940):</strong><br/>
              1. <strong>Schedule H/H1 Drug Warning:</strong> To be sold by retail on the prescription of a Registered Medical Practitioner only.<br/>
              2. Goods once sold will not be accepted back or exchanged under any circumstances.<br/>
              3. <strong>Storage Conditions:</strong> Store below 25°C in a dry place away from direct sunlight.
            </div>

            <!-- Signatures -->
            <table class="sig-table">
              <tr>
                <td style="width: 50%;">
                  Customer Signature
                </td>
                <td style="width: 50%; text-align: right;">
                  <div style="border-bottom: 1px solid #000; display: inline-block; width: 200px; text-align: center; padding-bottom: 2px; font-weight: bold;">
                    LigiMed Healthcare Pharmacy
                  </div><br/>
                  <span>Regd. Pharmacist Reg No. PR-884920</span><br/>
                  <span style="font-size: 9px; color: #555;">[ Authorised Signatory Stamp ]</span>
                </td>
              </tr>
            </table>

          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Billing Section */}
      <div className="lg:col-span-2 space-y-6">
        {/* Customer Details */}
        <Card className="border border-gray-200 shadow-sm bg-white rounded-xl">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-base font-bold text-gray-900">Customer & Prescription Info</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="mobile" className="text-xs font-semibold text-gray-700">Mobile Number</Label>
                <div className="flex gap-2">
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="Enter 10-digit mobile"
                    className="h-10 text-xs"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    maxLength={10}
                  />
                  <Button variant="outline" size="sm" className="h-10 text-xs shrink-0">Fetch</Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold text-gray-700">Customer / Patient Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter patient name"
                  className="h-10 text-xs"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="doctor" className="text-xs font-semibold text-gray-700">Prescribing Doctor</Label>
                <Input
                  id="doctor"
                  type="text"
                  placeholder="Doctor name & Reg No."
                  className="h-10 text-xs"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Items */}
        <Card className="border border-gray-200 shadow-sm bg-white rounded-xl">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-base font-bold text-gray-900">Add Medicines</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search medicine by brand name, formula, or scan barcode..."
                  className="pl-10 h-10 text-xs bg-gray-50 border-gray-200"
                  value={searchMedicine}
                  onChange={(e) => setSearchMedicine(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" className="h-10 text-xs">
                Scan Barcode
              </Button>
            </div>

            {/* Search Results */}
            {searchMedicine && (
              <div className="border border-gray-200 rounded-lg divide-y bg-white shadow-md">
                {availableMedicines
                  .filter(med => med.name.toLowerCase().includes(searchMedicine.toLowerCase()))
                  .map(medicine => (
                    <div key={medicine.id} className="p-3 hover:bg-blue-50 cursor-pointer flex items-center justify-between transition-colors" onClick={() => addItem(medicine)}>
                      <div>
                        <p className="font-semibold text-xs text-gray-900">{medicine.name}</p>
                        <p className="text-[11px] text-gray-500">Batch: {medicine.batchNo} • Exp: {medicine.expDate} • HSN: {medicine.hsnCode}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xs text-gray-900">₹{medicine.price.toFixed(2)}</p>
                        <p className="text-[10px] text-emerald-600 font-semibold">MRP ₹{medicine.mrp} (+{medicine.gst}% GST)</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Bill Items Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <table className="w-full">
                <thead className="bg-slate-100 text-gray-700 text-xs">
                  <tr>
                    <th className="text-left p-3">Medicine Item</th>
                    <th className="text-center p-3">HSN</th>
                    <th className="text-center p-3">Batch / Exp</th>
                    <th className="text-center p-3">Qty</th>
                    <th className="text-right p-3">MRP</th>
                    <th className="text-right p-3">Rate</th>
                    <th className="text-right p-3">GST</th>
                    <th className="text-right p-3">Amount</th>
                    <th className="text-center p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-gray-400">
                        No medicines added. Search above to add items to the GST Tax Bill.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <p className="font-bold text-gray-900">{item.name}</p>
                        </td>
                        <td className="p-3 text-center text-gray-500 font-mono text-[11px]">{item.hsnCode}</td>
                        <td className="p-3 text-center text-gray-500 text-[11px]">
                          <span>{item.batchNo}</span> • <span className="text-gray-400">{item.expDate}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-6 w-6 p-0 text-xs"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              -
                            </Button>
                            <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-6 w-6 p-0 text-xs"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              +
                            </Button>
                          </div>
                        </td>
                        <td className="p-3 text-right text-gray-400">₹{item.mrp.toFixed(2)}</td>
                        <td className="p-3 text-right font-medium">₹{item.price.toFixed(2)}</td>
                        <td className="p-3 text-right text-emerald-600 font-semibold">{item.gst}%</td>
                        <td className="p-3 text-right font-bold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bill Summary Section */}
      <div className="space-y-6">
        <Card className="border border-gray-200 shadow-sm bg-white rounded-xl">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-base font-bold text-gray-900">Bill Summary & Tax</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Items Count</span>
                <span className="font-semibold text-gray-900">{items.length} medicines</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Subtotal (Excl. Tax)</span>
                <span className="font-semibold text-gray-900">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>CGST (6%)</span>
                <span>₹{cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>SGST (6%)</span>
                <span>₹{sgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Total GST (12%)</span>
                <span className="text-emerald-600 font-semibold">₹{totalGST.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-sm pt-1">
                <span className="font-bold text-gray-900">Grand Total</span>
                <span className="font-extrabold text-xl text-blue-600">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Dialog for Generating Official Indian Medical Tax Invoice */}
            <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
              <DialogTrigger asChild>
                <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl gap-2 shadow-md" disabled={items.length === 0}>
                  <FileText className="w-4 h-4" />
                  <span>Generate Official Tax Bill</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-slate-900/5 rounded-2xl">
                
                {/* Fixed Top Modal Header */}
                <DialogHeader className="p-4 bg-white border-b border-gray-200 shrink-0">
                  <div className="flex items-center justify-between">
                    <DialogTitle className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-blue-600" />
                      <span>Indian Medical GST Tax Invoice Preview</span>
                    </DialogTitle>
                    <Badge className="bg-emerald-600 text-white text-xs">Official GST Tax Invoice</Badge>
                  </div>
                </DialogHeader>

                {/* Notifications Confirmation Banner */}
                {isSentNotification && (
                  <div className="bg-emerald-100 text-emerald-800 text-xs px-4 py-2 flex items-center gap-2 border-b border-emerald-200 shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isSentNotification}</span>
                  </div>
                )}

                {/* ============================================================ */}
                {/* OFFICIAL INDIAN MEDICAL TAX INVOICE PREVIEW WORKSPACE */}
                {/* ============================================================ */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex justify-center">
                  <div ref={printRef} className="w-full max-w-[800px] bg-white shadow-xl border border-gray-300 rounded-xl p-6 font-sans text-xs text-gray-900 space-y-4">
                    
                    {/* Invoice Top Header */}
                    <div className="text-center border-b-2 border-gray-900 pb-3 space-y-1">
                      <div className="inline-block bg-gray-900 text-white px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded mb-1">
                        TAX INVOICE / CASH MEMO
                      </div>
                      <h2 className="text-xl font-extrabold uppercase text-blue-900 tracking-wide">LigiMed Healthcare Pharmacy Pvt. Ltd.</h2>
                      <p className="text-[11px] font-medium text-gray-700">Plot 42, Bandra Medical Market, Bandra West, Mumbai, Maharashtra - 400050</p>
                      <p className="text-[11px] text-gray-600">Ph: +91 98765 43210 | Email: billing@ligimed.com | Web: www.ligimed.com</p>
                    </div>

                    {/* Statutory License Badges Bar */}
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold bg-slate-100 border border-gray-900 p-2 rounded">
                      <div>DL NO (Form 20/21): <span className="text-blue-900">MH-MZ2-482910</span></div>
                      <div>GSTIN NO: <span className="text-blue-900">27AABCU9603R1ZM</span></div>
                      <div>FSSAI LIC NO: <span className="text-blue-900">11521004000892</span></div>
                    </div>

                    {/* Bill Meta Details Table */}
                    <div className="grid grid-cols-2 gap-4 border border-gray-900 p-3 rounded text-xs bg-slate-50/50">
                      <div className="space-y-1">
                        <p><strong>Invoice No:</strong> <span className="font-mono font-bold text-blue-900">{invoiceNumber}</span></p>
                        <p><strong>Date & Time:</strong> {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                        <p><strong>Prescribed By:</strong> {doctorName || "Dr. S. Sharma, MBBS"}</p>
                      </div>
                      <div className="space-y-1 text-right sm:text-left">
                        <p><strong>Patient Name:</strong> <span className="font-bold">{customerName || "Walk-in Customer"}</span></p>
                        <p><strong>Mobile No:</strong> +91 {customerMobile || "N/A"}</p>
                        <p><strong>Payment Mode:</strong> <span className="font-bold text-emerald-700">GST CASH / UPI</span></p>
                      </div>
                    </div>

                    {/* Itemized Medicine Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-900 text-[11px]">
                        <thead>
                          <tr className="bg-slate-200 border-b border-gray-900 font-bold text-gray-900">
                            <th className="border border-gray-900 p-1.5 text-center">#</th>
                            <th className="border border-gray-900 p-1.5 text-left">Medicine Description</th>
                            <th className="border border-gray-900 p-1.5 text-center">HSN</th>
                            <th className="border border-gray-900 p-1.5 text-center">Batch</th>
                            <th className="border border-gray-900 p-1.5 text-center">Exp</th>
                            <th className="border border-gray-900 p-1.5 text-center">Qty</th>
                            <th className="border border-gray-900 p-1.5 text-right">MRP</th>
                            <th className="border border-gray-900 p-1.5 text-right">Rate</th>
                            <th className="border border-gray-900 p-1.5 text-right">GST %</th>
                            <th className="border border-gray-900 p-1.5 text-right">Amount (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, idx) => (
                            <tr key={item.id} className="border-b border-gray-800">
                              <td className="border border-gray-900 p-1.5 text-center font-bold">{idx + 1}</td>
                              <td className="border border-gray-900 p-1.5 font-semibold text-gray-900">{item.name}</td>
                              <td className="border border-gray-900 p-1.5 text-center font-mono text-[10px]">{item.hsnCode}</td>
                              <td className="border border-gray-900 p-1.5 text-center font-mono text-[10px]">{item.batchNo}</td>
                              <td className="border border-gray-900 p-1.5 text-center text-[10px]">{item.expDate}</td>
                              <td className="border border-gray-900 p-1.5 text-center font-bold">{item.quantity}</td>
                              <td className="border border-gray-900 p-1.5 text-right text-gray-500">₹{item.mrp.toFixed(2)}</td>
                              <td className="border border-gray-900 p-1.5 text-right font-medium">₹{item.price.toFixed(2)}</td>
                              <td className="border border-gray-900 p-1.5 text-right text-emerald-700 font-bold">{item.gst}%</td>
                              <td className="border border-gray-900 p-1.5 text-right font-bold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Tax & Total Summary Box */}
                    <div className="border border-gray-900 p-3 rounded bg-slate-50 space-y-1.5">
                      <div className="grid grid-cols-2 text-xs">
                        <div className="space-y-1">
                          <p><strong>Subtotal (Excl. Tax):</strong> ₹{subtotal.toFixed(2)}</p>
                          <p><strong>CGST (6%):</strong> ₹{cgst.toFixed(2)}</p>
                          <p><strong>SGST (6%):</strong> ₹{sgst.toFixed(2)}</p>
                          <p><strong>Total GST Amount:</strong> ₹{totalGST.toFixed(2)}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-xs text-gray-600">Total Bill Amount</p>
                          <p className="text-2xl font-extrabold text-blue-900">₹{grandTotal.toFixed(2)}</p>
                          <p className="text-[10px] font-semibold text-gray-700 italic">
                            Amount in Words: Rupees Eighty-Five and Sixty-Eight Paise Only
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Statutory Disclaimers & Pharmacist Signature Box */}
                    <div className="pt-2">
                      <div className="text-[9px] text-gray-600 space-y-0.5 border-t border-gray-300 pt-2">
                        <p>• <strong>Schedule H/H1 Warning:</strong> Sold on the prescription of a Registered Medical Practitioner only.</p>
                        <p>• Goods once sold will not be accepted back or exchanged as per Drug Rules 1945.</p>
                        <p>• Storage Instructions: Store below 25°C in a cool and dry place away from direct sunlight.</p>
                      </div>

                      <div className="flex items-end justify-between pt-6 text-[10px]">
                        <div>
                          <p className="font-bold text-gray-800">Customer Signature</p>
                        </div>
                        <div className="text-center">
                          <div className="border-b border-gray-900 w-48 pb-1 mb-1 font-bold text-blue-900">
                            LigiMed Healthcare Pharmacy
                          </div>
                          <p className="font-medium text-gray-700">Registered Pharmacist (Reg No. PR-884920)</p>
                          <p className="text-[9px] text-gray-500">[ Authorised Signatory Stamp ]</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Fixed Bottom Action Footer */}
                <DialogFooter className="p-4 bg-white border-t border-gray-200 shrink-0 flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsSentNotification(`SMS Tax Invoice receipt sent to +91 ${customerMobile}`)}
                      className="gap-1.5 text-xs rounded-xl"
                    >
                      <Smartphone className="w-4 h-4 text-blue-600" />
                      <span>Send SMS</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsSentNotification(`WhatsApp Tax Bill PDF sent to +91 ${customerMobile}`)}
                      className="gap-1.5 text-xs rounded-xl"
                    >
                      <Send className="w-4 h-4 text-emerald-600" />
                      <span>WhatsApp Bill</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrintInvoice}
                      className="gap-1.5 text-xs rounded-xl"
                    >
                      <Download className="w-4 h-4 text-purple-600" />
                      <span>Download PDF</span>
                    </Button>
                  </div>

                  <Button
                    onClick={handlePrintInvoice}
                    className="w-full sm:w-auto h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 rounded-xl gap-2 shadow-md"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Complete & Print Tax Bill</span>
                  </Button>
                </DialogFooter>

              </DialogContent>
            </Dialog>

          </CardContent>
        </Card>

        {/* Recent Bills */}
        <Card className="border border-gray-200 shadow-sm bg-white rounded-xl">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-base font-bold text-gray-900">Recent Bills</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              {[
                { id: "INV-8765", amount: "₹485.00", time: "2 mins ago", customer: "Rahul V." },
                { id: "INV-8764", amount: "₹1,240.00", time: "15 mins ago", customer: "Priya S." },
                { id: "INV-8763", amount: "₹325.00", time: "1 hour ago", customer: "Walk-in" },
              ].map(bill => (
                <div key={bill.id} className="flex items-center justify-between p-2.5 hover:bg-blue-50/50 rounded-lg cursor-pointer transition-colors border border-gray-100">
                  <div>
                    <p className="text-xs font-bold text-gray-900">{bill.id} • {bill.customer}</p>
                    <p className="text-[11px] text-gray-400">{bill.time}</p>
                  </div>
                  <p className="font-bold text-xs text-blue-600">{bill.amount}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
