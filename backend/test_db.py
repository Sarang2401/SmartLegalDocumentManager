import psycopg

configs = [
    "postgresql://postgres:password@localhost:5432/postgres",
    "postgresql://postgres:postgres@localhost:5432/postgres",
    "postgresql://postgres:password@localhost:5433/postgres",
    "postgresql://postgres:postgres@localhost:5433/postgres",
    "postgresql://defnix:defnix_dev@localhost:5433/postgres",
    "postgresql://defnix:defnix_dev@localhost:5433/defnix",
]

for url in configs:
    try:
        conn = psycopg.connect(url)
        print(f"SUCCESS with '{url}'")
        conn.close()
    except Exception as e:
        print(f"Failed with '{url}': {e}")
