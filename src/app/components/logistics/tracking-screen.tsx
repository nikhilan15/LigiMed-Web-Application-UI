import { useState, useEffect } from "react";
import { 
  Package, Truck, CheckCircle2, Phone, User, Clock, MapPin, 
  ChevronDown, FileText, AlertCircle, ShoppingBag, ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
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

export function TrackingScreen() {
  const [orders, setOrders] = useState<WholesaleOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");

  const loadOrders = () => {
    const saved = localStorage.getItem("ligimed_orders");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOrders(parsed);
          if (!selectedOrderId || !parsed.some(o => o.id === selectedOrderId)) {
            setSelectedOrderId(parsed[0].id);
          }
        } else {
          setOrders([]);
        }
      } catch (e) {
        setOrders([]);
      }
    } else {
      setOrders([]);
    }
  };

  useEffect(() => {
    loadOrders();

    const handleStorageChange = () => {
      loadOrders();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const activeOrder = orders.find(o => o.id === selectedOrderId) || orders[0];

  if (!activeOrder) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-200 shadow-sm text-center space-y-4">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
          <Truck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">No Active Medicine Shipments</h2>
        <p className="text-sm text-gray-500 max-w-md">
          You currently have no active wholesale medicine orders. Place an order from wholesale dealers in the Marketplace to view live tracking updates.
        </p>
      </div>
    );
  }

  const statusLower = (activeOrder.status || "Pending").toLowerCase();

  // Dynamic status mapping for timeline
  const isConfirmed = true;
  const isPacked = statusLower.includes("processing") || statusLower.includes("packed") || statusLower.includes("dispatched") || statusLower.includes("in transit") || statusLower.includes("delivered");
  const isInTransit = statusLower.includes("dispatched") || statusLower.includes("in transit") || statusLower.includes("delivered");
  const isDelivered = statusLower.includes("delivered");

  const timelineSteps = [
    {
      title: "Order Confirmed & Escrow Authorized",
      desc: `Wholesale order ${activeOrder.id} authorized via ${activeOrder.paymentMethod || "LigiMed Escrow"}`,
      time: activeOrder.time || "Today",
      isDone: true,
      isCurrent: statusLower === "pending"
    },
    {
      title: "Wholesale Packaging & Verification",
      desc: "Batch numbers and expiry dates verified by wholesale distributor",
      time: isPacked ? "15 mins after order" : "Pending warehouse pack",
      isDone: isPacked,
      isCurrent: statusLower === "processing" || statusLower === "packed"
    },
    {
      title: "Shipped & In Transit",
      desc: `Dispatched from wholesale hub via express delivery courier`,
      time: isInTransit ? "In Transit" : "Awaiting dispatch",
      isDone: isInTransit,
      isCurrent: statusLower === "dispatched" || statusLower === "in transit"
    },
    {
      title: "Delivered to Pharmacy",
      desc: "Received and verified at pharmacy store location",
      time: isDelivered ? "Delivered" : "Est. 30-45 mins",
      isDone: isDelivered,
      isCurrent: isDelivered
    }
  ];

  // Parse items
  const itemsList: OrderItem[] = Array.isArray(activeOrder.items) 
    ? activeOrder.items 
    : [
        { medicineName: "Wholesale Restock Medicine Pack", quantity: typeof activeOrder.items === 'number' ? activeOrder.items : 1, price: activeOrder.total ? Math.round(activeOrder.total / 1.12) : 1200 }
      ];

  const totalAmount = activeOrder.total || activeOrder.totalAmount || 1500;

  return (
    <div className="space-y-6">
      
      {/* Top Header & Order Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            <span>Live Medicine Order Tracking</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Real-time status updates for incoming wholesale pharma deliveries.</p>
        </div>

        {orders.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Select Order:</span>
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="h-10 px-3 text-xs font-semibold rounded-xl border border-gray-300 bg-white text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {orders.map((ord) => (
                <option key={ord.id} value={ord.id}>
                  {ord.id} - {ord.status} (₹{ord.total || ord.totalAmount || 0})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Summary Banner & Delivery Timeline */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tracking Status Summary Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-md space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-white/20 text-white border-0 font-bold px-3 py-1 text-xs uppercase tracking-wide">
                    {activeOrder.status}
                  </Badge>
                  <span className="text-xs text-blue-100 font-mono">Order Ref: {activeOrder.id}</span>
                </div>
                <h2 className="text-xl font-bold mt-2.5">
                  Shipment: {itemsList[0]?.medicineName || "Pharma Order"} {itemsList.length > 1 ? `+${itemsList.length - 1} items` : ''}
                </h2>
                <p className="text-xs text-blue-100 mt-1.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-green-300" />
                  Supplier Hub: <span className="font-semibold text-white">{activeOrder.dealerName || "Wholesale Distributor"}</span>
                </p>
              </div>

              <div className="flex items-center gap-6 bg-white/10 backdrop-blur px-5 py-3.5 rounded-xl border border-white/20">
                <div>
                  <p className="text-xs text-blue-200">Current Status</p>
                  <p className="text-base font-bold text-white mt-0.5">{activeOrder.status}</p>
                </div>
                <div className="h-8 w-px bg-white/20" />
                <div>
                  <p className="text-xs text-blue-200">Est. Arrival</p>
                  <p className="text-base font-bold text-green-300 mt-0.5">
                    {isDelivered ? "Delivered" : "30-45 mins"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Timeline */}
          <Card className="rounded-2xl border-gray-200">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Live Order Progress Timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {timelineSteps.map((step, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          step.isDone
                            ? "bg-emerald-500 text-white shadow-sm"
                            : step.isCurrent
                            ? "bg-blue-600 text-white animate-pulse ring-4 ring-blue-100"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {step.isDone ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <span className="text-xs font-bold">{index + 1}</span>
                        )}
                      </div>
                      {index < timelineSteps.length - 1 && (
                        <div
                          className={`w-0.5 h-12 ${
                            step.isDone ? "bg-emerald-500" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p
                            className={`text-sm font-bold ${
                              step.isCurrent
                                ? "text-blue-600"
                                : step.isDone
                                ? "text-gray-900"
                                : "text-gray-400"
                            }`}
                          >
                            {step.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {step.desc}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 font-medium whitespace-nowrap bg-gray-50 px-2 py-1 rounded-md">
                          {step.time}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Order Items & Delivery Details */}
        <div className="space-y-6">
          
          {/* Order Details */}
          <Card className="rounded-2xl border-gray-200">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-bold text-gray-900">Order Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Order Reference</span>
                <span className="font-mono font-bold text-gray-900">{activeOrder.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Supplier Name</span>
                <span className="font-semibold text-gray-900">{activeOrder.dealerName || "Wholesale Distributor"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Supplier GSTIN</span>
                <span className="font-mono text-gray-700">{activeOrder.gstin || "27AAAAA9901A1Z5"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Payment Status</span>
                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 font-semibold">
                  Paid / Escrow Locked
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-sm font-bold pt-1">
                <span className="text-gray-900">Total Invoice Amount</span>
                <span className="text-blue-600">₹{totalAmount.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Ordered Medicines List */}
          <Card className="rounded-2xl border-gray-200">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-bold text-gray-900 flex items-center justify-between">
                <span>Ordered Medicines ({itemsList.length})</span>
                <Package className="w-4 h-4 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {itemsList.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-xs border border-gray-100"
                >
                  <div>
                    <p className="font-bold text-gray-900">{item.medicineName}</p>
                    {item.dosage && <p className="text-gray-500 text-[11px]">{item.dosage}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{item.quantity} units</p>
                    <p className="text-gray-500 text-[11px]">₹{item.price} / unit</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Logistics Driver Details */}
          <Card className="rounded-2xl border-gray-200">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-bold text-gray-900">Courier Driver Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-xs text-gray-900">Rajesh Kumar (Express Delivery)</p>
                  <p className="text-xs text-gray-500">Vehicle: MH 02 CZ 4819</p>
                </div>
              </div>
              <Button variant="outline" className="w-full h-10 text-xs font-bold gap-2 rounded-xl border-gray-300">
                <Phone className="w-3.5 h-3.5" />
                Contact Dispatch Driver
              </Button>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
