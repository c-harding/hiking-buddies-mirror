import { HTMLElement, NodeType, parse } from 'node-html-parser';

import { EventDetails } from './event-details';

class PageParser {
  constructor(private id: number, private page: HTMLElement) {}

  private inputValue(selectorId: string, fallback?: string): string {
    const selector = `#${selectorId}`;
    const inputElement = this.page.querySelector(selector);
    if (inputElement === null) {
      console.warn('Element', selector, 'not found when scraping event', this.id);
      return fallback ?? 'Not found';
    }
    return inputElement.getAttribute('value') ?? '';
  }

  private textArea(selectorId: string, fallback?: string): string {
    const selector = `#${selectorId}`;
    const inputElement = this.page.querySelector(selector);
    if (inputElement === null) {
      console.warn('Element', selector, 'not found when scraping event', this.id);
      return fallback ?? 'Not found';
    }
    return inputElement.textContent;
  }

  private static removeBlankHtml(snippet: string): string {
    const htmlContent = parse(snippet);
    if (htmlContent.rawText.trim() === '') {
      // querySelectorAll also matches text nodes, which may be blank
      // If there are no elements other than p, div and br, and there is no text, then the box is blank
      // This is because e.g. images could be included without text.
      const found = htmlContent
        .querySelectorAll(':not(div):not(p):not(br)')
        .filter((x) => x.nodeType === NodeType.ELEMENT_NODE);
      if (found.length === 0) {
        return '';
      }
    }
    return snippet;
  }

  eventDetails(): EventDetails {
    return {
      id: this.id,
      eventTitle: this.inputValue('id_event_name'),
      meetingPoint: this.inputValue('id_meeting_point'),
      eventStart: PageParser.parseSwedishDate(this.inputValue('id_start', '1970-01-01 00:00:00')),
      maxParticipants: +this.inputValue('id_max_participants'),
      numOfDays: +this.inputValue('id_num_of_days'),
      description: PageParser.removeBlankHtml(this.textArea('id_description')),
      instructions: PageParser.removeBlankHtml(this.textArea('id_instructions')),
    };
  }

  // Swedish date chosen to guarantee YMD
  private static parseSwedishDate(dateString: string): Date {
    const [year, month, date, hour, minute, second] = dateString.split(/[-: ]/).map(Number);
    return new Date(year, month - 1, date, hour, minute, second);
  }
}

export default async function getEventDetails(id: number): Promise<EventDetails | null> {
  const url = `https://www.hiking-buddies.com/routes/events/${id}/`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'se-SE' } });
  if (res.status !== 200) return null;
  const page: HTMLElement = parse(await res.text());
  return new PageParser(id, page).eventDetails();
}
