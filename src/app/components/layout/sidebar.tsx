import { 
  LayoutDashboard, 
  ShoppingCart, 
  FileText, 
  Package, 
  TrendingUp, 
  MapPin, 
  RotateCcw, 
  Shield, 
  CreditCard, 
  Settings, 
  Users,
  Activity,
  ClipboardList
} from "lucide-react";
import { Button } from "../ui/button";

interface SidebarProps {
  userType: "pharmacy" | "dealer" | "admin";
  activePage: string;
  onNavigate: (page: string) => void;
}

export function Sidebar({ userType, activePage, onNavigate }: SidebarProps) {
  const getMenuItems = () => {
    if (userType === "pharmacy") {
      return [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "marketplace", label: "Marketplace", icon: ShoppingCart },
        { id: "orders", label: "Orders", icon: ClipboardList },
        { id: "billing", label: "Billing", icon: FileText },
        { id: "inventory", label: "Inventory", icon: Package },
        { id: "tracking", label: "Logistics", icon: MapPin },
        { id: "reverse", label: "Returns", icon: RotateCcw },
        { id: "kyc", label: "KYC & Compliance", icon: Shield },
        { id: "bnpl", label: "Payments", icon: CreditCard },
      ];
    } else if (userType === "dealer") {
      return [
        { id: "dealer-dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "orders", label: "Pharmacy Orders", icon: ClipboardList },
        { id: "inventory-upload", label: "Inventory & SKUs", icon: Package },
        { id: "analytics", label: "Sales Analytics", icon: TrendingUp },
        { id: "tracking", label: "Shipments & Logistics", icon: MapPin },
      ];
    } else {
      return [
        { id: "admin-dashboard", label: "Dashboard", icon: Activity },
        { id: "pharmacies", label: "Pharmacies", icon: Users },
        { id: "dealers", label: "Dealers", icon: Users },
        { id: "logistics", label: "Logistics", icon: MapPin },
        { id: "analytics", label: "Analytics", icon: TrendingUp },
      ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="flex flex-col h-full w-64 bg-white border-r border-border">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1A73E8] to-[#00A6A6] flex items-center justify-center">
            <span className="text-white font-semibold">LM</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">LigiMed</h2>
            <p className="text-xs text-muted-foreground capitalize">{userType === "dealer" ? "Wholesale Dealer" : userType} Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={`w-full justify-start gap-3 text-xs font-bold ${
                isActive 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "text-gray-700 hover:bg-slate-100"
              }`}
              onClick={() => onNavigate(item.id)}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-xs font-bold text-gray-700"
          onClick={() => onNavigate("settings")}
        >
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </div>
    </div>
  );
}
