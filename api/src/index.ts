import { Hono } from "hono";
import { cors } from "hono/cors";
import type { DoctorSearchService } from "./search";
import type { FeedbackService } from "./feedback";
import { validateRating } from "./feedback";

type AppDependencies = {
	port?: number;
	searchService?: DoctorSearchService;
	feedbackService?: FeedbackService;
	corsAllowedOrigins?: string[];
};

export function createApp({
	port = Number(process.env.PORT ?? 3000),
	searchService,
	feedbackService,
	corsAllowedOrigins = [],
}: AppDependencies = {}) {
	const app = new Hono();

	app.use(
		"*",
		cors({
			origin: corsAllowedOrigins,
		}),
	);

	app.get("/", (c) => {
		return c.json({
			name: "DocSeek API",
			status: "ok",
			port,
		});
	});

	app.post("/doctors/search", async (c) => {
		const body = await c.req.json().catch(() => null);
		const symptoms = typeof body?.symptoms === "string" ? body.symptoms.trim() : "";
		const limit = body?.limit;

		if (!symptoms) {
			return c.json(
				{
					error: "symptoms must be a non-empty string",
				},
				400,
			);
		}

		try {
			if (!searchService) {
				throw new Error("doctor search service is not configured");
			}

			const doctors = await searchService({
				symptoms,
				options: {
					limit,
				},
			});

			return c.json({
				doctors,
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : "doctor search failed";
			const status = message.includes("limit must be a positive integer") ? 400 : 500;

			return c.json(
				{
					error: message,
				},
				status,
			);
		}
	});

	app.post("/doctors/:id/feedback", async (c) => {
		const doctorId = Number(c.req.param("id"));
		if (!Number.isInteger(doctorId) || doctorId < 1) {
			return c.json({ error: "invalid doctor id" }, 400);
		}

		const body = await c.req.json().catch(() => null);

		try {
			const rating = validateRating(body?.rating);
			const comment = typeof body?.comment === "string" ? body.comment.trim() || undefined : undefined;

			if (!feedbackService) {
				throw new Error("feedback service is not configured");
			}

			await feedbackService({ doctorId, rating, comment });
			return c.json({ success: true }, 201);
		} catch (error) {
			const message = error instanceof Error ? error.message : "failed to submit feedback";
			const status = message.includes("rating must be") ? 400 : 500;
			return c.json({ error: message }, status);
		}
	});

	return app;
}

const port = Number(process.env.PORT ?? 3000);

export const app = createApp({ port });

export default {
	port,
	fetch: app.fetch,
};
