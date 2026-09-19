import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { Pill, Building2, Mail, Lock, User, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { loginUser, registerUser } from "../../services/api";

interface LoginScreenProps {
  onLogin: (userType: "pharmacy" | "dealer" | "admin" | "pharmacist", userData?: any, token?: string) => void;
  onStartKYC: () => void;
}

export function LoginScreen({ onLogin, onStartKYC }: LoginScreenProps) {
  const [userType, setUserType] = useState<"pharmacy" | "dealer" | "pharmacist">("pharmacy");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const roleLabel = userType === "pharmacy" ? "Pharmacy" : userType === "dealer" ? "Dealer" : "Pharmacist";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (!emailInput || !emailInput.includes("@")) {
      setErrorMessage("Please enter a valid Gmail / Email address.");
      return;
    }

    if (!passwordInput || passwordInput.length < 4) {
      setErrorMessage("Please enter your password (minimum 4 characters).");
      return;
    }

    setIsLoading(true);

    try {
      if (authMode === "signin") {
        const res = await loginUser({
          email: emailInput,
          password: passwordInput,
          role: userType
        });
        setIsLoading(false);

        if (res.success && res.user) {
          const userWithSelectedRole = { ...res.user, role: userType };
          localStorage.setItem("ligimed_user", JSON.stringify(userWithSelectedRole));
          if (emailInput) localStorage.setItem("last_registered_email", emailInput.trim());
          onLogin(userType, userWithSelectedRole, res.token);
        } else {
          setErrorMessage(res.message || "Invalid email or password. Please try again.");
        }
      } else {
        // Sign Up Mode
        const fullName = nameInput.trim() || emailInput.split("@")[0].toUpperCase();
        const res = await registerUser({
          name: fullName,
          email: emailInput,
          password: passwordInput,
          role: userType,
          company_name: `${fullName} ${userType === 'dealer' ? 'Distributors' : userType === 'pharmacist' ? 'Pharma Verification' : 'Pharma'}`
        });
        setIsLoading(false);

        if (res.success && res.user) {
          const userWithSelectedRole = { ...res.user, role: userType };
          localStorage.setItem("ligimed_user", JSON.stringify(userWithSelectedRole));
          if (emailInput) localStorage.setItem("last_registered_email", emailInput.trim());
          setStatusMessage("Account created successfully! Logging you in...");
          setTimeout(() => {
            onLogin(userType, userWithSelectedRole, res.token);
          }, 400);
        } else {
          setErrorMessage(res.message || "Registration failed. Please check details and try again.");
        }
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage("Connection error. Please check your backend service.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white mb-2 shadow-xl border-2 border-white/20">
            <Pill className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">LigiMed</h1>
          <p className="text-sm text-blue-200 font-medium">AI-Powered B2B Healthcare & Pharmacy Ecosystem</p>
        </div>

        {/* Success Alert Banner */}
        {statusMessage && (
          <div className="bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-300 p-3.5 rounded-2xl flex items-center gap-2 shadow-lg backdrop-blur-md animate-fadeIn text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{statusMessage}</span>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="bg-red-500/15 border border-red-500/40 text-red-200 p-3.5 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-md rounded-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-bold text-gray-900">
              {authMode === "signin" ? "Sign In to Your Account" : "Create New B2B Account"}
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              {userType === "pharmacy" 
                ? "Pharmacy Portal - Browse inventory, place B2B orders & manage bills" 
                : userType === "pharmacist"
                ? "Licensed Pharmacist - Quality inspection, batch verification & seal checks"
                : "Wholesale Dealer - Manage catalog, inventory & bulk pharmacy orders"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-5">
            {/* Role Selection Tabs */}
            <Tabs value={userType} onValueChange={(v) => setUserType(v as "pharmacy" | "dealer" | "pharmacist")}>
              <TabsList className="grid w-full grid-cols-3 h-11 p-1 bg-slate-100 rounded-xl">
                <TabsTrigger value="pharmacy" className="gap-1.5 text-xs font-bold rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white px-2">
                  <Pill className="w-3.5 h-3.5" />
                  Pharmacy
                </TabsTrigger>
                <TabsTrigger value="dealer" className="gap-1.5 text-xs font-bold rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white px-2">
                  <Building2 className="w-3.5 h-3.5" />
                  Wholesale
                </TabsTrigger>
                <TabsTrigger value="pharmacist" className="gap-1.5 text-xs font-bold rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white px-2">
                  <User className="w-3.5 h-3.5" />
                  Pharmacist
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Auth Mode Toggle (Sign In / Sign Up) */}
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => { setAuthMode("signin"); setErrorMessage(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  authMode === "signin"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode("signup"); setErrorMessage(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  authMode === "signup"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {authMode === "signup" && (
                <div className="space-y-1">
                  <Label htmlFor="fullName" className="text-xs font-bold text-gray-700">
                    {userType === "pharmacy" ? "Pharmacy / Business Name" : "Wholesale Business Name"}
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder={userType === "pharmacy" ? "e.g. Apollo Meds Ltd" : "e.g. Metro Pharma Wholesalers"}
                      className="h-11 text-xs pl-10 bg-gray-50 border-gray-200 font-medium"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="contactEmail" className="text-xs font-bold text-gray-700">Gmail / Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="name@gmail.com"
                    className="h-11 text-xs pl-10 bg-gray-50 border-gray-200 font-medium"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <Label htmlFor="contactPassword" className="text-xs font-bold text-gray-700">Password</Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="contactPassword"
                    type="password"
                    placeholder="Enter password"
                    className="h-11 text-xs pl-10 bg-gray-50 border-gray-200 font-medium"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md gap-2 mt-2"
              >
                <span>
                  {isLoading
                    ? authMode === "signin" ? "Signing In..." : "Creating Account..."
                    : authMode === "signin"
                      ? `Sign In as ${roleLabel}`
                      : `Create ${roleLabel} Account`
                  }
                </span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            {/* KYC Sign Up Optional Link */}
            <div className="text-center pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Need Full Onboarding?{" "}
                <button 
                  type="button"
                  onClick={onStartKYC}
                  className="text-blue-600 font-bold hover:underline"
                >
                  Register with GST & Drug License →
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer info */}
        <div className="text-center text-[11px] text-gray-400 space-y-1">
          <p>🔒 Form 20 & 21 Verified B2B Pharma Network</p>
        </div>
      </div>
    </div>
  );
}
