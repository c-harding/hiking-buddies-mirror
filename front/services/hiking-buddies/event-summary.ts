import { DataTableRow } from './events-data-table';

export interface RawEventSummary {
  readonly id: number;
  readonly title: string;
  readonly grade: string;
  readonly organizer: string;
  readonly date: string;
  readonly status: string;
}

export class EventSummary {
  private constructor(
    readonly id: number,
    readonly title: string,
    readonly grade: string,
    readonly organizer: string,
    readonly date: Date,
    readonly status: string,
  ) {}

  toString(): string {
    return `Event #${this.id}: ${this.title} (${this.grade}) organized by ${
      this.organizer
    } and taking place on ${this.date.toLocaleString(undefined, {
      dateStyle: 'full',
      timeStyle: 'short',
    })}`;
  }

  static fromRaw(raw: RawEventSummary): EventSummary {
    return new EventSummary(
      raw.id,
      raw.title,
      raw.grade,
      raw.organizer,
      new Date(raw.date),
      raw.status,
    );
  }

  static fromDataTable([
    _index,
    title,
    grade,
    organizer,
    dateParts,
    id,
    status,
  ]: DataTableRow): EventSummary {
    return new EventSummary(id, title, grade, organizer, this.parseDate(dateParts), status);
  }

  private static parseDate(dateParts: string): Date {
    const [_weekday, day, month, year, hour, min] = dateParts.split(',');
    return new Date(+year, +month - 1, +day, +hour, +min);
  }
}
