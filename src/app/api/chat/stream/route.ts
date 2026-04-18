import { getCurrentUser } from "@/lib/auth";
import { streamManager } from "@/lib/stream-manager";

/**
 * Real-time SSE Stream for Chat & Video Signaling.
 * Uses the high-performance StreamManager for scalable connection handling.
 */
export async function GET() {
    const user = await getCurrentUser();

    if (!user || user.role === "CITIZEN") {
        return new Response("Unauthorized", { status: 401 });
    }

    let connectionId: string;

    const stream = new ReadableStream({
        start(controller) {
            // Register this connection with the manager
            connectionId = streamManager.addConnection(user.id, controller);

            // Send initial connection event
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`));
        },
        cancel() {
            // Clean up resources immediately to prevent memory leaks
            if (connectionId) {
                streamManager.removeConnection(connectionId);
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
        },
    });
}
