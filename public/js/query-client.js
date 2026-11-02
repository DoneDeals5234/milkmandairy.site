/**
 * TanStack Query Inspired Client-Side Cache & Data Management
 * Eliminates redundant database fetches, loading screens, and enables
 * optimistic UI updates and granular component-level re-rendering.
 */
class QueryClient {
    constructor() {
        this.cache = new Map();
        this.inFlight = new Map();
        this.subscribers = new Map();
    }

    getQueryData(queryKey) {
        const entry = this.cache.get(queryKey);
        return entry ? entry.data : undefined;
    }

    setQueryData(queryKey, updater) {
        const oldData = this.getQueryData(queryKey);
        const newData = typeof updater === 'function' ? updater(oldData) : updater;
        this.cache.set(queryKey, {
            data: newData,
            timestamp: Date.now()
        });
        this.notify(queryKey, newData);
        return newData;
    }

    invalidateQueries(queryKeyPattern) {
        if (!queryKeyPattern) {
            this.cache.clear();
            return;
        }
        for (const [key] of this.cache) {
            if (key === queryKeyPattern || key.startsWith(queryKeyPattern)) {
                this.cache.delete(key);
            }
        }
    }

    async fetchQuery({ queryKey, queryFn, staleTime = 60000, force = false }) {
        const cached = this.cache.get(queryKey);
        const isFresh = cached && (Date.now() - cached.timestamp < staleTime);

        if (!force && isFresh) {
            return cached.data;
        }

        // Stale-While-Revalidate: Return stale cached data immediately to keep UI fast & responsive,
        // then fetch fresh data silently in background without showing any loading spinner!
        if (!force && cached) {
            this.revalidateInBackground(queryKey, queryFn);
            return cached.data;
        }

        // Deduplicate in-flight requests for same key
        if (this.inFlight.has(queryKey)) {
            return this.inFlight.get(queryKey);
        }

        const promise = (async () => {
            try {
                const data = await queryFn();
                this.setQueryData(queryKey, data);
                return data;
            } finally {
                this.inFlight.delete(queryKey);
            }
        })();

        this.inFlight.set(queryKey, promise);
        return promise;
    }

    async revalidateInBackground(queryKey, queryFn) {
        if (this.inFlight.has(queryKey)) return;
        try {
            const data = await queryFn();
            const oldData = this.getQueryData(queryKey);
            if (JSON.stringify(data) !== JSON.stringify(oldData)) {
                this.setQueryData(queryKey, data);
            }
        } catch (e) {
            console.warn(`[QueryClient] Background revalidate error for ${queryKey}:`, e);
        }
    }

    subscribe(queryKey, callback) {
        if (!this.subscribers.has(queryKey)) {
            this.subscribers.set(queryKey, new Set());
        }
        this.subscribers.get(queryKey).add(callback);
        return () => this.subscribers.get(queryKey)?.delete(callback);
    }

    notify(queryKey, data) {
        const listeners = this.subscribers.get(queryKey);
        if (listeners) {
            listeners.forEach(cb => {
                try { cb(data); } catch (e) { console.error(e); }
            });
        }
    }
}

window.queryClient = new QueryClient();
