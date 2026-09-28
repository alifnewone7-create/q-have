"""
Simple in-memory candle buffer — NO persistence, NO complex merging.

This replaces the old CandleStore which persisted candles to disk and had
complex merging logic that caused stale candles to override fresh broker data.

Now we simply:
  1. Store candles in memory only (dict keyed by (asset, period))
  2. Always trust fresh pyquotex data completely
  3. No disk I/O, no locking semantics, no bucket preservation

The pyquotex library handles all the candle aggregation properly — we just
need to store what it gives us and send it to the frontend.
"""

from __future__ import annotations

import logging
import threading
from typing import Any

log = logging.getLogger("simple-buffer")

MAX_CANDLES = 200


class SimpleBuffer:
    """Thread-safe in-memory candle buffer. No persistence."""

    def __init__(self) -> None:
        self._buffers: dict[tuple[str, int], list[dict[str, Any]]] = {}
        self._lock = threading.RLock()

    def get(self, key: tuple[str, int]) -> list[dict[str, Any]]:
        """Return a copy of the current buffer."""
        with self._lock:
            return list(self._buffers.get(key, []))

    def has(self, key: tuple[str, int]) -> bool:
        with self._lock:
            return bool(self._buffers.get(key))

    def set_history(
        self,
        key: tuple[str, int],
        candles: list[dict[str, Any]],
        period: int | None = None,  # kept for API compat, not used
    ) -> list[dict[str, Any]]:
        """
        Replace the buffer with fresh broker history.
        
        Always trusts pyquotex data completely — no merging, no preservation
        of old candles. This is the fix for the "candle broker er sathe mil
        nai" bug.
        """
        with self._lock:
            cleaned = [
                c for c in candles if isinstance(c, dict) and "time" in c
            ]
            cleaned.sort(key=lambda c: int(c["time"]))
            cleaned = cleaned[-MAX_CANDLES:]
            self._buffers[key] = cleaned
            return list(cleaned)

    def push(
        self,
        key: tuple[str, int],
        candle: dict[str, Any],
        period: int,
        gap_filler: Any = None,  # kept for API compat, not used
    ) -> tuple[bool, list[dict[str, Any]]]:
        """
        Insert / update a single candle from live WS stream.
        
        Simple logic:
          - If candle time matches last candle: update in place
          - If candle time is newer: append (and trim to MAX_CANDLES)
          - If candle time is older: ignore (stale tick)
        """
        if not isinstance(candle, dict) or "time" not in candle:
            return False, self.get(key)
        
        try:
            t = int(candle["time"])
        except (TypeError, ValueError):
            return False, self.get(key)

        with self._lock:
            arr = self._buffers.setdefault(key, [])
            
            if not arr:
                # First candle
                arr.append(candle)
                return True, list(arr)
            
            last_t = int(arr[-1].get("time", 0))
            
            if t == last_t:
                # Update forming candle in place
                arr[-1] = candle
                return True, list(arr)
            elif t > last_t:
                # New candle - append
                arr.append(candle)
                # Trim to max
                if len(arr) > MAX_CANDLES:
                    self._buffers[key] = arr[-MAX_CANDLES:]
                    arr = self._buffers[key]
                return True, list(arr)
            else:
                # Old tick - ignore
                return False, list(arr)

    def clear(self, key: tuple[str, int]) -> None:
        """Clear the buffer for a key."""
        with self._lock:
            self._buffers.pop(key, None)
            log.info("simple-buffer: cleared %s", key)

    def flush(self, key: tuple[str, int]) -> None:
        """No-op for API compatibility."""
        pass

    def flush_all(self) -> None:
        """No-op for API compatibility."""
        pass
