import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

const loadTeams = () => getJson<{ teams: Record<string, unknown>[] }>('/api/teams')
  .then(({ teams }) => teams);

export default function Teams() {
  return <CapabilityCard title="Teams" description="Manage teams and members." loadItems={loadTeams} emptyMessage="No teams yet." />;
}
