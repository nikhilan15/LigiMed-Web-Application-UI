import { useState, useEffect } from "react";
import { Users, Building2, Truck, TrendingUp, AlertTriangle, DollarSign, Activity, CheckCircle } from "lucide-react";
import { MetricCard } from "../ui/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { StatusBadge } from "../ui/status-badge";
import { Input } from "../ui/input";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";

export function AdminDashboard() {
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRev, setTotalRev] = useState(0);
  const [dealersCount, setDealersCount] = useState(0);

  useEffect(() => {
    const savedOrders = localStorage.getItem("ligimed_orders");
    if (savedOrders) {
      try {
        const parsed = JSON.parse(savedOrders);
        if (Array.isArray(parsed)) {
          setTotalOrders(parsed.length);
          const rev = parsed.reduce((sum: number, o: any) => sum + (o.total || o.totalAmount || 0), 0);
          setTotalRev(rev);
        }
      } catch (e) {}
    }

    const savedDealers = localStorage.getItem("registered_dealers");
    if (savedDealers) {
      try {
        const parsed = JSON.parse(savedDealers);
        if (Array.isArray(parsed)) {
          setDealersCount(parsed.length);
        }
      } catch (e) {}
    }
  }, []);

  const revenueData = [
    { month: "Jul", revenue: 0, orders: 0 },
    { month: "Aug", revenue: 0, orders: 0 },
    { month: "Sep", revenue: totalRev, orders: totalOrders },
  ];

  const userDistribution = [
    { name: "Pharmacies", value: 1, color: "#1A73E8" },
    { name: "Dealers", value: dealersCount, color: "#00A6A6" },
  ];

  const flaggedIssues: any[] = [];
  const recentActivity: any[] = [];
  const topPerformers: any[] = [];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={`₹${totalRev.toLocaleString()}`}
          change={totalOrders > 0 ? "Live order revenue" : "No sales yet"}
          changeType="positive"
          icon={DollarSign}
          iconColor="bg-green-500"
        />
        <MetricCard
          title="Active Users"
          value={(1 + dealersCount).toString()}
          change={`1 Registered Pharmacy, ${dealersCount} Dealers`}
          changeType="neutral"
          icon={Users}
          iconColor="bg-[#1A73E8]"
        />
        <MetricCard
          title="Total Orders"
          value={totalOrders.toString()}
          change={totalOrders > 0 ? `${totalOrders} orders processed` : "0 orders"}
          changeType="positive"
          icon={Activity}
          iconColor="bg-[#00A6A6]"
        />
        <MetricCard
          title="Flagged Issues"
          value="0"
          change="System healthy"
          changeType="positive"
          icon={AlertTriangle}
          iconColor="bg-emerald-500"
        />
      </div>

      {/* Revenue & Orders Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue & Order Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Revenue (₹)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  stroke="#1A73E8"
                  strokeWidth={2}
                  name="Orders"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {userDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Pharmacies</span>
                <span className="font-medium">856</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Dealers</span>
                <span className="font-medium">234</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flagged Issues */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Flagged Issues
            </CardTitle>
            <Button variant="outline" size="sm">View All</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {flaggedIssues.map((issue) => (
              <div
                key={issue.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-medium">{issue.id}</p>
                    <StatusBadge 
                      status={issue.priority}
                      variant={issue.priority === "High" ? "danger" : "warning"}
                    />
                    <StatusBadge status={issue.status} />
                  </div>
                  <p className="text-sm mb-1">{issue.description}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{issue.type}</span>
                    <span>•</span>
                    <span>{issue.entity} ({issue.entityType})</span>
                  </div>
                </div>
                <Button size="sm">Review</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.map((performer) => (
                <div key={performer.rank} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1A73E8] to-[#00A6A6] flex items-center justify-center">
                      <span className="text-white font-semibold">#{performer.rank}</span>
                    </div>
                    <div>
                      <p className="font-medium">{performer.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{performer.type}</span>
                        <span>•</span>
                        <span>⭐ {performer.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{performer.revenue}</p>
                    <p className="text-sm text-muted-foreground">{performer.orders} orders</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Activity className="w-4 h-4 text-primary" />
                    </div>
                    {index < recentActivity.length - 1 && (
                      <div className="w-0.5 h-8 bg-border" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.entity}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Tools */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#1A73E8]/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-[#1A73E8]" />
              </div>
            </div>
            <h3 className="font-semibold mb-2">Manage Pharmacies</h3>
            <p className="text-sm text-muted-foreground mb-4">
              View, approve, and manage all pharmacy accounts
            </p>
            <Button variant="outline" className="w-full">
              View Pharmacies
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#00A6A6]/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-[#00A6A6]" />
              </div>
            </div>
            <h3 className="font-semibold mb-2">Manage Dealers</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Oversee dealer operations and inventory
            </p>
            <Button variant="outline" className="w-full">
              View Dealers
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Truck className="w-6 h-6 text-purple-500" />
              </div>
            </div>
            <h3 className="font-semibold mb-2">Logistics Partners</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Manage delivery partners and tracking
            </p>
            <Button variant="outline" className="w-full">
              View Logistics
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Insights */}
      <Card>
        <CardHeader>
          <CardTitle>System Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-green-900">Uptime</p>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-semibold text-green-900">99.9%</p>
              <p className="text-xs text-green-700 mt-1">Last 30 days</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-blue-900">API Calls</p>
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-semibold text-blue-900">1.2M</p>
              <p className="text-xs text-blue-700 mt-1">This month</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-purple-900">Avg Response</p>
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-semibold text-purple-900">124ms</p>
              <p className="text-xs text-purple-700 mt-1">System latency</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-amber-900">Error Rate</p>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-semibold text-amber-900">0.02%</p>
              <p className="text-xs text-amber-700 mt-1">Very low</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
