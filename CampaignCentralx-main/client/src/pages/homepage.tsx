import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Globe,
  Smartphone,
  Zap,
  Star,
  ArrowRight,
  CheckCircle,
  Code,
  Palette,
  Rocket,
  Shield,
  Lock,
  ChevronRight,
  Monitor,
  Search,
  Users,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { setAuthToken } from "@/lib/auth";

export default function Homepage() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handlePasswordSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!password.trim()) {
      toast({
        title: "Password Required",
        description: "Please enter the access password",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const data = await response.json();
        setAuthToken(data.token);
        setLocation('/dashboard');
        setShowAdminModal(false);
        setPassword("");
        toast({
          title: "Access Granted",
          description: "Welcome to Campaign Manager",
        });
      } else {
        toast({
          title: "Access Denied",
          description: "Invalid password. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Unable to connect to server. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyrightClick = () => {
    setShowAdminModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Globe className="text-white h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-700 bg-clip-text text-transparent">
                Fallowl
              </h1>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#services" className="text-slate-600 hover:text-purple-600 transition-colors font-medium">Services</a>
              <a href="#portfolio" className="text-slate-600 hover:text-purple-600 transition-colors font-medium">Portfolio</a>
              <a href="#about" className="text-slate-600 hover:text-purple-600 transition-colors font-medium">About</a>
              <Button variant="outline" size="sm" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                Get Quote
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-8">
          <div className="space-y-6">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight">
              Build Stunning
              <br />
              <span className="bg-gradient-to-r from-purple-600 to-blue-700 bg-clip-text text-transparent">
                Websites
              </span>
              <br />
              That Convert
            </h1>
            <p className="text-xl sm:text-2xl text-slate-600 leading-relaxed max-w-4xl mx-auto">
              We create beautiful, fast, and conversion-optimized websites that help your business grow. 
              From concept to launch, we handle everything with expertise and creativity.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-700 hover:from-purple-700 hover:to-blue-800 text-white font-semibold px-12 py-4 text-lg">
              Start Your Project
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="border-purple-200 text-purple-600 hover:bg-purple-50 px-12 py-4 text-lg">
              View Our Work
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="pt-16">
            <p className="text-slate-500 text-sm uppercase tracking-wider mb-8 font-medium">Trusted by 500+ businesses worldwide</p>
            <div className="flex items-center justify-center space-x-12 opacity-60">
              <div className="w-32 h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                <span className="text-slate-400 font-semibold">TechCorp</span>
              </div>
              <div className="w-32 h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                <span className="text-slate-400 font-semibold">StartupXYZ</span>
              </div>
              <div className="w-32 h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                <span className="text-slate-400 font-semibold">GlobalInc</span>
              </div>
              <div className="w-32 h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                <span className="text-slate-400 font-semibold">Innovation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="bg-white/70 backdrop-blur-sm py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900">
              Our Services
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Everything you need to establish a powerful online presence and grow your business
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-white/90 border-slate-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                  <Palette className="text-white h-7 w-7" />
                </div>
                <CardTitle className="text-xl font-bold">Web Design</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-6">
                  Custom, responsive designs that reflect your brand and captivate your audience with stunning visuals.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center text-sm text-slate-600">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    Responsive Design
                  </li>
                  <li className="flex items-center text-sm text-slate-600">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    Brand Integration
                  </li>
                  <li className="flex items-center text-sm text-slate-600">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    User Experience Focus
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white/90 border-slate-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                  <Code className="text-white h-7 w-7" />
                </div>
                <CardTitle className="text-xl font-bold">Development</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-6">
                  Fast, secure, and scalable websites built with cutting-edge technologies and best practices.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center text-sm text-slate-600">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    Modern Frameworks
                  </li>
                  <li className="flex items-center text-sm text-slate-600">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    SEO Optimized
                  </li>
                  <li className="flex items-center text-sm text-slate-600">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    Lightning Fast Loading
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white/90 border-slate-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4">
                  <Rocket className="text-white h-7 w-7" />
                </div>
                <CardTitle className="text-xl font-bold">Launch & Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-6">
                  Complete launch process with ongoing support, maintenance, and optimization services.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center text-sm text-slate-600">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    Domain & Hosting Setup
                  </li>
                  <li className="flex items-center text-sm text-slate-600">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    SSL Security
                  </li>
                  <li className="flex items-center text-sm text-slate-600">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    24/7 Support
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900">
              Why Choose Fallowl?
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              We combine creativity with technology to deliver exceptional results that exceed expectations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-8 bg-white/70 rounded-2xl border border-slate-200/50 hover:shadow-lg transition-shadow">
              <Zap className="h-16 w-16 text-yellow-500 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Lightning Fast</h3>
              <p className="text-slate-600">Optimized for speed and peak performance on all devices</p>
            </div>

            <div className="text-center p-8 bg-white/70 rounded-2xl border border-slate-200/50 hover:shadow-lg transition-shadow">
              <Smartphone className="h-16 w-16 text-blue-500 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Mobile First</h3>
              <p className="text-slate-600">Perfect experience on every device and screen size</p>
            </div>

            <div className="text-center p-8 bg-white/70 rounded-2xl border border-slate-200/50 hover:shadow-lg transition-shadow">
              <Shield className="h-16 w-16 text-green-500 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Secure</h3>
              <p className="text-slate-600">Enterprise-grade security and data protection included</p>
            </div>

            <div className="text-center p-8 bg-white/70 rounded-2xl border border-slate-200/50 hover:shadow-lg transition-shadow">
              <Star className="h-16 w-16 text-purple-500 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">5-Star Support</h3>
              <p className="text-slate-600">Dedicated support team ready to help you succeed</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-700 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white">
              Ready to Start Your Project?
            </h2>
            <p className="text-xl text-purple-100 max-w-3xl mx-auto">
              Let's bring your vision to life with a website that drives results. Get a free consultation and quote today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
              <Button size="lg" variant="secondary" className="px-12 py-4 text-lg font-semibold">
                Get Free Quote
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600 px-12 py-4 text-lg">
                View Portfolio
              </Button>
            </div>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <Globe className="text-white h-5 w-5" />
                </div>
                <h3 className="text-2xl font-bold">Fallowl</h3>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Building exceptional websites that drive results for businesses worldwide. Your success is our mission.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-lg">Services</h4>
              <ul className="space-y-3 text-slate-400">
                <li className="hover:text-white transition-colors cursor-pointer">Web Design</li>
                <li className="hover:text-white transition-colors cursor-pointer">Development</li>
                <li className="hover:text-white transition-colors cursor-pointer">SEO Optimization</li>
                <li className="hover:text-white transition-colors cursor-pointer">Maintenance</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-lg">Company</h4>
              <ul className="space-y-3 text-slate-400">
                <li className="hover:text-white transition-colors cursor-pointer">About Us</li>
                <li className="hover:text-white transition-colors cursor-pointer">Portfolio</li>
                <li className="hover:text-white transition-colors cursor-pointer">Contact</li>
                <li className="hover:text-white transition-colors cursor-pointer">Blog</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-lg">Contact</h4>
              <div className="space-y-3 text-slate-400">
                <p className="hover:text-white transition-colors">hello@fallowl.com</p>
                <p className="hover:text-white transition-colors">+1 (555) 123-4567</p>
                <p className="hover:text-white transition-colors">San Francisco, CA</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-400">
            <p>
              <span 
                onClick={handleCopyrightClick}
                className="cursor-pointer hover:text-white transition-colors"
              >
                &copy; 2024
              </span> Fallowl. All rights reserved. Built with passion and precision.
            </p>
          </div>
        </div>
      </footer>

      {/* Hidden Admin Access Modal */}
      <Dialog open={showAdminModal} onOpenChange={setShowAdminModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Lock className="text-white h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-xl font-bold text-slate-900">
              Admin Access
            </DialogTitle>
            <p className="text-center text-slate-600 text-sm">
              Enter password to access campaign management dashboard
            </p>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-4">
            <div>
              <Input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-white border-slate-300"
                required
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <Button 
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAdminModal(false);
                  setPassword("");
                }}
                className="flex-1 h-12"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 h-12 bg-slate-800 hover:bg-slate-900 text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Authenticating..." : "Access Dashboard"}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}