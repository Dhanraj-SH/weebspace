import 'dotenv/config';
import app from './app.js';
import {connection} from './config/database.js';

const startServer = async(): Promise<void> => {
    await connection();

    app.listen(process.env.PORT, () => {
        console.log(`Server running on port ${process.env.PORT}`);
    });
};

startServer();