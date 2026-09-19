import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { Upload, CheckCircle, Pill } from "lucide-react";

interface KYCOnboardingProps {
  onComplete: (userType: "pharmacy" | "dealer", registrationData: { name: string; email: string; company_name: string; phone: string; password: string }) => void;
  onBack: () => void;
}

export function KYCOnboarding({ onComplete, onBack }: KYCOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [userType, setUserType] = useState<"pharmacy" | "dealer">("pharmacy");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    address: "",
    drugLicense: null as File | null,
    gstNumber: "",
    panNumber: "",
  });

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const steps = [
    { number: 1, title: "Business Details", description: "Basic information about your business" },
    { number: 2, title: "Drug License", description: "Upload your drug license certificate" },
    { number: 3, title: "GST Verification", description: "Verify your GST registration" },
    { number: 4, title: "PAN Verification", description: "Verify your PAN details" },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, drugLicense: e.target.files[0] });
    }
  };

  const handleNext = () => {
    setErrorMessage(null);
    if (currentStep === 1 && (!formData.businessName.trim() || !formData.ownerName.trim() || !formData.email.trim() || !formData.phone.trim())) {
      setErrorMessage("Please complete all business, owner, email, and phone details.");
      return;
    }
    if (currentStep === 1 && !/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      setErrorMessage("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (currentStep === 1 && (password.length < 8 || password !== confirmPassword)) {
      setErrorMessage("Use a password of at least 8 characters and make sure both passwords match.");
      return;
    }
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(userType, {
        name: formData.ownerName || formData.businessName,
        email: formData.email,
        company_name: formData.businessName,
        phone: formData.phone,
        password
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EBF5FF] via-white to-[#E0F7F7] flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1A73E8] to-[#00A6A6] mb-4">
            <Pill className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl mb-2">KYC Onboarding</h1>
          <p className="text-muted-foreground">Complete your verification to get started</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {steps.map((step) => (
              <div 
                key={step.number}
                className={`flex items-center gap-2 ${
                  step.number === currentStep ? "text-primary" : 
                  step.number < currentStep ? "text-green-600" : 
                  "text-muted-foreground"
                }`}
              >
                {step.number < currentStep ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    step.number === currentStep ? "border-primary bg-primary text-white" : "border-muted"
                  }`}>
                    {step.number}
                  </div>
                )}
                <span className="hidden md:inline text-sm">{step.title}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
            <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {errorMessage && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="userType">Account Type</Label>
                    <select
                      id="userType"
                      value={userType}
                      onChange={(e) => setUserType(e.target.value as "pharmacy" | "dealer")}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="pharmacy">Pharmacy</option>
                      <option value="dealer">Dealer</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      placeholder="Enter business name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerName">Owner Name</Label>
                    <Input
                      id="ownerName"
                      value={formData.ownerName}
                      onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      placeholder="Enter owner name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="kycPassword">Create Password</Label>
                    <Input id="kycPassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kycConfirmPassword">Confirm Password</Label>
                    <Input id="kycConfirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Business Address</Label>
                  <textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter complete business address"
                    className="w-full p-2 border rounded-lg min-h-[80px]"
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="mb-2">Upload Drug License Certificate</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Supported formats: PDF, JPG, PNG (Max 5MB)
                  </p>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    id="drugLicense"
                  />
                  <label htmlFor="drugLicense">
                    <Button type="button" onClick={() => document.getElementById('drugLicense')?.click()}>
                      Select File
                    </Button>
                  </label>
                  {formData.drugLicense && (
                    <p className="mt-4 text-sm text-green-600 flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {formData.drugLicense.name} uploaded
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <Input
                    id="licenseNumber"
                    placeholder="Enter drug license number"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issueDate">Issue Date</Label>
                    <Input
                      id="issueDate"
                      type="date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      type="date"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gstNumber">GST Number</Label>
                  <Input
                    id="gstNumber"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    placeholder="Enter 15-digit GST number"
                    maxLength={15}
                  />
                </div>
                <Button type="button" variant="outline" className="w-full">
                  Auto-Fill via GST API
                </Button>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <h4>GST Details (Auto-filled)</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Legal Name</p>
                      <p>Will be auto-filled</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Trade Name</p>
                      <p>Will be auto-filled</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p>Will be auto-filled</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Registration Date</p>
                      <p>Will be auto-filled</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="panNumber">PAN Number</Label>
                  <Input
                    id="panNumber"
                    value={formData.panNumber}
                    onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                    placeholder="Enter 10-character PAN"
                    maxLength={10}
                  />
                </div>
                <Button type="button" variant="outline" className="w-full">
                  Verify PAN
                </Button>
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="text-green-900 mb-1">Verification Complete</h4>
                      <p className="text-sm text-green-700">
                        All your documents have been verified successfully. Click Submit to complete your registration.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-6 pt-6 border-t border-border">
              <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                Back
              </Button>
              <Button type="button" onClick={handleNext} className="flex-1">
                {currentStep === totalSteps ? "Submit & Complete" : "Continue"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
