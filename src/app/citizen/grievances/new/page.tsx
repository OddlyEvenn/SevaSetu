"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { PhotoIcon, MapPinIcon, SparklesIcon, CheckCircleIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export default function NewGrievancePage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "",
        subcategory: "",
        address: "",
        latitude: "",
        longitude: "",
        departmentId: "",
    });
                 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [departments, setDepartments] = useState<any[]>([]);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [detectingLocation, setDetectingLocation] = useState(false);
    const [uploadProgress, setUploadProgress] = useState("");
    const [isScanning, setIsScanning] = useState(false);
                 
    const [scanComplete, setScanComplete] = useState(false);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [scanAnimationData, setScanAnimationData] = useState<any>(null);

    useEffect(() => {
        fetch("/sccan.json")
            .then(res => res.json())
            .then(data => setScanAnimationData(data))
            .catch(err => console.error("Error loading scanning animation:", err));
    }, []);

    const categories = [
        { value: "ROADS", label: "Roads & Infrastructure", subcategories: ["Potholes", "Street Lights", "Drainage"] },
        { value: "WATER", label: "Water Supply", subcategories: ["No Water", "Contaminated Water", "Leakage"] },
        { value: "SANITATION", label: "Sanitation", subcategories: ["Garbage Collection", "Public Toilets", "Sewage"] },
        { value: "ELECTRICITY", label: "Electricity", subcategories: ["Power Cut", "Faulty Meter", "Street Lights"] },
        { value: "OTHER", label: "Other", subcategories: ["Noise Pollution", "Illegal Construction", "Other"] },
    ];

    const selectedCategory = categories.find(c => c.value === formData.category);

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const res = await fetch("/api/departments");
                const data = await res.json();
                if (data.departments) {
                    setDepartments(data.departments);
                }
            } catch (err) {
                console.error("Failed to fetch departments", err);
            }
        };
        fetchDepartments();
    }, []);

    const detectLocation = async () => {
        setDetectingLocation(true);
        setError("");

        try {
            let latitude = "";
            let longitude = "";

            try {
                if (Capacitor.isNativePlatform()) {
                    const checkPerms = await Geolocation.checkPermissions();
                    
                    if (checkPerms.location !== 'granted') {
                        const requestPerms = await Geolocation.requestPermissions();
                        if (requestPerms.location !== 'granted') {
                            setError("Location permission denied. Please enable it in settings.");
                            setDetectingLocation(false);
                            return;
                        }
                    }
                }

                const position = await Geolocation.getCurrentPosition({
                    enableHighAccuracy: true,
                    timeout: 10000
                });
                latitude = position.coords.latitude.toString();
                longitude = position.coords.longitude.toString();
            } catch (capErr) {
                console.warn("Capacitor Geolocation failed, trying web fallback:", capErr);
                if (typeof window !== "undefined" && navigator.geolocation) {
                    const webPosition = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            enableHighAccuracy: true,
                            timeout: 10000
                        });
                    });
                    latitude = webPosition.coords.latitude.toString();
                    longitude = webPosition.coords.longitude.toString();
                } else {
                    throw capErr;
                }
            }

            setFormData(prev => ({
                ...prev,
                latitude,
                longitude,
            }));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error("Location error:", err);
            setError("Unable to detect location. Please ensure GPS is on and try again.");
        } finally {
            setDetectingLocation(false);
        }
    };

    const handleAIScan = async () => {
        if (!imageFile) {
            setError("Please select an image first to scan.");
            return;
        }

        setIsScanning(true);
        setError("");

        try {
            const scanFormData = new FormData();
            scanFormData.append("file", imageFile);

            const res = await fetch("/api/analyze-image", {
                method: "POST",
                body: scanFormData,
            });

            if (!res.ok) throw new Error("AI Analysis failed");

            const data = await res.json();

            // Artificial delay for animation
            await new Promise(r => setTimeout(r, 3000));

            setFormData(prev => ({
                ...prev,
                ...data,
                departmentId: departments.find(d => d.name.toUpperCase().includes(data.category))?.id || prev.departmentId
                 
            }));

            setScanComplete(true);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsScanning(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        setUploadProgress("Preparing submission...");

        try {
            let imageUrl = null;
            if (imageFile) {
                setUploadProgress("Uploading image...");
                const uploadFormData = new FormData();
                uploadFormData.append("file", imageFile);

                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: uploadFormData,
                });

                if (!uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    throw new Error(uploadData.error || "Image upload failed");
                }

                const uploadData = await uploadRes.json();
                imageUrl = uploadData.imageUrl;
            }

            setUploadProgress("Submitting grievance details...");
            const res = await fetch("/api/grievances", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                    longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                    imageUrl,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                let errorMessage = data.error || "Failed to submit grievance";
                if (data.details && data.details.fieldErrors) {
                    const validationErrors = Object.entries(data.details.fieldErrors)
                        .map(([field, errors]) => `${field}: ${(errors as string[]).join(", ")}`)
                        .join("; ");
                    errorMessage += `: ${validationErrors}`;
                }
                 
                throw new Error(errorMessage);
            }

            router.push(`/citizen/grievances/${data.grievance.id}`);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message);
            window.scrollTo({ top: 0, behavior: "smooth" });
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-500/30">
            {/* Subtle background decoration */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-blue-100/40 blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-indigo-100/40 blur-[100px]" />
            </div>

            <Navbar userRole="CITIZEN" userName="Citizen" />

            <main className="relative z-10 mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">

                <div className="mb-8">
                    <Link href="/citizen/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors mb-4">
                        <ArrowLeftIcon className="h-4 w-4" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-3xl sm:text-4xl font-heading font-black tracking-tight text-slate-900 mb-2">
                        Report Grievance
                    </h1>
                    <p className="text-base sm:text-lg text-slate-500 font-medium">
                        Provide detailed information to help us resolve the issue faster.
                    </p>
                </div>

                <div className="rounded-3xl border border-slate-200/60 bg-white shadow-sm p-6 sm:p-10 transition-shadow">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {error && (
                            <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700 border border-red-200/60 animate-slide-up">
                                {error}
                            </div>
                        )}

                        {/* AI Section (Bento Box style) */}
                        <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/50 border border-slate-200/60 p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-100/50 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-blue-200/50 transition-colors"></div>

                            <label className="block text-sm font-bold text-slate-900 mb-4 relative z-10">
                                Step 1: Upload Image & Auto-fill Data
                            </label>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 relative z-10">
                                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-4 text-sm font-bold text-slate-700 transition-all hover:border-blue-400 hover:bg-blue-50/50 shadow-sm w-full sm:w-auto">
                                    <PhotoIcon className="h-6 w-6 text-blue-500" />
                                    {imageFile ? "Change Image" : "Choose Image"}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            setImageFile(e.target.files?.[0] || null);
                                            setScanComplete(false);
                                        }}
                                        className="hidden"
                                    />
                                </label>

                                {imageFile && !scanComplete && (
                                    <button
                                        type="button"
                                        onClick={handleAIScan}
                                        disabled={isScanning}
                                        className="flex items-center justify-center w-full sm:w-auto gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                                    >
                                        <SparklesIcon className={`h-5 w-5 ${isScanning ? "animate-spin" : ""}`} />
                                        {isScanning ? "Analyzing..." : "Auto-Fill with AI"}
                                    </button>
                                )}

                                {scanComplete && (
                                    <div className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-50 px-6 py-4 text-sm font-bold text-emerald-700 border border-emerald-200 shadow-sm">
                                        <CheckCircleIcon className="h-5 w-5" />
                                        AI Auto-Fill Completed
                                    </div>
                                )}
                            </div>
                            {imageFile && (
                                <p className="mt-3 text-sm font-medium text-slate-500 relative z-10 flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                                    {imageFile.name}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-8 pt-4">
                            {/* Basic Details */}
                            <div>
                                <label htmlFor="title" className="block text-sm font-bold text-slate-900 mb-2">
                                    Issue Title *
                                </label>
                                <input
                                    id="title"
                                    type="text"
                                    required
                                    minLength={5}
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="block w-full rounded-xl border border-slate-200/60 bg-slate-50 py-3.5 px-4 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                                    placeholder="Brief summary of the issue (e.g. Large pothole on Main St)"
                                />
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-bold text-slate-900 mb-2">
                                    Detailed Description *
                                </label>
                                <textarea
                                    id="description"
                                    required
                                    minLength={10}
                                    rows={5}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="block w-full rounded-xl border border-slate-200/60 bg-slate-50 py-3.5 px-4 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium resize-none"
                                    placeholder="Provide as much detail as possible to help the department understand the issue..."
                                />
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="category" className="block text-sm font-bold text-slate-900 mb-2">
                                        Classification Category *
                                    </label>
                                    <select
                                        id="category"
                                        required
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value, subcategory: "" })}
                                        className="block w-full rounded-xl border border-slate-200/60 bg-slate-50 py-3.5 px-4 text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium appearance-none"
                                    >
                                        <option value="">Select general category</option>
                                        {categories.map((cat) => (
                                            <option key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="department" className="block text-sm font-bold text-slate-900 mb-2">
                                        Assigned Department *
                                    </label>
                                    <select
                                        id="department"
                                        required
                                        value={formData.departmentId}
                                        onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                                        className="block w-full rounded-xl border border-slate-200/60 bg-slate-50 py-3.5 px-4 text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium appearance-none"
                                    >
                                        <option value="">Select target department</option>
                                        {departments.map((dept) => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="subcategory" className="block text-sm font-bold text-slate-900 mb-2">
                                        Specific Subcategory
                                    </label>
                                    <select
                                        id="subcategory"
                                        value={formData.subcategory}
                                        onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                                        disabled={!selectedCategory}
                                        className="block w-full rounded-xl border border-slate-200/60 bg-slate-50 py-3.5 px-4 text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium appearance-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                                    >
                                        <option value="">Select detailed issue type</option>
                                        {selectedCategory?.subcategories.map((sub) => (
                                            <option key={sub} value={sub}>
                                                {sub}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="my-2 border-t border-slate-100"></div>

                            {/* Location Section */}
                            <div>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                                    <label htmlFor="address" className="block text-sm font-bold text-slate-900/90">
                                        Incident Address / Location *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={detectLocation}
                                        disabled={detectingLocation}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/60 bg-white px-4 py-2 text-xs font-bold text-blue-600 transition-all hover:bg-slate-50 hover:border-blue-200 hover:shadow-sm disabled:opacity-50"
                                    >
                                        <MapPinIcon className="h-4 w-4" />
                                        {detectingLocation ? "Detecting..." : "Auto-Detect Full GPS"}
                                    </button>
                                </div>
                                <input
                                    id="address"
                                    type="text"
                                    required
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="block w-full rounded-xl border border-slate-200/60 bg-slate-50 py-3.5 px-4 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                                    placeholder="Enter street address, nearby landmark, etc."
                                />

                                {formData.latitude && formData.longitude && (
                                    <div className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 w-max px-3 py-1.5 rounded-lg border border-emerald-100">
                                        <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                                        GPS Locked: {parseFloat(formData.latitude).toFixed(5)}, {parseFloat(formData.longitude).toFixed(5)}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-8 mt-8 border-t border-slate-100">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 font-bold tracking-wide text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed group relative overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {loading ? (
                                        <>
                                            <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                                            {uploadProgress || "Submitting Request..."}
                                        </>
                                    ) : (
                                        "Submit Grievance Report"
                                    )}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="rounded-xl border border-slate-200/60 bg-white px-8 py-4 font-bold text-slate-700 transition-all hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            {/* Scanning Animation Overlay */}
            {isScanning && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl overflow-hidden">
                    {/* Ambient Particles */}
                    <div className="absolute inset-0 pointer-events-none">
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className="particle"
                                style={{
                                    left: `${(i * 7) % 100}%`,
                 
                                    top: `${(i * 13) % 100}%`,
                                    width: `${((i % 3) + 1) * 2}px`,
                                    height: `${((i % 3) + 1) * 2}px`,
                                    opacity: 0.3,
                                    animationDelay: `${i * 0.2}s`,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                } as any}
                            />
                        ))}
                    </div>

                    <div className="relative h-96 w-96 flex items-center justify-center">
                        {/* Lottie Animation */}
                        <div className="w-full h-full relative z-10">
                            {scanAnimationData && (
                                <Lottie
                                    animationData={scanAnimationData}
                                    loop={true}
                                    className="w-full h-full text-blue-400"
                                />
                            )}
                        </div>



                        {/* Text Overlay */}
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center w-full">
                            <h1 className="text-xl font-heading font-black text-white uppercase tracking-[0.4em] animate-pulse">
                                AI Scanning
                            </h1>
                            <p className="text-[10px] font-mono text-blue-400 opacity-60 mt-1 uppercase tracking-widest">
                                Analyzing visual markers...
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
