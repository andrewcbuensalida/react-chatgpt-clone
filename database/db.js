import pkg from "pg";
const { Pool } = pkg;

export default new Pool({
	user: "your_username",
	host: "localhost",
	database: "react-chatgpt-clone",
	password: "your_password",
	port: 5433,
});
