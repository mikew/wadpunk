type ArrayItemType<T> = T extends Array<infer A> ? A : never
