import { useState, useEffect } from "react";
import { CreditCard, TrendingUp, Calendar, DollarSign, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { StatusBadge } from "../ui/status-badge";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function BNPLDashboard() {
  const creditLimit = 0;
  const usedCredit = 0;
  const availableCredit = creditLimit - usedCredit;
  const utilizationPercentage = (usedCredit / creditLimit) * 100;

  const paymentHistory = [];

  const upcomingPayments = [];

  const transactionHistory = [];

  const utilizationData = [
    { name: "Available", value: availableCredit, color: "#10B981" },
    { name: "Used", value: usedCredit, color: "#1A73E8" },
  ];

  return (
    <div className="space-y-6">
      {/* Credit Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-[#1A73E8]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#1A73E8]" />
              Credit Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Credit Limit</p>
                  <p className="text-3xl font-bold">₹{(creditLimit / 1000).toFixed(0)}K</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Used Credit</p>
                  <p className="text-3xl font-bold text-[#1A73E8]">₹{(usedCredit / 1000).toFixed(0)}K</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Available</p>
                  <p className="text-3xl font-bold text-green-600">₹{(availableCredit / 1000).toFixed(0)}K</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Credit Utilization</span>
                  <span className="font-medium">{utilizationPercentage.toFixed(1)}%</span>
                </div>
                <Progress value={utilizationPercentage} className="h-3" />
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-muted-foreground">Credit Score Impact</p>
                  <p className="text-sm font-medium text-green-600">Excellent (Low Utilization)</p>
                </div>
                <Button>Request Credit Increase</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Credit Utilization</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={utilizationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
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
    </div>
  );
}
