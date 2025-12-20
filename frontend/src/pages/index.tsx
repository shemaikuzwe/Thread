import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { MessageCircle, Video, Shield, Check, Zap, Globe } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <main className="px-6 pt-10 pb-20 lg:pt-32 lg:pb-32 relative overflow-hidden">
        {/* Background Gradient Blob */}
        {/* <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] -z-10" /> */}

        <div className="max-w-7xl mx-auto text-center space-y-8">
          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
              Connect with your team <br />
              <span className="">simpler, faster, better.</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Thread is the ultimate communication platform for modern teams.
              Chat, video call, and collaborate in one secure place.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              className="h-12 px-8 text-lg rounded-full"
              asChild
            >
              <Link to="/auth/register">Start for free</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 text-lg rounded-full"
              asChild
            >
              <Link to="/auth/login">Live Demo</Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Trusted By Section */}
      <section className="py-12 border-y bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-8">
            Trusted by innovative teams at
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Logo placeholders using text for reliability */}
            <div className="text-2xl font-bold flex items-center gap-2">
              <Globe className="w-6 h-6" /> GlobalTech
            </div>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Zap className="w-6 h-6" /> FlashSync
            </div>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6" /> SecureNet
            </div>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Video className="w-6 h-6" /> StreamLine
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-24 px-6 bg-background overflow-hidden relative"
      >
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold">
              Everything you need to collaborate
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to keep your team aligned and moving
              forward.
            </p>
          </div>

          {/* Feature 1: Chat */}
          <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-24">
            <div className="flex-1 space-y-6">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold">Real-time Chat</h3>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Instant messaging with rich text, file sharing, and thread
                support to keep conversations organized. Catch up on what you
                missed with intelligent history.
              </p>
              <ul className="space-y-3 pt-4">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-blue-500" />{" "}
                  <span>Rich text editor</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-blue-500" />{" "}
                  <span>File attachments</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-blue-500" />{" "}
                  <span>Emoji reactions</span>
                </li>
              </ul>
            </div>
            <div className="flex-1 relative group w-full">
              <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full opacity-30 group-hover:opacity-50 transition-opacity" />
              <img
                src="/chat_feature.png"
                alt="Chat Interface"
                className="relative rounded-2xl shadow-2xl border bg-background/50 backdrop-blur-sm w-full"
              />
            </div>
          </div>

          {/* Feature 2: Video */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-12 lg:gap-24">
            <div className="flex-1 space-y-6">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center">
                <Video className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-3xl font-bold">HD Video Calls</h3>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Crystal clear video conferencing for standups, client meetings,
                and quick syncs with your team. Share your screen and
                collaborate in real-time.
              </p>
              <ul className="space-y-3 pt-4">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-purple-500" />{" "}
                  <span>4K Video Quality</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-purple-500" />{" "}
                  <span>Screen Sharing</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-purple-500" />{" "}
                  <span>Noise Cancellation</span>
                </li>
              </ul>
            </div>
            <div className="flex-1 relative group w-full">
              <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full opacity-30 group-hover:opacity-50 transition-opacity" />
              <img
                src="/video_feature.png"
                alt="Video Interface"
                className="relative rounded-2xl shadow-2xl border bg-background/50 backdrop-blur-sm w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that's right for your team. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard
              title="Starter"
              price="$0"
              description="Perfect for individuals and small tests."
              features={[
                "Up to 5 members",
                "1GB Storage",
                "Unlimited History",
                "Community Support",
              ]}
            />
            <PricingCard
              title="Pro"
              price="$12"
              period="/mo"
              isPopular
              description="For growing teams that need more power."
              features={[
                "Unlimited members",
                "20GB Storage",
                "HD Video Calls",
                "Priority Support",
                "Guest Access",
              ]}
            />
            <PricingCard
              title="Enterprise"
              price="$49"
              period="/mo"
              description="Advanced control for large organizations."
              features={[
                "Unlimited Storage",
                "SSO & Audit Logs",
                "Dedicated Manager",
                "99.9% Uptime SLA",
                "Custom Contracts",
              ]}
            />
          </div>
        </div>
      </section>

      <footer className="py-12 px-6 border-t bg-background">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xl font-bold">Thread</div>
          <p className="text-sm text-muted-foreground">
            © 2025 Thread Inc. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary">
              Privacy
            </a>
            <a href="#" className="hover:text-primary">
              Terms
            </a>
            <a href="#" className="hover:text-primary">
              Twitter
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PricingCard({
  title,
  price,
  period = "",
  features,
  description,
  isPopular = false,
}: {
  title: string;
  price: string;
  period?: string;
  features: string[];
  description: string;
  isPopular?: boolean;
}) {
  return (
    <div
      className={`relative p-8 rounded-2xl border bg-card flex flex-col ${
        isPopular
          ? "border-blue-500 shadow-xl ring-1 ring-blue-500"
          : "hover:shadow-lg"
      } transition-all duration-300`}
    >
      {isPopular && (
        <span className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
          Most Popular
        </span>
      )}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold">{price}</span>
          <span className="text-muted-foreground">{period}</span>
        </div>
        <p className="text-muted-foreground mt-2 text-sm">{description}</p>
      </div>

      <ul className="space-y-4 mb-8 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3 text-sm">
            <Check className="w-4 h-4 text-green-500 shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        className={`w-full ${isPopular ? "" : "variant-outline"}`}
        variant={isPopular ? "default" : "outline"}
      >
        Choose {title}
      </Button>
    </div>
  );
}
