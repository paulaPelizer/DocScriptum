-- VXX__create_password_reset_token.sql
-- ajuste o XX para o próximo número da sua sequência Flyway

IF NOT EXISTS (
    SELECT 1
    FROM sys.tables t
    JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE t.name = 'password_reset_token'
      AND s.name = 'app'
)
BEGIN
    CREATE TABLE app.password_reset_token (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        user_id BIGINT NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at DATETIME2 NOT NULL,
        used BIT NOT NULL CONSTRAINT DF_password_reset_token_used DEFAULT (0),

        CONSTRAINT FK_password_reset_token_user
            FOREIGN KEY (user_id)
            REFERENCES app.app_user (id)
    );

    CREATE INDEX IX_password_reset_token_token
        ON app.password_reset_token (token);
END;
