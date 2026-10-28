// Every endpoint replacing the profile must return the same related records.
export const personProfileInclude = {
  notes: { orderBy: { createdAt: "desc" } },
  faceToFaceMeetings: { orderBy: { date: "desc" } },
  Loan: { orderBy: { createdAt: "asc" } },
} as const;
