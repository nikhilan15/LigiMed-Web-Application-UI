import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from "react";
import { Sidebar } from "./components/layout/sidebar";
import { Header } from "./components/layout/header";
import { LoginScreen } from "./components/auth/login-screen";
import { KYCOnboarding } from "./components/auth/kyc-onboarding";
import { PharmacyDashboard } from "./components/dashboards/pharmacy-dashboard";
import { DealerDashboard } from "./components/dashboards/dealer-dashboard";
import { AdminDashboard } from "./components/dashboards/admin-dashboard";
import { MarketplaceScreen, DEFAULT_REGISTERED_DEALERS } from "./components/marketplace/marketplace-screen";
import { BillingScreen } from "./components/billing/billing-screen";
import { InventoryScreen } from "./components/inventory/inventory-screen";
import { TrackingScreen } from "./components/logistics/tracking-screen";
import { ReverseLogistics } from "./components/logistics/reverse-logistics";
import { KYCCompliance } from "./components/kyc/kyc-compliance";
import { PharmacistVerificationModal } from "./components/kyc/pharmacist-verification";
import { BNPLDashboard } from "./components/payments/bnpl-dashboard";
import { PharmacyOrdersScreen } from "./components/orders/pharmacy-orders-screen";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./components/ui/button";
import { registerUser } from "./services/api";

type UserType = "pharmacy" | "dealer" | "admin" | "pharmacist" | null;
type Page = string;
const SESSION_KEY = "ligimed_session";

function syncDealerToMarketplace(fullUserData: any) {
  if (!fullUserData) return;
  const dealerName = fullUserData.role === "dealer" 
    ? (fullUserData.companyName || fullUserData.company_name || fullUserData.name || "Vinayag Distributors")
    : "Vinayag Distributors";

  try {
    const saved = localStorage.getItem("registered_dealers");
    let dealers = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(dealers)) {
      dealers = [];
    }

    const defaultMedicines = [
      { id: "m1", name: "Paracetamol 650mg (Dolo)", dosage: "650mg", category: "Painkillers", price: 30.00, mrp: 38.00, discount: 20, availability: "In Stock", stockCount: 5000, minOrder: 10, requiresColdChain: false },
      { id: "m2", name: "Azithromycin 500mg", dosage: "500mg", category: "Antibiotics", price: 120.00, mrp: 150.00, discount: 20, availability: "In Stock", stockCount: 2000, minOrder: 5, requiresColdChain: false },
      { id: "m3", name: "Metformin 500mg", dosage: "500mg", category: "Diabetes", price: 35.00, mrp: 45.00, discount: 22, availability: "In Stock", stockCount: 3000, minOrder: 10, requiresColdChain: false },
      { id: "m4", name: "Insulin Glargine 100 IU/ml", dosage: "100 IU/ml", category: "Diabetes", price: 560.00, mrp: 680.00, discount: 18, availability: "In Stock", stockCount: 500, minOrder: 2, requiresColdChain: true },
      { id: "m5", name: "Amoxicillin 250mg", dosage: "250mg", category: "Antibiotics", price: 85.00, mrp: 110.00, discount: 23, availability: "In Stock", stockCount: 1500, minOrder: 10, requiresColdChain: false },
      { id: "m6", name: "Pantoprazole 40mg", dosage: "40mg", category: "Gastro", price: 40.00, mrp: 52.00, discount: 23, availability: "In Stock", stockCount: 4000, minOrder: 10, requiresColdChain: false },
      { id: "m7", name: "Cetirizine 10mg", dosage: "10mg", category: "Allergy", price: 25.00, mrp: 35.00, discount: 28, availability: "In Stock", stockCount: 6000, minOrder: 10, requiresColdChain: false }
    ];

    const existingIdx = dealers.findIndex((d: any) => d.name.toLowerCase() === dealerName.toLowerCase());
    if (existingIdx === -1) {
      const newDealer = {
        id: `dealer-${Date.now()}`,
        name: dealerName,
        legalName: `${dealerName} Wholesale Distributors Pvt Ltd (GSTIN: 27AAAAA9901A1Z5)`,
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
      };
      dealers = [newDealer, ...dealers];
      localStorage.setItem("registered_dealers", JSON.stringify(dealers));
    } else {
      if (!dealers[existingIdx].medicines || dealers[existingIdx].medicines.length === 0) {
        dealers[existingIdx].medicines = defaultMedicines;
        localStorage.setItem("registered_dealers", JSON.stringify(dealers));
      }
    }
  } catch (e) {}
}

