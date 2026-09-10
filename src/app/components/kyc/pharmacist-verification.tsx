import React, { useState } from "react";
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Thermometer, 
  Package, 
  Calendar, 
  FileText, 
  Award,
  ClipboardCheck,
  UserCheck
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

export interface PharmacistInspectionData {
  orderId: string;
  drugName: string;
  batchNumber: string;
  manufacturer: string;
  expiryDate: string;
  quantity: number;
  temperatureRecorded?: string;
  batchValid: boolean;
  expiryValid: boolean;
  sealIntact: boolean;
  storageCompliant: boolean;
  result: "APPROVED" | "FLAGGED" | "REJECTED";
  pharmacistLicenseNo: string;
  notes: string;
  verifiedAt?: string;
}

interface PharmacistVerificationProps {
  order?: any;
  onComplete: (data: PharmacistInspectionData) => void;
  onClose: () => void;
}

export function PharmacistVerificationModal({ order, onComplete, onClose }: PharmacistVerificationProps) {
  const [batchValid, setBatchValid] = useState(true);
  const [expiryValid, setExpiryValid] = useState(true);
  const [sealIntact, setSealIntact] = useState(true);
  const [storageCompliant, setStorageCompliant] = useState(true);
  const [temperature, setTemperature] = useState("4.2 °C");
  const [licenseNo, setLicenseNo] = useState("PH-IND-2026-9821");
  const [decision, setDecision] = useState<"APPROVED" | "FLAGGED" | "REJECTED">("APPROVED");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const orderId = order?.id || order?.orderNumber || "LM-ORD-7749";
  const drugName = order?.items?.[0]?.name || order?.product || "Insulin Glargine 100 IU/ml (Cold Chain)";
  const batchNumber = order?.batchNo || "BATCH-2026-X88";
  const manufacturer = order?.supplierName || "May & Baker Healthcare Distributors";
  const expiryDate = order?.expiryDate || "2027-11-30";
  const quantity = order?.qty || order?.items?.[0]?.qty || 250;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      onComplete({
        orderId,
        drugName,
        batchNumber,
        manufacturer,
        expiryDate,
        quantity,
        temperatureRecorded: temperature,
        batchValid,
        expiryValid,
        sealIntact,
        storageCompliant,
        result: decision,
        pharmacistLicenseNo: licenseNo,
        notes: notes || "Quality audit passed. Batch registry verified against national drug database.",
        verifiedAt: new Date().toISOString()
      });
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-blue-100 w-full max-w-2xl overflow-hidden animate-fadeIn">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-200 bg-blue-500/30 px-2.5 py-0.5 rounded-full border border-blue-400/30">
                  Form 20/21 Compliance Audit
                </span>
                <h2 className="text-xl font-extrabold tracking-tight mt-1">Pharmacist Quality & Physical Verification</h2>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Order & Drug Meta Summary */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Order Reference</span>
              <span className="font-extrabold text-slate-900">{orderId}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Product Name</span>
              <span className="font-bold text-blue-700 truncate block">{drugName}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Batch No / Expiry</span>
              <span className="font-extrabold text-slate-800">{batchNumber} ({expiryDate})</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Quantity Inspected</span>
              <span className="font-extrabold text-emerald-600">{quantity} units</span>
            </div>
          </div>

          {/* Verification Checklist Matrix */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-blue-600" />
              Physical Inspection Checklist
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Check 1: Batch Validity */}
              <div 
                onClick={() => setBatchValid(!batchValid)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  batchValid ? "bg-emerald-50/60 border-emerald-300 text-emerald-900" : "bg-red-50/60 border-red-300 text-red-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Package className={`w-5 h-5 ${batchValid ? "text-emerald-600" : "text-red-500"}`} />
                  <div>
                    <p className="text-xs font-bold">Manufacturer Batch Match</p>
                    <p className="text-[10px] opacity-75">Verified against Central Drug Registry</p>
                  </div>
                </div>
                {batchValid ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
              </div>

              {/* Check 2: Expiry Date */}
              <div 
                onClick={() => setExpiryValid(!expiryValid)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  expiryValid ? "bg-emerald-50/60 border-emerald-300 text-emerald-900" : "bg-amber-50/60 border-amber-300 text-amber-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Calendar className={`w-5 h-5 ${expiryValid ? "text-emerald-600" : "text-amber-500"}`} />
                  <div>
                    <p className="text-xs font-bold">Expiry Date Shelf Life</p>
                    <p className="text-[10px] opacity-75">Minimum &gt; 12 months remaining</p>
                  </div>
                </div>
                {expiryValid ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />}
              </div>

              {/* Check 3: Protective Seal */}
              <div 
                onClick={() => setSealIntact(!sealIntact)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  sealIntact ? "bg-emerald-50/60 border-emerald-300 text-emerald-900" : "bg-red-50/60 border-red-300 text-red-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className={`w-5 h-5 ${sealIntact ? "text-emerald-600" : "text-red-500"}`} />
                  <div>
                    <p className="text-xs font-bold">Tamper-Evident Seal Intact</p>
                    <p className="text-[10px] opacity-75">No physical container damage</p>
                  </div>
                </div>
                {sealIntact ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
              </div>

              {/* Check 4: Cold-Chain Storage */}
              <div 
                onClick={() => setStorageCompliant(!storageCompliant)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  storageCompliant ? "bg-emerald-50/60 border-emerald-300 text-emerald-900" : "bg-blue-50/60 border-blue-300 text-blue-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Thermometer className={`w-5 h-5 ${storageCompliant ? "text-emerald-600" : "text-blue-500"}`} />
                  <div>
                    <p className="text-xs font-bold">Cold Chain Temp Compliant</p>
                    <p className="text-[10px] opacity-75">Logged reading: {temperature}</p>
                  </div>
                </div>
                {storageCompliant ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <XCircle className="w-5 h-5 text-blue-500 shrink-0" />}
              </div>
            </div>
          </div>

          {/* Pharmacist License & Telemetry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                Pharmacist Registration / License No.
              </Label>
              <Input 
                value={licenseNo}
                onChange={(e) => setLicenseNo(e.target.value)}
                placeholder="e.g. PH-IND-2026-XXXX"
                className="h-10 text-xs font-bold bg-slate-50 border-slate-200"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-cyan-600" />
                Recorded Thermal Telemetry Reading
              </Label>
              <Input 
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="e.g. 4.2 °C"
                className="h-10 text-xs font-bold bg-slate-50 border-slate-200"
              />
            </div>
          </div>

          {/* Inspection Decision Toggle */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-indigo-600" />
              Final Inspection Outcome Decision
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDecision("APPROVED")}
                className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 border transition-all ${
                  decision === "APPROVED"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                APPROVED
              </button>

              <button
                type="button"
                onClick={() => setDecision("FLAGGED")}
                className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 border transition-all ${
                  decision === "FLAGGED"
                    ? "bg-amber-500 text-white border-amber-500 shadow-md"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                FLAGGED
              </button>

              <button
                type="button"
                onClick={() => setDecision("REJECTED")}
                className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 border transition-all ${
                  decision === "REJECTED"
                    ? "bg-red-600 text-white border-red-600 shadow-md"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <XCircle className="w-4 h-4" />
                REJECTED
              </button>
            </div>
          </div>

          {/* Pharmacist Audit Notes */}
          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Pharmacist Inspection Notes & Regulatory Remarks
            </Label>
            <Textarea 
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Physical package seal verified. Temperature logs continuously compliant during transit..."
              className="text-xs font-medium bg-slate-50 border-slate-200"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs font-bold h-10 rounded-xl px-5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold h-10 rounded-xl px-6 gap-2 shadow-lg shadow-blue-600/30"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? "Signing & Submitting..." : "Sign & Save Audit Verification"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
