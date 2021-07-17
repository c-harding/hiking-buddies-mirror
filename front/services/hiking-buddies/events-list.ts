import { EventSummary } from './event-summary';
import { DataTableResponse } from './events-data-table';

const upcomingEvents = (length = 10, start = 0): string =>
  `https://www.hiking-buddies.com/routes/event_list/get_event_list/?draw=1&start=${start}&length=${length}&id=id_future`;

export async function getUpcomingEvents(): Promise<EventSummary[]> {
  const hbResponse = await fetch(upcomingEvents(100));
  const tableResponse = (await hbResponse.json()) as DataTableResponse;
  return tableResponse.data.map((row) => EventSummary.fromDataTable(row));
}
