import { MainLayout } from "@/components/layout/MainLayout";
import { Shield, Database, Lock, Eye, Cookie, Clock, UserCheck, Mail } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <MainLayout>
  {/* Hero Section */}
  <section className="relative gradient-hero text-primary-foreground overflow-hidden py-16">
        <div className="container mx-auto px-4 text-center">
          <Shield className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Heritage Energy Procurement Platform
          </p>
          <p className="text-white/70 mt-2">Last Updated: December 2025</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-muted-foreground mb-8">
              Heritage Energy ("we," "us," "our") operates an online procurement marketplace designed for the oil, gas, and industrial sectors. This Privacy Policy explains how we collect, use, disclose, and protect your information when you access our website.
            </p>
            <p className="text-lg font-semibold text-heriglob-chocolate mb-8">
              By using the platform, you agree to the practices described in this policy.
            </p>

            {/* Section 1 */}
            <div className="bg-card rounded-xl p-8 mb-8 border">
              <div className="flex items-center gap-3 mb-6">
                <Database className="w-8 h-8 text-heriglob-orange" />
                <h2 className="text-2xl font-bold text-foreground m-0">1. Information We Collect</h2>
              </div>

              <h3 className="text-xl font-semibold text-foreground mb-4">A. Information Provided by Sellers</h3>
              <p className="text-muted-foreground mb-4">When registering a seller account, we collect:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-6">
                <li>Company Name</li>
                <li>RC or CAC Number</li>
                <li>Company Address</li>
                <li>Email Address</li>
                <li>Official Phone Number</li>
                <li>Name of Company Contact Person</li>
                <li>Business Line (e.g., chemicals, equipment, services)</li>
                <li>Product Line (including specifications)</li>
                <li>State(s) of operation</li>
                <li>Real product images</li>
                <li>Certificates and uploaded documents</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-4">B. Information Provided by Buyers</h3>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-6">
                <li>Name (if provided)</li>
                <li>Email address (optional)</li>
                <li>Searches and browsing preferences</li>
                <li>Contact messages sent to sellers</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-4">C. Automatically Collected Information</h3>
              <p className="text-muted-foreground mb-4">We collect:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                <li>IP address</li>
                <li>Browser type</li>
                <li>Device information</li>
                <li>Pages visited</li>
                <li>Cookies and session data</li>
                <li>Search history on the platform</li>
              </ul>
              <p className="text-muted-foreground italic">
                This helps us improve user experience and maintain platform security.
              </p>
            </div>

            {/* Section 2 */}
            <div className="bg-card rounded-xl p-8 mb-8 border">
              <div className="flex items-center gap-3 mb-6">
                <Eye className="w-8 h-8 text-heriglob-orange" />
                <h2 className="text-2xl font-bold text-foreground m-0">2. How We Use Your Information</h2>
              </div>
              <p className="text-muted-foreground mb-4">We use the collected information to:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Verify sellers and their uploaded documents</li>
                <li>Approve or decline storefronts</li>
                <li>Display seller profiles to buyers</li>
                <li>Connect buyers directly to sellers</li>
                <li>Enhance search results and product visibility</li>
                <li>Process subscriptions and payments</li>
                <li>Improve user interface and platform performance</li>
                <li>Prevent fraud, ensure safety, and enforce compliance</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="bg-card rounded-xl p-8 mb-8 border">
              <div className="flex items-center gap-3 mb-6">
                <Lock className="w-8 h-8 text-heriglob-orange" />
                <h2 className="text-2xl font-bold text-foreground m-0">3. How We Share Your Information</h2>
              </div>

              <h3 className="text-xl font-semibold text-foreground mb-4">A. Shared with Buyers</h3>
              <p className="text-muted-foreground mb-4">Once approved, seller information such as:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                <li>Company name</li>
                <li>Company address</li>
                <li>Product images and specifications</li>
                <li>Business line</li>
                <li>Contact email and phone number</li>
              </ul>
              <p className="text-muted-foreground mb-6">will be publicly displayed so buyers can contact sellers directly.</p>

              <h3 className="text-xl font-semibold text-foreground mb-4">B. Shared with Service Providers</h3>
              <p className="text-muted-foreground mb-4">We may share non-sensitive data with:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                <li>Payment processors</li>
                <li>Hosting providers</li>
                <li>Security monitoring tools</li>
              </ul>
              <p className="text-muted-foreground mb-6">They are required to protect your data.</p>

              <h3 className="text-xl font-semibold text-foreground mb-4">C. Legal and Compliance</h3>
              <p className="text-muted-foreground mb-4">We may disclose information if:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Required by law</li>
                <li>Necessary to protect the platform from fraud</li>
                <li>Needed to enforce our Terms of Service</li>
              </ul>
            </div>

            {/* Section 4 */}
            <div className="bg-card rounded-xl p-8 mb-8 border">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-8 h-8 text-heriglob-orange" />
                <h2 className="text-2xl font-bold text-foreground m-0">4. Data Security</h2>
              </div>
              <p className="text-muted-foreground mb-4">We implement measures to protect your data from:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                <li>Unauthorized access</li>
                <li>Loss</li>
                <li>Misuse</li>
                <li>Modification</li>
              </ul>
              <p className="text-muted-foreground font-semibold">
                However, no online platform guarantees 100% security.
              </p>
            </div>

            {/* Section 5 */}
            <div className="bg-card rounded-xl p-8 mb-8 border">
              <div className="flex items-center gap-3 mb-6">
                <UserCheck className="w-8 h-8 text-heriglob-orange" />
                <h2 className="text-2xl font-bold text-foreground m-0">5. Seller Responsibilities</h2>
              </div>
              <p className="text-muted-foreground mb-4">Sellers must ensure that:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                <li>All uploaded documents are accurate</li>
                <li>Product images are REAL, not downloaded or AI-generated</li>
                <li>Information remains updated</li>
              </ul>
              <p className="text-destructive font-semibold">
                False information may result in account suspension.
              </p>
            </div>

            {/* Section 6 */}
            <div className="bg-card rounded-xl p-8 mb-8 border">
              <div className="flex items-center gap-3 mb-6">
                <Cookie className="w-8 h-8 text-heriglob-orange" />
                <h2 className="text-2xl font-bold text-foreground m-0">6. Cookies & Tracking</h2>
              </div>
              <p className="text-muted-foreground mb-4">We use cookies to:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                <li>Enhance user experience</li>
                <li>Save search preferences</li>
                <li>Track platform analytics</li>
              </ul>
              <p className="text-muted-foreground">
                Users may disable cookies, but some features may not function properly.
              </p>
            </div>

            {/* Section 7 */}
            <div className="bg-card rounded-xl p-8 mb-8 border">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-8 h-8 text-heriglob-orange" />
                <h2 className="text-2xl font-bold text-foreground m-0">7. Data Retention</h2>
              </div>
              <p className="text-muted-foreground">
                We retain your information as long as your account is active or as required by law.
              </p>
            </div>

            {/* Section 8 */}
            <div className="bg-card rounded-xl p-8 mb-8 border">
              <div className="flex items-center gap-3 mb-6">
                <UserCheck className="w-8 h-8 text-heriglob-orange" />
                <h2 className="text-2xl font-bold text-foreground m-0">8. Your Rights</h2>
              </div>
              <p className="text-muted-foreground mb-4">You may:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Request access to your data</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion (subject to regulatory and business requirements)</li>
              </ul>
            </div>

            {/* Section 9 */}
            <div className="bg-card rounded-xl p-8 border">
              <div className="flex items-center gap-3 mb-6">
                <Mail className="w-8 h-8 text-heriglob-orange" />
                <h2 className="text-2xl font-bold text-foreground m-0">9. Contact Us</h2>
              </div>
              <p className="text-muted-foreground mb-4">For questions or complaints:</p>
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

export default PrivacyPolicy;
