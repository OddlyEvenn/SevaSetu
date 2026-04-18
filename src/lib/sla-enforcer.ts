import { prisma } from "./prisma";

/**
 * Globally checks for overdue grievances and escalates them.
 * This should be called on frequently accessed endpoints (like notifications)
 * to simulate automated background processing in a serverless environment.
 */
export async function enforceSla() {
    try {
        const now = new Date();

        // 1. DEBOUNCING / RATE-LIMITING (System Level Optimization)
        // Check if we ran this recently to avoid redundant DB pressure
        const lastRun = await prisma.systemSetting.findUnique({
            where: { key: "LAST_SLA_RUN" }
        });

        const COOLDOWN_MS = 5 * 60 * 1000; // 5 Minutes
        if (lastRun && (now.getTime() - new Date(lastRun.value).getTime() < COOLDOWN_MS)) {
            return; // Exit early: Already optimized
        }

        // 2. SYSTEM LOCK (Mutual Exclusion)
        // Update the timestamp BEFORE running the heavy logic to "lock" it
        await prisma.systemSetting.upsert({
            where: { key: "LAST_SLA_RUN" },
            update: { value: now.toISOString() },
            create: { key: "LAST_SLA_RUN", value: now.toISOString(), type: "STRING" }
        });

        // 3. CORE LOGIC
        // Find ALL overdue grievances across the system that aren't yet handled
        const overdueGrievances = await prisma.grievance.findMany({
            where: {
                slaDueAt: { lt: now },
                status: { notIn: ["ESCALATED", "RESOLVED", "CLOSED"] },
                OR: [
                    { priority: { not: "URGENT" } },
                    { status: { not: "ESCALATED" } }
                ]
            },
            select: {
                id: true,
                departmentId: true,
                title: true,
                status: true,
                priority: true
            }
        });

        if (overdueGrievances.length === 0) return;

        for (const g of overdueGrievances) {
            // Update the grievance status and priority
            await prisma.grievance.update({
                where: { id: g.id },
                data: {
                    status: "ESCALATED",
                    priority: "URGENT"
                }
            });

            // Create status history entry
            await prisma.grievanceStatusHistory.create({
                data: {
                    grievanceId: g.id,
                    fromStatus: g.status,
                    toStatus: "ESCALATED",
                    changedById: null,
                    note: "Automatically escalated due to SLA breach."
                }
            });

            // Notify Stakeholders (All Dept Heads for this dept + All Admins)
            if (g.departmentId) {
                const recipients = await prisma.user.findMany({
                    where: {
                        OR: [
                            { departmentId: g.departmentId, role: "DEPT_HEAD" },
                            { role: { in: ["ADMIN", "SUPER_ADMIN"] } }
                        ]
                    },
                    select: { id: true }
                });

                for (const recipient of recipients) {
                    await prisma.notification.create({
                        data: {
                            userId: recipient.id,
                            title: "🚨 SLA BREACH ALERT!",
                            message: `Grievance #${g.id.substring(0, 8)} ("${g.title}") has breached its SLA and is now ESCALATED.`,
                            type: "URGENT",
                            grievanceId: g.id
                        }
                    });
                }
            }

            // Log the system action
            await prisma.auditLog.create({
                data: {
                    action: "UPDATE_GRIEVANCE_STATUS",
                    grievanceId: g.id,
                    entity: "Grievance",
                    entityId: g.id,
                    metadata: JSON.stringify({ reason: "SLA_BREACH", oldStatus: g.status, newStatus: "ESCALATED" }),
                    actorId: null
                }
            });
        }
    } catch (error) {
        console.error("SLA Enforcement Error:", error);
    }
}
