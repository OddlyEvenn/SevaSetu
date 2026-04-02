"use client";

import { useState } from "react";
import { TruckIcon, PlusIcon, TrashIcon, MapIcon, XMarkIcon } from "@heroicons/react/24/outline";
import dynamic from "next/dynamic";

const LiveVehicleMap = dynamic(() => import("@/components/LiveVehicleMap"), {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse bg-slate-100 rounded-3xl" />
});

interface Vehicle {
    id: string;
    registrationNumber: string;
    type: string;
    isActive: boolean;
    department?: { name: string } | null;
}

interface AdminVehiclesClientProps {
    initialVehicles: Vehicle[];
    departments: { id: string, name: string }[];
    createVehicleAction: (formData: FormData) => Promise<void>;
    deleteVehicleAction: (formData: FormData) => Promise<void>;
}

export default function AdminVehiclesClient({
    initialVehicles,
    departments,
    createVehicleAction,
    deleteVehicleAction
}: AdminVehiclesClientProps) {
    const [trackingVehicle, setTrackingVehicle] = useState<Vehicle | null>(null);

    return (
        <div className="grid gap-12 lg:grid-cols-3">
            {/* Add Vehicle Form */}
            <div className="lg:col-span-1">
                <div className="rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 bg-white p-6 sm:p-10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-10 -mt-10 group-hover:bg-blue-100 transition-colors"></div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-6 sm:mb-8 relative z-10">Add Vehicle</h2>
                    <form action={createVehicleAction} className="space-y-6 relative z-10">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Registration Number</label>
                            <input
                                name="registrationNumber"
                                required
                                className="block w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                placeholder="MH-12-AB-1234"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Vehicle Type</label>
                            <select
                                name="type"
                                required
                                className="block w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none"
                            >
                                <option value="">Select Type</option>
                                <option value="GARBAGE_TRUCK">Garbage Truck</option>
                                <option value="WATER_TANKER">Water Tanker</option>
                                <option value="AMBULANCE">Ambulance</option>
                                <option value="PATROL_CAR">Patrol Car</option>
                                <option value="MAINTENANCE_VAN">Maintenance Van</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Assign Department</label>
                            <select
                                name="departmentId"
                                className="block w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none"
                            >
                                <option value="">Unassigned</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <button type="submit" className="w-full h-16 flex items-center justify-center gap-3 rounded-2xl bg-slate-900 px-6 font-black text-white shadow-xl hover:bg-blue-600 transition-all hover:-translate-y-1 active:scale-95">
                            <PlusIcon className="h-5 w-5" />
                            Provision Fleet
                        </button>
                    </form>
                </div>
            </div>

            {/* Vehicles List */}
            <div className="lg:col-span-2">
                <div className="rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 sm:px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Vehicle Entity</th>
                                    <th className="px-6 sm:px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Department</th>
                                    <th className="px-6 sm:px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Status</th>
                                    <th className="relative px-6 sm:px-8 py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-50">
                                {initialVehicles.map((vehicle) => (
                                    <tr key={vehicle.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 sm:px-8 py-6">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                    <TruckIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                                                </div>
                                                <div className="ml-4 sm:ml-5">
                                                    <div className="text-base sm:text-lg font-black text-slate-900 leading-tight">{vehicle.registrationNumber}</div>
                                                    <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">{vehicle.type.replace("_", " ")}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 sm:px-8 py-6">
                                            <span className="text-[10px] sm:text-sm font-bold text-slate-600 bg-slate-100 px-2 sm:px-3 py-1 rounded-lg border border-slate-200">
                                                {vehicle.department?.name || "Global"}
                                            </span>
                                        </td>
                                        <td className="px-6 sm:px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <span className={`h-2 w-2 rounded-full ${vehicle.isActive ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}></span>
                                                <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${vehicle.isActive ? "text-emerald-700" : "text-red-700"}`}>
                                                    {vehicle.isActive ? "Online" : "Offline"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 sm:px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 sm:gap-3 transition-opacity">
                                                <button
                                                    onClick={() => setTrackingVehicle(vehicle)}
                                                    className="h-9 sm:h-10 px-3 sm:px-4 bg-blue-600 text-white rounded-lg sm:rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
                                                >
                                                    Track
                                                </button>
                                                <form action={deleteVehicleAction}>
                                                    <input type="hidden" name="vehicleId" value={vehicle.id} />
                                                    <button type="submit" className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center bg-red-50 text-red-500 rounded-lg sm:rounded-xl hover:bg-red-500 hover:text-white transition-all">
                                                        <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                                    </button>
                                                </form>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Tracking Modal */}
            {trackingVehicle && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4 sm:p-8 animate-fade-in">
                    <div className="relative w-full h-full max-w-7xl overflow-hidden rounded-[3rem] bg-white shadow-2xl flex flex-col border border-white/20">
                        <div className="flex shrink-0 items-center justify-between px-10 py-8 bg-white/50 backdrop-blur-md z-10 relative">
                            <div className="flex items-center gap-6">
                                <div className="h-16 w-16 rounded-[1.5rem] bg-blue-600 text-white flex items-center justify-center shadow-2xl shadow-blue-500/40">
                                    <MapIcon className="h-8 w-8" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-heading font-black text-slate-900 tracking-tight">Fleet Surveillance</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{trackingVehicle.registrationNumber}</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setTrackingVehicle(null)}
                                className="h-14 w-14 flex items-center justify-center rounded-2xl bg-slate-100 hover:bg-red-500 text-slate-500 hover:text-white transition-all shadow-sm group"
                            >
                                <XMarkIcon className="h-6 w-6 group-hover:scale-110 group-hover:rotate-90 transition-transform duration-300" />
                            </button>
                        </div>
                        <div className="flex-1 w-full relative">
                            <LiveVehicleMap vehicleName={trackingVehicle.registrationNumber} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
