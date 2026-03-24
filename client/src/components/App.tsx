import { Link, useNavigate } from "@tanstack/react-router";
import {
	ArrowLeft,
	ArrowRight,
	Filter,
	Search,
	Stethoscope,
} from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";

const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export const SUGGESTED_SYMPTOMS = [
	"Migraines",
	"MRI scan",
	"Broken leg",
] as const;

export type Doctor = {
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

export type SearchFilters = {
	location?: string;
	onlyAcceptingNewPatients?: boolean;
};

type SearchDoctorsOptions = {
	apiBaseUrl?: string;
	fetchImpl?: typeof fetch;
	filters?: SearchFilters;
};

type SearchFiltersFormProps = {
	location: string;
	onlyAcceptingNewPatients: boolean;
	onLocationChange: (value: string) => void;
	onOnlyAcceptingChange: (value: boolean) => void;
};

type SearchPageShellProps = {
	children: ReactNode;
};

type SearchFormProps = {
	symptoms: string;
	onSymptomsChange: (value: string) => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
	isLoading?: boolean;
};

type SearchHeroProps = SearchFormProps & {
	errorMessage?: string;
	filters?: SearchFiltersFormProps;
};

type HomePageProps = {
	navigateToResults: (symptoms: string, filters?: SearchFilters) => void;
};

type DoctorRecommendationCardProps = {
	doctors: Doctor[];
	activeDoctorIndex: number;
	onNextDoctor: () => void;
};

type ResultsHeaderProps = {
	includeBackLink?: boolean;
	initialSymptoms: string;
	activeFilters?: SearchFilters;
	onRefineFilters?: () => void;
};

type ResultsSearchSummaryProps = {
	symptoms: string;
};

type ResultsActiveFiltersProps = {
	filters: SearchFilters;
	onRefine: () => void;
};

type ResultsRefineFiltersProps = {
	location: string;
	onlyAcceptingNewPatients: boolean;
	onLocationChange: (value: string) => void;
	onOnlyAcceptingChange: (value: boolean) => void;
	onApply: () => void;
	onCancel: () => void;
	isRefining: boolean;
};

type ResultsPageProps = {
	initialSymptoms: string;
	initialFilters?: SearchFilters;
	searchDoctorsImpl?: typeof searchDoctors;
	includeBackLink?: boolean;
};

export function getDoctorSearchUrl(apiBaseUrl = API_BASE_URL) {
	return `${apiBaseUrl}/doctors/search`;
}

export function normalizeSymptoms(symptoms: string) {
	return symptoms.trim();
}

export function getResultsNavigation(
	symptoms: string,
	filters?: SearchFilters,
) {
	return {
		to: "/results" as const,
		search: {
			symptoms: normalizeSymptoms(symptoms),
			...(filters?.location && { location: filters.location }),
			...(filters?.onlyAcceptingNewPatients && {
				onlyAcceptingNewPatients: "true",
			}),
		},
	};
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
		filters,
	}: SearchDoctorsOptions = {},
): Promise<Doctor[]> {
	const trimmedSymptoms = normalizeSymptoms(symptoms);
	if (!trimmedSymptoms) {
		throw new Error(
			"Enter your current symptoms to search for matching doctors.",
		);
	}

	const body: Record<string, unknown> = { symptoms: trimmedSymptoms };
	if (filters) {
		if (filters.location) body.location = filters.location;
		if (filters.onlyAcceptingNewPatients) body.onlyAcceptingNewPatients = true;
	}

	const response = await fetchImpl(getDoctorSearchUrl(apiBaseUrl), {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	const payload = (await response.json()) as
		| DoctorSearchResponse
		| { error?: string };

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

export function SearchPageShell({ children }: SearchPageShellProps) {
	return (
		<main className="app-shell">
			<a className="skip-link" href="#page-content">
				Skip to main content
			</a>
			<div className="background-orb background-orb-left" aria-hidden="true" />
			<div className="background-orb background-orb-right" aria-hidden="true" />
			<div className="constellation constellation-top" aria-hidden="true" />
			<div className="constellation constellation-bottom" aria-hidden="true" />
			<div id="page-content" className="page-content">
				{children}
			</div>
		</main>
	);
}

export function SearchForm({
	symptoms,
	onSymptomsChange,
	onSubmit,
	isLoading = false,
}: SearchFormProps) {
	return (
		<form className="search-form" onSubmit={onSubmit}>
			<label className="sr-only" htmlFor="symptoms">
				Current symptoms
			</label>
			<div className="search-frame">
				<div className="search-input-wrap">
					<Search
						aria-hidden="true"
						className="search-icon"
						size={28}
						strokeWidth={1.9}
					/>
					<textarea
						id="symptoms"
						name="symptoms"
						className="symptoms-input"
						rows={1}
						value={symptoms}
						onChange={(event) => onSymptomsChange(event.target.value)}
						placeholder="I have chest pains"
						required
					/>
				</div>
				<button
					className="primary-action"
					type="submit"
					disabled={isLoading}
					aria-label={isLoading ? "Finding doctors" : "Find matching doctors"}
				>
					<ArrowRight aria-hidden="true" size={34} strokeWidth={2.1} />
				</button>
			</div>
		</form>
	);
}

export function SearchFiltersForm({
	location,
	onlyAcceptingNewPatients,
	onLocationChange,
	onOnlyAcceptingChange,
}: SearchFiltersFormProps) {
	return (
		<fieldset className="search-filters" aria-labelledby="filter-heading">
			<legend id="filter-heading" className="filter-heading">
				Filter by your preferences
			</legend>
			<div className="filter-fields">
				<div className="filter-field">
					<label htmlFor="filter-location">
						Location (city, state, or ZIP)
					</label>
					<input
						id="filter-location"
						type="text"
						value={location}
						onChange={(e) => onLocationChange(e.target.value)}
						placeholder="e.g. Pittsburgh, PA"
						aria-describedby="filter-location-hint"
					/>
					<span id="filter-location-hint" className="filter-hint">
						Show doctors near this area
					</span>
				</div>
				<div className="filter-field filter-checkbox">
					<input
						id="filter-accepting"
						type="checkbox"
						checked={onlyAcceptingNewPatients}
						onChange={(e) => onOnlyAcceptingChange(e.target.checked)}
						aria-describedby="filter-accepting-hint"
					/>
					<label htmlFor="filter-accepting">
						Only show doctors accepting new patients
					</label>
					<span id="filter-accepting-hint" className="filter-hint">
						Filter by availability
					</span>
				</div>
			</div>
		</fieldset>
	);
}

export function SearchHero({
	symptoms,
	onSymptomsChange,
	onSubmit,
	isLoading = false,
	errorMessage,
	filters,
}: SearchHeroProps) {
	return (
		<section className="hero">
			<div className="brand-lockup">
				<div className="brand-mark" aria-hidden="true">
					<Stethoscope aria-hidden="true" size={36} strokeWidth={2.1} />
				</div>
				<p className="eyebrow">DocSeek</p>
			</div>
			<h1>How can we help you today?</h1>
			<p className="lede hero-lede">
				Describe what you are feeling and DocSeek will surface the strongest
				doctor matches on a separate results page.
			</p>

			<SearchForm
				symptoms={symptoms}
				onSymptomsChange={onSymptomsChange}
				onSubmit={onSubmit}
				isLoading={isLoading}
			/>

			{filters ? (
				<SearchFiltersForm
					location={filters.location}
					onlyAcceptingNewPatients={filters.onlyAcceptingNewPatients}
					onLocationChange={filters.onLocationChange}
					onOnlyAcceptingChange={filters.onOnlyAcceptingChange}
				/>
			) : null}

			<div className="suggestion-list">
				{SUGGESTED_SYMPTOMS.map((suggestion) => (
					<button
						key={suggestion}
						className="suggestion-chip"
						type="button"
						onClick={() => onSymptomsChange(suggestion)}
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
		</section>
	);
}

export function HomePage({ navigateToResults }: HomePageProps) {
	const [symptoms, setSymptoms] = useState("");
	const [location, setLocation] = useState("");
	const [onlyAcceptingNewPatients, setOnlyAcceptingNewPatients] =
		useState(false);
	const [errorMessage, setErrorMessage] = useState("");

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const trimmedSymptoms = normalizeSymptoms(symptoms);
		if (!trimmedSymptoms) {
			setErrorMessage(
				"Enter your current symptoms to search for matching doctors.",
			);
			return;
		}

		setErrorMessage("");
		const filters: SearchFilters = {};
		if (location.trim()) filters.location = location.trim();
		if (onlyAcceptingNewPatients) filters.onlyAcceptingNewPatients = true;
		navigateToResults(
			trimmedSymptoms,
			Object.keys(filters).length ? filters : undefined,
		);
	}

	return (
		<SearchPageShell>
			<SearchHero
				symptoms={symptoms}
				onSymptomsChange={setSymptoms}
				onSubmit={handleSubmit}
				errorMessage={errorMessage}
				filters={{
					location,
					onlyAcceptingNewPatients,
					onLocationChange: setLocation,
					onOnlyAcceptingChange: setOnlyAcceptingNewPatients,
				}}
			/>
		</SearchPageShell>
	);
}

export function DoctorRecommendationCard({
	doctors,
	activeDoctorIndex,
	onNextDoctor,
}: DoctorRecommendationCardProps) {
	const activeDoctor = doctors[activeDoctorIndex];
	const hasNextDoctor = activeDoctorIndex < doctors.length - 1;

	if (!activeDoctor) {
		return null;
	}

	return (
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
					<a
						href={activeDoctor.profile_url}
						target="_blank"
						rel="noreferrer"
						aria-label={`View profile for ${activeDoctor.full_name} (opens in a new tab)`}
					>
						View profile
					</a>
				) : null}
				{activeDoctor.book_appointment_url ? (
					<a
						href={activeDoctor.book_appointment_url}
						target="_blank"
						rel="noreferrer"
						aria-label={`Book an appointment with ${activeDoctor.full_name} (opens in a new tab)`}
					>
						Book appointment
					</a>
				) : null}
				<button
					className="secondary-action"
					type="button"
					onClick={onNextDoctor}
					disabled={!hasNextDoctor}
				>
					{getNextRecommendationLabel(hasNextDoctor)}
				</button>
			</div>
		</section>
	);
}

export function ResultsActiveFilters({
	filters,
	onRefine,
}: ResultsActiveFiltersProps) {
	const labels: string[] = [];
	if (filters.location) labels.push(filters.location);
	if (filters.onlyAcceptingNewPatients) labels.push("Accepting new patients");

	if (labels.length === 0) return null;

	return (
		<div className="results-active-filters">
			<Filter aria-hidden="true" size={16} strokeWidth={2} />
			<span className="results-active-filters-label">
				Filtered by: {labels.join(" • ")}
			</span>
			<button
				type="button"
				className="results-refine-link"
				onClick={onRefine}
				aria-label="Refine location and availability filters"
			>
				Refine filters
			</button>
		</div>
	);
}

export function ResultsRefineFilters({
	location,
	onlyAcceptingNewPatients,
	onLocationChange,
	onOnlyAcceptingChange,
	onApply,
	onCancel,
	isRefining,
}: ResultsRefineFiltersProps) {
	if (!isRefining) return null;

	return (
		<div className="results-refine-filters">
			<h3 id="refine-heading" className="refine-heading">
				Refine your filters
			</h3>
			<div className="refine-fields">
				<div className="filter-field">
					<label htmlFor="refine-location">
						Location (city, state, or ZIP)
					</label>
					<input
						id="refine-location"
						type="text"
						value={location}
						onChange={(e) => onLocationChange(e.target.value)}
						placeholder="e.g. Pittsburgh, PA"
					/>
				</div>
				<div className="filter-field filter-checkbox">
					<input
						id="refine-accepting"
						type="checkbox"
						checked={onlyAcceptingNewPatients}
						onChange={(e) => onOnlyAcceptingChange(e.target.checked)}
					/>
					<label htmlFor="refine-accepting">
						Only show doctors accepting new patients
					</label>
				</div>
			</div>
			<div className="refine-actions">
				<button
					type="button"
					className="primary-action"
					onClick={onApply}
					aria-label="Apply refined filters"
				>
					Apply filters
				</button>
				<button
					type="button"
					className="secondary-action"
					onClick={onCancel}
					aria-label="Cancel refining filters"
				>
					Cancel
				</button>
			</div>
		</div>
	);
}

export function ResultsHeader({
	includeBackLink = true,
	initialSymptoms,
	activeFilters,
}: ResultsHeaderProps) {
	return (
		<header className="results-header">
			<div className="results-header-top">
				{includeBackLink ? (
					<Link className="back-link" to="/">
						<ArrowLeft aria-hidden="true" size={18} strokeWidth={2.2} />
						Start a new search
					</Link>
				) : null}
				<ResultsSearchSummary symptoms={initialSymptoms} />
			</div>
			{activeFilters &&
			(activeFilters.location || activeFilters.onlyAcceptingNewPatients) ? (
				<ResultsActiveFilters
					filters={activeFilters}
					onRefine={onRefineFilters ?? (() => {})}
				/>
			) : null}
			<div className="results-copy">
				<p className="results-kicker">Recommended doctors</p>
				<h1 className="results-title">Recommended doctors</h1>
				<p className="results-lede">
					Review one doctor at a time, then move to the next recommendation if
					you want more options.
				</p>
			</div>
		</header>
	);
}

export function ResultsSearchSummary({ symptoms }: ResultsSearchSummaryProps) {
	return (
		<div className="results-search-summary">
			<div className="results-search-frame">
				<Search
					aria-hidden="true"
					className="search-icon results-search-icon"
					size={22}
					strokeWidth={1.9}
				/>
				<p className="results-search-text">
					<span className="sr-only">Search symptoms:</span>
					{symptoms}
				</p>
			</div>
		</div>
	);
}

export function ResultsPage({
	initialSymptoms,
	initialFilters,
	searchDoctorsImpl = searchDoctors,
	includeBackLink = false,
}: ResultsPageProps) {
	const navigate = useNavigate();
	const [doctors, setDoctors] = useState<Doctor[]>([]);
	const [activeDoctorIndex, setActiveDoctorIndex] = useState(0);
	const [errorMessage, setErrorMessage] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isRefining, setIsRefining] = useState(false);
	const [refineLocation, setRefineLocation] = useState(
		initialFilters?.location ?? "",
	);
	const [refineOnlyAccepting, setRefineOnlyAccepting] = useState(
		initialFilters?.onlyAcceptingNewPatients ?? false,
	);

	useEffect(() => {
		setRefineLocation(initialFilters?.location ?? "");
		setRefineOnlyAccepting(initialFilters?.onlyAcceptingNewPatients ?? false);
	}, [initialFilters]);

	useEffect(() => {
		let ignore = false;

		async function loadDoctors() {
			setIsLoading(true);
			setErrorMessage("");

			try {
				const matchedDoctors = await searchDoctorsImpl(initialSymptoms, {
					filters: initialFilters,
				});

				if (ignore) {
					return;
				}

				setDoctors(matchedDoctors);
				setActiveDoctorIndex(0);

				if (matchedDoctors.length === 0) {
					setErrorMessage(
						"No doctors matched those symptoms. Try adding more detail or relaxing your filters.",
					);
				}
			} catch (error) {
				if (ignore) {
					return;
				}

				setDoctors([]);
				setActiveDoctorIndex(0);
				setErrorMessage(
					error instanceof Error
						? error.message
						: "Unable to search for doctors right now.",
				);
			} finally {
				if (!ignore) {
					setIsLoading(false);
				}
			}
		}

		void loadDoctors();

		return () => {
			ignore = true;
		};
	}, [initialSymptoms, initialFilters, searchDoctorsImpl]);

	return (
		<SearchPageShell>
			<section
				className="results-page"
				aria-busy={isLoading}
				aria-describedby="results-status"
			>
				<ResultsHeader
					includeBackLink={includeBackLink}
					initialSymptoms={initialSymptoms}
					activeFilters={initialFilters}
					onRefineFilters={
						initialFilters ? () => setIsRefining(true) : undefined
					}
				/>

				<ResultsRefineFilters
					location={refineLocation}
					onlyAcceptingNewPatients={refineOnlyAccepting}
					onLocationChange={setRefineLocation}
					onOnlyAcceptingChange={setRefineOnlyAccepting}
					onApply={() => {
						const filters: SearchFilters = {};
						if (refineLocation.trim()) filters.location = refineLocation.trim();
						if (refineOnlyAccepting) filters.onlyAcceptingNewPatients = true;
						navigate(getResultsNavigation(initialSymptoms, filters));
						setIsRefining(false);
					}}
					onCancel={() => setIsRefining(false)}
					isRefining={isRefining}
				/>

				<div id="results-status" className="sr-only" aria-live="polite">
					{isLoading
						? `Loading doctor recommendations for ${initialSymptoms}.`
						: doctors.length > 0
							? `Showing ${doctors.length} doctor recommendations for ${initialSymptoms}.`
							: "No doctor recommendations are currently displayed."}
				</div>

				{isLoading ? (
					<p className="loading-message">Loading recommendations…</p>
				) : null}

				{errorMessage ? (
					<p className="feedback-message" role="alert">
						{errorMessage}
					</p>
				) : null}

				{!errorMessage && !isLoading && doctors.length > 0 ? (
					<DoctorRecommendationCard
						doctors={doctors}
						activeDoctorIndex={activeDoctorIndex}
						onNextDoctor={() =>
							setActiveDoctorIndex((currentIndex) => currentIndex + 1)
						}
					/>
				) : null}
			</section>
		</SearchPageShell>
	);
}
