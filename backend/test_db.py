import psycopg

from app.config import settings
from app.db_url import (
    placeholder_password_error,
    psycopg_database_url,
    uses_placeholder_password,
)


def main() -> int:
    url = settings.DATABASE_URL

    if uses_placeholder_password(url):
        print(placeholder_password_error())
        return 1

    try:
        with psycopg.connect(psycopg_database_url(url)) as conn:
            with conn.cursor() as cur:
                cur.execute("select current_database(), current_user")
                database_name, username = cur.fetchone()
    except Exception as exc:
        print(f"Connection failed for DATABASE_URL={url!r}")
        print(exc)
        return 1

    print(f"Connected successfully to database '{database_name}' as '{username}'.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
