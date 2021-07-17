export enum HttpVerb {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export enum HttpCode {
  CONTINUE = 100, //	Continue
  SWITCHING_PROTOCOLS = 101, //	Switching Protocols
  PROCESSING = 102, //	Processing
  OK = 200, //	OK
  CREATED = 201, //	Created
  ACCEPTED = 202, //	Accepted
  NON_AUTHORITATIVE_INFORMATION = 203, //	Non Authoritative Information
  NO_CONTENT = 204, //	No Content
  RESET_CONTENT = 205, //	Reset Content
  PARTIAL_CONTENT = 206, //	Partial Content
  MULTI_STATUS = 207, //	Multi-Status
  MULTIPLE_CHOICES = 300, //	Multiple Choices
  MOVED_PERMANENTLY = 301, //	Moved Permanently
  MOVED_TEMPORARILY = 302, //	Moved Temporarily
  SEE_OTHER = 303, //	See Other
  NOT_MODIFIED = 304, //	Not Modified
  USE_PROXY = 305, //	Use Proxy
  TEMPORARY_REDIRECT = 307, //	Temporary Redirect
  PERMANENT_REDIRECT = 308, //	Permanent Redirect
  BAD_REQUEST = 400, //	Bad Request
  UNAUTHORIZED = 401, //	Unauthorized
  PAYMENT_REQUIRED = 402, //	Payment Required
  FORBIDDEN = 403, //	Forbidden
  NOT_FOUND = 404, //	Not Found
  METHOD_NOT_ALLOWED = 405, //	Method Not Allowed
  NOT_ACCEPTABLE = 406, //	Not Acceptable
  PROXY_AUTHENTICATION_REQUIRED = 407, //	Proxy Authentication Required
  REQUEST_TIMEOUT = 408, //	Request Timeout
  CONFLICT = 409, //	Conflict
  GONE = 410, //	Gone
  LENGTH_REQUIRED = 411, //	Length Required
  PRECONDITION_FAILED = 412, //	Precondition Failed
  REQUEST_TOO_LONG = 413, //	Request Entity Too Large
  REQUEST_URI_TOO_LONG = 414, //	Request-URI Too Long
  UNSUPPORTED_MEDIA_TYPE = 415, //	Unsupported Media Type
  REQUESTED_RANGE_NOT_SATISFIABLE = 416, //	Requested Range Not Satisfiable
  EXPECTATION_FAILED = 417, //	Expectation Failed
  IM_A_TEAPOT = 418, //	I'm a teapot
  INSUFFICIENT_SPACE_ON_RESOURCE = 419, //	Insufficient Space on Resource
  METHOD_FAILURE = 420, //	Method Failure
  UNPROCESSABLE_ENTITY = 422, //	Unprocessable Entity
  LOCKED = 423, //	Locked
  FAILED_DEPENDENCY = 424, //	Failed Dependency
  PRECONDITION_REQUIRED = 428, //	Precondition Required
  TOO_MANY_REQUESTS = 429, //	Too Many Requests
  REQUEST_HEADER_FIELDS_TOO_LARGE = 431, //	Request Header Fields Too Large
  UNAVAILABLE_FOR_LEGAL_REASONS = 451, //	Unavailable For Legal Reasons
  INTERNAL_SERVER_ERROR = 500, //	Internal Server Error
  NOT_IMPLEMENTED = 501, //	Not Implemented
  BAD_GATEWAY = 502, //	Bad Gateway
  SERVICE_UNAVAILABLE = 503, //	Service Unavailable
  GATEWAY_TIMEOUT = 504, //	Gateway Timeout
  HTTP_VERSION_NOT_SUPPORTED = 505, //	HTTP Version Not Supported
  INSUFFICIENT_STORAGE = 507, //	Insufficient Storage
  NETWORK_AUTHENTICATION_REQUIRED = 511, //	Network Authentication Required
}

export enum TypeRepr {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
}

export type TypeOf<T extends TypeRepr> = {
  [TypeRepr.BOOLEAN]: boolean;
  [TypeRepr.NUMBER]: number;
  [TypeRepr.STRING]: string;
}[T];

export interface Parameter<
  T extends TypeRepr = TypeRepr,
  N extends string = string,
  R extends boolean = boolean,
> {
  name: N;
  type: ParameterType<T, R>;
}
export interface ParameterType<T extends TypeRepr = TypeRepr, R extends boolean = boolean> {
  type: T;
  required: R;
  encode(value: TypeOf<T>): string;
  decode(encoded: string): TypeOf<T>;
}
export type RequiredParameterType<T extends TypeRepr = TypeRepr> = ParameterType<T, true>;
export type RequiredParameter<T extends TypeRepr = TypeRepr, N extends string = string> = Parameter<
  T,
  N,
  true
>;

export type TypeOfParameter<P extends ParameterType> = P extends { type: infer T }
  ? T extends TypeRepr
    ? P extends { required: false }
      ? TypeOf<T> | undefined
      : TypeOf<T>
    : never
  : never;

function encodeString(value: string): string {
  return encodeURIComponent(value);
}
function decodeString(value: string): string {
  return decodeURIComponent(value);
}
function encodeNumber(value: number): string {
  return encodeURIComponent(value);
}
function decodeNumber(value: string): number {
  return +decodeURIComponent(value);
}
function encodeBool(value: boolean): string {
  return encodeURIComponent(value ? 't' : 'f');
}
function decodeBool(value: string): boolean {
  return decodeURIComponent(value) === 't';
}

export function string<N extends string>(name: N): Parameter<TypeRepr.STRING, N, true> {
  return {
    name,
    type: { type: TypeRepr.STRING, required: true, decode: decodeString, encode: encodeString },
  };
}

export function boolean<N extends string>(name: N): Parameter<TypeRepr.BOOLEAN, N, true> {
  return {
    name,
    type: { type: TypeRepr.BOOLEAN, required: true, decode: decodeBool, encode: encodeBool },
  };
}

export function number<N extends string>(name: N): Parameter<TypeRepr.NUMBER, N, true> {
  return {
    name,
    type: { type: TypeRepr.NUMBER, required: true, decode: decodeNumber, encode: encodeNumber },
  };
}

export function optional<N extends string, T extends TypeRepr>(
  parameter: Parameter<T, N, true>,
): Parameter<T, N, false> {
  return { name: parameter.name, type: { ...parameter.type, required: false } };
}

export function parameterToString(parameter: Parameter): string {
  const baseType = `${parameter.type.type}("${parameter.name}")`;
  return parameter.type.required ? baseType : `optional(${baseType})`;
}

export type ParameterTypeToArray<T extends Record<string, unknown>> = {
  [K in keyof T]: { name: K; type: T[K] };
}[keyof T & string][];

export type ParameterTypeFromArray<T extends readonly Parameter[]> = {
  [K in T[number] as K['name']]: K['type'] & ParameterType;
};

export function parameterTypeFromArray<ParameterArray extends readonly Parameter[]>(
  array: ParameterArray,
): ParameterTypeFromArray<ParameterArray> {
  return Object.fromEntries(
    array.map(({ name, type }) => [name, type]),
  ) as ParameterTypeFromArray<ParameterArray>;
}

export type RawParameterType<P extends ParameterType> = TypeOf<P['type']>;

export type RequiredParameterObject<T extends readonly RequiredParameter[]> = {
  [K in T[number] as K['name']]: TypeOfParameter<K['type']>;
};

export type ParameterObject<T extends readonly Parameter[]> = {
  [K in T[number] as K['type']['required'] extends true ? K['name'] : never]-?: TypeOfParameter<
    K['type']
  >;
} &
  {
    [K in T[number] as K['type']['required'] extends true ? never : K['name']]?: TypeOfParameter<
      K['type']
    >;
  };
