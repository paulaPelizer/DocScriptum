-- SQL Server
IF EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'email'   AND Object_ID = Object_ID(N'app.organization'))
  ALTER TABLE app.organization DROP COLUMN email;

IF EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'phone'   AND Object_ID = Object_ID(N'app.organization'))
  ALTER TABLE app.organization DROP COLUMN phone;

IF EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'address' AND Object_ID = Object_ID(N'app.organization'))
  ALTER TABLE app.organization DROP COLUMN address;
