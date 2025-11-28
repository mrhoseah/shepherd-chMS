
import os

content = r"""import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LandingNav } from "@/components/landing-nav";
import { getAppNameFromDB } from "@/lib/app-config-server";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Wallet,
  Calendar,
  HandHeart,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  Smartphone,
  Play,
  ShieldCheck,
  Globe2,
  Star,
  Check,
  Sparkles,
  Zap,
} from "lucide-react";

export default async function LandingPage() {
  const appName = await getAppNameFromDB();
  
  // Fetch subscription plans for pricing
  const plans = await prisma.subscriptionPlanTemplate.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-blue-100 text-slate-900">
      <LandingNav />

      {/* Hero Section - Clean Light Theme with Animated Gradients */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-100 mb-8 shadow-sm hover:bg-blue-100 transition-colors cursor-pointer">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
            New: Advanced Presentation Editor 2.0
            <ArrowRight className="ml-2 w-4 h-4" />
          </div>
          
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.1]">
            Ministry management <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              reimagined.
            </span>
          </h1>
          
          <p className="mt-6 text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-light">
            The all-in-one operating system for modern churches. 
            Streamline operations, engage your community, and focus on what matters most—<span className="text-slate-900 font-medium">people</span>.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/signin">
              <Button size="lg" className="text-lg px-8 py-6 h-auto rounded-full shadow-xl shadow-blue-600/20 bg-blue-600 hover:bg-blue-700 transition-all duration-300 hover:-translate-y-1">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto rounded-full border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all duration-300">
                <Play className="mr-2 w-5 h-5 fill-slate-700" />
                Watch Demo
              </Button>
            </Link>
          </div>

          {/* 3D Perspective Dashboard Mockup */}
          <div className="mt-20 relative mx-auto max-w-6xl perspective-1000">
            <div className="relative rounded-2xl bg-slate-900/5 p-2 ring-1 ring-slate-900/10 backdrop-blur-sm lg:rounded-3xl lg:p-4 shadow-2xl transform rotate-x-12 hover:rotate-x-0 transition-transform duration-1000 ease-out">
              <div className="rounded-xl bg-white shadow-2xl overflow-hidden aspect-[16/9] border border-slate-200 relative group">
                {/* Mockup Content Placeholder - In a real app, use an actual screenshot */}
                <div className="absolute inset-0 bg-slate-50 flex flex-col">
                  {/* Mock Header */}
                  <div className="h-12 border-b border-slate-200 bg-white flex items-center px-4 gap-4">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="h-6 w-64 bg-slate-100 rounded-md"></div>
                  </div>
                  {/* Mock Body */}
                  <div className="flex-1 flex">
                    <div className="w-64 border-r border-slate-200 bg-white p-4 space-y-4 hidden md:block">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="h-8 bg-slate-50 rounded-md w-full"></div>
                      ))}
                    </div>
                    <div className="flex-1 p-8 grid grid-cols-3 gap-6">
                      <div className="col-span-2 h-64 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="h-8 w-32 bg-slate-100 rounded mb-4"></div>
                        <div className="flex items-end gap-2 h-40">
                          {[40, 70, 45, 90, 60, 80, 50].map((h, i) => (
                            <div key={i} className="flex-1 bg-blue-500/10 rounded-t-md relative group/bar overflow-hidden">
                              <div style={{ height: `${h}%` }} className="absolute bottom-0 w-full bg-blue-500 rounded-t-md transition-all duration-500 group-hover/bar:bg-blue-600"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="h-64 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                         <div className="h-8 w-32 bg-slate-100 rounded mb-4"></div>
                         <div className="space-y-3">
                           {[1,2,3,4].map(i => (
                             <div key={i} className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-slate-100"></div>
                               <div className="flex-1 h-2 bg-slate-100 rounded"></div>
                             </div>
                           ))}
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Overlay Content */}
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/5 pointer-events-none">
                  <div className="text-center p-8 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 transform translate-y-8 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                    <LayoutDashboard className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                    <p className="text-slate-900 font-bold text-xl">Interactive Dashboard</p>
                    <p className="text-slate-500">Real-time insights at your fingertips</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Strip */}
      <div className="border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-center text-sm font-semibold text-slate-500 uppercase tracking-wider mb-8">Trusted by 500+ forward-thinking churches</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
             {/* Placeholder Logos */}
             {['ChurchOne', 'Grace Community', 'LifePoint', 'The Rock', 'City Church'].map((name, i) => (
               <div key={i} className="text-xl font-bold text-slate-400 flex items-center gap-2">
                 <div className="w-8 h-8 bg-slate-300 rounded-full"></div>
                 {name}
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Features Grid - Bento Style */}
      <section id="features" className="py-32 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <Badge variant="outline" className="mb-4 px-4 py-1 border-blue-200 bg-blue-50 text-blue-700">Features</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
              Everything you need to run your church.
            </h2>
            <p className="text-xl text-slate-600">
              A complete suite of tools designed to help your ministry thrive in the digital age.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(300px,auto)]">
            {/* People Management - Large Card */}
            <div className="md:col-span-2 bg-slate-50 rounded-[2rem] p-8 md:p-12 border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/50 rounded-full -mr-20 -mt-20 blur-3xl transition-transform group-hover:scale-110 duration-700" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm border border-slate-100">
                  <Users className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">People & Membership</h3>
                <p className="text-lg text-slate-600 max-w-md mb-8">
                  Go beyond simple lists. Track spiritual journeys, manage family relationships, and ensure no one falls through the cracks.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {['Family Grouping', 'Attendance Tracking', 'Custom Fields', 'Member Portal'].map((item, i) => (
                    <div key={i} className="flex items-center text-slate-700 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 mr-3" />
                      <span className="text-sm font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile App - Tall Card */}
            <div className="md:row-span-2 bg-slate-900 rounded-[2rem] p-8 md:p-12 text-white relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl" />
              
              <div className="relative z-10 h-full flex flex-col">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm border border-white/10">
                  <Smartphone className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Mobile First</h3>
                <p className="text-slate-300 mb-8">
                  Access everything from our powerful mobile app. Ministry doesn't happen behind a desk.
                </p>
                
                {/* Mobile Mockup */}
                <div className="mt-auto relative mx-auto w-full max-w-[240px]">
                  <div className="bg-slate-800 rounded-[2.5rem] p-3 border-4 border-slate-700 shadow-2xl transform group-hover:-translate-y-4 transition-transform duration-500">
                    <div className="bg-slate-900 rounded-[2rem] overflow-hidden aspect-[9/19] relative">
                      {/* App Header */}
                      <div className="h-14 bg-slate-800 flex items-center justify-between px-4">
                        <div className="w-4 h-4 rounded-full bg-slate-600"></div>
                        <div className="w-20 h-2 rounded-full bg-slate-700"></div>
                      </div>
                      {/* App Content */}
                      <div className="p-4 space-y-3">
                        <div className="h-24 bg-blue-600 rounded-xl w-full opacity-80"></div>
                        <div className="h-16 bg-slate-800 rounded-xl w-full"></div>
                        <div className="h-16 bg-slate-800 rounded-xl w-full"></div>
                        <div className="h-16 bg-slate-800 rounded-xl w-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Giving - Card */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 group hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-6 text-green-600 group-hover:scale-110 transition-transform">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Giving & Finance</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Secure online giving, recurring donations, and comprehensive financial reporting.
              </p>
            </div>

            {/* Events - Card */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 group hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-6 text-orange-600 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Events & Calendar</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Coordinate facility usage, manage event registrations, and sync calendars effortlessly.
              </p>
            </div>

            {/* Volunteers - Wide Card */}
            <div className="md:col-span-2 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-[2rem] p-8 md:p-12 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm">
                    <HandHeart className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Volunteer Management</h3>
                  <p className="text-violet-100 mb-6">
                    Schedule teams, manage availability, and send automated reminders. Keep your volunteers engaged and appreciated.
                  </p>
                  <Button variant="secondary" className="bg-white text-violet-600 hover:bg-violet-50 border-0">
                    Explore Scheduling
                  </Button>
                </div>
                
                {/* Mini Schedule Mockup */}
                <div className="flex-1 w-full max-w-xs bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/10 shadow-lg">
                  <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                    <span className="text-sm font-medium">Sunday Service</span>
                    <span className="text-xs bg-green-400/20 text-green-300 px-2 py-0.5 rounded-full">Confirmed</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: "John Doe", role: "Worship Leader", status: "accepted" },
                      { name: "Jane Smith", role: "Greeter", status: "pending" },
                      { name: "Mike Ross", role: "Audio", status: "accepted" }
                    ].map((person, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 bg-black/20 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-violet-400/30 flex items-center justify-center text-xs font-bold">
                          {person.name[0]}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{person.name}</div>
                          <div className="text-xs text-violet-200">{person.role}</div>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${person.status === 'accepted' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Presentation Feature Highlight */}
      <section className="py-24 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:flex items-center gap-16">
            <div className="lg:w-1/2 mb-12 lg:mb-0 order-2 lg:order-1">
              <div className="relative group cursor-pointer">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden aspect-video flex items-center justify-center">
                   <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-90 group-hover:scale-105 transition-transform duration-700" />
                   <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                   <div className="relative z-10 w-16 h-16 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                     <Play className="w-6 h-6 text-blue-600 fill-current ml-1" />
                   </div>
                </div>
              </div>
            </div>
            
            <div className="lg:w-1/2 order-1 lg:order-2">
              <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-orange-600 bg-orange-50 border border-orange-100 mb-6">
                <Zap className="w-4 h-4 mr-2" />
                New Feature
              </div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">
                Stunning Presentations, <br />
                <span className="text-blue-600">Zero Hassle.</span>
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Create beautiful slide decks for your sermons and announcements directly within {appName || "Shepherd"}. No need for external software.
              </p>
              <div className="space-y-6">
                {[
                  { title: "Drag & Drop Editor", desc: "Intuitive interface for quick slide creation." },
                  { title: "Cloud Sync", desc: "Access your presentations from any device." },
                  { title: "Live Mode", desc: "Present directly from the browser with presenter notes." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{item.title}</h4>
                      <p className="text-slate-600 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats / Trust Section */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-green-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Bank-Grade Security</h3>
              <p className="text-slate-600 text-sm">Your data is encrypted and protected with industry-leading security standards.</p>
            </div>
            <div className="p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                <Globe2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">99.9% Uptime</h3>
              <p className="text-slate-600 text-sm">Reliable infrastructure ensures your ministry tools are always available.</p>
            </div>
            <div className="p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-purple-600">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Premium Support</h3>
              <p className="text-slate-600 text-sm">Our dedicated team is here to help you succeed every step of the way.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <Badge variant="outline" className="mb-4 px-4 py-1 border-blue-200 bg-blue-50 text-blue-700">Pricing</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-slate-600">
              Choose the perfect plan for your church. All plans include a 14-day free trial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => {
              const isPopular = plan.isPopular;
              const monthlyPrice = Number(plan.monthlyPrice);
              const yearlyPrice = Number(plan.yearlyPrice);
              const features = Array.isArray(plan.features) ? plan.features : [];
              
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-3xl p-8 flex flex-col ${
                    isPopular
                      ? 'bg-white ring-2 ring-blue-600 shadow-2xl scale-105 z-10'
                      : 'bg-white border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white px-4 py-1.5 text-sm font-bold shadow-lg border-0">
                        <Sparkles className="w-3 h-3 mr-1" />
                        MOST POPULAR
                      </Badge>
                    </div>
                  )}

                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">
                      {plan.displayName}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-slate-900">
                        KES {monthlyPrice.toLocaleString()}
                      </span>
                      <span className="text-slate-500">/mo</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Billed annually as KES {yearlyPrice.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex-grow">
                    <div className="font-semibold text-sm uppercase tracking-wide text-slate-900 mb-4">
                      What's included:
                    </div>
                    <ul className="space-y-3 mb-8">
                      {features.slice(0, 8).map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className="w-5 h-5 flex-shrink-0 text-blue-600 mt-0.5" />
                          <span className="text-sm text-slate-600">
                            {String(feature)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link href="/auth/signin" className="mt-auto">
                    <Button
                      size="lg"
                      className={`w-full rounded-full py-6 text-lg font-semibold ${
                        isPopular
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      Start Free Trial
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Loved by church leaders
            </h2>
            <p className="text-xl text-slate-600">
              See what pastors and administrators are saying about {appName || "Shepherd"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Pastor David Kimani",
                role: "Senior Pastor",
                church: "Grace Community Church",
                text: "Shepherd has transformed how we manage our church. The member management and giving features have been game-changers.",
              },
              {
                name: "Rev. Sarah Wanjiku",
                role: "Administrator",
                church: "New Life Assembly",
                text: "The presentation editor is absolutely brilliant! We no longer need separate software for creating sermon slides.",
              },
              {
                name: "Pastor John Ochieng",
                role: "Lead Pastor",
                church: "Faith Center",
                text: "Best investment we've made for our ministry. The volunteer scheduling feature alone has saved us countless hours.",
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:border-blue-100 transition-colors"
              >
                <div className="flex items-center gap-1 mb-6">
                  {[1,2,3,4,5].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                <p className="text-slate-700 mb-6 leading-relaxed font-medium">
                  "{testimonial.text}"
                </p>
                
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{testimonial.name}</div>
                    <div className="text-xs text-slate-500">{testimonial.role}, {testimonial.church}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1510936111840-65e151ad71bb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/90 to-slate-900/50" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">
            Ready to transform your ministry?
          </h2>
          <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
            Join hundreds of churches using {appName || "Shepherd"} to reach more people and manage their operations effectively.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <Link href="/auth/signin">
              <Button size="lg" className="text-lg px-12 py-8 h-auto bg-blue-600 text-white hover:bg-blue-500 rounded-full font-bold shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 border-0">
                Start Your Free Trial
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="text-lg px-12 py-8 h-auto border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-full bg-transparent backdrop-blur-sm">
                Contact Sales
              </Button>
            </Link>
          </div>
          <p className="mt-8 text-slate-500 text-sm">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
            <div>
              <h3 className="font-bold text-slate-900 mb-6">Product</h3>
              <ul className="space-y-4 text-slate-600 text-sm">
                <li><Link href="#features" className="hover:text-blue-600 transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Security</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Roadmap</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-6">Resources</h3>
              <ul className="space-y-4 text-slate-600 text-sm">
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Documentation</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">API Reference</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Community</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-6">Company</h3>
              <ul className="space-y-4 text-slate-600 text-sm">
                <li><Link href="#" className="hover:text-blue-600 transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Partners</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-6">Legal</h3>
              <ul className="space-y-4 text-slate-600 text-sm">
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} {appName || "Shepherd ChMS"}. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="#" className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
              </Link>
              <Link href="#" className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="sr-only">GitHub</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
"""

with open("/home/mrhoseah/dev/shepherd-chMS/app/page.tsx", "w") as f:
    f.write(content)
