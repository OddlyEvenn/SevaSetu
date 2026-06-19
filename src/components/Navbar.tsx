"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    HomeIcon,
    DocumentTextIcon,
    MapIcon,
    UserCircleIcon,
    ArrowRightOnRectangleIcon,
    BuildingOfficeIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    Bars3Icon,
    XMarkIcon,
    ChevronDownIcon,
    BellIcon,
    ChatBubbleLeftRightIcon
} from "@heroicons/react/24/outline";
import { useState, useRef, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";

interface NavbarProps {
    userRole: "CITIZEN" | "OFFICER" | "DEPT_HEAD" | "ADMIN" | "SUPER_ADMIN";
    userName: string;
}

export default function Navbar({ userRole, userName }: NavbarProps) {
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [systemMenuOpen, setSystemMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
                 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [hasUnreadChat, setHasUnreadChat] = useState(false);
    const pathname = usePathname();
    const systemMenuRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login?noAnim=true");
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (systemMenuRef.current && !systemMenuRef.current.contains(event.target as Node)) {
                setSystemMenuOpen(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setNotificationsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await fetch("/api/notifications");
                const data = await res.json();
                if (data.notifications) {
                    setNotifications(data.notifications);
                    setUnreadCount(data.unreadCount);
                }
            } catch (err) {
                console.error("Failed to fetch notifications", err);
            }
        };
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 600000); // Poll every 10 minutes
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const checkUnreadChat = async () => {
            try {
                const res = await fetch("/api/chat/unread");
                const data = await res.json();
                setHasUnreadChat(data.unread);
            } catch (err) {
                console.error("Failed to check unread chat", err);
            }
        };

        if (userRole !== "CITIZEN") {
            checkUnreadChat();
            const interval = setInterval(checkUnreadChat, 180000); // Poll every 3 minutes for chat
            return () => clearInterval(interval);
        }
    }, [userRole]);

    const markAsRead = async (id?: string) => {
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            if (id) {
                setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            } else {
                setNotifications(notifications.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
            }
        } catch (err) {
            console.error("Failed to mark notification as read", err);
        }
    };

    const getNavItems = () => {
        switch (userRole) {
            case "CITIZEN":
                return [
                    { name: "Dashboard", href: "/citizen/dashboard", icon: HomeIcon },
                    { name: "Grievances", href: "/citizen/grievances", icon: DocumentTextIcon },
                    { name: "Vehicles", href: "/citizen/vehicles", icon: MapIcon },
                    { name: "Profile", href: "/citizen/profile", icon: UserCircleIcon },
                ];
            case "OFFICER":
                return [
                    { name: "Dashboard", href: "/officer/dashboard", icon: HomeIcon },
                    { name: "Cases", href: "/officer/cases", icon: DocumentTextIcon },
                    { name: "Chat", href: "/chat", icon: ChatBubbleLeftRightIcon, isChat: true },
                    { name: "Profile", href: "/officer/profile", icon: UserCircleIcon },
                ];
            case "DEPT_HEAD":
                return [
                    { name: "Dashboard", href: "/dept-head/dashboard", icon: HomeIcon },
                    { name: "Analytics", href: "/dept-head/analytics", icon: ChartBarIcon },
                    { name: "Chat", href: "/chat", icon: ChatBubbleLeftRightIcon, isChat: true },
                    { name: "Team", href: "/dept-head/team", icon: UserCircleIcon },
                    { name: "Profile", href: "/dept-head/profile", icon: UserCircleIcon },
                ];
            case "ADMIN":
            case "SUPER_ADMIN":
                return [
                    { name: "Apps", href: "/admin/dashboard", icon: HomeIcon },
                    { name: "Reports", href: "/admin/grievances", icon: DocumentTextIcon },
                    { name: "Chat", href: "/chat", icon: ChatBubbleLeftRightIcon, isChat: true },
                    { name: "Users", href: "/admin/users", icon: UserCircleIcon },
                    { name: "Docs", href: "/admin/departments", icon: BuildingOfficeIcon },
                    { name: "Fleet", href: "/admin/vehicles", icon: MapIcon },
                ];
            default:
                return [];
        }
    };

    const navItems = getNavItems();
    const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";

    const isActive = (href: string) => {
        if (href === "/admin/dashboard" || href === "/citizen/dashboard" || href === "/officer/dashboard" || href === "/dept-head/dashboard") {
            return pathname === href;
        }
        return pathname.startsWith(href);
    };

    return (
        <div className="w-full flex justify-center sticky top-4 z-50 px-4 sm:px-6 lg:px-8 pointer-events-none">
            <nav className="pointer-events-auto w-full max-w-7xl rounded-2xl border border-white/40 glass shadow-xl shadow-slate-200/20">
                <div className="px-4 py-2 sm:px-6 lg:px-8">
                    <div className="flex h-14 items-center justify-between">
                        {/* Logo */}
                        <Link 
                            href={
                                userRole === "CITIZEN" ? "/citizen/dashboard" :
                                userRole === "OFFICER" ? "/officer/dashboard" :
                                userRole === "DEPT_HEAD" ? "/dept-head/dashboard" :
                                "/admin/dashboard"
                            } 
                            className="flex items-center gap-3 group"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-md shadow-slate-200/50 transition-all group-hover:scale-105 p-1.5 ring-1 ring-slate-100">
                                <img
                                    src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
                                    alt="National Emblem of India"
                                    className="h-full w-full object-contain"
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg font-heading font-bold tracking-tight text-slate-900 leading-none group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">SevaSetu</span>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex lg:items-center lg:gap-1.5 bg-slate-50/50 p-1 rounded-xl">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all transition-all relative group/item ${isActive(item.href)
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                        : "text-slate-600 hover:bg-white hover:text-blue-600 hover:shadow-sm"
                                        }`}
                                >
                                    <item.icon className={`h-4 w-4 ${isActive(item.href) ? "text-white" : ""}`} />
                                    {item.name}
                                    {item.isChat && hasUnreadChat && (
                                        <span className={`h-2 w-2 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse ${isActive(item.href) ? "bg-white" : "bg-blue-500"}`} />
                                    )}
                                    {isActive(item.href) && (
                                        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600 lg:hidden"></span>
                                    )}
                                </Link>
                            ))}

                            {isAdmin && (
                                <div className="relative ml-1" ref={systemMenuRef}>
                                    <button
                                        onClick={() => setSystemMenuOpen(!systemMenuOpen)}
                                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${systemMenuOpen ? "bg-slate-900 text-white shadow-md" : "text-slate-600 hover:bg-white hover:text-blue-600 hover:shadow-sm"
                                            }`}
                                    >
                                        <Cog6ToothIcon className="h-4 w-4" />
                                        System
                                        <ChevronDownIcon className={`h-3 w-3 transition-transform ${systemMenuOpen ? "rotate-180" : ""}`} />
                                    </button>

                                    {systemMenuOpen && (
                                        <div className="absolute right-0 mt-3 w-48 rounded-xl border border-slate-100 bg-white/95 backdrop-blur-md p-1.5 shadow-2xl ring-1 ring-black/5 animate-scale-in origin-top-right">
                                            <Link href="/admin/analytics" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors" onClick={() => setSystemMenuOpen(false)}>
                                                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md"><ChartBarIcon className="h-3.5 w-3.5" /></div>
                                                Analytics
                                            </Link>
                                            <Link href="/admin/settings" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors" onClick={() => setSystemMenuOpen(false)}>
                                                <div className="p-1.5 bg-slate-100 text-slate-600 rounded-md"><Cog6ToothIcon className="h-3.5 w-3.5" /></div>
                                                Settings
                                            </Link>
                                            <Link href="/admin/profile" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors" onClick={() => setSystemMenuOpen(false)}>
                                                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md"><UserCircleIcon className="h-3.5 w-3.5" /></div>
                                                My Profile
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* User Section */}
                        <div className="hidden md:flex md:items-center md:gap-3">
                            {/* Notifications */}
                            <div className="relative" ref={notificationsRef}>
                                <button
                                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                                    className={`relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300 ${notificationsOpen ? "ring-2 ring-blue-500/20 border-blue-500 text-blue-600" : ""}`}
                                >
                                    <BellIcon className="h-4 w-4" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>

                                {notificationsOpen && (
                                    <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-slate-100 bg-white/95 backdrop-blur-xl p-2 shadow-2xl ring-1 ring-black/5 animate-scale-in origin-top-right">
                                        <div className="flex items-center justify-between border-b border-slate-100/50 px-4 py-3">
                                            <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Notifications</h3>
                                            {unreadCount > 0 && (
                                                <button onClick={() => markAsRead()} className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">Mark all read</button>
                                            )}
                                        </div>
                                        <div className="max-h-96 overflow-y-auto pt-2 scrollbar-hide">
                                            {notifications.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                                                    <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                                                        <BellIcon className="h-6 w-6 text-slate-300" />
                                                    </div>
                                                    <p className="text-xs font-medium text-slate-500">You&apos;re all caught up!</p>
                                                    <p className="text-[10px] text-slate-400 mt-1">No new notifications</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    {notifications.map((n) => (
                                                        <div
                                                            key={n.id}
                                                            onClick={() => {
                                                                if (!n.isRead) markAsRead(n.id);
                                                                if (n.grievanceId) router.push(`/${userRole.toLowerCase().replace("_", "-")}/grievances/${n.grievanceId}`);
                                                                setNotificationsOpen(false);
                                                            }}
                                                            className={`group relative flex cursor-pointer flex-col rounded-xl px-3 py-2.5 transition-all hover:bg-slate-50 ${!n.isRead ? "bg-blue-50/40" : ""}`}
                                                        >
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${n.type === "URGENT" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                                                                    {n.type}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 font-medium">
                                                                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                            <h4 className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors pr-4">{n.title}</h4>
                                                            <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2 leading-snug">{n.message}</p>
                                                            {!n.isRead && (
                                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="h-8 w-px bg-slate-200 mx-1"></div>

                            <div className="flex items-center gap-3">
                                <div className="text-right hidden xl:block">
                                    <p className="text-xs font-bold text-slate-900 leading-tight">{userName}</p>
                                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">{userRole.replace("_", " ")}</p>
                                    </div>
                                </div>
                                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white">
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                                <button
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-all hover:bg-red-50 hover:text-red-500 disabled:opacity-50 border border-transparent shadow-sm hover:border-red-100"
                                    title="Logout"
                                >
                                    {isLoggingOut ? <div className="h-3 w-3 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin" /> : <ArrowRightOnRectangleIcon className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Mobile toggle */}
                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden rounded-lg bg-slate-50 p-2 text-slate-600 hover:bg-slate-100 transition-colors">
                            {mobileMenuOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Drawer */}
                {mobileMenuOpen && (
                    <div className="border-t border-slate-100 bg-white/95 backdrop-blur-xl lg:hidden animate-slide-down rounded-b-2xl overflow-hidden">
                        <div className="space-y-1 px-4 py-4">
                            {/* Mobile User Info */}
                            <div className="flex items-center gap-3 p-3 mb-4 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">{userName}</p>
                                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{userRole.replace("_", " ")}</p>
                                </div>
                            </div>

                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <div className="p-1.5 rounded-lg bg-white shadow-sm ring-1 ring-slate-100 group-hover:ring-blue-200">
                                        <item.icon className="h-4 w-4" />
                                    </div>
                                    {item.name}
                                </Link>
                            ))}

                            {isAdmin && (
                                <div className="space-y-1 pt-3 pb-2 border-t border-slate-100 mt-3">
                                    <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">System Administration</p>
                                    <Link href="/admin/analytics" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                                        <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600"><ChartBarIcon className="h-4 w-4" /></div>
                                        Analytics
                                    </Link>
                                    <Link href="/admin/settings" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                                        <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600"><Cog6ToothIcon className="h-4 w-4" /></div>
                                        Settings
                                    </Link>
                                </div>
                            )}

                            <div className="pt-4 mt-2 border-t border-slate-100">
                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-100 transition-colors"
                                >
                                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                                    Sign Out securely
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </nav>
        </div>
    );
}
