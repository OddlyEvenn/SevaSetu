/**
 * SEVASETU SYSTEM-LEVEL LOAD TEST
 * Simulates 1,000 concurrent citizen interactions to measure system performance
 * and verifies Load Balancing distribution across scaled instances.
 */

async function runLoadTest() {
    console.log("🚀 Starting SevaSetu Scaled Load Test...");
    console.log("📊 Target: GET /api/grievances (via Nginx Load Balancer)");
    console.log("👥 Concurrent Citizens: 1,000\n");

    const API_URL = "http://localhost/api/grievances";
    const TOTAL_REQUESTS = 1000;
    const CONCURRENCY = 100;

    const start = performance.now();
    const latencies: number[] = [];
    const distribution = new Map<string, number>();
    let successCount = 0;
    let lastError: string | null = null;

    for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENCY) {
        const batch = Array.from({ length: Math.min(CONCURRENCY, TOTAL_REQUESTS - i) }, async () => {
            const reqStart = performance.now();
            try {
                const res = await fetch(API_URL, {
                    headers: { 
                        'Cache-Control': 'no-cache',
                        'Cookie': 'x-load-test-auth=true'
                    }
                });
                
                const handledBy = res.headers.get("X-Handled-By") || "Unknown";
                distribution.set(handledBy, (distribution.get(handledBy) || 0) + 1);

                const reqEnd = performance.now();
                latencies.push(reqEnd - reqStart);
                
                if (res.ok) {
                    successCount++;
                } else {
                    if (!lastError) {
                        lastError = res.statusText;
                    }
                }
            } catch (e) {
                if (!lastError) lastError = e instanceof Error ? e.message : "Unknown error";
            }
        });

        await Promise.all(batch);
        process.stdout.write(`Progress: ${((i + CONCURRENCY) / TOTAL_REQUESTS * 100).toFixed(0)}%\r`);
    }

    const end = performance.now();
    const totalTime = (end - start) / 1000;
    const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
    const rps = TOTAL_REQUESTS / totalTime;

    console.log("\n\n" + "=".repeat(40));
    console.log("📈 SEVASETU PERFORMANCE DATA");
    console.log("=".repeat(40));
    console.log(`Total Requests:    ${TOTAL_REQUESTS}`);
    console.log(`Success Rate:      ${((successCount / TOTAL_REQUESTS) * 100).toFixed(2)}%`);
    if (successCount < TOTAL_REQUESTS) {
        console.log(`Last Error:        ${lastError || "Unknown"}`);
    }
    console.log(`Req/Second:        ${rps.toFixed(2)}`);
    console.log(`Avg Latency:       ${avgLatency.toFixed(2)}ms`);
    
    console.log("\n📐 LOAD DISTRIBUTION (Round Robin)");
    console.log("-".repeat(40));
    
    // Sort distribution by IP/Hostname
    const sortedIPs = Array.from(distribution.keys()).sort();
    sortedIPs.forEach(ip => {
        const count = distribution.get(ip)!;
        const percentage = ((count / TOTAL_REQUESTS) * 100).toFixed(1);
        console.log(`Instance [${ip.padEnd(20)}]: ${count.toString().padStart(4)} requests (${percentage}%)`);
    });
    
    console.log("=".repeat(40));

    if (successCount === TOTAL_REQUESTS && distribution.size > 1) {
        console.log("\n✅ VERDICT: CLUSTER WORKING PERFECTLY");
        console.log(`Traffic was distributed across ${distribution.size} active instances.`);
    }
}

runLoadTest().catch(console.error);
