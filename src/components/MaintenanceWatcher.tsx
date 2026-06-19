"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function MaintenanceWatcher() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Skip checking on the maintenance page itself to prevent infinite loops
        if (pathname === "/maintenance" || pathname.startsWith("/login")) {
            return;
        }

        const checkMaintenanceStatus = async () => {
            try {
                // Fetch status from API (with a cache-busting timestamp to avoid caching)
                const res = await fetch(`/api/system/maintenance?t=${Date.now()}`);
                if (!res.ok) return;

                const { maintenanceMode, isAdmin } = await res.json();

                // If maintenance is on and user is not an admin, boot them
                if (maintenanceMode && !isAdmin && pathname !== "/maintenance") {
                    router.push("/maintenance");
                }
            } catch (err) {
                // Silently ignore network errors during polling
            }
        };

        // Check immediately on mount
        checkMaintenanceStatus();

        // Then poll every 15 minutes (900000ms)
        const intervalId = setInterval(checkMaintenanceStatus, 900000);

        return () => clearInterval(intervalId);
    }, [pathname, router]);

    // This component doesn't render any UI
    return null;
}
