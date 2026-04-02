"use client";

import Link from "next/link";
import { MapPinIcon, ShieldCheckIcon, ChartBarIcon, BellAlertIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 overflow-hidden relative selection:bg-blue-500/30">

      {/* Background Decor */}
      <div className="absolute top-0 inset-x-0 h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] mix-blend-screen" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] rounded-full bg-indigo-600/20 blur-[130px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[40%] rounded-full bg-purple-600/10 blur-[100px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 pt-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex items-center justify-between animate-fade-in">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md shadow-lg shadow-black/50 transition-all group-hover:scale-105 p-2 ring-1 ring-white/20">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
              alt="National Emblem of India"
              className="h-full w-full object-contain brightness-0 invert opacity-90"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-heading font-black tracking-tight text-white leading-none">SevaSetu</span>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-0.5">Urban Governance</span>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:text-white hover:bg-white/5"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="group relative inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-900 transition-all hover:scale-105 hover:bg-slate-100 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)]"
          >
            Get Started <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-20 pb-20 sm:pt-32 sm:pb-24 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs sm:text-sm font-semibold mb-6 sm:mb-8">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
            Next-Gen Governance Platform
          </div>
          <h1 className="text-4xl font-heading font-black tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.15] sm:leading-[1.1]">
            Empowering Citizens.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
              Enabling Governance.
            </span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-slate-400 font-medium">
            SevaSetu bridges the gap between citizens and municipal authorities, delivering an elegant, transparent, and blazing-fast experience for urban grievance management.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="group w-full sm:w-auto rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-105 hover:shadow-blue-500/40 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
              <span className="relative flex items-center justify-center gap-2">
                Register as Citizen <ArrowRightIcon className="h-4 w-4" />
              </span>
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md px-8 py-4 text-base font-bold text-white transition-all hover:bg-white/10 hover:border-white/20"
            >
              Official Login
            </Link>
          </div>
        </div>


        {/* Features Grid */}
        <div className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-heading font-bold text-white">Why SevaSetu?</h2>
            <p className="mt-4 text-slate-400">Everything you need to transform your city&apos;s service delivery framework.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
            <FeatureCard
              icon={<MapPinIcon className="h-6 w-6" />}
              title="Hyper-Local Navigation"
              description="Automatically pinpoint exact issue locations for rapid deployment of resources."
            />
            <FeatureCard
              icon={<ShieldCheckIcon className="h-6 w-6" />}
              title="Verified Trust"
              description="Aadhaar-backed identity verification ensures a genuine and secure user ecosystem."
            />
            <FeatureCard
              icon={<ChartBarIcon className="h-6 w-6" />}
              title="Live Analytics"
              description="Deep insights and real-time SLA tracking for unprecedented operational transparency."
            />
            <FeatureCard
              icon={<BellAlertIcon className="h-6 w-6" />}
              title="Intelligent Escalation"
              description="Automated smart routing ensures critical issues never slip through the cracks."
            />
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-32 grid gap-6 sm:grid-cols-3">
          <StatCard number="100%" label="Transparent" />
          <StatCard number="24/7" label="Availability" />
          <StatCard number="< 1s" label="Action Latency" />
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-32 border-t border-white/10 bg-slate-950/50 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 flex flex-col items-center">
          <div className="flex items-center gap-2 opacity-50 mb-4">
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Emblem" className="h-6 w-6 invert" />
            <span className="text-lg font-heading font-bold text-white">SevaSetu</span>
          </div>
          <p className="text-center text-sm font-medium text-slate-500">
            © {new Date().getFullYear()} SevaSetu Platform. Empowering Citizens.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 transition-all hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10">
      <div className="mb-6 inline-flex rounded-xl bg-blue-500/10 p-3 text-blue-400 ring-1 ring-blue-500/20 transition-all group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white">
        {icon}
      </div>
      <h3 className="mb-3 text-lg font-heading font-bold text-slate-200 group-hover:text-white transition-colors">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-400">{description}</p>
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent p-8 text-center backdrop-blur-sm">
      <div className="text-5xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-sm">{number}</div>
      <div className="mt-3 text-sm font-bold text-slate-400 uppercase tracking-widest">{label}</div>
    </div>
  );
}
