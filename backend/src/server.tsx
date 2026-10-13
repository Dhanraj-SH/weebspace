import 'dotenv/config';
import app from './app.js';
import {connection} from './config/database.js';
import { promoteAdminByEmail, countAdmins } from "./repositories/userRepository.js";

const startServer = async(): Promise<void> => {
    await connection();

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

    if (adminEmail) {
        const adminCount = await countAdmins();

        if (adminCount === 0) {
            const promoted = await promoteAdminByEmail(adminEmail);

            if (promoted) {
                console.log("Initial admin account promoted successfully.");
            } else {
                console.warn(
                    "ADMIN_EMAIL does not match an existing user. Register or sign in with that email, then restart the server."
                );
            }
        }
    } else {
        console.warn("ADMIN_EMAIL is not configured; admin bootstrap skipped.");
    }

    app.listen(process.env.PORT, () => {
        console.log(`Server running on port ${process.env.PORT}`);
    });
};

startServer();