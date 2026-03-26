import type { DoctorRow } from "./search";

export type QuerySearchDoctorFilters = {
	locationContains?: string | null;
	onlyAcceptingNewPatients?: boolean | null;
};

export function querySearchDoctors(
	sql: Bun.SQL,
	vectorLiteral: string,
	limit: number,
	filters: QuerySearchDoctorFilters = {},
): Promise<DoctorRow[]> {
	const locationContains = filters.locationContains ?? null;
	const onlyAccepting = filters.onlyAcceptingNewPatients ?? null;

	return sql<DoctorRow[]>`
		SELECT d.*,
			loc.latitude,
			loc.longitude
		FROM doctor_search_embeddings dse
		INNER JOIN doctors d ON d.id = dse.doctor_id
		LEFT JOIN doctor_locations dl ON dl.doctor_id = d.id AND dl.is_primary = true
		LEFT JOIN locations loc ON loc.id = dl.location_id
		WHERE dse.embedding IS NOT NULL
			AND (${locationContains}::text IS NULL OR d.primary_location ILIKE '%' || ${locationContains} || '%')
			AND (${onlyAccepting}::boolean IS NULL OR d.accepting_new_patients = true)
		ORDER BY dse.embedding <=> ${vectorLiteral}::vector
		LIMIT ${limit}
	`;
}
