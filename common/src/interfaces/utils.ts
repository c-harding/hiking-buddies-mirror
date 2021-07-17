type Entries<T> = {
  [K in keyof T]: readonly [K, T[K]];
}[keyof T][];

export function entries<T extends Record<string, unknown>>(obj: T): Entries<T> {
  return Object.entries(obj) as Entries<T>;
}

export function fromEntries<T extends Record<string, unknown>>(obj: Entries<T>): T {
  return Object.fromEntries(obj) as T;
}

export function keys<T extends Record<string, unknown>>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

export function mapObject<A extends Record<string, unknown>, B extends Record<keyof A, unknown>>(
  obj: A,
  f: <K extends keyof A>(x: A[K]) => B[K],
): B {
  return fromEntries<B>(keys(obj).map((key) => [key, f(obj[key])]));
}

type Defined<T> = T extends undefined ? never : T;

export function notUndefined<T>(value: T): value is Defined<T> {
  return value !== undefined;
}

export function sndNotUndefined<S, T>(value: [S, T]): value is [S, Defined<T>] {
  return value[1] !== undefined;
}
