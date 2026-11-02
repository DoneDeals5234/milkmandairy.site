import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema.js";
import { sendWhatsAppOTP } from "./whatsapp.js";
import "dotenv/config";

// Connect to Turso Database via Drizzle
const client = createClient({
    url: process.env.TURSO_DATABASE_URL || "",
    authToken: process.env.TURSO_AUTH_TOKEN || ""
});

const db = drizzle(client, { schema });

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "sqlite"
    }),
    baseURL: process.env.BETTER_AUTH_URL || (process.env.NODE_ENV === "production" ? "https://milkmandairy.site/api/auth" : "http://localhost:8080/api/auth"),
    trustedOrigins: [
        "https://milkmandairy.site",
        "https://www.milkmandairy.site",
        "http://milkmandairy.site",
        "http://www.milkmandairy.site",
        "http://3.26.5.85",
        "http://3.26.5.85:8080",
        "http://localhost:8080",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://10.49.177.146:3000",
        "http://localhost:61578",
        "http://127.0.0.1:61578"
    ],
    emailAndPassword: {
        enabled: true,
    },
    plugins: [
        emailOTP({
            async sendVerificationOTP({ email, otp, type }) {
                // Extract phone number from our dummy email format
                const phoneNumber = email.replace('@milkman.local', '');
                await sendWhatsAppOTP(phoneNumber, otp);
            }
        })
    ]
});
