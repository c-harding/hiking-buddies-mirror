import Link from 'next/link';
import { useRouter } from 'next/router';

import BadId from '../../components/errors/bad-id';

function useEventId(): number | undefined {
  const router = useRouter();
  if (!router.isReady) return;
  const eventIdQuery = router.query['event-id'];
  if (typeof eventIdQuery !== 'string') return NaN;
  return parseInt(eventIdQuery);
}

function EventBody({ eventId }: { eventId: number | undefined }) {
  if (eventId === undefined) {
    return <></>;
  } else if (isNaN(eventId)) {
    return <BadId />;
  } else {
    return (
      <>
        <h1>This is the event page for event {eventId}</h1>
      </>
    );
  }
}

export default function EventPage(): JSX.Element {
  const eventId = useEventId();
  return (
    <>
      <p>
        Back to the <Link href="/events">events list</Link>
      </p>
      <EventBody eventId={eventId} />
    </>
  );
}
