import { createApp } from "./index";
import { getRuntimeConfig } from "./env";
import { createDoctorSearchService } from "./search";
import { createFeedbackService } from "./feedback";

const config = getRuntimeConfig();
const app = createApp({
	port: config.port,
	searchService: createDoctorSearchService(config),
	feedbackService: createFeedbackService(config),
	corsAllowedOrigins: config.corsAllowedOrigins,
});

export default {
	port: config.port,
	fetch: app.fetch,
};