function getStoredSession() {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    const session = JSON.parse(stored);
    if (session.expiresAt && session.expiresAt <= Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem("ligimed_user");
      return null;
    }
    return session;
  } catch (e) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class PageErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("LigiMed Page Render Error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white p-8 rounded-2xl border border-red-200 shadow-sm max-w-lg mx-auto text-center space-y-4 my-12">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Page Render Notice</h3>
            <p className="text-xs text-gray-500 mt-1">{this.state.error?.message || "An unexpected display issue occurred."}</p>
          </div>
          <Button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 rounded-xl gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload Page</span>
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(getStoredSession()?.user || localStorage.getItem("ligimed_user"));
  });
  const [showKYC, setShowKYC] = useState(false);
  const [userType, setUserType] = useState<UserType>(() => {
    const saved = localStorage.getItem("ligimed_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.role || "pharmacy";
      } catch (e) {}
    }
    return "pharmacy";
  });
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    const saved = localStorage.getItem("ligimed_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.role === "dealer" ? "dealer-dashboard" : parsed.role === "admin" ? "admin-dashboard" : parsed.role === "pharmacist" ? "orders" : "dashboard";
      } catch (e) {}
    }
    return "dashboard";
  });
  const [userProfile, setUserProfile] = useState<any>(() => {
    const session = getStoredSession();
    const saved = session?.user ? JSON.stringify(session.user) : localStorage.getItem("ligimed_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });

  // Restore authenticated user session on mount
  useEffect(() => {
    const session = getStoredSession();
    const savedUser = session?.user ? JSON.stringify(session.user) : localStorage.getItem("ligimed_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUserProfile(parsed);
        const role = parsed.role || "pharmacy";
        setUserType(role);
        setCurrentPage(role === "dealer" ? "dealer-dashboard" : role === "admin" ? "admin-dashboard" : role === "pharmacist" ? "orders" : "dashboard");
        setIsAuthenticated(true);
        syncDealerToMarketplace(parsed);
      } catch (e) {}
    }
  }, []);

  const handleLogin = (type: UserType, userData?: any, token?: string) => {
    const roleType = type || "pharmacy";
    setUserType(roleType);
    if (userData) {
      const fullUserData = { ...userData, role: roleType };
      setUserProfile(fullUserData);
      localStorage.setItem("ligimed_user", JSON.stringify(fullUserData));
      syncDealerToMarketplace(fullUserData);
      if (token) {
        let expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          if (payload.exp) expiresAt = payload.exp * 1000;
        } catch (e) {}
        localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user: fullUserData, expiresAt }));
      }
    }
    setIsAuthenticated(true);
    setShowKYC(false);
    setCurrentPage(roleType === "dealer" ? "dealer-dashboard" : roleType === "admin" ? "admin-dashboard" : roleType === "pharmacist" ? "orders" : "dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("ligimed_user");
    localStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
    setUserProfile(null);
    setUserType("pharmacy");
    setCurrentPage("dashboard");
  };

  const handleStartKYC = () => {
    setShowKYC(true);
  };

  const handleKYCComplete = async (type: "pharmacy" | "dealer", registrationData: { name: string; email: string; company_name: string; phone: string; password: string }) => {
    const response = await registerUser({ ...registrationData, role: type });
    if (response.success) {
      handleLogin(type, response.user, response.token);
    }
  };

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
  };

  // If not authenticated, show login or KYC
  if (!isAuthenticated) {
    if (showKYC) {
      return (
        <KYCOnboarding 
          onComplete={handleKYCComplete}
          onBack={() => setShowKYC(false)}
        />
      );
    }
    return (
      <LoginScreen 
        onLogin={handleLogin}
        onStartKYC={handleStartKYC}
      />
    );
  }

  // Render the appropriate page based on currentPage and userType
  const renderPage = () => {
    // Pharmacy pages
    if (userType === "pharmacy") {
      switch (currentPage) {
        case "dashboard":
          return <PharmacyDashboard />;
        case "marketplace":
          return <MarketplaceScreen />;
        case "orders":
          return <PharmacyOrdersScreen />;
        case "billing":
          return <BillingScreen />;
        case "inventory":
          return <InventoryScreen />;
        case "tracking":
          return <TrackingScreen />;
        case "reverse":
          return <ReverseLogistics />;
        case "kyc":
          return <KYCCompliance />;
        case "bnpl":
          return <BNPLDashboard />;
        default:
          return <PharmacyDashboard />;
      }
    }
    
    // Dealer / Distributor pages
    if (userType === "dealer") {
      switch (currentPage) {
        case "dealer-dashboard":
          return <DealerDashboard activeTab="dealer-dashboard" />;
        case "orders":
          return <DealerDashboard activeTab="orders" />;
        case "inventory-upload":
          return <DealerDashboard activeTab="inventory-upload" />;
        case "analytics":
          return <DealerDashboard activeTab="analytics" />;
        case "tracking":
          return <TrackingScreen />;
        default:
          return <DealerDashboard activeTab="dealer-dashboard" />;
      }
    }

    // Pharmacist Quality Inspection pages
    if (userType === "pharmacist") {
      switch (currentPage) {
        case "orders":
        case "pharmacist-verification":
          return <PharmacistVerificationModal
            onClose={() => setCurrentPage("orders")}
            onComplete={() => setCurrentPage("orders")}
          />;
        case "inventory":
          return <InventoryScreen />;
        case "tracking":
          return <TrackingScreen />;
        case "kyc":
          return <KYCCompliance />;
        default:
          return <PharmacyOrdersScreen />;
      }
    }
    
    // Admin pages
    if (userType === "admin") {
      switch (currentPage) {
        case "admin-dashboard":
          return <AdminDashboard />;
        case "pharmacies":
        case "dealers":
        case "analytics":
          return <AdminDashboard />;
        default:
          return <AdminDashboard />;
      }
    }

    return <PharmacyDashboard />;
  };

  const getPageTitle = () => {
    const pageTitles: { [key: string]: string } = {
      dashboard: "Dashboard",
      marketplace: "Medicine Marketplace",
      billing: "Smart Billing",
      inventory: "Inventory Management",
      tracking: "Logistics Tracking",
      reverse: "Reverse Logistics",
      kyc: "KYC & Compliance",
      bnpl: "Payments & BNPL",
      "dealer-dashboard": "Wholesale Dealer Dashboard",
      orders: "Pharmacy Orders",
      "inventory-upload": "Inventory & Bulk SKU Import",
      analytics: "Sales & Revenue Analytics",
      "admin-dashboard": "Admin Control Center",
    };
    return pageTitles[currentPage] || "Dashboard";
  };

  const getPageSubtitle = () => {
    const pageSubtitles: { [key: string]: string } = {
      dashboard: "Overview of your pharmacy operations",
      marketplace: "Browse and order medicines from verified dealers",
      billing: "Generate invoices and manage customer bills",
      inventory: "AI-powered inventory tracking and forecasting",
      tracking: "Real-time shipment tracking",
      reverse: "Return expired or damaged medicines",
      kyc: "Manage documents and compliance",
      bnpl: "Manage credit and payment schedules",
      "dealer-dashboard": "Manage wholesale catalog, bulk SKUs, and incoming pharmacy orders",
      orders: "Incoming orders from retail pharmacies",
      "inventory-upload": "Manage product catalog and bulk CSV SKU imports",
      analytics: "Revenue, GMV, and order analytics",
      "admin-dashboard": "Platform management, compliance, and metrics",
    };
    return pageSubtitles[currentPage];
  };

  const displayName = userProfile?.pharmacyName || userProfile?.companyName || userProfile?.company_name || userProfile?.name || "Registered User";

  return (
    <div className="flex h-screen bg-[#F5F7FA]">
      {/* Sidebar */}
      <Sidebar 
        userType={userType!} 
        activePage={currentPage}
        onNavigate={handleNavigate}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header 
          title={getPageTitle()}
          subtitle={getPageSubtitle()}
          showSearch={currentPage === "marketplace"}
          userName={displayName}
          notificationCount={3}
          onLogout={handleLogout}
        />

        {/* Page Content wrapped in Error Boundary */}
        <main className="flex-1 overflow-y-auto p-6">
          <PageErrorBoundary>
            {renderPage()}
          </PageErrorBoundary>
        </main>
      </div>
    </div>
  );
}
