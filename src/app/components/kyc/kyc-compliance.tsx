import { useState, useEffect } from "react";
import { Shield, FileText, CheckCircle, AlertTriangle, Upload, Download, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { StatusBadge } from "../ui/status-badge";
import { Progress } from "../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

export function KYCCompliance() {
  const documents = [
    {
      id: 1,
      name: "Drug License",
      type: "Drug License",
      number: "DL-KA-2024-12345",
      uploadDate: "2024-01-15",
      expiryDate: "2025-12-31",
      status: "Verified",
      daysUntilExpiry: 400,
    },
    {
      id: 2,
      name: "GST Certificate",
      type: "GST",
      number: "29ABCDE1234F1Z5",
      uploadDate: "2024-01-15",
      expiryDate: "N/A",
      status: "Verified",
      daysUntilExpiry: null,
    },
    {
      id: 3,
      name: "PAN Card",
      type: "PAN",
      number: "ABCDE1234F",
      uploadDate: "2024-01-15",
      expiryDate: "N/A",
      status: "Verified",
      daysUntilExpiry: null,
    },
    {
      id: 4,
      name: "Trade License",
      type: "Trade License",
      number: "TL-2024-6789",
      uploadDate: "2024-05-20",
      expiryDate: "2024-12-15",
      status: "Expiring Soon",
      daysUntilExpiry: 18,
    },
  ];

  const complianceScore = 85;

  return (
    <div className="space-y-6">
      {/* Compliance Score Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-[#1A73E8]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#1A73E8]" />
              Compliance Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-end gap-4">
                <div className="text-5xl font-bold text-[#1A73E8]">{complianceScore}%</div>
                <div className="mb-2">
                  <p className="text-sm text-muted-foreground">Overall Compliance Rating</p>
                  <StatusBadge status="Good Standing" variant="success" />
                </div>
              </div>
              <Progress value={complianceScore} className="h-3" />
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Documents</p>
                  <p className="text-2xl font-semibold">4/4</p>
                  <p className="text-xs text-green-600">All verified</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expiring Soon</p>
                  <p className="text-2xl font-semibold">1</p>
                  <p className="text-xs text-amber-600">Needs renewal</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-sm font-medium">Nov 25, 2024</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full gap-2" variant="outline">
              <Upload className="w-4 h-4" />
              Upload Document
            </Button>
            <Button className="w-full gap-2" variant="outline">
              <RefreshCw className="w-4 h-4" />
              Renew License
            </Button>
            <Button className="w-full gap-2" variant="outline">
              <Download className="w-4 h-4" />
              Download Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-900 mb-1">Document Expiring Soon</p>
                <p className="text-sm text-amber-800">
                  Your Trade License will expire in 18 days. Please renew it to avoid
                  service disruption.
                </p>
                <Button size="sm" className="mt-3" variant="default">
                  Renew Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-900 mb-1">All Documents Verified</p>
                <p className="text-sm text-green-800">
                  Great! Your Drug License, GST, and PAN documents are verified and up to date.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents Management */}
      <Card>
        <CardHeader>
          <CardTitle>Document Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Documents</TabsTrigger>
              <TabsTrigger value="verified">Verified</TabsTrigger>
              <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-6">
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        doc.status === "Verified" 
                          ? "bg-green-100" 
                          : "bg-amber-100"
                      }`}>
                        <FileText className={`w-6 h-6 ${
                          doc.status === "Verified" 
                            ? "text-green-600" 
                            : "text-amber-600"
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-muted-foreground">{doc.number}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">
                            Uploaded: {doc.uploadDate}
                          </span>
                          {doc.expiryDate !== "N/A" && (
                            <>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className={`text-xs ${
                                doc.daysUntilExpiry && doc.daysUntilExpiry < 60
                                  ? "text-amber-600"
                                  : "text-muted-foreground"
                              }`}>
                                Expires: {doc.expiryDate}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge 
                        status={doc.status}
                        variant={doc.status === "Verified" ? "success" : "warning"}
                      />
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* GST Auto-Fill */}
      <Card>
        <CardHeader>
          <CardTitle>GST Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">GST Number</p>
              <p className="font-medium">29ABCDE1234F1Z5</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <StatusBadge status="Active" variant="success" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Legal Name</p>
              <p className="font-medium">MediCare Pharmacy Private Limited</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Trade Name</p>
              <p className="font-medium">MediCare Pharmacy</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Registration Date</p>
              <p className="font-medium">January 15, 2024</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">State</p>
              <p className="font-medium">Karnataka</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Principal Place of Business</p>
            <p className="font-medium">123, MG Road, Bangalore - 560001, Karnataka</p>
          </div>
          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh GST Data
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Download Certificate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* PAN Verification */}
      <Card>
        <CardHeader>
          <CardTitle>PAN Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">PAN Number</p>
              <p className="font-medium">ABCDE1234F</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <StatusBadge status="Verified" variant="success" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name on PAN</p>
              <p className="font-medium">MEDICARE PHARMACY PVT LTD</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Verification Date</p>
              <p className="font-medium">January 15, 2024</p>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">PAN Details Verified</p>
                <p className="text-sm text-green-800">
                  PAN information has been verified with Income Tax Department records.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                date: "Nov 25, 2024",
                action: "All documents reviewed",
                status: "Completed",
              },
              {
                date: "Oct 15, 2024",
                action: "Drug License renewed",
                status: "Completed",
              },
              {
                date: "Sep 05, 2024",
                action: "Quarterly compliance check",
                status: "Completed",
              },
              {
                date: "May 20, 2024",
                action: "Trade License uploaded",
                status: "Completed",
              },
            ].map((item, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  {index < 3 && <div className="w-0.5 h-8 bg-green-500" />}
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium">{item.action}</p>
                  <p className="text-sm text-muted-foreground">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
