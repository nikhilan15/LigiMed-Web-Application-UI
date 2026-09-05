import { useState, useEffect } from "react";
import { ShoppingCart, TrendingUp, Package, AlertTriangle, FileText, Pill, CreditCard, Sparkles } from "lucide-react";
import { MetricCard } from "../ui/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { StatusBadge } from "../ui/status-badge";
import { Progress } from "../ui/progress";

export function PharmacyDashboard() {
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);

  useEffect(() => {
    // Load Low Stock Alerts from registered_inventory
    const savedInv = localStorage.getItem("registered_inventory");
    if (savedInv) {
      try {
        const parsed = JSON.parse(savedInv);
        if (Array.isArray(parsed)) {
          const low = parsed.filter((item: any) => item.currentStock < (item.minStock || 30));
          setLowStockItems(low);
        }
      } catch (e) {}
    }

    // Load Orders from ligimed_orders
    const savedOrders = localStorage.getItem("ligimed_orders");
    if (savedOrders) {
      try {
        const parsed = JSON.parse(savedOrders);
        if (Array.isArray(parsed)) {
          setRecentOrders(parsed.slice(0, 5));
          setTotalOrdersCount(parsed.length);
        }
      } catch (e) {}
    }
  }, []);

  const aiSuggestions = lowStockItems.length > 0 ? lowStockItems.map(item => ({
    medicine: item.name,
    reason: `Low stock alert (${item.currentStock} units left). Re-order recommended for shop demand.`,
    quantity: `${(item.minStock || 30) * 2} strips`,
    savings: "Bulk Dealer Discount"
  })) : [
    { medicine: "Dolo 650mg Paracetamol", reason: "Monsoon flu seasonal spike expected in your area (+45% demand)", quantity: "50 strips", savings: "20% bulk deal" },
    { medicine: "Pantoprazole 40mg", reason: "High re-order velocity detected based on 30-day sales history", quantity: "30 strips", savings: "15% discount" }
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Orders"
          value={totalOrdersCount.toString()}
          change={totalOrdersCount > 0 ? `${totalOrdersCount} active` : "0 orders"}
          changeType="positive"
          icon={ShoppingCart}
          iconColor="bg-[#1A73E8]"
        />
        <MetricCard
          title="Pending Deliveries"
          value={recentOrders.filter(o => o.status !== "Delivered").length.toString()}
          change="Real-time order tracking"
          changeType="neutral"
          icon={TrendingUp}
          iconColor="bg-[#00A6A6]"
        />
        <MetricCard
          title="Low Stock Alerts"
          value={lowStockItems.length.toString()}
          change={lowStockItems.length > 0 ? "Action required" : "Inventory healthy"}
          changeType={lowStockItems.length > 0 ? "negative" : "positive"}
          icon={AlertTriangle}
          iconColor="bg-orange-500"
        />
        <MetricCard
          title="Credit Available"
          value="₹2,50,000"
          change="BNPL Escrow Active"
          changeType="positive"
          icon={CreditCard}
          iconColor="bg-green-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span>Low Stock Alerts ({lowStockItems.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockItems.length === 0 ? (
                <p className="text-xs text-gray-500 py-6 text-center">No low stock items. All inventory SKUs are healthy.</p>
              ) : (
                lowStockItems.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-start justify-between text-xs">
                      <div>
                        <p className="font-bold text-gray-900">{item.name}</p>
                        <p className="text-gray-500">
                          {item.currentStock} / {item.minStock || 30} strips
                        </p>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-xs">Restock</Button>
                    </div>
                    <Progress value={Math.min(100, (item.currentStock / (item.minStock || 30)) * 100)} className="h-2" />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI-Powered Recommendations */}
      <Card className="border-[#1A73E8] border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#1A73E8]" />
            AI-Powered Restock Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {aiSuggestions.map((suggestion, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-[#EBF5FF] to-white rounded-lg border border-[#1A73E8]/20">
                <div className="flex-1">
                  <p className="font-medium">{suggestion.medicine}</p>
                  <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm">Qty: {suggestion.quantity}</span>
                    <span className="text-sm text-green-600">Save {suggestion.savings}</span>
                  </div>
                </div>
                <Button size="sm">Add to Cart</Button>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4">
            View All AI Suggestions
          </Button>
        </CardContent>
      </Card>

      {/* BNPL Status */}
      <Card>
        <CardHeader>
          <CardTitle>Buy Now Pay Later Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Credit Limit</p>
                <p className="text-2xl">₹3,00,000</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl text-green-600">₹2,50,000</p>
              </div>
            </div>
            <Progress value={16.67} className="h-3" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Used: ₹50,000</span>
              <span className="text-muted-foreground">83% available</span>
            </div>
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-1">Next Payment Due</p>
              <div className="flex items-center justify-between">
                <p className="font-medium">₹25,000 on Dec 5, 2024</p>
                <Button size="sm">Pay Now</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
