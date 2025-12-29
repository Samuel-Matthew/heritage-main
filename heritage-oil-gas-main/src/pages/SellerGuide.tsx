import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BookOpen, UserPlus, CreditCard, Upload, Search, Video, 
  FileText, Building, Mail, Phone, User, MapPin, Image, 
  CheckCircle, ArrowRight, HelpCircle
} from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  {
    number: 1,
    title: "Create Your Seller Account",
    icon: UserPlus,
    description: "To begin selling, each company must create an official storefront. You will be required to upload mandatory documents.",
  },
  {
    number: 2,
    title: "Choose a Subscription Plan",
    icon: CreditCard,
    description: "To upload products, sellers must subscribe to one of the available plans. You can upgrade your plan at any time.",
  },
  {
    number: 3,
    title: "Add Your Products",
    icon: Upload,
    description: "Once your store is approved, upload real product photos with complete specifications and pricing.",
  },
  {
    number: 4,
    title: "Get Discovered by Buyers",
    icon: Search,
    description: "Your products will appear in search results, filters, Hot Deals, Wholesale Market, and Monthly Exhibition.",
  },
  {
    number: 5,
    title: "Join Monthly Exhibition",
    icon: Video,
    description: "Participate in live video showcases, time-limited deals, flash sales, and new product announcements.",
  },
];

const mandatoryDocs = [
  { icon: FileText, name: "CAC Certificate / RC Number" },
  { icon: Building, name: "Company Address (Head Office)" },
  { icon: Mail, name: "Valid Email Address" },
  { icon: Phone, name: "Phone Number" },
  { icon: User, name: "Name of Contact Person" },
  { icon: FileText, name: "Business Line (Chemicals, Equipment, Tools, etc.)" },
  { icon: FileText, name: "Product Line (With specifications)" },
  { icon: MapPin, name: "State(s) of Operation" },
  { icon: Image, name: "Live product images ONLY" },
];

const responsibilities = [
  "Ensure all product information is accurate",
  "Maintain quality and transparency",
  "Upload ONLY real product images",
  "Respond to client inquiries promptly",
  "Update inventory when necessary",
];

export default function SellerGuide() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary to-secondary py-16">
        <div className="container">
          <div className="text-center text-primary-foreground">
            <div className="flex items-center justify-center gap-2 mb-4">
              <BookOpen className="w-10 h-10 text-secondary" />
              <h1 className="text-4xl md:text-5xl font-heading font-bold">Seller Guide</h1>
            </div>
            <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-2">
              How to Register, List Products & Grow Your Sales
            </p>
            <p className="text-primary-foreground/70">
              Everything you need to know as a verified seller on Heritage Energy
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container max-w-5xl">
          {/* Steps Overview */}
          <div className="mb-12">
            <h2 className="text-2xl font-heading font-semibold mb-6 text-center">Getting Started in 5 Steps</h2>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div 
                  key={step.number} 
                  className="flex items-start gap-4 p-6 bg-card rounded-xl border hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-foreground font-bold">{step.number}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <step.icon className="w-5 h-5 text-secondary" />
                      <h3 className="font-heading font-semibold">{step.title}</h3>
                    </div>
                    <p className="text-muted-foreground text-sm">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className="w-5 h-5 text-muted-foreground hidden md:block" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1 Details */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">1</span>
                Mandatory Company Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                After submission, your application undergoes admin review before approval.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {mandatoryDocs.map((doc) => (
                  <div key={doc.name} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <doc.icon className="w-4 h-4 text-secondary" />
                    <span className="text-sm">{doc.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Step 2 Details - Pricing Table */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">2</span>
                Subscription Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Monthly Fee</TableHead>
                    <TableHead>Product Slots</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      <Badge variant="outline">Starter</Badge>
                    </TableCell>
                    <TableCell>₦5,000</TableCell>
                    <TableCell>5 products</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      <Badge variant="secondary">Standard</Badge>
                    </TableCell>
                    <TableCell>₦7,500</TableCell>
                    <TableCell>10 products</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      <Badge>Premium</Badge>
                    </TableCell>
                    <TableCell>₦12,000</TableCell>
                    <TableCell>20 products</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Step 3 Details */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">3</span>
                Product Upload Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {[
                  "Upload real product photos (no downloaded images)",
                  "Add product name and category",
                  "Include full technical specifications",
                  "Add available quantity",
                  "Set wholesale availability (optional)",
                  "Add product state location",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Seller Responsibilities */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Seller Responsibilities</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {responsibilities.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-secondary mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-8 border">
            <HelpCircle className="w-12 h-12 text-secondary mx-auto mb-4" />
            <h3 className="text-xl font-heading font-semibold mb-2">Need Help?</h3>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Our support team is available to guide you through setup, product uploads, and subscription issues.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg">
                <Link to="/seller/register">Start Selling Now</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/pricing">View Pricing Plans</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
