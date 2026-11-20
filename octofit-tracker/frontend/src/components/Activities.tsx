import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

const loadActivities = () => getJson<{ activities: Record<string, unknown>[] }>('/api/activities')
  .then(({ activities }) => activities);

export default function Activities() {
  return <CapabilityCard title="Activities" description="Track student activity minutes and points." loadItems={loadActivities} emptyMessage="No activities yet." />;
}
