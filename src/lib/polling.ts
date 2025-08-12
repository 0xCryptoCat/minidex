export interface PollOptions {
  onError?: (err: unknown) => void;
  onRecover?: () => void;
}

export function createPoller(
  fn: () => Promise<void>,
  intervalMs: number,
  options: PollOptions = {}
) {
  let timer: number | null = null;
  let stopped = true;
  const backoffs = [10000, 20000, 40000];
  let backoffIndex = 0;
  let inBackoff = false;

  async function run() {
    try {
      await fn();
      if (inBackoff) {
        inBackoff = false;
        backoffIndex = 0;
        options.onRecover?.();
      }
      schedule(intervalMs);
    } catch (err: any) {
      const status = err?.status as number | undefined;
      if (status === 429 || (status && status >= 500)) {
        inBackoff = true;
        options.onError?.(err);
        const delay = backoffs[Math.min(backoffIndex, backoffs.length - 1)];
        if (backoffIndex < backoffs.length - 1) backoffIndex++;
        schedule(delay);
      } else {
        schedule(intervalMs);
      }
    }
  }

  function schedule(ms: number) {
    timer = window.setTimeout(() => {
      timer = null;
      if (!stopped && !document.hidden) run();
    }, ms);
  }

  function start() {
    if (!stopped) return;
    stopped = false;
    if (!document.hidden) run();
    document.addEventListener('visibilitychange', handleVisibility);
  }

  function stop() {
    stopped = true;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    document.removeEventListener('visibilitychange', handleVisibility);
  }

  function handleVisibility() {
    if (document.hidden) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    } else if (!stopped) {
      run();
    }
  }

  return { start, stop };
}

