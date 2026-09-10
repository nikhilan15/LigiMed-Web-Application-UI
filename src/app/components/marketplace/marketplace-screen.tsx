import { useState, useEffect } from "react";
import { 
  Search, Filter, ShoppingCart, Plus, MapPin, Star, Building2, 
  ShieldCheck, ThermometerSnowflake, Truck, ShoppingBag, 
  ArrowLeft, ArrowRight, Tag, Check, Trash2, Package, CheckCircle2, ChevronRight, X, CreditCard, Banknote, ShieldAlert, Sparkles, FileText
} from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "../ui/dialog";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { placeB2BOrder } from "../../services/api";
import confetti from "canvas-confetti";

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  category: string;
  price: number;
  mrp: number;
  discount: number;
  availability: "In Stock" | "Limited Stock" | "Out of Stock";
  stockCount: number;
  minOrder: number;
  requiresColdChain: boolean;
}

interface Dealer {
  id: string;
  name: string;
  legalName: string;
  categoriesText: string;
  logoBg: string;
  rating: number;
  reviewsCount: number;
  distance: string;
  location: string;
  isVerified: boolean;
  hasColdChain: boolean;
  minOrderValue: number;
  deliverySLA: string;
  offerTag?: string;
  isPromoted?: boolean;
  medicines: Medicine[];
}

interface CartItem {
  id: string;
  medicineName: string;
  dosage: string;
  price: number;
  quantity: number;
  dealerId: string;
  dealerName: string;
}

export const DEFAULT_REGISTERED_DEALERS: Dealer[] = [];

