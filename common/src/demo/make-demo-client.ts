import { HttpCode, HttpVerb } from '../typesafe-server/types/http-enums';
import { fromEntries, keys, mapObject, sndNotUndefined } from '../utils';
import { AnyEndpoint } from '../typesafe-server/endpoint';
import { ParameterObject } from '../typesafe-server/parameter-universe';
import { Caller, Client, Handlers } from '../typesafe-server/types/connection';

export function makeDemoClient<Server extends Record<string, AnyEndpoint>>(
  server: Server,
  handlers: Handlers<Server>,
): Client<Server> {
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
    const queryParameterStrings = fromEntries<Record<string, string>>(
      qsa.split('&').map<[string, string]>((q) => {
        const [k, v = ''] = q.split('=', 2);
        return [k, v];
      }),
    );
    for (const key of keys(handlers)) {
      const endpoint = server[key];
      if (method !== endpoint.method) continue;
      const pathParameters = endpoint.path.parseUrl(path);
      if (!pathParameters) continue;
      const queryParameters = mapObject<Record<string, string>, Record<string, unknown>>(
        queryParameterStrings,
        (string, k) => {
          const parameter = endpoint.queryParameters.find((param) => param.name === k);
          if (!parameter) {
            throw new Error(`Unknown query parameter "${k}"`);
          }
          return parameter.type.decode(string);
        },
      ) as ParameterObject<Server[typeof key]['queryParameters']>;
      const { code, body } = handlers[key](pathParameters, queryParameters, readBody);
      return { code, body: JSON.stringify(body) };
    }
    throw new Error('Nothing received');
  }

  const client: Client<Server> = mapObject(
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
      }) as Caller<Server[K]>,
  );

  return client;
}
