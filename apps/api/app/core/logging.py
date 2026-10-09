"""Structured logging configuration with secret redaction and correlation IDs."""

import json
import logging
import re
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Any, Dict

# ContextVar to hold current request ID across async tasks
request_id_ctx: ContextVar[str] = ContextVar("request_id", default="system")

REDACTED_KEYS = {
    "password",
    "token",
    "access_token",
    "refresh_token",
    "secret",
    "client_secret",
    "authorization",
    "api_key",
    "provider_api_key",
}

REDACTED_PATTERN = re.compile(
    r"(?i)(password|token|secret|authorization|api_key|client_secret)[\"']?\s*[:=]\s*[\"']?([^\"'\s&]+)",
)


def redact_sensitive_data(data: Any) -> Any:
    """Recursively redact sensitive keys from dictionaries, lists, or strings."""
    if isinstance(data, dict):
        redacted = {}
        for k, v in data.items():
            if any(sens in k.lower() for sens in REDACTED_KEYS):
                redacted[k] = "[REDACTED]"
            else:
                redacted[k] = redact_sensitive_data(v)
        return redacted
    elif isinstance(data, list):
        return [redact_sensitive_data(item) for item in data]
    elif isinstance(data, str):
        return REDACTED_PATTERN.sub(r"\1=[REDACTED]", data)
    return data


class JSONFormatter(logging.Formatter):
    """Custom JSON formatter emitting structured logs with request correlation."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": request_id_ctx.get(),
        }

        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        # Include custom extra fields if provided
        for key, value in record.__dict__.items():
            if key not in {
                "name", "msg", "args", "levelname", "levelno", "pathname", "filename",
                "module", "exc_info", "exc_text", "stack_info", "lineno", "funcName",
                "created", "msecs", "relativeCreated", "thread", "threadName",
                "processName", "process", "message",
            }:
                log_entry[key] = value

        return json.dumps(redact_sensitive_data(log_entry))


def setup_logging(log_level: str = "INFO") -> None:
    """Configure root and application loggers."""
    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())

    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))
    root_logger.handlers = [handler]

    # Silence overly verbose external loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
