ALTER TABLE app.app_user
ADD roles VARCHAR(200) NULL;
GO

-- Opcional: definir roles padrão para o admin existente
UPDATE app.app_user
SET roles = 'DBA,ADMIN,RESOURCE'
WHERE username = 'admin@docflow';
GO
