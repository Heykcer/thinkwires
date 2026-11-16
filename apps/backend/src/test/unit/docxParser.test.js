import { describe, it, expect } from 'vitest';
import zlib from 'zlib';
import { extractTextFromDocxBuffer, aiService } from '../../services/ai.service.js';

describe('P1 Document Parsing - DOCX Extraction Suite', () => {
  /**
   * Helper to construct a minimal valid in-memory DOCX (ZIP archive with word/document.xml)
   */
  const createMockDocxBuffer = (textParagraphs = []) => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${textParagraphs.map((p) => `<w:p><w:r><w:t>${p}</w:t></w:r></w:p>`).join('\n')}
  </w:body>
</w:document>`;

    const xmlBuffer = Buffer.from(xmlContent, 'utf8');
    const compressed = zlib.deflateRawSync(xmlBuffer);

    const fileName = 'word/document.xml';
    const nameBuf = Buffer.from(fileName, 'utf8');

    // Minimal Local File Header (30 bytes + name + compressed)
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0); // Signature
    header.writeUInt16LE(20, 4); // Version needed
    header.writeUInt16LE(0, 6); // Flags
    header.writeUInt16LE(8, 8); // Method = Deflate (8)
    header.writeUInt16LE(0, 10); // Mod time
    header.writeUInt16LE(0, 12); // Mod date
    header.writeUInt32LE(0, 14); // CRC32 (dummy)
    header.writeUInt32LE(compressed.length, 18); // Compressed size
    header.writeUInt32LE(xmlBuffer.length, 22); // Uncompressed size
    header.writeUInt16LE(nameBuf.length, 26); // File name length
    header.writeUInt16LE(0, 28); // Extra field length

    return Buffer.concat([header, nameBuf, compressed]);
  };

  it('extracts structured paragraphs cleanly from a DOCX buffer', () => {
    const mockDocx = createMockDocxBuffer([
      'Biswarupa Swain',
      'Senior Cloud Solutions Architect',
      'Skills: Node.js, TypeScript, Kubernetes, MongoDB, AWS',
      'Email: biswarupa@thinkwires.com',
      'Phone: +91 9876543210',
    ]);

    const extractedText = extractTextFromDocxBuffer(mockDocx);
    expect(extractedText).toContain('Biswarupa Swain');
    expect(extractedText).toContain('Senior Cloud Solutions Architect');
    expect(extractedText).toContain('Kubernetes, MongoDB, AWS');
  });

  it('returns empty string for non-zip or corrupt buffers', () => {
    const randomBinary = Buffer.from('Not a zip file random binary garbage content');
    const result = extractTextFromDocxBuffer(randomBinary);
    expect(result).toBe('');
  });

  it('handles empty or null buffer gracefully', () => {
    expect(extractTextFromDocxBuffer(null)).toBe('');
    expect(extractTextFromDocxBuffer(Buffer.alloc(0))).toBe('');
  });

  it('fallbackParseResume successfully extracts candidate info from docx buffer', async () => {
    const mockDocx = createMockDocxBuffer([
      'Priya Sharma',
      'Lead Fullstack Engineer',
      'Contact: priya.sharma@example.com | +1 (415) 555-2671',
      'Technologies: React, Node.js, Python, PostgreSQL, Docker',
    ]);

    const result = await aiService.fallbackParseResume(mockDocx, 'priya_sharma_resume.docx');
    expect(result.candidate_name).toBe('Priya Sharma');
    expect(result.email).toBe('priya.sharma@example.com');
    expect(result.phone).toBe('+1 (415) 555-2671');
    expect(result.skills).toContain('React');
    expect(result.skills).toContain('Node.js');
    expect(result.skills).toContain('Python');
  });
});
