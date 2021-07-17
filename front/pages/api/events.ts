// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';

import { EventSummary } from '../../services/hiking-buddies/event-summary';
import { getUpcomingEvents } from '../../services/hiking-buddies/events-list';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EventSummary[]>,
): Promise<void> {
  try {
    const events = await getUpcomingEvents();

    res.setHeader('Cache-Control', 'public, max-age=60');
    res.status(200).json(events);
  } catch (e) {
    console.error(e);
    res.status(500).json(e);
  }
}
