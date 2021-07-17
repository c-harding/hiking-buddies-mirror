import Link from 'next/link';
import { useEffect, useState } from 'react';

import Title from '../../components/title';
import { EventSummary, RawEventSummary } from '../../services/hiking-buddies/event-summary';

async function getEvents(abortController?: AbortController): Promise<EventSummary[]> {
  const response = await fetch(`/api/events`, { signal: abortController?.signal });
  const rawSummaries = (await response.json()) as RawEventSummary[];
  return rawSummaries.map((raw) => EventSummary.fromRaw(raw));
}

export default function EventsList(): JSX.Element {
  const [events, setEvents] = useState<EventSummary[] | undefined>(undefined);
  const [loadingError, setLoadingError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    const abortController = new AbortController();

    getEvents(abortController).then(setEvents, (error) => {
      if (!abortController.signal.aborted && error instanceof Error) {
        setLoadingError(error);
      }
    });
    return () => {
      abortController.abort();
    };
  }, []);

  if (loadingError) {
    return (
      <>
        <h1>Loading error</h1>
        <p>{loadingError.toString()}</p>
      </>
    );
  }

  return (
    <>
      <Title page="Events list" />
      <h1>Events list</h1>
      {events ? (
        <ul>
          {events.map((event) => (
            <li key={event.id}>
              <Link href={`/events/${event.id}`}>{event.toString()}</Link>
            </li>
          ))}
        </ul>
      ) : (
        'Loading'
      )}
    </>
  );
}
