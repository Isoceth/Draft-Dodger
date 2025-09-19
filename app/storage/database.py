"""Database placeholder module."""

from __future__ import annotations


class DatabaseSession:
    """Stub for a future Postgres session or repository."""

    def save_document(self, project_id: str, markdown: str) -> None:
        # Replace with SQLAlchemy or another persistence layer.
        pass


def get_session() -> DatabaseSession:
    """Return a stub database session until the real adapter lands."""
    return DatabaseSession()
