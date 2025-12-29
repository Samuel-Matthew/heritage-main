import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Fuel, Target, Eye, Heart, Shield, Lightbulb, Users, Search, Store, CheckCircle, Calendar, FileCheck } from "lucide-react";
import { Link } from "react-router-dom";

const values = [
  { icon: Shield, title: "Integrity", desc: "Only authentic suppliers and real product photos" },
  { icon: Lightbulb, title: "Innovation", desc: "A future-driven platform for smarter procurement" },
  { icon: CheckCircle, title: "Reliability", desc: "Verified documents, approved vendors, transparent listings" },
  { icon: Users, title: "Service", desc: "Connecting the industry with ease" },
];

const features = [
  { icon: Search, title: "Product Search Engine", desc: "Search engine for oil & gas products across categories" },
  { icon: Store, title: "Verified Storefronts", desc: "Companies create verified storefronts with real products" },
  { icon: Users, title: "Nationwide Network", desc: "Connect buyers to suppliers across 36 states + FCT" },
  { icon: FileCheck, title: "Document Verification", desc: "Quality assurance through thorough document verification" },
  { icon: Calendar, title: "Exhibition Friday", desc: "Monthly virtual live showcase events" },
  { icon: CheckCircle, title: "Transparent Pricing", desc: "Real product images and transparent pricing" },
];

export default function About() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary to-secondary py-20">
        <div className="container">
          <div className="text-center text-primary-foreground max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
                <Fuel className="w-10 h-10 text-secondary-foreground" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">About Heritage Energy</h1>
            <p className="text-xl text-primary-foreground/90 mb-2">
              A specialized digital procurement marketplace powering the oil & gas sector
            </p>
            <p className="text-primary-foreground/70">
              with transparency, reliability, and innovation.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            {/* Introduction */}
            <div className="bg-card rounded-2xl p-8 border mb-12">
              <h2 className="text-2xl font-heading font-semibold mb-4">Who We Are</h2>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Heritage Energy is Nigeria's leading online procurement marketplace dedicated exclusively to the oil, gas, marine, and industrial sectors.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We bridge the gap between buyers and verified suppliers, providing a unified platform where companies can showcase real products, upload specifications, and connect directly with clients across the nation. Our mission is to simplify complex procurement processes, promote genuine suppliers, and support the growth of the oil & gas ecosystem through technology.
              </p>
            </div>

            {/* What We Do */}
            <div className="mb-12">
              <h2 className="text-2xl font-heading font-semibold mb-6 text-center">What We Do</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.map((feature) => (
                  <Card key={feature.title} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-5">
                      <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center mb-3">
                        <feature.icon className="w-5 h-5 text-secondary" />
                      </div>
                      <h3 className="font-medium mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Our Values */}
            <div className="mb-12">
              <h2 className="text-2xl font-heading font-semibold mb-6 text-center">Our Values</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {values.map((value) => (
                  <div key={value.title} className="flex items-start gap-4 p-6 bg-muted/50 rounded-xl">
                    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                      <value.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold mb-1">{value.title}</h3>
                      <p className="text-sm text-muted-foreground">{value.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vision & Mission */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <Card className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Eye className="w-8 h-8" />
                    <h3 className="text-xl font-heading font-semibold">Our Vision</h3>
                  </div>
                  <p className="text-primary-foreground/90 leading-relaxed">
                    To become Africa's most trusted oil & gas procurement marketplace.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-secondary to-secondary/90 text-secondary-foreground">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="w-8 h-8" />
                    <h3 className="text-xl font-heading font-semibold">Our Mission</h3>
                  </div>
                  <p className="text-secondary-foreground/90 leading-relaxed">
                    To empower businesses with direct access to verified suppliers, fair pricing, and reliable procurement tools.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* CTA */}
            <div className="text-center bg-muted/50 rounded-2xl p-8">
              <h3 className="text-xl font-heading font-semibold mb-3">Ready to Join the Marketplace?</h3>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Whether you're looking to source products or become a verified seller, we're here to help you succeed.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg">
                  <Link to="/products">Browse Products</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/seller/register">Become a Seller</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
