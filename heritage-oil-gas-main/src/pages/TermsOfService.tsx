import { MainLayout } from "@/components/layout/MainLayout";
import { FileText, Target, UserCheck, CreditCard, ShieldCheck, ShoppingCart, AlertTriangle, Calendar, XCircle, AlertOctagon, RefreshCw, Mail } from "lucide-react";

const TermsOfService = () => {
  return (
    <MainLayout>
  {/* Hero Section */}
  <section className="relative gradient-hero text-primary-foreground overflow-hidden py-16">
        <div className="container mx-auto px-4 text-center">
          <FileText className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Heritage Energy Procurement Platform
          </p>
          <p className="text-white/70 mt-2">Last Updated: December 2024</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-muted-foreground mb-8">
              These Terms of Service describe the rules and obligations for using the Heritage Energy Procurement Platform ("we," "us," "the platform").
            </p>
            <p className="text-lg font-semibold text-heriglob-chocolate mb-8">
              By registering or browsing the website, you agree to the following terms.
            </p>

            {/* Section 1 */}
            <div className="bg-card rounded-xl p-8 mb-8 border">
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-8 h-8 text-heriglob-orange" />
                <h2 className="text-2xl font-bold text-foreground m-0">1. Platform Purpose</h2>
              </div>
              <p className="text-muted-foreground mb-4">Heritage Energy provides an online marketplace where:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                <li>Sellers list oil & gas products</li>
                <li>Buyers search, compare, and contact sellers directly</li>
                <li>Sellers upload real product content</li>
                <li>Monthly live exhibitions are hosted on the platform</li>
              </ul>
              <p className="text-muted-foreground font-semibold">
                We serve as a facilitator, not the manufacturer, owner, or guarantor of listed products.
              </p>
            </div>

            {/* Section 2 */}
            <div className="bg-card rounded-xl p-8 mb-8 border">
              <div className="flex items-center gap-3 mb-6">
                <UserCheck className="w-8 h-8 text-heriglob-orange" />
                <h2 className="text-2xl font-bold text-foreground m-0">2. Eligibility</h2>
              </div>
              <p className="text-muted-foreground mb-4">To use the platform, you must:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Be at least 18 years old</li>
                <li>Register a legitimate company with CAC/RC number (for sellers)</li>
                <li>Agree to provide accurate information</li>
                <li>Abide by Nigerian commerce and trade laws</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="bg-card rounded-xl p-8 mb-8 border">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-8 h-8 text-heriglob-orange" />
                <h2 className="text-2xl font-bold text-foreground m-0">3. Seller Registration</h2>
              </div>
              <p className="text-muted-foreground mb-4">Sellers must provide:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                <li>CAC certificate</li>
                <li>RC/CAC number</li>
                <li>Company address</li>
                <li>Contact person details</li>
                <li>Business line & product categories</li>
                <li>Real product images</li>
                <li>Full technical specifications</li>
                <li>Any required company documents</li>
              </ul>
              <p className="text-muted-foreground font-semibold">
                Sellers agree that all submitted information is accurate and authentic.
              </p>
            </div>

            {/* Section 4 */}
            <div className="bg-card rounded-xl p-8 mb-8 border">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-8 h-8 text-heriglob-orange" />
                <h2 className="text-2xl font-bold text-foreground m-0">4. Subscription & Payment</h2>
              </div>
              <p className="text-muted-foreground mb-4">To upload products, sellers must subscribe to a monthly plan:</p>
              
              <div className="overflow-x-auto mb-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border p-3 text-left font-semibold">Plan</th>
                      <th className="border border-border p-3 text-left font-semibold">Monthly Fee</th>
                      <th className="border border-border p-3 text-left font-semibold">Product Slots</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-border p-3">5 Products</td>
                      <td className="border border-border p-3">₦5,000</td>
                      <td className="border border-border p-3">5 products</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">10 Products</td>
                      <td className="border border-border p-3">₦7,500</td>
                      <td className="border border-border p-3">10 products</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">20 Products</td>
                      <td className="border border-border p-3">₦12,000</td>
                      <td className="border border-border p-3">20 products</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-muted-foreground mb-4 font-semibold">Payments are non-refundable once the subscription period starts.</p>
              <p className="text-muted-foreground mb-2">Failure to renew may result in:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Product removal</li>
                <li>Store invisibility</li>
                <li>Account suspension</li>
              </ul>
            </div>

            {/* Section 5 */}
            <div className="bg-card rounded-xl p-8 mb-8 border">
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck className="w-8 h-8 text-heriglob-orange" />
                <h2 className="text-2xl font-bold text-foreground m-0">5. Seller Obligations</h2>
              </div>
              <p className="text-muted-foreground mb-4">Sellers must:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-6">
                <li>Upload only real photographs of products</li>
                <li>Provide accurate specifications</li>
                <li>Update product availability</li>
                <li>Maintain professional communication with buyers</li>
                <li>Avoid fraudulent or misleading practices</li>
              </ul>
              <p className="text-muted-foreground mb-2">Violations may lead to:</p>
              <ul className="list-disc pl-6 space-y-2 text-destructive font-semibold">
                <li>Store suspension</li>
                <li>Permanent account ban</li>
                <li>Reporting to authorities</li>
              </ul>
            </div>

            {/* Section 6 */}
            <div className="bg-card rounded-xl p-8 mb-8 border">
              <div className="flex items-center gap-3 mb-6">
                <ShoppingCart className="w-8 h-8 text-heriglob-orange" />
                <h2 className="text-2xl font-bold text-foreground m-0">6. Buyer Responsibilities</h2>
              </div>
              <p className="text-muted-foreground mb-4">Buyers:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                <li>Must verify product suitability before purchase</li>
                <li>Must communicate clearly with sellers</li>
                <li>Are responsible for negotiation, procurement, and payment terms</li>
              </ul>
              <p className="text-muted-foreground font-semibold">
                The platform does NOT intervene in pricing or payments.
              </p>
            </div>

            {/* Section 7 */}
            <div className="bg-card rounded-xl p-8 mb-8 border">
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="w-8 h-8 text-heriglob-orange" />
                <h2 className="text-2xl font-bold text-foreground m-0">7. Heriglob's Role & Limitations</h2>
              </div>
              <p className="text-muted-foreground mb-4">We:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                <li>Provide the digital space for buyers and sellers</li>
                <li>Verify documents before approving stores</li>
                <li>Do NOT guarantee product quality</li>
                <li>Are NOT responsible for delivery, logistics, or transactions</li>
                <li>Are NOT liable for disputes between buyers and sellers</li>
              </ul>
              <p className="text-muted-foreground font-semibold">
                All negotiations occur between buyer and seller directly.
              </p>
            </div>

            {/* Section 8 */}
            <div className="bg-card rounded-xl p-8 mb-8 border">
              <div className="flex items-center gap-3 mb-6">
                <XCircle className="w-8 h-8 text-heriglob-orange" />
                <h2 className="text-2xl font-bold text-foreground m-0">8. Prohibited Activities</h2>
              </div>
              <p className="text-muted-foreground mb-4">Users may NOT:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                <li>Upload fake documents</li>
                <li>Use AI-generated or downloaded images</li>
                <li>Post fraudulent products</li>
                <li>Misrepresent pricing</li>
                <li>Engage in scams</li>
                <li>Upload harmful content</li>
                <li>Attempt to hack or disrupt the platform</li>
              </ul>
              <p className="text-destructive font-semibold">
                Any violation will result in immediate account removal.
              </p>
            </div>

            {/* Section 9 */}
            <div className="bg-card rounded-xl p-8 mb-8 border">
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="w-8 h-8 text-heriglob-orange" />
                <h2 className="text-2xl font-bold text-foreground m-0">9. Monthly Exhibition Rules</h2>
              </div>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Sellers may participate in the last-Friday monthly live showcase</li>
                <li>Only approved stores can join</li>
                <li>Products displayed must be genuine</li>
                <li>Discounts and deals must be honoured</li>
              </ul>
            </div>

            {/* Section 10 */}
            <div className="bg-card rounded-xl p-8 mb-8 border">
              <div className="flex items-center gap-3 mb-6">
                <AlertOctagon className="w-8 h-8 text-heriglob-orange" />
                <h2 className="text-2xl font-bold text-foreground m-0">10. Termination</h2>
              </div>
              <p className="text-muted-foreground mb-4">We reserve the right to suspend or terminate accounts for:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Fraud</li>
                <li>Violation of terms</li>
                <li>Illegal activity</li>
                <li>Non-payment</li>
                <li>Misrepresentation</li>
              </ul>
            </div>

            {/* Section 11 */}
            <div className="bg-card rounded-xl p-8 mb-8 border">
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck className="w-8 h-8 text-heriglob-orange" />
                <h2 className="text-2xl font-bold text-foreground m-0">11. Limitation of Liability</h2>
              </div>
              <p className="text-muted-foreground mb-4">We are not responsible for:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                <li>Transaction failures</li>
                <li>Delivery issues</li>
                <li>Losses arising from seller–buyer disputes</li>
                <li>Damages resulting from product use</li>
              </ul>
              <p className="text-muted-foreground font-semibold">
                The platform is used at your own risk.
              </p>
            </div>

            {/* Section 12 */}
            <div className="bg-card rounded-xl p-8 mb-8 border">
              <div className="flex items-center gap-3 mb-6">
                <RefreshCw className="w-8 h-8 text-heriglob-orange" />
                <h2 className="text-2xl font-bold text-foreground m-0">12. Modifications</h2>
              </div>
              <p className="text-muted-foreground">
                We may update these terms periodically. Continued use of the platform signifies acceptance of new terms.
              </p>
            </div>

            {/* Section 13 */}
            <div className="bg-card rounded-xl p-8 border">
              <div className="flex items-center gap-3 mb-6">
                <Mail className="w-8 h-8 text-heriglob-orange" />
                <h2 className="text-2xl font-bold text-foreground m-0">13. Contact Information</h2>
              </div>
              <p className="text-muted-foreground mb-4">For support or inquiries:</p>
              <p className="text-foreground">
                <strong>Email:</strong> support@heriglob.com<br />
                <strong>Phone:</strong> +234 800 000 0000
              </p>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default TermsOfService;
