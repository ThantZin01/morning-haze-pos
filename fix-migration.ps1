$sql = npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script

[System.IO.File]::WriteAllText("prisma/migrations/20260718120000_init/migration.sql", ($sql -join "`n"), (New-Object System.Text.UTF8Encoding($false)))