import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

const loadLeaderboard = () => getJson<{ leaderboard: Record<string, unknown>[] }>('/api/leaderboard')
  .then(({ leaderboard }) => leaderboard);

export default function Leaderboard() {
  return <CapabilityCard title="Leaderboard" description="Compare team point totals." loadItems={loadLeaderboard} emptyMessage="No leaderboard rankings yet." />;
}
