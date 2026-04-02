"use client";

import { useState, useEffect, useRef } from "react";
import { ShieldCheckIcon, XMarkIcon, FingerPrintIcon } from "@heroicons/react/24/outline";

interface TwoFactorModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    email: string;
    onSuccess: (userData: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export default function TwoFactorModal({ isOpen, onClose, userId, email, onSuccess }: TwoFactorModalProps) {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (isOpen) {
            setOtp(["", "", "", "", "", ""]);
            setError("");
            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleDigitChange = (value: string, index: number) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        // Take only the last character if multiple are entered (some mobile keyboards)
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        // Move focus to next field if value is entered
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").slice(0, 6);
        if (!/^\d+$/.test(pastedData)) return;

        const newOtp = [...otp];
        pastedData.split("").forEach((char, i) => {
            if (i < 6) newOtp[i] = char;
        });
        setOtp(newOtp);

        // Auto submit if all 6 digits are pasted
        if (pastedData.length === 6) {
            setTimeout(() => {
                const finalOtp = pastedData;
                submitOtp(finalOtp);
            }, 100);
        }
    };

    const submitOtp = async (code: string) => {
        setError("");
        setLoading(true);
        try {
            console.log("Verifying 2FA for User:", userId, "Code Length:", code.length);
            const res = await fetch("/api/auth/2fa/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, otp: code }),
            });

            const data = await res.json();
            if (!res.ok) {
                console.error("2FA Verification Error (400?):", data);
                setLoading(false);
                throw new Error(data.error || "Verification failed");
            }

            // SUCCESS: Do not set loading to false; let the navigation handle it
            // We give it a tiny moment to ensure state is settled
            onSuccess(data.user);
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setError(err.message || "An unexpected error occurred during verification.");
            console.error("Verification Catch Error:", err);
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const code = otp.join("");
        if (code.length !== 6) {
            setError("Please enter a 6-digit code");
            return;
        }
        submitOtp(code);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" onClick={onClose}></div>

            <div className="relative w-full max-w-md rounded-3xl border border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl animate-scale-in overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full pointer-events-none"></div>

                <div className="p-8 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-6 shadow-inner ring-1 ring-indigo-100">
                        <FingerPrintIcon className="h-8 w-8" />
                    </div>

                    <h2 className="text-2xl font-heading font-black text-slate-900 mb-2">Two-Step Verification</h2>
                    <p className="text-slate-500 text-sm font-medium mb-8">
                        Enter the 6-digit code sent to your terminal for <span className="text-slate-900 font-bold">{email}</span>
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {error && (
                            <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold animate-shake">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-between gap-2 max-w-[320px] mx-auto" onPaste={handlePaste}>
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => { inputRefs.current[index] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleDigitChange(e.target.value, index)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    className="w-10 h-14 sm:w-12 sm:h-16 text-center text-2xl font-black rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                                />
                            ))}
                        </div>

                        <div className="space-y-4">
                            <button
                                type="submit"
                                disabled={loading || otp.join("").length !== 6}
                                className={`w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 hover:shadow-indigo-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${loading || otp.join("").length !== 6 ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    "Verify Identity"
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={onClose}
                                className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
                            >
                                Cancel and go back
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
