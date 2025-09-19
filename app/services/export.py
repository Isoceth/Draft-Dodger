"""Placeholder export helpers."""

from __future__ import annotations

from time import sleep


def render_export(project_id: str, markdown: str) -> None:
    """Pretend to render a PDF or Docx."""
    # Real implementation should hand off to a queue; simulate latency for now.
    sleep(0.1)


def enqueue_export(project_id: str, markdown: str) -> None:
    """Proxy for the future task queue."""
    # Until Redis/RQ are wired in, run synchronously.
    render_export(project_id, markdown)
