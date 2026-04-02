"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import TwoFactorModal from "@/components/TwoFactorModal";

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [show2FA, setShow2FA] = useState(false);
    const [authData, setAuthData] = useState<{ userId: string; email: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Login failed");

            if (data.requires2FA) {
                setAuthData({ userId: data.userId, email: data.email });
                setShow2FA(true);
                setLoading(false);
                return;
            }

            handleLoginSuccess(data.user);
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setError(err.message);
            setLoading(false);
        }
    };

    const handleLoginSuccess = (user: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        const role = user.role;
        
        // Use hard redirection to ensure the next page loads with a fresh state and bypasses any router caching
        let target = "/citizen/dashboard";
        if (role === "ADMIN" || role === "SUPER_ADMIN") {
            target = "/admin/dashboard";
        } else if (role === "DEPT_HEAD") {
            target = "/dept-head/dashboard";
        } else if (role === "OFFICER") {
            target = "/officer/dashboard";
        }
        
        window.location.assign(target);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex selection:bg-blue-500/30">
            {/* Left Side: Visual / Brand */}
            <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-8 xl:p-12 overflow-hidden border-r border-slate-200/60 bg-white">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50/50 z-0"></div>
                <div className="absolute top-[-10%] right-[-20%] w-[80%] h-[80%] rounded-full bg-blue-500/10 blur-[130px] mix-blend-multiply pointer-events-none" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[100px] mix-blend-multiply pointer-events-none" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>

                <div className="relative z-10 w-full animate-fade-in">
                    <Link href="/" className="inline-flex items-center gap-3 group">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xl shadow-blue-500/10 transition-transform duration-500 group-hover:scale-105 p-2 ring-1 ring-slate-100 border border-slate-50">
                            <img
                                src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
                                alt="National Emblem of India"
                                className="h-full w-full object-contain"
                            />
                        </div>
                        <span className="text-2xl font-heading font-black tracking-tight text-slate-900 leading-none">SevaSetu</span>
                    </Link>
                </div>

                <div className="relative z-10 mb-20 animate-fade-in" style={{ animationDelay: "100ms" }}>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-blue-600 text-xs font-bold uppercase tracking-widest mb-6 shadow-sm">
                        Welcome Back
                    </div>
                    <h2 className="text-4xl font-heading font-black text-slate-900 leading-[1.2] mb-6">
                        Access your <br /> civic dashboard.
                    </h2>
                    <p className="text-lg text-slate-500 font-medium max-w-lg">
                        Sign in to track your grievances, manage your profile, and engage with government services efficiently.
                    </p>
                </div>

                <div className="relative z-10 flex items-center gap-4 text-sm font-medium text-slate-400">
                    <span>© {new Date().getFullYear()} SevaSetu</span>
                    <span>•</span>
                    <a href="#" className="hover:text-slate-600 transition-colors">Help Center</a>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative overflow-y-auto bg-slate-50">
                {/* Mobile Background Elements */}
                <div className="absolute top-0 right-0 w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[100px] mix-blend-multiply pointer-events-none lg:hidden" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay pointer-events-none lg:hidden"></div>

                <div className="w-full max-w-md relative z-10 py-12 lg:py-0">
                    <div className="text-center lg:text-left mb-8">
                        {/* Mobile Logo */}
                        <div className="lg:hidden flex justify-center mb-8">
                            <Link href="/" className="inline-flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xl shadow-blue-500/10 p-2 ring-1 ring-slate-100 border border-slate-50">
                                    <img
                                        src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
                                        alt="National Emblem of India"
                                        className="h-full w-full object-contain"
                                    />
                                </div>
                            </Link>
                        </div>

                        <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight mb-2">Sign In</h1>
                        <p className="text-slate-500 text-sm">Please sign in to your account.</p>
                    </div>

                    <div className="rounded-3xl border border-white bg-white/60 backdrop-blur-xl p-8 shadow-xl shadow-slate-200/50">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm font-medium text-red-600 animate-slide-up">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                        <EnvelopeIcon className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="block w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                        <LockClosedIcon className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        id="password"
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="block w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="group w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-6 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                        Authenticating...
                                    </span>
                                ) : (
                                    "Sign In to Portal"
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center text-sm font-medium">
                            <span className="text-slate-500">Don&apos;t have an account? </span>
                            <Link href="/register" className="text-blue-600 hover:text-blue-700 transition-colors underline decoration-blue-600/30 underline-offset-4 font-bold">
                                Register here
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {authData && (
                <TwoFactorModal
                    isOpen={show2FA}
                    onClose={() => setShow2FA(false)}
                    userId={authData.userId}
                    email={authData.email}
                    onSuccess={handleLoginSuccess}
                />
            )}
        </div>
    );
}
