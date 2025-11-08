IF OBJECT_ID('app.trg_request_document_hash_change_update_status', 'TR') IS NOT NULL
    DROP TRIGGER app.trg_request_document_hash_change_update_status;
GO

CREATE TRIGGER app.trg_request_document_hash_change_update_status
ON app.request_document
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Se a coluna doc_upload_hash não foi alterada, não faz nada
    IF NOT UPDATE(doc_upload_hash)
        RETURN;

    /*
        Para cada request_document que teve a doc_upload_hash alterada,
        se a Request estiver em WAITING_CLIENT, passa para WAITING_ADM.
    */
    UPDATE r
    SET
        r.status     = 'WAITING_ADM',
        r.updated_at = SYSDATETIMEOFFSET()
    FROM app.request r
    INNER JOIN inserted i
        ON r.id = i.request_id
    WHERE r.status = 'WAITING_CLIENT';
END;
GO
