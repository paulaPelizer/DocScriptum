CREATE OR ALTER TRIGGER app.trg_document_sync_hash_to_request_document
ON app.document
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Só roda se upload_hash ou edit_count tiverem sido atualizados
    IF NOT (UPDATE(upload_hash) OR UPDATE(edit_count))
        RETURN;

    UPDATE rd
       SET rd.doc_upload_hash = d.upload_hash,
           rd.doc_edit_count  = d.edit_count
    FROM app.request_document rd
    INNER JOIN inserted i
        ON rd.document_id = i.id       -- mesmos documentos atualizados
    INNER JOIN app.document d
        ON d.id = i.id;                -- pega valores novos do próprio document
END;
GO
