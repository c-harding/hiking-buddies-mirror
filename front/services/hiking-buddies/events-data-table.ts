export type DataTableRow = [
  index: number,
  title: string,
  grade: string,
  organizer: string,
  dateParts: string,
  id: number,
  status: string,
];

export interface DataTableResponse {
  data: DataTableRow[];
  recordsFiltered: number;
  draw: number;
  recordsTotal: number;
}
