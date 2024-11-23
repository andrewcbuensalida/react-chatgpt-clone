import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import pool from "./database/db.js";

dotenv.config();
const USERID = 1;
const app = express();
app.use(express.json());
app.use(cors());

const limiter = rateLimit({
	windowMs: 60 * 10000, // 10 minute
	max: 10, // limit each IP to 100 requests per minute defined in windowMs
	message: "Too many requests from this IP, please try again later.",
});

const auth = (req, res, next) => {
	if (req.headers.authorization !== process.env.VITE_AUTH_TOKEN) {
		return res.status(401).send("Unauthorized");
	}
	next();
};

app.post("/api/completions", auth, limiter, async (req, res) => {
	let chatId = req.body.chatId;
	console.log(`*Example chatId: `, chatId);

	if (!chatId) {
		try {
			const result = await pool.query(
				"INSERT INTO chats (title, user_id) VALUES ($1, $2) RETURNING chat_id",
				[req.body.message, USERID]
			);
			chatId = result.rows[0].chat_id;
		} catch (error) {
			console.error("Error inserting new chat into database:", error);
			res.status(500).send("Internal Server Error");
			return;
		}
	}

	// TODO need to authenticate USERID from jwt token then
	// TODO need to make sure USERID is the same as the user_id in the chat record for authorization

	// Fetch previous messages from the database, if any
	const previousMessages = [];
	try {
		const result = await pool.query(
			"SELECT * FROM messages WHERE chat_id = $1",
			[chatId]
		);
		previousMessages.push(...result.rows);
	} catch (error) {
		console.error("Error fetching messages from database:", error);
		res.status(500).send("Internal Server Error");
		return;
	}
	console.log(`*Example previousMessages: `, previousMessages);

	const options = {
		method: "POST",
		headers: {
			Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: process.env.GPT_MODEL_NAME,
			messages: [
				...previousMessages,
				{
					role: "user",
					content: req.body.message,
				},
			],
		}),
	};

	// Send messages to LLM so it can answer
	try {
		console.log("Fetching response from OpenAI API...");
		const response = await fetch(
			"https://api.openai.com/v1/chat/completions",
			options
		);

		const data = await response.json();
		console.log(`*Example data: `, data);

		const newMessage = data.choices[0].message;
		console.log(`*Example newMessage: `, newMessage);

		// Insert the new message into the database
		try {
			const insertResult = await pool.query(
				"INSERT INTO messages (sender_id, created_at, message_id, chat_id, role, content) VALUES ($1, to_timestamp($2), $3, $4, $5, $6) RETURNING *",
				[
					USERID,
					data.created,
					data.id,
					chatId,
					newMessage.role,
					newMessage.content,
				]
			);
			const insertedMessage = insertResult.rows[0];
			// Send the response back to the client
			res.send(insertedMessage);
		} catch (error) {
			console.error("Error inserting message into database:", error);
			res.status(500).send("Internal Server Error");
			return;
		}
	} catch (e) {
		console.error(e);
		res.status(500).send(e.message);
	}
});

app.listen(process.env.PORT, () => {
	console.log(
		`Server is running on http://localhost:${process.env.PORT}/api/completions`
	);
});