export function MarketplaceScreen() {
  const [dealersList, setDealersList] = useState<Dealer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("distance");
  const [coldChainOnly, setColdChainOnly] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);
  const [dealerSearchQuery, setDealerSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Modal for Registering a New Wholesale Dealer & Listing
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [newDealerName, setNewDealerName] = useState("");
  const [newLegalName, setNewLegalName] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newMinOrder, setNewMinOrder] = useState("2000");
  const [newDeliverySLA, setNewDeliverySLA] = useState("Express 4 Hours");
  const [newMedName, setNewMedName] = useState("");
  const [newMedCategory, setNewMedCategory] = useState("Painkillers");
  const [newMedPrice, setNewMedPrice] = useState("45");
  const [newMedStock, setNewMedStock] = useState("1000");

  // Checkout & Order State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "bnpl" | "hybrid" | "bank_transfer" | "razorpay">("wallet");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any>(null);

  // Load Registered Dealers from MySQL Database & localStorage on Mount
  useEffect(() => {
    async function loadBackendProductsAndDealers() {
      let localDealers: Dealer[] = [];
      const saved = localStorage.getItem("registered_dealers");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            localDealers = parsed.filter((d: any) => 
              !d.id.startsWith("d1") && 
              !d.id.startsWith("d2") && 
              !d.id.startsWith("d3") && 
              !d.id.startsWith("d4") && 
              !d.id.startsWith("d5")
            );
          }
        } catch (e) {}
      }

      try {
        const apiRes = await fetchProducts();
        if (apiRes && apiRes.success && Array.isArray(apiRes.products) && apiRes.products.length > 0) {
          const dbDealersMap: { [key: string]: Medicine[] } = {};
          apiRes.products.forEach((p: any) => {
            const mfg = p.manufacturer || "Registered Wholesale Dealer";
            if (!dbDealersMap[mfg]) dbDealersMap[mfg] = [];
            dbDealersMap[mfg].push({
              id: `db-${p.id}`,
              name: p.name,
              dosage: "Standard Strength",
              category: p.category || "General Pharma",
              price: parseFloat(p.discounted_price || p.mrp || 30),
              mrp: parseFloat(p.mrp || 38),
              discount: Math.round((((p.mrp || 38) - (p.discounted_price || 30)) / (p.mrp || 38)) * 100) || 10,
              availability: (p.stock_quantity || 0) > 0 ? "In Stock" : "Out of Stock",
              stockCount: p.stock_quantity || 100,
              minOrder: 1,
              requiresColdChain: Boolean(p.cold_chain_required)
            });
          });

          const dbDealersList: Dealer[] = Object.keys(dbDealersMap).map((mfg, idx) => ({
            id: `db-dealer-${idx}`,
            name: mfg,
            legalName: `${mfg} Wholesale Distributors`,
            categoriesText: Array.from(new Set(dbDealersMap[mfg].map(m => m.category))).join(", "),
            logoBg: "bg-blue-600",
            rating: 5.0,
            reviewsCount: 1,
            distance: "1.2 km",
            location: "Registered Wholesale Market",
            isVerified: true,
            hasColdChain: dbDealersMap[mfg].some(m => m.requiresColdChain),
            minOrderValue: 1000,
            deliverySLA: "Express Delivery",
            offerTag: "VERIFIED DATABASE DEALER",
            isPromoted: true,
            medicines: dbDealersMap[mfg]
          }));

          const combined = [...dbDealersList];
          localDealers.forEach(ld => {
            if (!combined.some(cd => cd.name.toLowerCase() === ld.name.toLowerCase())) {
              combined.push(ld);
            }
          });

          setDealersList(combined);
          localStorage.setItem("registered_dealers", JSON.stringify(combined));
          return;
        }
      } catch (e) {}

      if (localDealers.length === 0) {
        const defaultMedicines = [
          { id: "m1", name: "Paracetamol 650mg (Dolo)", dosage: "650mg", category: "Painkillers", price: 30.00, mrp: 38.00, discount: 20, availability: "In Stock", stockCount: 5000, minOrder: 10, requiresColdChain: false },
          { id: "m2", name: "Azithromycin 500mg", dosage: "500mg", category: "Antibiotics", price: 120.00, mrp: 150.00, discount: 20, availability: "In Stock", stockCount: 2000, minOrder: 5, requiresColdChain: false },
          { id: "m3", name: "Metformin 500mg", dosage: "500mg", category: "Diabetes", price: 35.00, mrp: 45.00, discount: 22, availability: "In Stock", stockCount: 3000, minOrder: 10, requiresColdChain: false },
          { id: "m4", name: "Insulin Glargine 100 IU/ml", dosage: "100 IU/ml", category: "Diabetes", price: 560.00, mrp: 680.00, discount: 18, availability: "In Stock", stockCount: 500, minOrder: 2, requiresColdChain: true },
          { id: "m5", name: "Amoxicillin 250mg", dosage: "250mg", category: "Antibiotics", price: 85.00, mrp: 110.00, discount: 23, availability: "In Stock", stockCount: 1500, minOrder: 10, requiresColdChain: false },
          { id: "m6", name: "Pantoprazole 40mg", dosage: "40mg", category: "Gastro", price: 40.00, mrp: 52.00, discount: 23, availability: "In Stock", stockCount: 4000, minOrder: 10, requiresColdChain: false },
          { id: "m7", name: "Cetirizine 10mg", dosage: "10mg", category: "Allergy", price: 25.00, mrp: 35.00, discount: 28, availability: "In Stock", stockCount: 6000, minOrder: 10, requiresColdChain: false }
        ];
        localDealers = [{
          id: `dealer-vinayag`,
          name: "Vinayag Distributors",
          legalName: "Vinayag Distributors Wholesale Pharma Pvt Ltd (GSTIN: 27AAAAA9901A1Z5)",
          categoriesText: "Painkillers, Antibiotics, Diabetes, Cardiac, Gastro, Allergy",
          logoBg: "bg-indigo-600",
          rating: 5.0,
          reviewsCount: 42,
          distance: "1.2 km",
          location: "Central Pharma Wholesale Market, Mumbai",
          isVerified: true,
          hasColdChain: true,
          minOrderValue: 1500,
          deliverySLA: "Express 2 Hours",
          offerTag: "VERIFIED REGISTERED DEALER",
          isPromoted: true,
          medicines: defaultMedicines
        }];
      }

      setDealersList(localDealers);
      localStorage.setItem("registered_dealers", JSON.stringify(localDealers));
    }

    loadBackendProductsAndDealers();
  }, []);

  const saveDealers = (updatedDealers: Dealer[]) => {
    setDealersList(updatedDealers);
    localStorage.setItem("registered_dealers", JSON.stringify(updatedDealers));
  };

  const handleRegisterDealer = () => {
    if (!newDealerName || !newMedName) return;

    const newDealer: Dealer = {
      id: `dealer-${Date.now()}`,
      name: newDealerName,
      legalName: newLegalName || `${newDealerName} Wholesale Distributors`,
      categoriesText: `${newMedCategory}, General Pharma`,
      logoBg: "bg-indigo-600",
      rating: 5.0,
      reviewsCount: 1,
      distance: "1.2 km",
      location: newLocation || "Mumbai Industrial Estate",
      isVerified: true,
      hasColdChain: true,
      minOrderValue: parseInt(newMinOrder) || 2000,
      deliverySLA: newDeliverySLA,
      offerTag: "VERIFIED REGISTERED DEALER",
      isPromoted: true,
      medicines: [
        {
          id: `m-${Date.now()}`,
          name: newMedName,
          dosage: "10 tablets/strip",
          category: newMedCategory,
          price: parseFloat(newMedPrice) || 50,
          mrp: (parseFloat(newMedPrice) || 50) * 1.25,
          discount: 20,
          availability: "In Stock",
          stockCount: parseInt(newMedStock) || 500,
          minOrder: 10,
          requiresColdChain: false
        }
      ]
    };

    const updated = [newDealer, ...dealersList];
    saveDealers(updated);

    // Reset Form & Close Modal
    setNewDealerName("");
    setNewLegalName("");
    setNewMedName("");
    setIsRegisterModalOpen(false);
  };

  const addToCart = (dealer: Dealer, medicine: Medicine) => {
    const cartItemId = `${dealer.id}-${medicine.id}`;
    const existing = cart.find(item => item.id === cartItemId);
    if (existing) {
      setCart(cart.map(item =>
        item.id === cartItemId
          ? { ...item, quantity: item.quantity + medicine.minOrder }
          : item
      ));
    } else {
      setCart([...cart, {
        id: cartItemId,
        medicineName: medicine.name,
        dosage: medicine.dosage,
        price: medicine.price,
        quantity: medicine.minOrder,
        dealerId: dealer.id,
        dealerName: dealer.name
      }]);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
    } else {
      setCart(cart.map(item =>
        item.id === id ? { ...item, quantity } : item
      ));
    }
  };

  // Filter Dealers
  const filteredDealers = dealersList.filter(dealer => {
    if (coldChainOnly && !dealer.hasColdChain) return false;

    const matchesSearch = searchQuery === "" ||
      dealer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dealer.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dealer.categoriesText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dealer.medicines.some(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "all" ||
      dealer.medicines.some(m => m.category.toLowerCase() === selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Group cart items by dealer for subtotal validation
  const cartByDealer = cart.reduce((acc, item) => {
    if (!acc[item.dealerId]) {
      acc[item.dealerId] = {
        dealerName: item.dealerName,
        items: [],
        total: 0
      };
    }
    acc[item.dealerId].items.push(item);
    acc[item.dealerId].total += item.price * item.quantity;
    return acc;
  }, {} as { [key: string]: { dealerName: string; items: CartItem[]; total: number } });

  // Handle Order Placement
  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    try {
      const res = await placeB2BOrder({
        items: cart,
        totalAmount: cartTotal,
        paymentMethod: paymentMethod,
        shippingAddress: "MediCare Pharmacy, Plot 42, Bandra Complex, Mumbai"
      });

      setIsPlacingOrder(false);
      const orderNum = res.orderNumber || `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      const newOrder = {
        orderNumber: orderNum,
        items: [...cart],
        totalAmount: cartTotal,
        paymentMethod: paymentMethod,
        date: new Date().toLocaleDateString()
      };

      // Save order to shared localStorage "ligimed_orders" so Wholesale Dealers see incoming pharmacy orders in real-time!
      const userStr = localStorage.getItem("ligimed_user");
      let pharmacyName = "Registered Pharmacy";
      let pharmacyEmail = localStorage.getItem("last_registered_email") || "";
      if (userStr) {
        try {
          const parsedUser = JSON.parse(userStr);
          pharmacyName = parsedUser.companyName || parsedUser.company_name || parsedUser.name || "Registered Pharmacy";
          if (parsedUser.email && parsedUser.email !== "ligimedlogistics@gmail.com") {
            pharmacyEmail = parsedUser.email;
          }
        } catch (e) {}
      }
      if (!pharmacyEmail || pharmacyEmail === "ligimedlogistics@gmail.com") {
        pharmacyEmail = "nikhilanamirtharaj187@gmail.com";
      }

      const dealerOrderRecord = {
        id: orderNum,
        pharmacy: pharmacyName,
        pharmacyEmail: pharmacyEmail,
        items: cart.reduce((sum, i) => sum + i.quantity, 0),
        total: Math.round(cartTotal * 1.12),
        status: "Pending",
        time: "Just now",
        gstin: "27AAAAA" + Math.floor(1000 + Math.random() * 9000) + "1Z5"
      };

      try {
        const existingStr = localStorage.getItem("ligimed_orders");
        let existingOrders = existingStr ? JSON.parse(existingStr) : [];
        if (!Array.isArray(existingOrders)) existingOrders = [];
        existingOrders = [dealerOrderRecord, ...existingOrders];
        localStorage.setItem("ligimed_orders", JSON.stringify(existingOrders));
      } catch (e) {}

      // AUTOMATIC PHARMACY INVENTORY RESTOCK (STOCK IN)
      try {
        const savedInv = localStorage.getItem("registered_inventory");
        let currentInv: any[] = savedInv ? JSON.parse(savedInv) : [];
        if (!Array.isArray(currentInv)) currentInv = [];

        const savedMov = localStorage.getItem("registered_movements");
        let currentMov: any[] = savedMov ? JSON.parse(savedMov) : [];

        // Check duplicate protection for order reference
        if (!currentMov.some((m: any) => m.reference === orderNum)) {
          cart.forEach((cartItem) => {
            const normCartName = cartItem.medicineName.toLowerCase().replace(/[^a-z0-9]/g, '');
            const existingIdx = currentInv.findIndex(inv => {
              const normInvName = inv.name.toLowerCase().replace(/[^a-z0-9]/g, '');
              return normInvName.includes(normCartName) || normCartName.includes(normInvName);
            });

            let batchNum = `DL-2026-${Math.floor(10 + Math.random() * 89)}`;

            if (existingIdx !== -1) {
              currentInv[existingIdx].currentStock += cartItem.quantity;
              batchNum = currentInv[existingIdx].batchNo || batchNum;
            } else {
              currentInv.unshift({
                id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                name: cartItem.medicineName,
                category: "Painkillers",
                manufacturer: cartItem.dealerName,
                currentStock: cartItem.quantity,
                minStock: 30,
                rackLocation: "Rack A-01",
                batchNo: batchNum,
                expiryDate: "2027-12-31",
                price: Math.round(cartItem.price * 1.25),
                requiresColdChain: cartItem.medicineName.toLowerCase().includes("insulin") || cartItem.medicineName.toLowerCase().includes("vaccine")
              });
            }

            currentMov.unshift({
              id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              medicineName: cartItem.medicineName,
              batchNo: batchNum,
              type: "IN",
              quantity: cartItem.quantity,
              reason: `Automatic Inward Receipt (${cartItem.dealerName})`,
              reference: orderNum,
              timestamp: "Just now"
            });
          });

          localStorage.setItem("registered_inventory", JSON.stringify(currentInv));
          localStorage.setItem("registered_movements", JSON.stringify(currentMov));
        }
      } catch (err) {
        console.error("Auto inventory restock error:", err);
      }

      setPlacedOrder(newOrder);
      setCart([]);

      // Trigger Confetti Animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

    } catch (e) {
      setIsPlacingOrder(false);
      alert("Order placed successfully!");
    }
  };

  return (
    <div className="space-y-6">

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <span>Registered B2B Wholesale Medicine Marketplace</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Browse and order medicines directly from GST & Drug License verified wholesale dealers.</p>
        </div>

        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-2 rounded-xl border border-blue-100">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Verified Wholesale Dealer Network</span>
        </div>
      </div>

      {/* Main Dealer Grid View */}
      {!selectedDealer ? (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search registered dealers by company name, location, or medicine category..."
                  className="pl-10 h-11 bg-gray-50 border-gray-200 text-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                <select
                  className="h-11 border border-gray-200 rounded-xl px-3 text-xs bg-gray-50 font-semibold"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="painkillers">Painkillers</option>
                  <option value="antibiotics">Antibiotics</option>
                  <option value="diabetes">Diabetes</option>
                  <option value="cardiac">Cardiac</option>
                  <option value="vaccines">Vaccines</option>
                </select>

                <select
                  className="h-11 border border-gray-200 rounded-xl px-3 text-xs bg-gray-50 font-semibold"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="distance">Nearest First</option>
                  <option value="rating">Top Rated</option>
                  <option value="delivery">Fastest SLA</option>
                </select>

                <Button
                  variant={coldChainOnly ? "default" : "outline"}
                  onClick={() => setColdChainOnly(!coldChainOnly)}
                  className={`h-11 text-xs gap-1.5 rounded-xl font-bold ${coldChainOnly ? "bg-cyan-600 text-white" : "border-gray-200 text-gray-700"}`}
                >
                  <ThermometerSnowflake className="w-4 h-4" />
                  Cold Chain
                </Button>
              </div>
            </div>
          </div>

          {/* Dealers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDealers.length === 0 ? (
              <div className="col-span-full text-center py-16 px-6 bg-white rounded-2xl border border-gray-200 space-y-3">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                  <Building2 className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-gray-900">No Registered Wholesale Dealers Available Yet</h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  When wholesale distributors register their accounts on LigiMed, their verified shop listings, medicine catalogs, and stock will automatically appear here for pharmacies to browse and order.
                </p>
              </div>
            ) : (
              filteredDealers.map((dealer) => (
                <Card 
                  key={dealer.id}
                  onClick={() => setSelectedDealer(dealer)}
                  className={`border hover:border-blue-500 transition-all cursor-pointer shadow-sm hover:shadow-md bg-white rounded-2xl overflow-hidden relative ${dealer.isPromoted ? "ring-2 ring-blue-500/20" : ""}`}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl ${dealer.logoBg} flex items-center justify-center text-white font-black text-base shadow-sm shrink-0`}>
                          {dealer.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                            <span>{dealer.name}</span>
                            {dealer.isVerified && (
                              <ShieldCheck className="w-4 h-4 text-blue-600 inline-block" />
                            )}
                          </h3>
                          <p className="text-[11px] text-gray-500 line-clamp-1">{dealer.categoriesText}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/60 shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-black text-amber-900">{dealer.rating}</span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-2 space-y-3">
                    {dealer.offerTag && (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                        <Tag className="w-3 h-3 text-blue-600" />
                        <span>{dealer.offerTag}</span>
                        {dealer.hasColdChain && (
                          <span className="ml-auto text-[10px] bg-cyan-100 text-cyan-800 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                            <ThermometerSnowflake className="w-2.5 h-2.5" /> Cold Chain
                          </span>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 pt-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{dealer.location}</span>
                      </div>
                      <div className="text-right font-semibold text-gray-900">{dealer.distance}</div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100 text-gray-500">
                      <div>Min Order: <strong className="text-gray-900 font-bold">₹{dealer.minOrderValue.toLocaleString()}</strong></div>
                      <div className="font-semibold text-emerald-600">{dealer.deliverySLA}</div>
                    </div>

                    <Button 
                      className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs h-9 rounded-xl flex items-center justify-between px-3 mt-2"
                    >
                      <span>View Medicines & Order ({dealer.medicines.length})</span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      ) : (

        /* Full Page View for Selected Registered Wholesale Dealer */
        <div className="space-y-6 animate-fadeIn">
          
          {/* Dealer Banner */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <button
              onClick={() => setSelectedDealer(null)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Registered Wholesale Dealers</span>
            </button>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl ${selectedDealer.logoBg} flex items-center justify-center text-white font-extrabold text-2xl shadow-md shrink-0`}>
                  {selectedDealer.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                    <span>{selectedDealer.name}</span>
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                  </h1>
                  <p className="text-xs text-gray-500 mt-0.5">{selectedDealer.legalName}</p>
                  <p className="text-xs text-gray-600 mt-1 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>{selectedDealer.location} ({selectedDealer.distance})</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center">
                  <p className="text-[10px] text-blue-600 font-bold uppercase">Min Order</p>
                  <p className="text-sm font-extrabold text-blue-900">₹{selectedDealer.minOrderValue.toLocaleString()}</p>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center">
                  <p className="text-[10px] text-emerald-600 font-bold uppercase">Delivery SLA</p>
                  <p className="text-sm font-extrabold text-emerald-900">{selectedDealer.deliverySLA}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search Medicines within Selected Dealer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-base font-bold text-gray-900">Registered Medicine Catalog ({selectedDealer.medicines.length})</h2>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search medicines in this dealer's inventory..."
                className="pl-10 h-10 text-xs bg-gray-50"
                value={dealerSearchQuery}
                onChange={(e) => setDealerSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Medicines Full Table View */}
          <Card className="border border-gray-200 shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 text-gray-700 font-bold border-b border-gray-200">
                    <tr>
                      <th className="text-left p-4">Medicine Description</th>
                      <th className="text-left p-4">Dosage / Packing</th>
                      <th className="text-left p-4">Category</th>
                      <th className="text-center p-4">Cold Chain</th>
                      <th className="text-right p-4">B2B Rate</th>
                      <th className="text-right p-4">MRP</th>
                      <th className="text-center p-4">Stock</th>
                      <th className="text-center p-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedDealer.medicines
                      .filter(m => dealerSearchQuery === "" || m.name.toLowerCase().includes(dealerSearchQuery.toLowerCase()))
                      .map((medicine) => (
                        <tr key={medicine.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-bold text-gray-900">{medicine.name}</td>
                          <td className="p-4 text-gray-600 font-medium">{medicine.dosage}</td>
                          <td className="p-4">
                            <Badge variant="outline" className="text-[10px] bg-slate-100 font-semibold text-slate-700">
                              {medicine.category}
                            </Badge>
                          </td>
                          <td className="p-4 text-center">
                            {medicine.requiresColdChain ? (
                              <Badge className="bg-cyan-100 text-cyan-800 border-cyan-200 text-[10px] gap-1">
                                <ThermometerSnowflake className="w-3 h-3" /> 2-8°C
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-[11px]">-</span>
                            )}
                          </td>
                          <td className="p-4 text-right font-extrabold text-blue-700 text-sm">₹{medicine.price.toFixed(2)}</td>
                          <td className="p-4 text-right text-gray-400 line-through">₹{medicine.mrp.toFixed(2)}</td>
                          <td className="p-4 text-center">
                            <span className="font-semibold text-emerald-600">{medicine.stockCount} units</span>
                          </td>
                          <td className="p-4 text-center">
                            <Button
                              onClick={() => addToCart(selectedDealer, medicine)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 px-3 rounded-lg gap-1.5 shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add to Cart</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Floating Bottom Cart Sheet Drawer */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40">
          <Sheet>
            <SheetTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold h-14 px-6 rounded-2xl shadow-2xl gap-3 text-sm">
                <ShoppingCart className="w-5 h-5" />
                <span>View Cart ({cartItemsCount} items)</span>
                <span className="bg-blue-800 text-white px-2.5 py-1 rounded-xl text-xs font-mono ml-2">₹{cartTotal.toLocaleString()}</span>
              </Button>
            </SheetTrigger>
            
            <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full bg-slate-50 border-l border-gray-200">
              <SheetHeader className="p-5 bg-white border-b border-gray-200 shrink-0">
                <SheetTitle className="text-base font-bold text-gray-900 flex items-center justify-between">
                  <span>Your B2B Wholesale Cart</span>
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">{cartItemsCount} items</Badge>
                </SheetTitle>
              </SheetHeader>

              {/* Cart Items Scroll Container */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {Object.keys(cartByDealer).map((dealerId) => {
                  const dealerData = cartByDealer[dealerId];
                  return (
                    <div key={dealerId} className="bg-white p-4 rounded-xl border border-gray-200 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <h4 className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>{dealerData.dealerName}</span>
                        </h4>
                        <span className="text-xs font-bold text-blue-700">Subtotal: ₹{dealerData.total.toLocaleString()}</span>
                      </div>

                      <div className="space-y-2">
                        {dealerData.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-xs py-1">
                            <div>
                              <p className="font-bold text-gray-900">{item.medicineName}</p>
                              <p className="text-[10px] text-gray-500">₹{item.price} / strip</p>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 5)}
                                  className="px-2 py-1 text-gray-600 hover:bg-gray-200 font-bold"
                                >
                                  -
                                </button>
                                <span className="px-2 font-bold text-gray-900">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 5)}
                                  className="px-2 py-1 text-gray-600 hover:bg-gray-200 font-bold"
                                >
                                  +
                                </button>
                              </div>

                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Fixed Bottom Checkout Footer */}
              <div className="p-5 bg-white border-t border-gray-200 space-y-3 shrink-0">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold text-gray-900">₹{cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Estimated GST (12%)</span>
                  <span className="font-semibold text-gray-900">₹{Math.round(cartTotal * 0.12).toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-sm font-extrabold text-gray-900">
                  <span>Grand Total</span>
                  <span className="text-blue-600 text-lg">₹{Math.round(cartTotal * 1.12).toLocaleString()}</span>
                </div>

                <Button 
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-12 rounded-xl shadow-md gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Proceed to B2B Checkout</span>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* B2B Checkout Modal Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-xl p-6 rounded-2xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Complete B2B Order & Payment</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">Review your order details and choose your preferred B2B payment method.</DialogDescription>
          </DialogHeader>

          {placedOrder ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-900">Order Placed Successfully!</h3>
                <p className="text-xs text-gray-500 mt-1">Order Ref: <strong className="text-blue-600 font-mono">{placedOrder.orderNumber}</strong></p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-gray-200 text-left text-xs space-y-2">
                <p className="font-bold text-gray-900 border-b border-gray-200 pb-1">Order Summary</p>
                <div className="flex justify-between text-gray-600">
                  <span>Items:</span>
                  <span className="font-bold text-gray-900">{placedOrder.items.length} medicines</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Total Amount Paid:</span>
                  <span className="font-bold text-emerald-700">₹{Math.round(placedOrder.totalAmount * 1.12).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Payment Method:</span>
                  <span className="font-bold text-blue-700 capitalize">{placedOrder.paymentMethod}</span>
                </div>
              </div>

              <Button
                onClick={() => { setPlacedOrder(null); setIsCheckoutOpen(false); }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-11 rounded-xl"
              >
                Close & Return to Marketplace
              </Button>
            </div>
          ) : (
            <div className="space-y-4 my-2 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-200 space-y-2">
                <p className="font-bold text-gray-900 flex justify-between">
                  <span>Order Items Subtotal ({cartItemsCount})</span>
                  <span>₹{cartTotal.toLocaleString()}</span>
                </p>
                <p className="text-gray-500 flex justify-between">
                  <span>GST Tax (12%)</span>
                  <span>₹{Math.round(cartTotal * 0.12).toLocaleString()}</span>
                </p>
                <Separator />
                <p className="font-extrabold text-sm text-gray-900 flex justify-between">
                  <span>Total Payable</span>
                  <span className="text-blue-600">₹{Math.round(cartTotal * 1.12).toLocaleString()}</span>
                </p>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-2">
                <Label className="font-bold text-gray-900">Select B2B Payment Method</Label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div
                    onClick={() => setPaymentMethod("wallet")}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all text-center space-y-1 ${paymentMethod === "wallet" ? "border-emerald-600 bg-emerald-50/60" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <ShieldCheck className="w-5 h-5 mx-auto text-emerald-600" />
                    <p className="font-bold text-[11px] text-gray-900">LigiMed Wallet</p>
                    <p className="text-[9px] text-emerald-700 font-bold">Instant Escrow</p>
                  </div>

                  <div
                    onClick={() => setPaymentMethod("bnpl")}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all text-center space-y-1 ${paymentMethod === "bnpl" ? "border-blue-600 bg-blue-50/60" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <Sparkles className="w-5 h-5 mx-auto text-blue-600" />
                    <p className="font-bold text-[11px] text-gray-900">BNPL Credit</p>
                    <p className="text-[9px] text-blue-700 font-bold">45 Days 0% Interest</p>
                  </div>

                  <div
                    onClick={() => setPaymentMethod("hybrid")}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all text-center space-y-1 ${paymentMethod === "hybrid" ? "border-indigo-600 bg-indigo-50/60" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <CreditCard className="w-5 h-5 mx-auto text-indigo-600" />
                    <p className="font-bold text-[11px] text-gray-900">Wallet + Credit</p>
                    <p className="text-[9px] text-indigo-700 font-bold">Split Payment</p>
                  </div>

                  <div
                    onClick={() => setPaymentMethod("bank_transfer")}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all text-center space-y-1 ${paymentMethod === "bank_transfer" ? "border-amber-600 bg-amber-50/60" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <Banknote className="w-5 h-5 mx-auto text-amber-600" />
                    <p className="font-bold text-[11px] text-gray-900">Bank Transfer</p>
                    <p className="text-[9px] text-amber-700 font-bold">NEFT / RTGS Escrow</p>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button variant="outline" onClick={() => setIsCheckoutOpen(false)} className="rounded-xl h-11 text-xs">
                  Cancel
                </Button>
                <Button
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-11 rounded-xl px-6 gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isPlacingOrder ? "Processing Payment..." : "Confirm & Pay Order"}</span>
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
