export interface RawEventDetails {
  readonly id: number;
  readonly eventTitle: string;
  readonly meetingPoint: string;
  readonly eventStart: string;
  readonly maxParticipants: number;
  readonly numOfDays: number;
  readonly description: string;
  readonly instructions: string;
}

export class EventDetails {
  constructor(
    readonly id: number,
    readonly eventTitle: string,
    readonly meetingPoint: string,
    readonly eventStart: Date,
    readonly maxParticipants: number,
    readonly numOfDays: number,
    readonly description: string,
    readonly instructions: string,
  ) {}

  static fromRaw(raw: RawEventDetails): EventDetails {
    return new EventDetails(
      raw.id,
      raw.eventTitle,
      raw.meetingPoint,
      new Date(raw.eventStart),
      raw.maxParticipants,
      raw.numOfDays,
      raw.description,
      raw.instructions,
    );
  }
}
