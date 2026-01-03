import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";

// Create axios instance with CSRF support
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  withCredentials: true,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json",
  },
});

// Add CSRF token interceptor
apiClient.interceptors.request.use((config) => {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("XSRF-TOKEN="))
    ?.split("=")[1];

  if (token) {
    config.headers["X-XSRF-TOKEN"] = decodeURIComponent(token);
  }

  return config;
});

const nigerianStates = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

const businessLines = [
  { id: "chemicals", label: "Chemicals" },
  { id: "equipment", label: "Equipment" },
  { id: "services", label: "Services" },
];

interface UploadedFile {
  name: string;
  uploaded: boolean;
}

const SellerRegister = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBusinessLines, setSelectedBusinessLines] = useState<string[]>(
    []
  );
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [mandatoryDocs, setMandatoryDocs] = useState<
    Record<string, UploadedFile>
  >({});
  const [optionalDocs, setOptionalDocs] = useState<
    Record<string, UploadedFile>
  >({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [userEmail, setUserEmail] = useState("");

  // Form data for Step 1
  const [formStep1, setFormStep1] = useState({
    company_name: "",
    rc_number: "",
    phone: "",
    email: "",
    address: "",
    contact_person: "",
  });

  // Form data for Step 2
  const [formStep2, setFormStep2] = useState({
    product_line: "",
  });

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiClient.get("/api/user");
        setIsAuthenticated(true);
        setUserEmail(response.data.user.email);
      } catch (error) {
        setIsAuthenticated(false);
        toast.error("You must be logged in to create a seller account");
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const toggleBusinessLine = (id: string) => {
    setSelectedBusinessLines((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const toggleState = (state: string) => {
    setSelectedStates((prev) =>
      prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state]
    );
  };

  const handleFileUpload = (
    docId: string,
    isOptional: boolean,
    file?: File
  ) => {
    // Handle file input change
    if (file) {
      const setter = isOptional ? setOptionalDocs : setMandatoryDocs;
      setter((prev) => ({
        ...prev,
        [docId]: { name: file.name, uploaded: true },
      }));
      setUploadedFiles((prev) => ({
        ...prev,
        [docId]: file,
      }));
    }
  };

  const mandatoryDocuments = [
    {
      id: "cac_certificate",
      label: "CAC Certificate",
      desc: "Business registration certificate",
    },
    {
      id: "company_logo",
      label: "Company Logo",
      desc: "Square format, min 500x500px",
    },
    {
      id: "live_photos",
      label: "Live Business Photos",
      desc: "Real photos only - no Google images allowed",
    },
  ];

  const optionalDocuments = [
    {
      id: "tin_certificate",
      label: "TIN Certificate",
      desc: "Tax Identification Number",
    },
    {
      id: "tax_clearance",
      label: "Tax Clearance Certificate",
      desc: "Current tax clearance",
    },
    {
      id: "dpr_nuprc",
      label: "DPR/NUPRC Certifications",
      desc: "Regulatory certifications",
    },
    {
      id: "import_license",
      label: "Importation License",
      desc: "If relevant to your business",
    },
    {
      id: "ncdmb",
      label: "Local Content Verification (NCDMB)",
      desc: "Nigerian Content certification",
    },
    {
      id: "oem_partner",
      label: "OEM Partner Certifications",
      desc: "Original Equipment Manufacturer partnerships",
    },
    {
      id: "hse_cert",
      label: "HSE Certifications",
      desc: "Health, Safety & Environment - required for safety equipment",
    },
  ];

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      const formData = new FormData();

      // Step 1 data
      formData.append("company_name", formStep1.company_name);
      formData.append("rc_number", formStep1.rc_number);
      formData.append("phone", formStep1.phone);
      formData.append("email", formStep1.email);
      formData.append("address", formStep1.address);
      formData.append("contact_person", formStep1.contact_person);

      // Step 2 data
      formData.append("product_line", formStep2.product_line);
      selectedBusinessLines.forEach((line) =>
        formData.append("business_lines[]", line)
      );
      selectedStates.forEach((state) => formData.append("states[]", state));

      // Step 3 data - uploaded files
      Object.entries(uploadedFiles).forEach(([docId, file]) => {
        formData.append(docId, file);
      });

      // Debug logging - show all formData entries
      // console.log("FormData entries:");
      for (let [key, value] of formData.entries()) {
        // console.log(
        //   `${key}:`,
        //   value instanceof File
        //     ? `File: ${value.name} (${value.size} bytes)`
        //     : value
        // );
      }

      const response = await apiClient.post("/api/seller/register", formData, {
        withCredentials: true,
      });

      toast.success("Application submitted successfully!");
      setTimeout(() => {
        navigate("/seller/registration-success", {
          state: { storeId: response.data.store_id },
        });
      }, 2000);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Failed to submit application";
      const errors = error?.response?.data?.errors;

      // console.error("Registration Error Full Response:", error?.response?.data);
      // console.error("Registration Error:", {
      //   status: error?.response?.status,
      //   data: error?.response?.data,
      //   errors,
      // });

      toast.error(errorMessage);

      if (errors) {
        Object.entries(errors).forEach(([field, messages]: any) => {
          const fieldMessages = Array.isArray(messages)
            ? messages.join(", ")
            : messages;
          toast.error(`${field}: ${fieldMessages}`);
          // console.error(`${field}:`, messages);
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      {isLoadingAuth ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-lg">Loading...</p>
          </div>
        </div>
      ) : !isAuthenticated ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-2xl font-bold mb-2">Login Required</h2>
            <p className="text-muted-foreground mb-4">
              You must be logged in as a buyer to create a seller account.
            </p>
            <Link to="/login">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="gradient-hero text-primary-foreground py-12">
            <div className="container">
              <Badge variant="secondary" className="mb-4">
                Seller Registration
              </Badge>
              <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">
                Become a Verified Seller
              </h1>
              <p className="text-primary-foreground/80">
                Complete all steps to list your products on Heriglob
              </p>
            </div>
          </div>{" "}
          <div className="container py-8">
            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 md:gap-4 mb-8 overflow-x-auto pb-2">
              {[
                { num: 1, label: "Company Info" },
                { num: 2, label: "Business Details" },
                { num: 3, label: "Documents" },
                { num: 4, label: "Review" },
              ].map((s, i) => (
                <div key={s.num} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                        step >= s.num
                          ? "gradient-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step > s.num ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        s.num
                      )}
                    </div>
                    <span
                      className={`text-xs mt-1 hidden md:block ${
                        step >= s.num
                          ? "text-primary font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < 3 && (
                    <div
                      className={`w-8 md:w-16 h-1 mx-1 md:mx-2 ${
                        step > s.num ? "bg-secondary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            <Card className="max-w-3xl mx-auto">
              <CardHeader>
                <CardTitle>
                  {step === 1 && "Company Information"}
                  {step === 2 && "Business Details"}
                  {step === 3 && "Document Upload"}
                  {step === 4 && "Review & Submit"}
                </CardTitle>
                <CardDescription>
                  {step === 1 && "Enter your company's basic information"}
                  {step === 2 && "Tell us about your business operations"}
                  {step === 3 && "Upload required verification documents"}
                  {step === 4 && "Review your information before submitting"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Step 1: Company Information */}
                {step === 1 && (
                  <form
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setStep(2);
                    }}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="companyName">
                        Company Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="companyName"
                        placeholder="Enter your registered company name"
                        required
                        value={formStep1.company_name}
                        onChange={(e) =>
                          setFormStep1({
                            ...formStep1,
                            company_name: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="rcNumber">
                          RC / CAC Number{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="rcNumber"
                          placeholder="e.g., RC 123456"
                          required
                          value={formStep1.rc_number}
                          onChange={(e) =>
                            setFormStep1({
                              ...formStep1,
                              rc_number: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">
                          Phone Number{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+234 800 000 0000"
                          required
                          value={formStep1.phone}
                          onChange={(e) =>
                            setFormStep1({
                              ...formStep1,
                              phone: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">
                        Company Address{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="address"
                        placeholder="Full registered business address"
                        required
                        value={formStep1.address}
                        onChange={(e) =>
                          setFormStep1({
                            ...formStep1,
                            address: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Business Email Address{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="info@yourcompany.com"
                        required
                        value={formStep1.email}
                        onChange={(e) =>
                          setFormStep1({ ...formStep1, email: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactPerson">
                        Name of Company Contact Person{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="contactPerson"
                        placeholder="Full name of contact person"
                        required
                        value={formStep1.contact_person}
                        onChange={(e) =>
                          setFormStep1({
                            ...formStep1,
                            contact_person: e.target.value,
                          })
                        }
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                )}

                {/* Step 2: Business Details */}
                {step === 2 && (
                  <form
                    className="space-y-6"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setStep(3);
                    }}
                  >
                    {/* Business Line */}
                    <div className="space-y-3">
                      <Label>
                        Business Line{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Select all that apply
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        {businessLines.map((line) => (
                          <button
                            key={line.id}
                            type="button"
                            onClick={() => toggleBusinessLine(line.id)}
                            className={`p-4 rounded-xl border-2 text-center transition-all ${
                              selectedBusinessLines.includes(line.id)
                                ? "border-primary bg-accent text-primary font-medium"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            {line.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Product Line */}
                    <div className="space-y-2">
                      <Label htmlFor="productLine">
                        Product Line <span className="text-destructive">*</span>
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        List all chemicals, equipment, or services you offer
                      </p>
                      <Textarea
                        id="productLine"
                        placeholder="e.g., Drilling fluids, Mud chemicals, Completion fluids, Production chemicals, Corrosion inhibitors..."
                        className="min-h-[100px]"
                        required
                        value={formStep2.product_line}
                        onChange={(e) =>
                          setFormStep2({
                            ...formStep2,
                            product_line: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* States of Operation */}
                    <div className="space-y-3">
                      <Label>
                        States of Operation{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Select all states where you operate
                      </p>
                      <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {nigerianStates.map((state) => (
                            <div
                              key={state}
                              className="flex items-center gap-2"
                            >
                              <Checkbox
                                id={state}
                                checked={selectedStates.includes(state)}
                                onCheckedChange={() => toggleState(state)}
                              />
                              <Label
                                htmlFor={state}
                                className="text-sm cursor-pointer"
                              >
                                {state}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      {selectedStates.length > 0 && (
                        <p className="text-sm text-primary">
                          {selectedStates.length} state(s) selected
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(1)}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                      </Button>
                      <Button type="submit" className="flex-1">
                        Continue <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </form>
                )}

                {/* Step 3: Document Upload */}
                {step === 3 && (
                  <div className="space-y-6">
                    {/* Mandatory Documents */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="w-5 h-5 text-destructive" />
                        <h3 className="font-semibold">Mandatory Documents</h3>
                      </div>
                      <div className="space-y-3">
                        {mandatoryDocuments.map((doc) => (
                          <div key={doc.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-medium flex items-center gap-2">
                                  {doc.label}
                                  <span className="text-destructive">*</span>
                                  {mandatoryDocs[doc.id]?.uploaded && (
                                    <FileCheck className="w-4 h-4 text-success" />
                                  )}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {doc.desc}
                                </p>
                              </div>
                              <label>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file)
                                      handleFileUpload(doc.id, false, file);
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant={
                                    mandatoryDocs[doc.id]?.uploaded
                                      ? "outline"
                                      : "secondary"
                                  }
                                  size="sm"
                                  asChild
                                >
                                  <span>
                                    <Upload className="w-4 h-4 mr-2" />
                                    {mandatoryDocs[doc.id]?.uploaded
                                      ? "Replace"
                                      : "Upload"}
                                  </span>
                                </Button>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Optional Documents */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-success" />
                        <h3 className="font-semibold">Optional Documents</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Upload these to increase your trust & verification rank
                      </p>
                      <div className="space-y-3">
                        {optionalDocuments.map((doc) => (
                          <div key={doc.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-medium flex items-center gap-2">
                                  {doc.label}
                                  {optionalDocs[doc.id]?.uploaded && (
                                    <FileCheck className="w-4 h-4 text-success" />
                                  )}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {doc.desc}
                                </p>
                              </div>
                              <label>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file)
                                      handleFileUpload(doc.id, true, file);
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  asChild
                                >
                                  <span>
                                    <Upload className="w-4 h-4 mr-2" />
                                    {optionalDocs[doc.id]?.uploaded
                                      ? "Replace"
                                      : "Upload"}
                                  </span>
                                </Button>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                      <strong>Note:</strong> All documents must be in JPG, PNG,
                      or PDF format. Maximum file size is 5MB per document. Only
                      upload real, live photos of your business - Google images
                      are not allowed.
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setStep(2)}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => {
                          // Validate mandatory docs
                          const hasMandatory = mandatoryDocuments.every(
                            (doc) => mandatoryDocs[doc.id]?.uploaded
                          );
                          if (!hasMandatory) {
                            toast.error(
                              "Please upload all mandatory documents"
                            );
                            return;
                          }
                          setStep(4);
                        }}
                      >
                        Continue <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 4: Review & Submit */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div className="p-6 rounded-xl bg-accent/50 text-center">
                      <CheckCircle className="w-16 h-16 mx-auto text-success mb-4" />
                      <h3 className="font-heading font-semibold text-xl">
                        Ready to Submit!
                      </h3>
                      <p className="text-muted-foreground mt-2">
                        Your application will be reviewed by our team within
                        24-48 hours. You'll receive an email notification once
                        your store is approved.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">What happens next?</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                        <li>
                          Our team will verify your documents and business
                          information
                        </li>
                        <li>You'll receive an email with approval status</li>
                        <li>
                          Once approved, you can purchase a subscription plan
                        </li>
                        <li>
                          Start listing your products and reach buyers across
                          Nigeria
                        </li>
                      </ol>
                    </div>

                    <div className="flex items-start gap-2">
                      <Checkbox id="terms" required />
                      <Label
                        htmlFor="terms"
                        className="text-sm leading-relaxed"
                      >
                        I confirm that all information provided is accurate and
                        I agree to the{" "}
                        <Link
                          to="/terms"
                          className="text-primary hover:underline"
                        >
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link
                          to="/seller-agreement"
                          className="text-primary hover:underline"
                        >
                          Seller Agreement
                        </Link>
                      </Label>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setStep(3)}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                      </Button>
                      <Button
                        className="flex-1"
                        variant="hero"
                        disabled={isSubmitting}
                        onClick={handleSubmit}
                      >
                        {isSubmitting ? "Submitting..." : "Submit Application"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Help Section */}
            <div className="max-w-3xl mx-auto mt-8 text-center">
              <p className="text-muted-foreground">
                Need help with registration?{" "}
                <Link
                  to="/help/seller"
                  className="text-primary hover:underline"
                >
                  View our seller guide
                </Link>{" "}
                or{" "}
                <Link to="/contact" className="text-primary hover:underline">
                  contact support
                </Link>
              </p>
            </div>
          </div>
        </>
      )}
    </MainLayout>
  );
};

export default SellerRegister;
