import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type RecordData = Record<string, unknown>;

type Props = {
  title: string;
  description: string;
  endpoint?: string;
  collectionKey?: string;
  loadItems?: () => Promise<RecordData[]>;
  emptyMessage: string;
};

function isRecordArray(value: unknown): value is RecordData[] {
  return Array.isArray(value)
    && value.every((item) => item !== null && typeof item === 'object' && !Array.isArray(item));
}

function displayValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return '';
}

export function CapabilityCard(props: Props) {
  const { title, description, emptyMessage } = props;
  const { endpoint, collectionKey, loadItems } = props;
  const [items, setItems] = useState<RecordData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const request = loadItems
      ? loadItems()
      : endpoint && collectionKey
        ? getJson<Record<string, unknown>>(endpoint).then((response) => {
          const collection = response[collectionKey];
          if (!isRecordArray(collection)) throw new Error('Invalid API response');
          return collection;
        })
        : Promise.reject(new Error('No data source configured'));

    request
      .then((loadedItems) => {
        if (active) setItems(loadedItems);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unknown error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [endpoint, collectionKey, loadItems]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {loading ? (
          <p role="status">Loading {title.toLowerCase()}...</p>
        ) : error ? (
          <p role="alert">Unable to load {title.toLowerCase()}: {error}</p>
        ) : items.length === 0 ? (
          <p>{emptyMessage}</p>
        ) : (
          <ul>
            {items.map((item, index) => (
              <li key={String(item._id ?? index)}>
                {Object.entries(item)
                  .map(([key, value]) => displayValue(value) ? `${key}: ${displayValue(value)}` : '')
                  .filter(Boolean)
                  .join(' · ')}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
