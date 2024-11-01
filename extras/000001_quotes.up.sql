CREATE TABLE IF NOT EXISTS "quotes" (
    "id" SERIAL PRIMARY KEY,
    "author" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "info" TEXT
);