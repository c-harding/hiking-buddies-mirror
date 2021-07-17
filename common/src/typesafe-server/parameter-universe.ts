/**
 * A universe is a runtime representation of types.
 * In this case we use an enum TypeRepr to represent the basic types string, number and boolean,
 * as well as wrappers to allow them to be made optional.
 */

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
