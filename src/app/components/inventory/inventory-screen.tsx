import { useState, useEffect } from "react";
import { 
  AlertTriangle, TrendingUp, TrendingDown, Calendar, Sparkles, RefreshCw, 
  Search, Filter, Plus, Package, CheckCircle2, Trash2, ArrowUpRight, 
  ArrowDownLeft, ThermometerSnowflake, FileText, ShoppingCart, Layers
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../ui/dialog";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";

interface RegisteredMedicine {
  id: string;
  name: string;
  category: string;
  manufacturer: string;
  currentStock: number;
  minStock: number;
  rackLocation: string;
  batchNo: string;
  expiryDate: string;
  price: number;
  requiresColdChain?: boolean;
}

interface StockMovement {
  id: string;
  medicineName: string;
  batchNo: string;
  type: "IN" | "OUT";
  quantity: number;
  reason: string;
  reference: string;
  timestamp: string;
}

const DEFAULT_PHARMACY_INVENTORY: RegisteredMedicine[] = [];
const DEFAULT_MOVEMENTS: StockMovement[] = [];

export function InventoryScreen() {
  const [activeTab, setActiveTab] = useState<"stock" | "movements" | "alerts">("stock");
  const [inventoryItems, setInventoryItems] = useState<RegisteredMedicine[]>([]);
  const [movementsList, setMovementsList] = useState<StockMovement[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Add Stock Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [medName, setMedName] = useState("");
  const [medManufacturer, setMedManufacturer] = useState("");
  const [medCategory, setMedCategory] = useState("Painkillers");
  const [medStock, setMedStock] = useState("100");
  const [medMinStock, setMedMinStock] = useState("40");
  const [medRack, setMedRack] = useState("Rack A-01");
  const [medBatch, setMedBatch] = useState("");
  const [medExpiry, setMedExpiry] = useState("2027-12-31");
  const [medPrice, setMedPrice] = useState("45");
  const [medColdChain, setMedColdChain] = useState(false);

  // Quick Inward/Outward Modal State
  const [selectedMedForAdjust, setSelectedMedForAdjust] = useState<RegisteredMedicine | null>(null);
  const [adjustType, setAdjustType] = useState<"IN" | "OUT">("IN");
  const [adjustQty, setAdjustQty] = useState("10");
  const [adjustReason, setAdjustReason] = useState("Manual Stock Adjustment");

  // Load Inventory & Movements from localStorage
  useEffect(() => {
    const savedInv = localStorage.getItem("registered_inventory");
    if (savedInv) {
      try {
        const parsed = JSON.parse(savedInv);
        if (Array.isArray(parsed)) {
          setInventoryItems(parsed);
        } else {
          setInventoryItems([]);
          localStorage.setItem("registered_inventory", JSON.stringify([]));
        }
      } catch (e) {
        setInventoryItems([]);
      }
    } else {
      setInventoryItems([]);
      localStorage.setItem("registered_inventory", JSON.stringify([]));
    }

    const savedMov = localStorage.getItem("registered_movements");
    if (savedMov) {
      try {
        const parsed = JSON.parse(savedMov);
        if (Array.isArray(parsed)) {
          setMovementsList(parsed);
        } else {
          setMovementsList([]);
          localStorage.setItem("registered_movements", JSON.stringify([]));
        }
      } catch (e) {
        setMovementsList([]);
      }
    } else {
      setMovementsList([]);
      localStorage.setItem("registered_movements", JSON.stringify([]));
    }
  }, []);

  const saveInventory = (items: RegisteredMedicine[]) => {
    setInventoryItems(items);
    localStorage.setItem("registered_inventory", JSON.stringify(items));
  };

  const saveMovements = (movs: StockMovement[]) => {
    setMovementsList(movs);
    localStorage.setItem("registered_movements", JSON.stringify(movs));
  };

  const handleAddMedicine = () => {
    if (!medName || !medBatch) return;

    const stockQty = parseInt(medStock) || 50;
    const normMedName = medName.toLowerCase().replace(/[^a-z0-9]/g, '');

    const existingIdx = inventoryItems.findIndex(item => {
      const normItemName = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return normItemName.includes(normMedName) || normMedName.includes(normItemName);
    });

    let updatedInv: RegisteredMedicine[];
    let targetBatch = medBatch;

    if (existingIdx !== -1) {
      updatedInv = [...inventoryItems];
      updatedInv[existingIdx] = {
        ...updatedInv[existingIdx],
        currentStock: updatedInv[existingIdx].currentStock + stockQty,
        batchNo: medBatch || updatedInv[existingIdx].batchNo,
        expiryDate: medExpiry || updatedInv[existingIdx].expiryDate
      };
      targetBatch = updatedInv[existingIdx].batchNo;
    } else {
      const newItem: RegisteredMedicine = {
        id: `inv-${Date.now()}`,
        name: medName,
        category: medCategory,
        manufacturer: medManufacturer || "Pharma Supplier",
        currentStock: stockQty,
        minStock: parseInt(medMinStock) || 30,
        rackLocation: medRack || "Rack A-01",
        batchNo: medBatch,
        expiryDate: medExpiry,
        price: parseFloat(medPrice) || 45,
        requiresColdChain: medColdChain
      };
      updatedInv = [newItem, ...inventoryItems];
    }

    saveInventory(updatedInv);

    // Record Stock IN Movement
    const newMov: StockMovement = {
      id: `mov-${Date.now()}`,
      medicineName: medName,
      batchNo: targetBatch,
      type: "IN",
      quantity: stockQty,
      reason: existingIdx !== -1 ? "Stock Top-up / Inward Receipt" : "Initial Stock Entry / Inward Receipt",
      reference: `INV-ENTRY-${targetBatch}`,
      timestamp: "Just now"
    };
    saveMovements([newMov, ...movementsList]);

    // Reset Form
    setMedName("");
    setMedManufacturer("");
    setMedBatch("");
    setIsAddModalOpen(false);
  };

  const handleAdjustStock = () => {
    if (!selectedMedForAdjust) return;
    const qty = parseInt(adjustQty) || 1;
    const isAdd = adjustType === "IN";

    const updatedInv = inventoryItems.map(item => {
      if (item.id === selectedMedForAdjust.id) {
        const newStock = isAdd ? item.currentStock + qty : Math.max(0, item.currentStock - qty);
        return { ...item, currentStock: newStock };
      }
      return item;
    });

    saveInventory(updatedInv);

    // Record Movement Ledger Entry
    const newMov: StockMovement = {
      id: `mov-${Date.now()}`,
      medicineName: selectedMedForAdjust.name,
      batchNo: selectedMedForAdjust.batchNo,
      type: adjustType,
      quantity: qty,
      reason: adjustReason || (isAdd ? "Inward Stock Refill" : "Outward Dispensed Sale"),
      reference: isAdd ? `REF-IN-${Date.now().toString().slice(-4)}` : `BILL-POS-${Date.now().toString().slice(-4)}`,
      timestamp: "Just now"
    };

    saveMovements([newMov, ...movementsList]);
    setSelectedMedForAdjust(null);
  };

  const handleDeleteItem = (id: string) => {
    const updated = inventoryItems.filter(item => item.id !== id);
    saveInventory(updated);
  };

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batchNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.rackLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === "all" ||
      item.category.toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const totalStockUnits = inventoryItems.reduce((sum, item) => sum + item.currentStock, 0);
  const totalValue = inventoryItems.reduce((sum, item) => sum + (item.currentStock * item.price), 0);
  const lowStockItems = inventoryItems.filter(item => item.currentStock < item.minStock);
  const expiringItems = inventoryItems.filter(item => new Date(item.expiryDate) < new Date("2027-01-01"));

  const totalStockIn = movementsList.filter(m => m.type === "IN").reduce((sum, m) => sum + m.quantity, 0);
  const totalStockOut = movementsList.filter(m => m.type === "OUT").reduce((sum, m) => sum + m.quantity, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span>Pharmacy Shop Inventory & Stock Movement Ledger</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Track real-time stock levels, inward receipts, outward customer sales, and rack locations.</p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-11 px-4 rounded-xl gap-2 shadow-md">
                <Plus className="w-4 h-4" />
                <span>+ Add Medicine to Shop Inventory</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md p-6 rounded-2xl bg-white">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-gray-900">Add New Medicine to Shop Inventory</DialogTitle>
              </DialogHeader>

              <div className="space-y-3 my-2 text-xs">
                <div className="space-y-1">
                  <Label className="font-semibold text-gray-700">Medicine Name & Strength</Label>
                  <Input
                    placeholder="e.g. Dolo 650mg Paracetamol"
                    className="h-10 text-xs"
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="font-semibold text-gray-700">Manufacturer</Label>
                    <Input
                      placeholder="e.g. Micro Labs / Cipla"
                      className="h-10 text-xs"
                      value={medManufacturer}
                      onChange={(e) => setMedManufacturer(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold text-gray-700">Category</Label>
                    <select
                      className="w-full h-10 border border-gray-200 rounded-lg px-2 text-xs bg-gray-50 font-medium"
                      value={medCategory}
                      onChange={(e) => setMedCategory(e.target.value)}
                    >
                      <option value="Painkillers">Painkillers</option>
                      <option value="Antibiotics">Antibiotics</option>
                      <option value="Diabetes">Diabetes</option>
                      <option value="Cardiac">Cardiac</option>
                      <option value="Gastro">Gastro</option>
                      <option value="Allergy">Allergy</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="font-semibold text-gray-700">Initial Stock</Label>
                    <Input
                      type="number"
                      className="h-10 text-xs"
                      value={medStock}
                      onChange={(e) => setMedStock(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold text-gray-700">Min Alert Limit</Label>
                    <Input
                      type="number"
                      className="h-10 text-xs"
                      value={medMinStock}
                      onChange={(e) => setMedMinStock(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold text-gray-700">Rack Location</Label>
                    <Input
                      placeholder="e.g. Rack A-02"
                      className="h-10 text-xs"
                      value={medRack}
                      onChange={(e) => setMedRack(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="font-semibold text-gray-700">Batch Number</Label>
                    <Input
                      placeholder="e.g. BATCH-2026-X"
                      className="h-10 text-xs font-mono"
                      value={medBatch}
                      onChange={(e) => setMedBatch(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold text-gray-700">Expiry Date</Label>
                    <Input
                      type="date"
                      className="h-10 text-xs"
                      value={medExpiry}
                      onChange={(e) => setMedExpiry(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 items-center">
                  <div className="space-y-1">
                    <Label className="font-semibold text-gray-700">Unit Selling Price (₹)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 45"
                      className="h-10 text-xs"
                      value={medPrice}
                      onChange={(e) => setMedPrice(e.target.value)}
                    />
                  </div>

                  <div className="pt-4 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="coldChain"
                      checked={medColdChain}
                      onChange={(e) => setMedColdChain(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor="coldChain" className="text-xs font-bold text-cyan-800 flex items-center gap-1">
                      <ThermometerSnowflake className="w-3.5 h-3.5" /> Cold Chain (2-8°C)
                    </label>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-xl h-10 text-xs">
                  Cancel
                </Button>
                <Button onClick={handleAddMedicine} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 rounded-xl">
                  Save to Inventory
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card 
          onClick={() => setActiveTab("stock")}
          className={`border border-gray-200 shadow-sm bg-white rounded-2xl cursor-pointer hover:border-blue-500 transition-all ${activeTab === "stock" ? "ring-2 ring-blue-500" : ""}`}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-semibold">Total Stock Units</p>
                <p className="text-2xl font-extrabold text-gray-900 mt-1">{totalStockUnits.toLocaleString()}</p>
                <p className="text-xs text-emerald-600 mt-1 font-semibold">{inventoryItems.length} active SKUs in shop</p>
              </div>
              <div className="bg-blue-600 p-3 rounded-xl shadow-md">
                <Package className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => setActiveTab("movements")}
          className={`border border-gray-200 shadow-sm bg-white rounded-2xl cursor-pointer hover:border-emerald-500 transition-all ${activeTab === "movements" ? "ring-2 ring-emerald-500" : ""}`}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-semibold">Stock In (Inward Receipts)</p>
                <p className="text-2xl font-extrabold text-emerald-700 mt-1">+{totalStockIn.toLocaleString()}</p>
                <p className="text-xs text-emerald-600 mt-1 font-semibold flex items-center gap-1">
                  <ArrowDownLeft className="w-3.5 h-3.5" /> From Wholesale Dealers
                </p>
              </div>
              <div className="bg-emerald-600 p-3 rounded-xl shadow-md">
                <ArrowDownLeft className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => setActiveTab("movements")}
          className={`border border-gray-200 shadow-sm bg-white rounded-2xl cursor-pointer hover:border-purple-500 transition-all ${activeTab === "movements" ? "ring-2 ring-purple-500" : ""}`}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-semibold">Stock Out (Customer Sales)</p>
                <p className="text-2xl font-extrabold text-purple-700 mt-1">-{totalStockOut.toLocaleString()}</p>
                <p className="text-xs text-purple-600 mt-1 font-semibold flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Dispensed & Billed
                </p>
              </div>
              <div className="bg-purple-600 p-3 rounded-xl shadow-md">
                <ArrowUpRight className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => setActiveTab("alerts")}
          className={`border border-gray-200 shadow-sm bg-white rounded-2xl cursor-pointer hover:border-amber-500 transition-all ${activeTab === "alerts" ? "ring-2 ring-amber-500" : ""}`}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-semibold">Total Stock Valuation</p>
                <p className="text-2xl font-extrabold text-blue-700 mt-1">₹{Math.round(totalValue).toLocaleString()}</p>
                <p className="text-xs text-emerald-600 mt-1 font-semibold">Live inventory asset</p>
              </div>
              <div className="bg-blue-600 p-3 rounded-xl shadow-md">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm">
        <button
          onClick={() => setActiveTab("stock")}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === "stock"
              ? "bg-blue-600 text-white shadow-md"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Active Shop Stock & Rack Locations ({inventoryItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("movements")}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === "movements"
              ? "bg-blue-600 text-white shadow-md"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Stock In / Out Movement Ledger ({movementsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("alerts")}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === "alerts"
              ? "bg-blue-600 text-white shadow-md"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-300" />
          <span>Low Stock & FEFO Expiry Alerts ({lowStockItems.length + expiringItems.length})</span>
        </button>
      </div>

      {/* ----------------------------------------------------
          TAB 1: LIVE SHOP STOCK TABLE
         ---------------------------------------------------- */}
      {activeTab === "stock" && (
        <Card className="border border-gray-200 shadow-sm bg-white rounded-2xl overflow-hidden animate-fadeIn">
          <CardHeader className="p-5 border-b border-gray-100 bg-slate-50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle className="text-base font-bold text-gray-900">Pharmacy Shop Live Stock Listings</CardTitle>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search stock by name, batch, rack..."
                    className="pl-9 h-10 text-xs bg-white border-gray-200"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <select
                  className="h-10 border border-gray-200 rounded-xl px-3 text-xs bg-white font-semibold"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="Painkillers">Painkillers</option>
                  <option value="Antibiotics">Antibiotics</option>
                  <option value="Diabetes">Diabetes</option>
                  <option value="Cardiac">Cardiac</option>
                  <option value="Gastro">Gastro</option>
                  <option value="Allergy">Allergy</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-gray-700 font-bold border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4">Medicine & Manufacturer</th>
                    <th className="text-left p-4">Category</th>
                    <th className="text-left p-4">Rack Location</th>
                    <th className="text-center p-4">Current Stock</th>
                    <th className="text-center p-4">Batch No</th>
                    <th className="text-center p-4">Expiry Date</th>
                    <th className="text-right p-4">Unit Rate</th>
                    <th className="text-right p-4">Stock Value</th>
                    <th className="text-center p-4">Quick Adjust / Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-gray-900 flex items-center gap-1.5">
                          <span>{item.name}</span>
                          {item.requiresColdChain && (
                            <Badge className="bg-cyan-100 text-cyan-800 text-[9px] gap-0.5">
                              <ThermometerSnowflake className="w-2.5 h-2.5" /> 2-8°C
                            </Badge>
                          )}
                        </p>
                        <p className="text-[10px] text-gray-500">{item.manufacturer}</p>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-700 font-semibold">
                          {item.category}
                        </Badge>
                      </td>
                      <td className="p-4 font-semibold text-blue-900">{item.rackLocation}</td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`font-bold text-sm ${item.currentStock < item.minStock ? "text-amber-600" : "text-gray-900"}`}>
                            {item.currentStock} strips
                          </span>
                          {item.currentStock < item.minStock && (
                            <Badge className="bg-amber-100 text-amber-800 text-[9px] mt-0.5">Low Stock Alert</Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center font-mono font-semibold text-gray-900">{item.batchNo}</td>
                      <td className="p-4 text-center text-gray-600 font-mono">{item.expiryDate}</td>
                      <td className="p-4 text-right font-medium">₹{item.price.toFixed(2)}</td>
                      <td className="p-4 text-right font-bold text-emerald-700">₹{(item.currentStock * item.price).toLocaleString()}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => { setSelectedMedForAdjust(item); setAdjustType("IN"); }}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] h-7 px-2 border border-emerald-200 rounded-lg"
                          >
                            + Stock In
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => { setSelectedMedForAdjust(item); setAdjustType("OUT"); }}
                            className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[10px] h-7 px-2 border border-purple-200 rounded-lg"
                          >
                            - Stock Out
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-500 hover:text-red-700 h-7 w-7 p-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ----------------------------------------------------
          TAB 2: STOCK IN / OUT MOVEMENT LEDGER
         ---------------------------------------------------- */}
      {activeTab === "movements" && (
        <Card className="border border-gray-200 shadow-sm bg-white rounded-2xl overflow-hidden animate-fadeIn">
          <CardHeader className="p-5 border-b border-gray-100 bg-slate-50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-gray-900">Inward & Outward Stock Movement Audit Log</CardTitle>
              <CardDescription className="text-xs text-gray-500">Real-time ledger of all medicine stock additions (purchases) and deductions (customer sales)</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-gray-700 font-bold border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4">Movement Type</th>
                    <th className="text-left p-4">Medicine Name</th>
                    <th className="text-center p-4">Batch No</th>
                    <th className="text-center p-4">Quantity</th>
                    <th className="text-left p-4">Transaction Reason</th>
                    <th className="text-left p-4">Invoice / Bill Ref</th>
                    <th className="text-right p-4">Time Recorded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {movementsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400">
                        No stock movement ledger records found. Click "+ Stock In" or "- Stock Out" to record inventory movements.
                      </td>
                    </tr>
                  ) : (
                    movementsList.map((mov) => (
                      <tr key={mov.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          {mov.type === "IN" ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-bold gap-1">
                              <ArrowDownLeft className="w-3.5 h-3.5" /> STOCK IN (Inward)
                            </Badge>
                          ) : (
                            <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs font-bold gap-1">
                              <ArrowUpRight className="w-3.5 h-3.5" /> STOCK OUT (Sales)
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 font-bold text-gray-900">{mov.medicineName}</td>
                        <td className="p-4 text-center font-mono font-semibold text-blue-900">{mov.batchNo}</td>
                        <td className="p-4 text-center font-extrabold text-sm">
                          <span className={mov.type === "IN" ? "text-emerald-700" : "text-purple-700"}>
                            {mov.type === "IN" ? `+${mov.quantity}` : `-${mov.quantity}`} strips
                          </span>
                        </td>
                        <td className="p-4 font-medium text-gray-700">{mov.reason}</td>
                        <td className="p-4 font-mono text-gray-500">{mov.reference}</td>
                        <td className="p-4 text-right text-gray-500">{mov.timestamp}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ----------------------------------------------------
          TAB 3: LOW STOCK & FEFO EXPIRY ALERTS
         ---------------------------------------------------- */}
      {activeTab === "alerts" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Low Stock Reorder List */}
            <Card className="border border-amber-200 bg-amber-50/20 shadow-sm rounded-2xl">
              <CardHeader className="bg-amber-100/50 p-4 border-b border-amber-200">
                <CardTitle className="text-sm font-bold text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Low Stock Items Requiring Restock ({lowStockItems.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {lowStockItems.length === 0 ? (
                  <p className="text-xs text-gray-500 py-4 text-center">All medicine stock levels are sufficient.</p>
                ) : (
                  lowStockItems.map((item) => (
                    <div key={item.id} className="bg-white p-3.5 rounded-xl border border-amber-200 flex items-center justify-between text-xs shadow-sm">
                      <div>
                        <p className="font-bold text-gray-900">{item.name}</p>
                        <p className="text-gray-500">Current Stock: <strong className="text-amber-700">{item.currentStock}</strong> / Min: {item.minStock}</p>
                      </div>
                      <Button 
                        onClick={() => { setSelectedMedForAdjust(item); setAdjustType("IN"); }}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] h-8 px-3 rounded-lg"
                      >
                        + Restock
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* FEFO Expiry Risk List */}
            <Card className="border border-red-200 bg-red-50/20 shadow-sm rounded-2xl">
              <CardHeader className="bg-red-100/50 p-4 border-b border-red-200">
                <CardTitle className="text-sm font-bold text-red-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-red-600" />
                  <span>FEFO Near-Expiry Risk Batches ({expiringItems.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {expiringItems.length === 0 ? (
                  <p className="text-xs text-gray-500 py-4 text-center">No batches near expiration date.</p>
                ) : (
                  expiringItems.map((item) => (
                    <div key={item.id} className="bg-white p-3.5 rounded-xl border border-red-200 flex items-center justify-between text-xs shadow-sm">
                      <div>
                        <p className="font-bold text-gray-900">{item.name}</p>
                        <p className="text-red-600 font-mono font-bold">Batch: {item.batchNo} • Expiry: {item.expiryDate}</p>
                      </div>
                      <Badge className="bg-red-100 text-red-800 text-[10px] font-bold">
                        Sell First (FEFO)
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      )}

      {/* Stock Adjustment Dialog (Inward / Outward) */}
      <Dialog open={Boolean(selectedMedForAdjust)} onOpenChange={() => setSelectedMedForAdjust(null)}>
        <DialogContent className="max-w-sm p-6 rounded-2xl bg-white text-xs">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              {adjustType === "IN" ? (
                <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
              ) : (
                <ArrowUpRight className="w-5 h-5 text-purple-600" />
              )}
              <span>{adjustType === "IN" ? "Record Stock IN (Inward Receipt)" : "Record Stock OUT (Customer Sale)"}</span>
            </DialogTitle>
          </DialogHeader>

          {selectedMedForAdjust && (
            <div className="space-y-3 my-2">
              <div className="bg-slate-50 p-3 rounded-xl border border-gray-200">
                <p className="font-bold text-gray-900">{selectedMedForAdjust.name}</p>
                <p className="text-gray-500">Current Shop Stock: <strong className="text-blue-900">{selectedMedForAdjust.currentStock} strips</strong></p>
                <p className="text-[10px] text-gray-400 font-mono">Batch: {selectedMedForAdjust.batchNo} • {selectedMedForAdjust.rackLocation}</p>
              </div>

              <div className="space-y-1">
                <Label className="font-bold text-gray-700">Quantity ({adjustType === "IN" ? "Adding" : "Deducting"})</Label>
                <Input
                  type="number"
                  className="h-10 text-xs font-bold"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="font-bold text-gray-700">Transaction Reason</Label>
                <Input
                  placeholder={adjustType === "IN" ? "e.g. Inward Restock Delivery" : "e.g. Counter POS Billing"}
                  className="h-10 text-xs"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedMedForAdjust(null)} className="rounded-xl h-10 text-xs">
              Cancel
            </Button>
            <Button 
              onClick={handleAdjustStock}
              className={`font-bold text-xs h-10 rounded-xl text-white ${adjustType === "IN" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-purple-600 hover:bg-purple-700"}`}
            >
              Confirm {adjustType === "IN" ? "+ Stock IN" : "- Stock OUT"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
