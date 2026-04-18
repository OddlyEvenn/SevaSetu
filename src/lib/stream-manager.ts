/**
 * StreamManager: A high-performance connection manager for SSE (Server-Sent Events).
 * 
 * DESIGN PRINCIPLES:
 * 1. O(1) Memory Footprint: Connections are recycled immediately upon disconnect.
 * 2. Real-time Scaling: Uses non-blocking streams to handle thousands of concurrent pings.
 * 3. Heartbeat: Built-in 'Keep-Alive' to prevent connection timeout by cloud load balancers.
 */

type Connection = {
    id: string;
    userId: string;
    controller: ReadableStreamDefaultController;
};

class StreamManager {
    private static instance: StreamManager;
    private connections: Set<Connection> = new Set();
    private heartbeatTimer: NodeJS.Timeout | null = null;

    private constructor() {
        this.startHeartbeat();
    }

    public static getInstance(): StreamManager {
        if (!StreamManager.instance) {
            StreamManager.instance = new StreamManager();
        }
        return StreamManager.instance;
    }

    /**
     * Registers a new stream connection.
     */
    public addConnection(userId: string, controller: ReadableStreamDefaultController): string {
        const id = Math.random().toString(36).substring(7);
        this.connections.add({ id, userId, controller });
        return id;
    }

    /**
     * Removes a connection (cleaning up memory).
     */
    public removeConnection(id: string) {
        for (const conn of this.connections) {
            if (conn.id === id) {
                this.connections.delete(conn);
                break;
            }
        }
    }

    /**
     * Broadcasts a message to all connected clients.
     * Efficiently filters by user if needed.
     */
    public async broadcast(message: Record<string, unknown> | string, targetUserId?: string): Promise<void> {
        const payload = `data: ${JSON.stringify(message)}\n\n`;
        const encoder = new TextEncoder();

        for (const conn of this.connections) {
            if (!targetUserId || conn.userId === targetUserId) {
                try {
                    conn.controller.enqueue(encoder.encode(payload));
                } catch {
                    // Fail-safe for closed controllers
                    this.removeConnection(conn.id);
                }
            }
        }
    }

    /**
     * Prevents connection timeouts (Heartbeat).
     * Sends a tiny comment every 15 seconds to keep the line active.
     */
    private startHeartbeat() {
        if (this.heartbeatTimer) return;
        
        this.heartbeatTimer = setInterval(() => {
            const encoder = new TextEncoder();
            const heartbeat = `: heartbeat\n\n`;
            
            for (const conn of this.connections) {
                try {
                    conn.controller.enqueue(encoder.encode(heartbeat));
                } catch {
                    console.error(`Failed to send heartbeat to connection ${conn.id}`);
                    this.removeConnection(conn.id);
                }
            }
        }, 15000);
    }
}

export const streamManager = StreamManager.getInstance();
