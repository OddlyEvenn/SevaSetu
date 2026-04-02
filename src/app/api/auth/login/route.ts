import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createAuthToken, setAuthCookie } from "@/lib/auth";
import { z } from "zod";
import { sendOTP } from "@/lib/email";

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const parsed = loginSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid data", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        // Check for 2FA
        if (user.twoFactorEnabled) {
            // Generate a 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();

            // Store the OTP temporarily in the database safely
            // For now, using twoFactorSecret as a temp storage for demonstration
            await prisma.user.update({
                where: { id: user.id },
                data: { twoFactorSecret: otp }
            });

            // Send OTP via Email
            await sendOTP(user.email, otp);

            return NextResponse.json({
                requires2FA: true,
                userId: user.id,
                email: user.email
            });
        }

        const token = await createAuthToken({
            sub: user.id,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
        });
        await setAuthCookie(token);

        // Log login action
        await prisma.auditLog.create({
            data: {
                actorId: user.id,
                action: "LOGIN",
                entity: "User",
                entityId: user.id,
            },
        });

        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
