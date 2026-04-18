import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { enforceSla } from "@/lib/sla-enforcer";

const grievanceSchema = z.object({
    title: z.string().min(5),
    description: z.string().min(10),
    category: z.string().min(1),
    subcategory: z.string().optional(),
    address: z.string().min(1),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
    departmentId: z.string().optional().nullable(),
});

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "CITIZEN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!user.isVerified) {
            return NextResponse.json(
                { error: "Please verify your identity first" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const parsed = grievanceSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid data", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const data = parsed.data;

        // SLA Calculation: Try subcategory first, then fallback to category
        let slaRule = null;

        if (data.subcategory) {
            slaRule = await prisma.slaRule.findFirst({
                where: {
                    category: data.subcategory,
                    OR: [
                        { departmentId: data.departmentId },
                        { departmentId: null }
                    ]
                },
                orderBy: { departmentId: 'desc' } // Specific first
            });
        }

        if (!slaRule) {
            slaRule = await prisma.slaRule.findFirst({
                where: {
                    category: data.category,
                    OR: [
                        { departmentId: data.departmentId },
                        { departmentId: null }
                    ]
                },
                orderBy: { departmentId: 'desc' } // Specific first
            });
        }

        let slaDueAt = null;
        if (slaRule) {
            slaDueAt = new Date(Date.now() + slaRule.durationSeconds * 1000);
        }

        // Create grievance
        const grievance = await prisma.grievance.create({
            data: {
                title: data.title,
                description: data.description,
                category: data.category,
                subcategory: data.subcategory || null,
                address: data.address,
                latitude: data.latitude,
                longitude: data.longitude,
                imageUrl: data.imageUrl,
                citizenId: user.id,
                departmentId: data.departmentId || null,
                slaDueAt,
                status: "SUBMITTED",
                priority: "NORMAL",
            },
        });

        // Create initial status history
        await prisma.grievanceStatusHistory.create({
            data: {
                grievanceId: grievance.id,
                fromStatus: null,
                toStatus: "SUBMITTED",
                changedById: user.id,
                note: "Grievance submitted",
            },
        });

        // Log action
        await prisma.auditLog.create({
            data: {
                actorId: user.id,
                grievanceId: grievance.id,
                action: "CREATE_GRIEVANCE",
                entity: "Grievance",
                entityId: grievance.id,
                metadata: JSON.stringify({ category: data.category }),
            },
        });

        return NextResponse.json({ grievance }, { status: 201 });
    } catch (error) {
        console.error("Grievance creation error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const category = searchParams.get("category");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {};

        // Role-based filtering
        if (user.role === "CITIZEN") {
            where.citizenId = user.id;
        } else if (user.role === "OFFICER" || user.role === "DEPT_HEAD") {
            // Both Officers and Dept Heads see all grievances in their department
            where.departmentId = user.departmentId;
        }

        // Additional filters
        if (status) {
            where.status = status;
        }
        if (category) {
            where.category = category;
        }

        // Global SLA Enforcement (Non-blocking Trigger)
        enforceSla().catch(err => console.error("Background SLA Error:", err));

        const grievances = await prisma.grievance.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
                citizen: { select: { name: true, email: true } },
                assignedTo: { select: { name: true } },
                department: { select: { name: true } },
                region: { select: { name: true } },
            },
        });

        return NextResponse.json({ grievances });
    } catch (error) {
        console.error("Grievances fetch error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
