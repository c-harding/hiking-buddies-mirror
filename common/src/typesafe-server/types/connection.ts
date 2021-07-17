import { AnyEndpoint, Endpoint } from '../endpoint';
import { RequiredParameterObject, ParameterObject } from '../parameter-universe';
import { HttpVerb } from './http-enums';

export type Handler<E extends AnyEndpoint> = E extends Endpoint<
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

export type Caller<E extends AnyEndpoint> = E extends Endpoint<
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

export type Handlers<Server extends Record<string, AnyEndpoint>> = {
  readonly [K in keyof Server]: Handler<Server[K]>;
};

export type Client<Server extends Record<string, AnyEndpoint>> = {
  readonly [K in keyof Server]: Caller<Server[K]>;
};
