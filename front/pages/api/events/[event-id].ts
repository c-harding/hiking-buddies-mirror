// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';

import { EventDetails } from '../../../services/hiking-buddies/event-details';
import getEventDetails from '../../../services/hiking-buddies/single-event';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EventDetails | undefined>,
): Promise<void> {
  try {
    const eventIdString = req.query['event-id'];
    let eventId: number;
    if (typeof eventIdString !== 'string' || isNaN((eventId = parseInt(eventIdString)))) {
      res.status(400).send(undefined);
      return;
    }
    const event = await getEventDetails(eventId);

    if (event === null) {
      res.status(404).send(undefined);
      return;
    }

    res.setHeader('Cache-Control', 'public, max-age=600');
    res.status(200).json(event);
  } catch (e) {
    console.error(e);
    res.status(500).json(e);
  }
}
