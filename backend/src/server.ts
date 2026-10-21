import { env } from "./config/env.js";
import app from "./app.js";
import { connection } from "./config/database.js";
import { countAdmins, promoteAdminByEmail } from "./repositories/userRepository.js";

const bootstrapAdmin = async (): Promise<void> => {
    const adminEmail = env.ADMIN_EMAIL?.trim().toLowerCase();

    if (!adminEmail) {
        console.warn("ADMIN_EMAIL is not configured; admin bootstrap skipped.");
        return;
    }

    if ((await countAdmins()) > 0) return;

    if (await promoteAdminByEmail(adminEmail)) {
        console.log("Initial admin account promoted successfully.");
    } else {
        console.warn("ADMIN_EMAIL does not match an existing user. Register with that email, then restart the server.");
    }
};

const startServer = async (): Promise<void> => {
    await connection();
    await bootstrapAdmin();

    app.listen(env.PORT, "0.0.0.0", () => {
        console.log(`Server running on port ${env.PORT}`);
    });
};

startServer();
