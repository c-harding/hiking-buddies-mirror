/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-continue */
/* eslint-disable max-classes-per-file, @typescript-eslint/no-use-before-define */
import {
  HttpCode,
  HttpVerb,
  number,
  parameterToString,
  parameterTypeFromArray,
  RawParameterType,
  RequiredParameter,
  RequiredParameterObject,
  ParameterTypeFromArray,
  Parameter,
  ParameterObject,
  optional,
} from './http-enums';
import { keys, mapObject, sndNotUndefined } from './utils';

enum PathSegmentType {
  LITERAL,
  PARAMETER,
}
type PathSegment<PathParameters extends readonly RequiredParameter[]> =
  | { type: PathSegmentType.LITERAL; string: string }
  | { type: PathSegmentType.PARAMETER; name: PathParameters[number]['name'] };

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
    return new Endpoint(this, HttpVerb.GET);
  }

  post<Body = void>(): Endpoint<HttpVerb.POST, PathParameters, [], Body> {
    return new Endpoint(this, HttpVerb.POST);
  }

  put<Body = void>(): Endpoint<HttpVerb.PUT, PathParameters, [], Body> {
    return new Endpoint(this, HttpVerb.PUT);
  }

  patch<Body = void>(): Endpoint<HttpVerb.PATCH, PathParameters, [], Body> {
    return new Endpoint(this, HttpVerb.PATCH);
  }

  delete<Body = void>(): Endpoint<HttpVerb.DELETE, PathParameters, [], Body> {
    return new Endpoint(this, HttpVerb.DELETE);
  }
}

function url<PathParameters extends readonly RequiredParameter[]>(
  strings: TemplateStringsArray,
  ...ids: PathParameters
): Path<PathParameters> {
  return new Path(strings, ...ids);
}

class Endpoint<
  Verb extends HttpVerb,
  PathParameters extends readonly RequiredParameter[],
  QueryParameters extends readonly Parameter[],
  Body = void,
  Responses extends { readonly code: HttpCode; readonly body: unknown } = never,
> {
  constructor(public readonly path: Path<PathParameters>, public readonly method: Verb) {}

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
    return this;
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
}

interface Event {
  id: number;
  description: string;
}

type AnyEndpoint = Endpoint<
  HttpVerb,
  readonly RequiredParameter[],
  readonly Parameter[],
  unknown,
  { readonly code: HttpCode; readonly body: unknown }
>;

type MakeHandler<E extends AnyEndpoint> = E extends Endpoint<
  HttpVerb,
  infer PathParameters,
  infer QueryParameters,
  infer Body,
  infer Response
>
  ? (
      pathParams: RequiredParameterObject<PathParameters>,
      queryParams: ParameterObject<QueryParameters>,
      readBody: () => Body,
    ) => Response
  : never;

type MakeCaller<E extends AnyEndpoint> = E extends Endpoint<
  HttpVerb,
  infer PathParameters,
  infer QueryParameters,
  infer Body,
  infer Response
>
  ? undefined extends Body
    ? (
        pathParams: RequiredParameterObject<PathParameters>,
        queryParams: ParameterObject<QueryParameters>,
        body?: Body,
      ) => Promise<Response>
    : (
        pathParams: RequiredParameterObject<PathParameters>,
        queryParams: ParameterObject<QueryParameters>,
        body: Body,
      ) => Promise<Response>
  : never;

type Handlers<Server extends Record<string, AnyEndpoint>> = {
  readonly [K in keyof Server]: MakeHandler<Server[K]>;
};

type Frontend<Server extends Record<string, AnyEndpoint>> = {
  readonly [K in keyof Server]: MakeCaller<Server[K]>;
};

function makeLocalServerPair<Server extends Record<string, AnyEndpoint>>(
  server: Server,
  handlers: Handlers<Server>,
): Frontend<Server> {
  function receiveRequest(
    receivedUrl: string,
    method: HttpVerb,
    requestBody?: string,
  ): { readonly code: HttpCode; readonly body: string } {
    const readBody = <T>(): T => {
      if (!requestBody) {
        throw new Error(`No body provided in request to ${method} ${receivedUrl}`);
      }
      return JSON.parse(requestBody) as T;
    };

    const [path, qsa = ''] = receivedUrl.split('?', 2);
    const queryParameters = Object.fromEntries<string>(
      qsa.split('&').map<[string, string]>((q) => {
        const [k, v = ''] = q.split('=', 2);
        return [k, v];
      }),
    );
    // eslint-disable-next-line no-restricted-syntax
    for (const key of keys(handlers)) {
      const endpoint = server[key];
      if (method !== endpoint.method) continue;
      const pathParameters = endpoint.path.parseUrl(path);
      if (!pathParameters) continue;
      const { code, body } = handlers[key](pathParameters, queryParameters, readBody);
      return { code, body: JSON.stringify(body) };
    }
    throw new Error('Nothing received');
  }

  const frontend: Frontend<Server> = mapObject(
    server,
    <K extends keyof Server>(endpoint: Server[K]) =>
      ((pathParameters, queryParameters, body?) => {
        const qsa = Object.entries(queryParameters)
          .filter(sndNotUndefined)
          .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
          .join('&');
        let path = endpoint.path.buildUrl(pathParameters);
        if (qsa) {
          path += `?${qsa}`;
        }
        const { code, body: bodyString } = receiveRequest(
          path,
          endpoint.method,
          body === undefined ? body : JSON.stringify(body),
        );

        return Promise.resolve({ code, body: JSON.parse(bodyString) as Response });
      }) as MakeCaller<Server[K]>,
  );

  return frontend;
}

const makeEvent = (i: number) => ({
  id: i + 1,
  description: `route number ${i + 1}`,
});

const range = (upTo: number): number[] => Array.from({ length: +upTo }, (_, i) => i);

const myServer = {
  simpleEndpoint: url`/routes`
    .get()
    .withQueryParameters(optional(number('pageSize')))
    .response<200, Event[]>()
    .response<404, string>(),

  parameterizedEndpoint: url`/route/${number('id')}`
    .get()
    .response<200, Event>()
    .response<404, string>(),

  editComment: url`/event/${number('id')}/comment/${number('commentId')}`
    .put<{ commentText: string }>()
    .response<204>()
    .response<404, string>(),
};

const frontend = makeLocalServerPair(myServer, {
  editComment: ({ id, commentId }, _, readBody) => {
    console.log(id, commentId, readBody());
    return {
      code: 204,
      body: undefined,
    };
  },

  simpleEndpoint: (_, { pageSize = 10 }) => ({
    code: 200,
    body: range(pageSize).map((i) => makeEvent(i)),
  }),
  parameterizedEndpoint: ({ id }) => ({
    code: 404,
    body: `Cannot find route with ID ${id}`,
  }),
});

frontend
  .simpleEndpoint({}, { pageSize: 3 })
  .then((value) => {
    console.log('simple endpoint returned', value.code, value.body);
  })
  .catch((e) => {
    console.log('could not send to simple endpoint,', e);
  });

frontend
  .parameterizedEndpoint({ id: 20 }, {})
  .then((value) => {
    console.log('parameterized endpoint returned', value.code, value.body);
  })
  .catch((e) => {
    console.log('could not send to parameterized endpoint,', e);
  });
