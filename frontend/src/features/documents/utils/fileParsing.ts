import mammoth from 'mammoth/mammoth.browser';

export async function readLegalDocumentFile(file: File): Promise<string> {
    if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    }

    return file.text();
}
