import { RequiredParameter } from '../parameter-universe';

export enum PathSegmentType {
  LITERAL,
  PARAMETER,
}

export type PathSegment<PathParameters extends readonly RequiredParameter[]> =
  | { type: PathSegmentType.LITERAL; string: string }
  | { type: PathSegmentType.PARAMETER; name: PathParameters[number]['name'] };
