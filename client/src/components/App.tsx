import * as React from "react";
import { ArrowRight, Search, Stethoscope } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export const SUGGESTED_SYMPTOMS = [
	"Migraines",
	"MRI scan",
	"Broken leg",
] as const;

type Doctor = {
	id: number;
	full_name: string;
	primary_specialty: string | null;
	accepting_new_patients: boolean;
	profile_url: string | null;
	book_appointment_url: string | null;
	primary_location: string | null;
	primary_phone: string | null;
};

type DoctorSearchResponse = {
	doctors: Doctor[];
};

type SearchDoctorsOptions = {
	apiBaseUrl?: string;
	fetchImpl?: typeof fetch;
};

export function getDoctorSearchUrl(apiBaseUrl = API_BASE_URL) {
	return `${apiBaseUrl}/doctors/search`;
}

export function getNextRecommendationLabel(hasNextDoctor: boolean) {
	return hasNextDoctor
		? "See the next recommended doctor"
		: "You've reached the last recommendation";
}

export async function searchDoctors(
	symptoms: string,
	{
		apiBaseUrl = API_BASE_URL,
		fetchImpl = fetch,
	}: SearchDoctorsOptions = {},
): Promise<Doctor[]> {
	const trimmedSymptoms = symptoms.trim();
	if (!trimmedSymptoms) {
		throw new Error("Enter your current symptoms to search for matching doctors.");
	}

	const response = await fetchImpl(getDoctorSearchUrl(apiBaseUrl), {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			symptoms: trimmedSymptoms,
		}),
	});

	const payload = (await response.json()) as DoctorSearchResponse | { error?: string };

	if (!response.ok) {
		throw new Error(
			"error" in payload && payload.error
				? payload.error
				: "Unable to search for doctors right now.",
		);
	}

	if (!("doctors" in payload)) {
		throw new Error("Unable to search for doctors right now.");
	}

	return payload.doctors;
}

export function App() {
	const [symptoms, setSymptoms] = React.useState("");
	const [doctors, setDoctors] = React.useState<Doctor[]>([]);
	const [activeDoctorIndex, setActiveDoctorIndex] = React.useState(0);
	const [errorMessage, setErrorMessage] = React.useState("");
	const [isLoading, setIsLoading] = React.useState(false);

	const activeDoctor = doctors[activeDoctorIndex];
	const hasNextDoctor = activeDoctorIndex < doctors.length - 1;

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		setIsLoading(true);
		setErrorMessage("");

		try {
			const matchedDoctors = await searchDoctors(symptoms);

			setDoctors(matchedDoctors);
			setActiveDoctorIndex(0);

			if (matchedDoctors.length === 0) {
				setErrorMessage("No doctors matched those symptoms. Try adding more detail.");
			}
		} catch (error) {
			setDoctors([]);
			setActiveDoctorIndex(0);
			setErrorMessage(
				error instanceof Error
					? error.message
					: "Unable to search for doctors right now.",
			);
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<main className="app-shell">
			<div className="background-orb background-orb-left" aria-hidden="true" />
			<div className="background-orb background-orb-right" aria-hidden="true" />
			<div className="constellation constellation-top" aria-hidden="true" />
			<div className="constellation constellation-bottom" aria-hidden="true" />
			<section className="hero">
				<div className="brand-lockup">
					<div className="brand-mark" aria-hidden="true">
						<Stethoscope size={36} strokeWidth={2.1} />
					</div>
					<p className="eyebrow">DocSeek</p>
				</div>
				<h1>How can we help you today?</h1>
				<p className="lede">
					Describe what you are feeling and DocSeek will surface the strongest
					doctor matches one recommendation at a time.
				</p>

				<form className="search-form" onSubmit={handleSubmit}>
					<label className="sr-only" htmlFor="symptoms">
						Current symptoms
					</label>
					<div className="search-frame">
						<div className="search-input-wrap">
							<Search className="search-icon" size={28} strokeWidth={1.9} />
							<textarea
								id="symptoms"
								name="symptoms"
								className="symptoms-input"
								rows={1}
								value={symptoms}
								onChange={(event) => setSymptoms(event.target.value)}
								placeholder="I have chest pains"
							/>
						</div>
						<button
							className="primary-action"
							type="submit"
							disabled={isLoading}
							aria-label={isLoading ? "Finding doctors" : "Find matching doctors"}
						>
							<ArrowRight size={34} strokeWidth={2.1} />
						</button>
					</div>
				</form>

				<div className="suggestion-list" aria-label="Suggested searches">
					{SUGGESTED_SYMPTOMS.map((suggestion) => (
						<button
							key={suggestion}
							className="suggestion-chip"
							type="button"
							onClick={() => setSymptoms(suggestion)}
						>
							{suggestion}
						</button>
					))}
				</div>

				{errorMessage ? (
					<p className="feedback-message" role="alert">
						{errorMessage}
					</p>
				) : null}

				{activeDoctor ? (
					<section className="doctor-card" aria-live="polite">
						<div className="doctor-card-header">
							<div>
								<p className="result-count">
									Recommendation {activeDoctorIndex + 1} of {doctors.length}
								</p>
								<h2>{activeDoctor.full_name}</h2>
							</div>
							<p
								className={
									activeDoctor.accepting_new_patients
										? "availability availability-open"
										: "availability"
								}
							>
								{activeDoctor.accepting_new_patients
									? "Accepting new patients"
									: "Check availability"}
							</p>
						</div>
						<p className="doctor-meta">
							{activeDoctor.primary_specialty ?? "Specialty not listed"}
						</p>
						<div className="doctor-details">
							<p className="doctor-detail">
								{activeDoctor.primary_location ?? "Location not listed"}
							</p>
							<p className="doctor-detail">
								{activeDoctor.primary_phone ?? "Phone number not listed"}
							</p>
						</div>
						<div className="doctor-links">
							{activeDoctor.profile_url ? (
								<a href={activeDoctor.profile_url} target="_blank" rel="noreferrer">
									View profile
								</a>
							) : null}
							{activeDoctor.book_appointment_url ? (
								<a
									href={activeDoctor.book_appointment_url}
									target="_blank"
									rel="noreferrer"
								>
									Book appointment
								</a>
							) : null}
							<button
								className="secondary-action"
								type="button"
								onClick={() =>
									setActiveDoctorIndex((currentIndex) => currentIndex + 1)
								}
								disabled={!hasNextDoctor}
							>
								{getNextRecommendationLabel(hasNextDoctor)}
							</button>
						</div>
					</section>
				) : null}
			</section>
		</main>
	);
}
