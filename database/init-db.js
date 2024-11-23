import { readFileSync } from "fs";
import pkg from "pg";
const { Pool } = pkg;
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
	user: "your_username",
	host: "localhost",
	database: "react-chatgpt-clone",
	password: "your_password",
	port: 5433,
});

const sql = readFileSync(path.join(__dirname, "schema.sql")).toString();

pool.query(sql)
	.then(() => {
		console.log("Tables created successfully");
		pool.end();
	})
	.catch((err) => {
		console.error("Error creating tables:", err);
		pool.end();
	});
