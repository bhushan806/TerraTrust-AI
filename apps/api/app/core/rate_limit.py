"""In-memory rate limiter for brute-force protection and traffic pacing."""

import time
from collections import defaultdict
from threading import Lock
from typing import Dict, List, Optional
from fastapi import Request
from app.core.errors import RateLimitException


class InMemoryRateLimiter:
    """Sliding-window in-memory rate limiter."""

    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._history: Dict[str, List[float]] = defaultdict(list)
        self._lock = Lock()

    def check(self, key: str) -> None:
        """Check if request rate for key is within limits, otherwise raise RateLimitException."""
        now = time.time()
        with self._lock:
            # Purge timestamps outside the active window
            cutoff = now - self.window_seconds
            valid_timestamps = [t for t in self._history[key] if t > cutoff]
            self._history[key] = valid_timestamps

            if len(valid_timestamps) >= self.max_requests:
                raise RateLimitException(
                    f"Rate limit of {self.max_requests} requests per {self.window_seconds}s exceeded"
                )

            self._history[key].append(now)

    def reset(self, key: Optional[str] = None) -> None:
        """Reset history for a key or all keys (useful in test teardowns)."""
        with self._lock:
            if key is None:
                self._history.clear()
            else:
                self._history.pop(key, None)


# Default global instance for login endpoints
login_rate_limiter = InMemoryRateLimiter(max_requests=10, window_seconds=60)
