import { useState, useEffect } from "react";
import { CreditCard, TrendingUp, Calendar, DollarSign, CheckCircle, AlertCircle, Wallet, ArrowUpRight, ArrowDownLeft, Plus, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { StatusBadge } from "../ui/status-badge";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function BNPLDashboard() {
  const creditLimit = 150000;
  const usedCredit = 42000;
  const availableCredit = creditLimit - usedCredit;
  const utilizationPercentage = (usedCredit / creditLimit) * 100;

  const [walletBalance, setWalletBalance] = useState<number>(() => {
    const saved = localStorage.getItem("ligimed_wallet_balance");
    return saved ? parseFloat(saved) : 28500;
  });

  const [topUpAmount, setTopUpAmount] = useState<string>("5000");
  const [showTopUpDialog, setShowTopUpDialog] = useState(false);

  const [walletLedger, setWalletLedger] = useState([
    { id: "WLT-2026-901", date: "2026-09-08", type: "TOPUP", description: "LigiMed Wallet Top Up via UPI", amount: 10000, direction: "CREDIT", balance: 28500 },
    { id: "WLT-2026-882", date: "2026-09-05", type: "PURCHASE", description: "B2B Order #LM-ORD-7749 (Split Payment)", amount: -4500, direction: "DEBIT", balance: 18500 },
    { id: "WLT-2026-810", date: "2026-09-01", type: "REFUND", description: "Reverse Logistics Return Credit Note #CN-881", amount: 3000, direction: "CREDIT", balance: 23000 },
    { id: "WLT-2026-750", date: "2026-08-25", type: "CREDIT_REPAYMENT", description: "BNPL Drawdown Repayment Auto-Debit", amount: -15000, direction: "DEBIT", balance: 20000 },
  ]);

  const handleTopUp = () => {
    const amt = parseFloat(topUpAmount);
    if (!amt || amt <= 0) return;
    const newBal = walletBalance + amt;
    setWalletBalance(newBal);
    localStorage.setItem("ligimed_wallet_balance", newBal.toString());

    const newTxn = {
      id: `WLT-2026-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split("T")[0],
      type: "TOPUP",
      description: "LigiMed Wallet Instant Top-Up",
      amount: amt,
      direction: "CREDIT",
      balance: newBal
    };

    setWalletLedger([newTxn, ...walletLedger]);
    setShowTopUpDialog(false);
  };

  const paymentHistory = [
    { month: "Apr", paid: 25000, due: 0 },
    { month: "May", paid: 35000, due: 0 },
    { month: "Jun", paid: 48000, due: 5000 },
    { month: "Jul", paid: 52000, due: 0 },
    { month: "Aug", paid: 60000, due: 12000 },
    { month: "Sep", paid: 42000, due: 0 },
  ];

  const upcomingPayments = [
    { amount: 18500, date: "15 Sep 2026", status: "Due Soon", invoiceRef: "INV-2026-9901" },
    { amount: 23500, date: "30 Sep 2026", status: "Upcoming", invoiceRef: "INV-2026-9954" },
  ];

  const transactionHistory = [
    { id: "TXN-9981", date: "08 Sep 2026", type: "Purchase", description: "Restock Paracetamol 650mg & Azithromycin", amount: 18500, balance: 42000 },
    { id: "TXN-9920", date: "01 Sep 2026", type: "Payment", description: "Auto-Debit Repayment", amount: -25000, balance: 23500 },
    { id: "TXN-9840", date: "24 Aug 2026", type: "Purchase", description: "Insulin Glargine Cold Chain Package", amount: 23500, balance: 48500 },
  ];

  const utilizationData = [
    { name: "Available Credit", value: availableCredit, color: "#10B981" },
    { name: "Used Credit", value: usedCredit, color: "#1A73E8" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: LigiMed Digital Wallet & BNPL Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Wallet Balance Card */}
        <Card className="border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 text-white shadow-xl rounded-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-400">
              <span className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                LigiMed Digital Wallet
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full border border-emerald-400/30">
                ACTIVE ESCROW
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-[11px] text-slate-400 font-semibold">Available Wallet Balance</p>
              <p className="text-3xl font-extrabold tracking-tight text-white mt-1">₹{walletBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
            </div>
            
            <div className="flex items-center gap-2 pt-1">
              <Button 
                onClick={() => setShowTopUpDialog(true)}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs h-9 rounded-xl gap-1.5 shadow-md shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Top Up Wallet</span>
              </Button>
              <Button 
                variant="outline"
                className="border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-white font-bold text-xs h-9 rounded-xl"
              >
                Ledger
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Credit Overview */}
        <Card className="md:col-span-2 border-blue-200 bg-white shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-bold text-slate-900">
              <span className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                B2B Revolving Credit Line (BNPL)
              </span>
              <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-bold border border-blue-200">
                45 Days 0% Interest
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Approved Credit Limit</p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-0.5">₹{(creditLimit / 1000).toFixed(0)}K</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Utilized Credit</p>
                  <p className="text-2xl font-extrabold text-blue-600 mt-0.5">₹{(usedCredit / 1000).toFixed(0)}K</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Available to Spend</p>
                  <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">₹{(availableCredit / 1000).toFixed(0)}K</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600">Credit Limit Utilization</span>
                  <span className="text-blue-700">{utilizationPercentage.toFixed(1)}%</span>
                </div>
                <Progress value={utilizationPercentage} className="h-2.5 bg-slate-100" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credit Utilization Pie Chart */}
        <Card className="border-slate-200 bg-white shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-900">Credit Utilization</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={utilizationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {utilizationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Auto-Debit Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex-1">
                <Label htmlFor="auto-debit" className="text-base">Enable Auto-Debit</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Automatically deduct payments from your bank account on due dates
                </p>
              </div>
              <Switch id="auto-debit" defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex-1">
                <Label htmlFor="payment-reminders" className="text-base">Payment Reminders</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Get notified 3 days before payment due date
                </p>
              </div>
              <Switch id="payment-reminders" defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Payments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Upcoming Payments</CardTitle>
            <Button variant="outline" size="sm">View All</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingPayments.map((payment, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    payment.status === "Due Soon" 
                      ? "bg-amber-100" 
                      : "bg-blue-100"
                  }`}>
                    <Calendar className={`w-6 h-6 ${
                      payment.status === "Due Soon" 
                        ? "text-amber-600" 
                        : "text-blue-600"
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium">₹{payment.amount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Due on {payment.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge 
                    status={payment.status}
                    variant={payment.status === "Due Soon" ? "warning" : "info"}
                  />
                  <Button size="sm">Pay Now</Button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">No Overdue Payments</p>
                <p className="text-sm text-green-800">
                  Great job! You have no overdue payments. Keep up the good payment history.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={paymentHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="paid" stroke="#10B981" strokeWidth={2} name="Paid Amount" />
              <Line type="monotone" dataKey="due" stroke="#EF4444" strokeWidth={2} name="Due Amount" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 text-sm">Transaction ID</th>
                  <th className="text-left p-3 text-sm">Date</th>
                  <th className="text-left p-3 text-sm">Type</th>
                  <th className="text-left p-3 text-sm">Description</th>
                  <th className="text-right p-3 text-sm">Amount</th>
                  <th className="text-right p-3 text-sm">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactionHistory.map((txn) => (
                  <tr key={txn.id} className="hover:bg-muted/50">
                    <td className="p-3">
                      <p className="font-medium text-sm">{txn.id}</p>
                    </td>
                    <td className="p-3 text-sm">{txn.date}</td>
                    <td className="p-3">
                      <StatusBadge 
                        status={txn.type}
                        variant={txn.type === "Payment" ? "success" : "info"}
                      />
                    </td>
                    <td className="p-3 text-sm">{txn.description}</td>
                    <td className={`p-3 text-right font-medium ${
                      txn.amount < 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {txn.amount < 0 ? "" : "+"}₹{Math.abs(txn.amount).toLocaleString()}
                    </td>
                    <td className="p-3 text-right text-sm">₹{txn.balance.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button variant="outline" className="w-full mt-4">
            Load More Transactions
          </Button>
        </CardContent>
      </Card>

      {/* Benefits Card */}
      <Card className="border-[#00A6A6] bg-gradient-to-r from-[#E0F7F7] to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#00A6A6]" />
            BNPL Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[#00A6A6]" />
              </div>
              <div>
                <p className="font-medium">0% Interest</p>
                <p className="text-sm text-muted-foreground">No interest on timely payments</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#00A6A6]" />
              </div>
              <div>
                <p className="font-medium">45 Days Credit</p>
                <p className="text-sm text-muted-foreground">Extended payment period</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-[#00A6A6]" />
              </div>
              <div>
                <p className="font-medium">Instant Approval</p>
                <p className="text-sm text-muted-foreground">Quick credit decisions</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top-Up Wallet Dialog Modal */}
      {showTopUpDialog && (
        <Dialog open={showTopUpDialog} onOpenChange={setShowTopUpDialog}>
          <DialogContent className="max-w-md bg-white rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                <span>Instant Wallet Top-Up</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-2 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl">
                <p className="text-slate-600 font-medium">Current Balance</p>
                <p className="text-xl font-extrabold text-emerald-700 mt-0.5">₹{walletBalance.toLocaleString()}</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Enter Top-Up Amount (₹)</Label>
                <Input 
                  type="number"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="h-11 text-sm font-bold bg-slate-50 border-slate-200"
                />
              </div>

              <div className="flex gap-2">
                {["1000", "5000", "10000", "25000"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTopUpAmount(preset)}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-all"
                  >
                    +₹{preset}
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowTopUpDialog(false)} className="rounded-xl h-10 text-xs font-bold">
                Cancel
              </Button>
              <Button onClick={handleTopUp} className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs h-10 rounded-xl px-6 gap-2">
                <Plus className="w-4 h-4" />
                <span>Add Money to Wallet</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
