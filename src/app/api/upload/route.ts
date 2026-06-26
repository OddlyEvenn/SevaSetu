import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        let imageUrl;
        try {
            // Define upload directory
            const uploadDir = join(process.cwd(), "public", "uploads");

            // Ensure directory exists
            await mkdir(uploadDir, { recursive: true });

            // Generate unique filename
            const uniqueId = crypto.randomUUID();
            const extension = (file.name || "bin").split(".").pop() || "jpg";
            const filename = `${uniqueId}.${extension}`;
            const path = join(uploadDir, filename);

            // Write file
            await writeFile(path, buffer);

            // Return the public URL
            imageUrl = `/uploads/${filename}`;
        } catch (writeErr) {
            console.warn("Local file write failed, falling back to base64 Data URL:", writeErr);
            // Fallback: Convert to base64 Data URL
            const base64Data = buffer.toString("base64");
            imageUrl = `data:${file.type || "image/jpeg"};base64,${base64Data}`;
        }

        return NextResponse.json({ imageUrl });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
