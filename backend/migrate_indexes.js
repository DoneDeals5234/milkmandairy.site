import { createClient } from "@libsql/client";
import "dotenv/config";

const db = createClient({
    url: process.env.TURSO_DATABASE_URL || "",
    authToken: process.env.TURSO_AUTH_TOKEN || ""
});

async function runIndexes() {
    try {
        const orderInfo = await db.execute(`PRAGMA table_info("order");`);
        const orderCols = orderInfo.rows.map(r => r.name);
        console.log("Order table columns:", orderCols);

        // Core indexes
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_sub_del_sub_date ON subscription_deliveries (subscriptionId, deliveryDate);`);
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_sub_del_sub_status ON subscription_deliveries (subscriptionId, status);`);
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_user_sub_status ON user_subscriptions (status);`);
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_user_sub_userId ON user_subscriptions (userId);`);
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_user_phone ON user (phoneNumber);`);
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_areas_active ON serviceable_areas (isActive);`);

        if (orderCols.includes("customerEmail")) {
            await db.execute(`CREATE INDEX IF NOT EXISTS idx_order_email ON "order" (customerEmail);`);
        } else if (orderCols.includes("userId")) {
            await db.execute(`CREATE INDEX IF NOT EXISTS idx_order_userId ON "order" (userId);`);
        }

        if (orderCols.includes("createdAt")) {
            await db.execute(`CREATE INDEX IF NOT EXISTS idx_order_createdAt ON "order" (createdAt);`);
        }

        console.log("✓ All indexes verified and active!");
    } catch (e) {
        console.error("Index error:", e);
    }
}

runIndexes();
