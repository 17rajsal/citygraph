"""
CityGraph Rate Limiter
Lightweight, thread-safe, in-memory sliding-window rate limiter for FastAPI.
Zero external dependencies required.
Supports reverse-proxy client IP extraction (X-Forwarded-For).
"""

import time
import threading
from collections import defaultdict
from typing import Dict, List, Tuple
from fastapi import Request, HTTPException, status


class SlidingWindowRateLimiter:
    def __init__(self):
        # Maps endpoint_tag:ip -> list of request timestamps (float)
        self._requests: Dict[str, List[float]] = defaultdict(list)
        self._lock = threading.Lock()

    def _get_client_ip(self, request: Request) -> str:
        # Check X-Forwarded-For header (first IP in chain is the client behind proxies like Render/Cloudflare)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        # Fall back to client host
        return request.client.host if request.client else "unknown"

    def check_rate_limit(
        self,
        request: Request,
        endpoint_key: str,
        max_requests: int,
        window_seconds: int = 60,
    ) -> None:
        """
        Check if the request exceeds max_requests within window_seconds.
        Raises HTTPException(429) if exceeded.
        """
        client_ip = self._get_client_ip(request)
        key = f"{endpoint_key}:{client_ip}"
        now = time.time()
        window_start = now - window_seconds

        with self._lock:
            # Clean up timestamps older than window_start
            timestamps = [ts for ts in self._requests[key] if ts > window_start]
            
            if len(timestamps) >= max_requests:
                retry_after = int(window_seconds - (now - timestamps[0])) + 1
                self._requests[key] = timestamps
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Maximum {max_requests} requests per {window_seconds}s for this operation. Please retry in {retry_after}s.",
                    headers={"Retry-After": str(max(1, retry_after))},
                )

            # Record this request
            timestamps.append(now)
            self._requests[key] = timestamps

    def cleanup(self) -> None:
        """Periodic cleanup of stale keys to prevent memory growth."""
        now = time.time()
        with self._lock:
            stale_keys = []
            for key, timestamps in self._requests.items():
                active = [ts for ts in timestamps if now - ts < 120]
                if active:
                    self._requests[key] = active
                else:
                    stale_keys.append(key)
            for k in stale_keys:
                del self._requests[k]


# Global rate limiter instance
limiter = SlidingWindowRateLimiter()
