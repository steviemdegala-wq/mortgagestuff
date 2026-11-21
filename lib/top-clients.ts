export const TOP_CLIENT_COUNT = 10;

type ClientProjection = {
  expectedDeals: number | null;
  averageDealSize: number | null;
  commissionRate: number | null;
  annualValueOverride: number | null;
};

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function projectClient(client: ClientProjection) {
  const { expectedDeals, averageDealSize, commissionRate, annualValueOverride } = client;
  const grossVolume = expectedDeals === null || averageDealSize === null
    ? null
    : roundCurrency(expectedDeals * averageDealSize);
  const annualValue = annualValueOverride ?? (
    grossVolume === null || commissionRate === null
      ? null
      : roundCurrency(grossVolume * commissionRate / 100)
  );

  return { ...client, grossVolume, annualValue };
}

export function summarizeTopClients(clients: ReturnType<typeof projectClient>[]) {
  let grossVolume = 0;
  let annualValue = 0;
  let valuedClients = 0;
  let expectedDeals = 0;

  for (const client of clients) {
    grossVolume += client.grossVolume ?? 0;
    expectedDeals += client.expectedDeals ?? 0;
    if (client.annualValue !== null) {
      annualValue += client.annualValue;
      valuedClients++;
    }
  }

  return {
    grossVolume: roundCurrency(grossVolume),
    annualValue: roundCurrency(annualValue),
    expectedDeals,
    averageClientValue: valuedClients ? roundCurrency(annualValue / valuedClients) : null,
  };
}

export function latestContactDate(contacts: { lastContactedAt: Date | null }[]) {
  let latest: Date | null = null;
  for (const { lastContactedAt } of contacts) {
    if (lastContactedAt && (!latest || lastContactedAt > latest)) latest = lastContactedAt;
  }
  return latest;
}
