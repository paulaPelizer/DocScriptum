IF OBJECT_ID('app.trg_request_document_fill_snapshot', 'TR') IS NOT NULL
    DROP TRIGGER app.trg_request_document_fill_snapshot;
GO

CREATE TRIGGER app.trg_request_document_fill_snapshot
ON app.request_document
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE rd
    SET
        rd.doc_upload_hash = d.upload_hash,
        rd.doc_edit_count  = d.edit_count
    FROM app.request_document rd
    INNER JOIN inserted i
        ON rd.id = i.id          -- mesmo registro recém-inserido
    INNER JOIN app.document d
        ON d.id = rd.document_id; -- documento apontado
END;
GO

IF OBJECT_ID('app.trg_document_propagate_edit_count', 'TR') IS NOT NULL
    DROP TRIGGER app.trg_document_propagate_edit_count;
GO

CREATE TRIGGER app.trg_document_propagate_edit_count
ON app.document
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- se nem edit_count nem upload_hash mudaram, não faz nada
    IF NOT (UPDATE(edit_count) OR UPDATE(upload_hash))
        RETURN;

    UPDATE rd
    SET
        rd.doc_edit_count  = d.edit_count,
        rd.doc_upload_hash = d.upload_hash
    FROM app.request_document rd
    INNER JOIN app.document d
        ON d.id = rd.document_id
    INNER JOIN inserted i
        ON i.id = d.id;      -- documentos que acabaram de ser atualizados
END;
GO
