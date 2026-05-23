SELECT 'CREATE DATABASE "IdentityDB"'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'IdentityDB')\gexec

SELECT 'CREATE DATABASE "MangaManagementDB"'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'MangaManagementDB')\gexec

SELECT 'CREATE DATABASE "FileDB"'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'FileDB')\gexec

SELECT 'CREATE DATABASE "EditorialDB"'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'EditorialDB')\gexec

SELECT 'CREATE DATABASE "NotificationDB"'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'NotificationDB')\gexec
