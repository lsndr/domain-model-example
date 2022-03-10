type Dictionary<E extends object> = {
  [P in keyof E]: E[P] extends object
    ? Dictionary<E[P]>
    :
        | string
        | number
        | undefined
        | null
        | (
            | string
            | number
            | null
            | undefined
            | Dictionary<Record<string, string | number | undefined | null>>
          )[];
};

export type IEvent<E extends object> = Dictionary<E>;

export type IEventConstructor<
  E extends IEvent<E>,
  C extends { new (...args: any): E } = { new (...args: any): E },
> = C extends {
  new (...args: infer P): E;
}
  ? {
      channel: string;

      new (...args: P): E;
    }
  : never;
