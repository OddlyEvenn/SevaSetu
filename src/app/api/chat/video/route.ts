import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { streamManager } from "@/lib/stream-manager";
import { z } from "zod";

const videoCallSchema = z.object({
    type: z.enum(["START", "STOP", "JOIN", "SIGNAL"]),
    roomId: z.string().optional(),
    targetId: z.string().optional(),
    signalData: z.any().optional(),
});

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const parsed = videoCallSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        const { type, roomId, targetId, signalData } = parsed.data;

        // Role-based Access Control
        if ((type === "START" || type === "STOP") && user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Unauthorized. Level 5 clearance required." }, { status: 401 });
        }

        const eventData = {
            type,
            callerId: user.id,
            callerName: user.name,
            roomId: roomId || `room-${Date.now()}`,
            targetId,
            signalData,
            timestamp: new Date().toISOString(),
        };

        // Broadcast video call event via scalable StreamManager
        streamManager.broadcast({ sseType: "video-call", ...eventData });

        return NextResponse.json({ success: true, ...eventData });
    } catch (error) {
        console.error("Video call error:", error);
        return NextResponse.json({ error: "Failed to process video call action" }, { status: 500 });
    }
}
