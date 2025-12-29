import { MainLayout } from "@/components/layout/MainLayout";

const HelpCenter = () => {
  return (
    <MainLayout>
      <section className="relative gradient-hero text-primary-foreground overflow-hidden py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Help Center</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            We’re here to help you navigate the Heritage Energy Marketplace with ease.
          </p>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="prose prose-lg max-w-none space-y-12">
            <section id="buyers" className="space-y-4">
              <h2>Buyers’ Guide</h2>
            <h3>1. How to Search for Products</h3>
            <ol>
              <li>Use the Search Bar on the homepage.</li>
              <li>Enter the product name (e.g., “H₂S Scavenger”, “Industrial Pump”, “Gate Valve”).</li>
              <li>You will see a list of verified sellers that offer the product along with their: Location, Product specifications, Price range (if provided), Contact information.</li>
            </ol>

            <h3>2. How to Contact Sellers</h3>
            <p>
              Each product page shows the seller’s phone number, email address and company profile. Contact them directly for negotiation, inquiries, or bulk purchase.
            </p>

            <h3>3. How to Verify a Seller</h3>
            <p>
              All sellers on the platform pass through CAC/RC verification, document checks and review/approval by the admin team to ensure verified businesses.
            </p>

              <h3>4. How to Report a Seller</h3>
              <p>
                If you encounter suspicious activity: go to the seller’s profile, click “Report Seller” and submit your complaint. Our compliance team will investigate and respond within 24–48 hours.
              </p>
            </section>

            <hr className="border-primary-foreground/10" />

            <section id="sellers" className="space-y-4">
              <h2>Sellers’ Guide</h2>
            <h3>1. How to Become a Seller</h3>
            <p>To register your company, provide:</p>
            <ul>
              <li>Company name, RC/CAC number, Company Address, Email address, Phone number, Company Contact Person</li>
              <li>Business Line (Chemicals, Equipment, Tools, Safety Items, etc.)</li>
              <li>Product Categories (with specifications) and Live photos of products (no Google images)</li>
              <li>Required documents: CAC Certificate, TIN, Proof of Address</li>
            </ul>

            <h3>2. Subscription Packages</h3>
            <p>To list products, sellers must subscribe to one of the plans:</p>
            <ul>
              <li><strong>Basic Plan</strong> – ₦5,000/month — Upload up to 5 products</li>
              <li><strong>Standard Plan</strong> – ₦7,500/month — Upload up to 10 products</li>
              <li><strong>Premium Plan</strong> – ₦12,000/month — Upload up to 20 products</li>
            </ul>

            <h3>3. Uploading Products</h3>
            <ol>
              <li>Log in to your Seller Dashboard</li>
              <li>Click “Add Product” and upload live photos only</li>
              <li>Add product name, specifications, applications, state location, availability status, price (optional) and submit for verification</li>
            </ol>

              <h3>4. Managing Your Store</h3>
              <p>From the dashboard sellers can edit products, update pricing, add categories, view subscription status, upgrade plans and access support.</p>
            </section>

            <section className="space-y-4">
              <h2>Exhibitions & Hot Deals</h2>
              <p>Monthly Live Exhibition (Every Last Friday) — sellers showcase products with short live videos, demos, special deals and discounts. Buyers can watch, ask questions and order instantly.</p>
            </section>

            <section className="space-y-4">
              <h2>Logistics Support</h2>
              <p>We connect buyers and sellers to third‑party logistics for nationwide delivery, heavy equipment transport and safety‑compliant movement. Request support via the Help Desk.</p>
            </section>

            <section className="space-y-4">
              <h2>Account & Technical Support</h2>
              <h3>I forgot my password</h3>
              <p>Click “Forgot Password” → Enter email → Reset link will be sent.</p>

              <h3>I cannot upload documents</h3>
              <p>Make sure files are JPG, PNG, or PDF and under the file size limit. If issue persists, contact support.</p>

              <h3>Website is not loading properly</h3>
              <p>Try clearing browser cache, restarting device, or using Chrome/Safari.</p>
            </section>

            <section className="space-y-4">
              <h2>Contact Support</h2>
              <p>
                Support Email: <a href="mailto:support@heritageenergy.com">support@heritageenergy.com</a><br />
                Phone: +234 (---) --- ----
              </p>
            </section>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default HelpCenter;
