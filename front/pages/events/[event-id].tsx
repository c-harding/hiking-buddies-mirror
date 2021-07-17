import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import SanitizedHTML from 'react-sanitized-html';

import BadId from '../../components/errors/bad-id';
import NotFound from '../../components/errors/not-found';
import { EventDetails, RawEventDetails } from '../../services/hiking-buddies/event-details';

async function getEvent(
  id: number,
  abortController?: AbortController,
): Promise<EventDetails | null> {
  const response = await fetch(`/api/events/${id}`, { signal: abortController?.signal });
  if (response.status === 404) return null;
  else if (response.status !== 200) {
    throw new Error(
      `Error fetching event with ID ${id}, encountered code ${status}: ${await response.text()}`,
    );
  }
  const rawEvent = (await response.json()) as RawEventDetails;
  return EventDetails.fromRaw(rawEvent);
}

function useEventId(): number | undefined {
  const router = useRouter();
  if (!router.isReady) return;
  const eventIdQuery = router.query['event-id'];
  if (typeof eventIdQuery !== 'string') return NaN;
  return parseInt(eventIdQuery);
}

function EventBody({
  event,
  eventId,
}: {
  event: EventDetails | null | undefined;
  eventId: number | undefined;
}) {
  if (eventId === undefined || event === undefined) {
    return <>Loading</>;
  } else if (isNaN(eventId)) {
    return <BadId />;
  } else if (event === null) {
    return <NotFound type="event" id={eventId} />;
  } else {
    return (
      <>
        <h1>This is the event page for event {eventId}</h1>
        <h2>{event.eventTitle}</h2>
        <p>
          {event.meetingPoint} on{' '}
          {event.eventStart.toLocaleString(undefined, {
            dateStyle: 'full',
            timeStyle: 'short',
          })}
        </p>
        <h2>Description</h2>
        <SanitizedHTML html={event.description} />
        {event.instructions && (
          <>
            <h2>Instructions</h2>
            <SanitizedHTML html={event.instructions} />
          </>
        )}
      </>
    );
  }
}

export default function EventPage(): JSX.Element {
  const eventId = useEventId();
  const [event, setEvent] = useState<EventDetails | undefined | null>(undefined);
  const [loadingError, setLoadingError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    const abortController = new AbortController();

    setLoadingError(undefined);
    if (eventId !== undefined && !isNaN(eventId)) {
      getEvent(eventId, abortController).then(setEvent, (error) => {
        if (!abortController.signal.aborted && error instanceof Error) {
          setLoadingError(error);
        }
      });
    }
    return () => {
      abortController.abort();
    };
  }, [eventId]);

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
      <p>
        Back to the <Link href="/events">events list</Link>
      </p>
      <EventBody event={event} eventId={eventId} />
    </>
  );
}
