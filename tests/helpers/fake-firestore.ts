/** A tiny in-memory Firestore (docs, subcollections, merge, queries, transactions) for server tests. */
type Doc = Record<string, any>;

export function createFakeFirestore() {
  const docs = new Map<string, Doc>();
  const clone = <T,>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

  function docRef(path: string): any {
    return {
      path,
      id: path.split("/").pop(),
      collection: (name: string) => collectionRef(`${path}/${name}`),
      async get() {
        const d = docs.get(path);
        return { exists: d !== undefined, id: path.split("/").pop(), data: () => clone(d) };
      },
      async set(v: Doc, opts?: { merge?: boolean }) {
        docs.set(path, opts?.merge ? { ...(docs.get(path) || {}), ...clone(v) } : clone(v));
      },
      async update(v: Doc) {
        if (!docs.has(path)) throw new Error(`no doc ${path}`);
        docs.set(path, { ...docs.get(path), ...clone(v) });
      },
      async delete() {
        docs.delete(path);
      },
    };
  }

  function query(col: string, filters: [string, unknown][] = [], max = Infinity): any {
    const depth = col.split("/").length + 1;
    return {
      where: (field: string, _op: string, value: unknown) => query(col, [...filters, [field, value]], max),
      limit: (n: number) => query(col, filters, n),
      async get() {
        const found = [...docs.entries()]
          .filter(([p, d]) => p.startsWith(`${col}/`) && p.split("/").length === depth && filters.every(([f, v]) => d[f] === v))
          .slice(0, max)
          .map(([p, d]) => ({ id: p.split("/").pop(), data: () => clone(d) }));
        return { empty: found.length === 0, size: found.length, docs: found };
      },
    };
  }

  function collectionRef(col: string): any {
    return { doc: (id: string) => docRef(`${col}/${id}`), ...query(col) };
  }

  const db = {
    collection: (name: string) => collectionRef(name),
    async runTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
      // writes are queued and applied only if the body succeeds, like Firestore
      const queued: (() => Promise<void>)[] = [];
      const result = await fn({
        get: (ref: any) => ref.get(),
        set: (ref: any, v: Doc, opts?: { merge?: boolean }) => queued.push(() => ref.set(v, opts)),
        update: (ref: any, v: Doc) => queued.push(() => ref.update(v)),
        delete: (ref: any) => queued.push(() => ref.delete()),
      });
      for (const w of queued) await w();
      return result;
    },
  };

  /** The store as the app sees it: public document plus private one. */
  const storeView = (sub: string) => ({ ...(docs.get(`stores/${sub}`) || {}), ...(docs.get(`stores/${sub}/private/data`) || {}) });

  return { db, docs, clone, storeView };
}
