/* eslint-disable max-classes-per-file -- these two classes are mutually recursive */
import { PathSegment, PathSegmentType } from './types/path-segment';
import { HttpVerb, HttpCode } from './types/http-enums';
import {
  RequiredParameter,
  Parameter,
  ParameterTypeFromArray,
  parameterTypeFromArray,
  parameterToString,
  RawParameterType,
  RequiredParameterObject,
} from './parameter-universe';

export class Endpoint<
  Verb extends HttpVerb,
  PathParameters extends readonly RequiredParameter[],
  QueryParameters extends readonly Parameter[],
  Body = void,
  Responses extends { readonly code: HttpCode; readonly body: unknown } = never,
> {
  private constructor(
    public readonly path: Path<PathParameters>,
    public readonly method: Verb,
    public readonly queryParameters: QueryParameters,
  ) {}

  withQueryParameters<NewQueryParameters extends Parameter[]>(
    ...queryParameters: NewQueryParameters
  ): Endpoint<Verb, PathParameters, NewQueryParameters> {
    queryParameters.forEach((parameter) => {
      if (parameter.name in this.path.pathParameters) {
        throw new Error(
          `Parameter name ${parameter.name} as both a path parameter and a query string parameter`,
        );
      }
    });
    return new Endpoint(this.path, this.method, queryParameters);
  }

  toString(): string {
    return `${this.method} ${this.path.toString()}`;
  }

  response<C extends number, T = void>(): Endpoint<
    Verb,
    PathParameters,
    QueryParameters,
    Body,
    Responses | { code: C; body: T }
  > {
    return this;
  }

  static new<Verb extends HttpVerb, PathParameters extends readonly RequiredParameter[]>(
    path: Path<PathParameters>,
    method: Verb,
  ): Endpoint<Verb, PathParameters, [], void, never> {
    return new Endpoint(path, method, []);
  }
}

class Path<PathParameters extends readonly RequiredParameter[]> {
  private readonly asString: string;

  private readonly segments: readonly PathSegment<PathParameters>[];

  readonly pathParameters: ParameterTypeFromArray<PathParameters>;

  toString() {
    return this.asString;
  }

  /**
   * This constructor is only used by the function `url`, and is produced by a typed template string.
   *
   * @param strings Every literal part of the string
   * @param ids Every interpolated value
   */
  constructor(readonly strings: TemplateStringsArray, ...pathParameters: PathParameters) {
    // ids.length === strings.length - 1

    this.pathParameters = parameterTypeFromArray(pathParameters);
    const segments: PathSegment<PathParameters>[] = [];
    const asString = strings
      .map((string, i) =>
        i === strings.length - 1 ? string : `${string}\${${parameterToString(pathParameters[i])}}`,
      )
      .join('');
    this.asString = asString;
    if (asString[0] !== '/') {
      throw new Error(`Path must start with a slash, in url\`${asString}\``);
    }
    strings.forEach((string, i) => {
      const isLastString = i === strings.length - 1;
      if (isLastString && string === '') {
        // The last segment is allowed to be empty
        return;
      }
      if (string[0] !== '/') {
        // i !== 0, because this case was checked before the forEach loop
        throw new Error(
          `Slash expected after ${pathParameters[i - 1].name}, in url\`${asString}\` @${i}`,
        );
      }
      if (!isLastString && string[string.length - 1] !== '/') {
        throw new Error(
          `Slash expected before ${pathParameters[i].name}, in url\`${asString}\` @${i}`,
        );
      }
      const stringToSegments = string.split('/').slice(1);
      stringToSegments.forEach((segment) => {
        segments.push({ type: PathSegmentType.LITERAL, string: segment });
      });
      if (!isLastString) {
        segments[segments.length - 1] = {
          type: PathSegmentType.PARAMETER,
          name: pathParameters[i].name,
        };
      }
    });

    this.segments = segments;
  }

  private encodeValue<K extends keyof ParameterTypeFromArray<PathParameters>>(
    key: K,
    value: RawParameterType<ParameterTypeFromArray<PathParameters>[K]>,
  ): string {
    const pathParameter: ParameterTypeFromArray<PathParameters>[K] = this.pathParameters[key];
    return pathParameter.encode(value);
  }

  private decodeValue<K extends keyof ParameterTypeFromArray<PathParameters>>(
    key: K,
    encodedValue: string,
  ): RawParameterType<ParameterTypeFromArray<PathParameters>[K]> {
    const pathParameter: ParameterTypeFromArray<PathParameters>[K] = this.pathParameters[key];
    return pathParameter.decode(encodedValue) as RawParameterType<
      ParameterTypeFromArray<PathParameters>[K]
    >;
  }

  parseUrl(receivedUrl: string): RequiredParameterObject<PathParameters> | undefined {
    if (!receivedUrl.startsWith('/')) {
      throw new Error('Invalid URL received, no leading `/`');
    }
    const receivedUrlSegments = receivedUrl.slice(1).split('/');
    if (receivedUrlSegments.length !== this.segments.length) {
      return undefined;
    }
    const values: RequiredParameterObject<PathParameters> =
      {} as RequiredParameterObject<PathParameters>;
    for (let i = 0; i < receivedUrlSegments.length; i += 1) {
      const segment = this.segments[i];
      const receivedUrlSegment = receivedUrlSegments[i];
      if (segment.type === PathSegmentType.LITERAL) {
        if (receivedUrlSegment !== segment.string) {
          return undefined;
        }
      } else {
        values[segment.name] = this.decodeValue(
          segment.name,
          receivedUrlSegment,
        ) as RequiredParameterObject<PathParameters>[PathParameters[number]['name']];
      }
    }
    return values;
  }

  buildUrl(parameters: RequiredParameterObject<PathParameters>) {
    return `/${this.segments
      .map((segment) => {
        if (segment.type === PathSegmentType.LITERAL) {
          return segment.string;
        }
        return this.encodeValue(segment.name, parameters[segment.name]);
      })
      .join('/')}`;
  }

  get(): Endpoint<HttpVerb.GET, PathParameters, []> {
    return Endpoint.new(this, HttpVerb.GET);
  }

  post<Body = void>(): Endpoint<HttpVerb.POST, PathParameters, [], Body> {
    return Endpoint.new(this, HttpVerb.POST);
  }

  put<Body = void>(): Endpoint<HttpVerb.PUT, PathParameters, [], Body> {
    return Endpoint.new(this, HttpVerb.PUT);
  }

  patch<Body = void>(): Endpoint<HttpVerb.PATCH, PathParameters, [], Body> {
    return Endpoint.new(this, HttpVerb.PATCH);
  }

  delete<Body = void>(): Endpoint<HttpVerb.DELETE, PathParameters, [], Body> {
    return Endpoint.new(this, HttpVerb.DELETE);
  }
}

export function url<PathParameters extends readonly RequiredParameter[]>(
  strings: TemplateStringsArray,
  ...ids: PathParameters
): Path<PathParameters> {
  return new Path(strings, ...ids);
}

export type AnyEndpoint = Endpoint<
  HttpVerb,
  readonly RequiredParameter[],
  readonly Parameter[],
  unknown,
  { readonly code: HttpCode; readonly body: unknown }
>;
