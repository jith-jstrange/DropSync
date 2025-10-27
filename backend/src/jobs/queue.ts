// Lightweight in-memory queue to avoid paid Redis services. This is not distributed
// but works for single-node deployments. It mimics a subset of BullMQ API used here.

export type Job<Data> = { id: string; name: string; data: Data; attemptsMade: number };

export class InMemoryQueue<Data = any> {
  private name: string;
  private concurrency: number;
  private processing = 0;
  private queue: Job<Data>[] = [];
  private processor?: (job: Job<Data>) => Promise<void>;

  constructor(name: string, concurrency = 2) {
    this.name = name;
    this.concurrency = concurrency;
  }

  process(processor: (job: Job<Data>) => Promise<void>) {
    this.processor = processor;
    this.drain();
  }

  async add(name: string, data: Data): Promise<Job<Data>> {
    const job: Job<Data> = { id: `${Date.now()}-${Math.random()}`, name, data, attemptsMade: 0 };
    this.queue.push(job);
    this.drain();
    return job;
  }

  private async drain() {
    while (this.processing < this.concurrency && this.queue.length > 0 && this.processor) {
      const job = this.queue.shift()!;
      this.processing += 1;
      this.processor(job)
        .catch(() => { /* swallow, logs elsewhere */ })
        .finally(() => {
          this.processing -= 1;
          queueMicrotask(() => this.drain());
        });
    }
  }
}

export const syncQueue = new InMemoryQueue<any>('sync', 2);
