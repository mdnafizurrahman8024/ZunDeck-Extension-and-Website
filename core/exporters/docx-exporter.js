import zlib from 'node:zlib';

function createCrcTable() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const CRC_TABLE = createCrcTable();

function calculateCrc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function buildZip(files) {
  const localHeaders = [];
  const centralHeaders = [];
  let offset = 0;

  for (const file of files) {
    const rawData = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data, 'utf8');
    const crc = calculateCrc32(rawData);
    const uncompressedSize = rawData.length;

    let compressedData = rawData;
    let method = 0; // Stored

    try {
      if (typeof zlib !== 'undefined' && zlib.deflateRawSync) {
        compressedData = zlib.deflateRawSync(rawData);
        method = 8; // Deflated
      }
    } catch {}

    const compressedSize = compressedData.length;
    const nameBuf = Buffer.from(file.name, 'utf8');

    // Local file header (30 bytes + name + data)
    const localHeader = Buffer.alloc(30 + nameBuf.length);
    localHeader.writeUInt32LE(0x04034b50, 0); // PK\x03\x04
    localHeader.writeUInt16LE(20, 4);         // version needed: 2.0
    localHeader.writeUInt16LE(0, 6);          // general purpose bit
    localHeader.writeUInt16LE(method, 8);     // compression method
    localHeader.writeUInt16LE(0, 10);         // time
    localHeader.writeUInt16LE(0, 12);         // date
    localHeader.writeUInt32LE(crc, 14);       // crc32
    localHeader.writeUInt32LE(compressedSize, 18);
    localHeader.writeUInt32LE(uncompressedSize, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);
    nameBuf.copy(localHeader, 30);

    localHeaders.push(localHeader, compressedData);

    // Central directory header (46 bytes + name)
    const centralHeader = Buffer.alloc(46 + nameBuf.length);
    centralHeader.writeUInt32LE(0x02014b50, 0); // PK\x01\x02
    centralHeader.writeUInt16LE(20, 4);          // version made by
    centralHeader.writeUInt16LE(20, 6);          // version needed
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(method, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressedSize, 20);
    centralHeader.writeUInt32LE(uncompressedSize, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt32LE(0, 36);
    centralHeader.writeUInt32LE(offset, 42);
    nameBuf.copy(centralHeader, 46);

    centralHeaders.push(centralHeader);
    offset += localHeader.length + compressedData.length;
  }

  const centralDirSize = centralHeaders.reduce((acc, h) => acc + h.length, 0);

  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralDirSize, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
}

export function xmlEscape(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function pHeading(text, color = '0D9488') {
  return `
    <w:p>
      <w:pPr>
        <w:pBdr>
          <w:bottom w:val="single" w:sz="12" w:space="4" w:color="${color}"/>
        </w:pBdr>
        <w:spacing w:before="240" w:after="100"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:color w:val="${color}"/>
          <w:sz w:val="26"/>
        </w:rPr>
        <w:t>${xmlEscape(text)}</w:t>
      </w:r>
    </w:p>
  `;
}

function pEntry(title, rightText, subTitle = '', bullets = []) {
  return `
    <w:p>
      <w:pPr>
        <w:tabs>
          <w:tab w:val="right" w:pos="9360"/>
        </w:tabs>
        <w:spacing w:before="120" w:after="20"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="21"/></w:rPr>
        <w:t>${xmlEscape(title)}</w:t>
      </w:r>
      ${rightText ? `
      <w:r><w:tab/></w:r>
      <w:r>
        <w:rPr><w:i/><w:color w:val="64748B"/><w:sz w:val="18"/></w:rPr>
        <w:t>${xmlEscape(rightText)}</w:t>
      </w:r>` : ''}
    </w:p>
    ${subTitle ? `
    <w:p>
      <w:pPr><w:spacing w:before="0" w:after="40"/></w:pPr>
      <w:r>
        <w:rPr><w:i/><w:color w:val="334155"/><w:sz w:val="19"/></w:rPr>
        <w:t>${xmlEscape(subTitle)}</w:t>
      </w:r>
    </w:p>` : ''}
    ${bullets.map((b) => `
    <w:p>
      <w:pPr>
        <w:ind w:left="360"/>
        <w:spacing w:before="20" w:after="20"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:sz w:val="19"/></w:rPr>
        <w:t>•  ${xmlEscape(b)}</w:t>
      </w:r>
    </w:p>`).join('')}
  `;
}

export function generateDocxBlob(profile) {
  const identity = profile.identity || {};
  const links = profile.links || {};
  const education = Array.isArray(profile.education) ? profile.education : [];
  const research = Array.isArray(profile.research) ? profile.research : [];
  const publications = Array.isArray(profile.publications) ? profile.publications : [];
  const projects = Array.isArray(profile.projects) ? profile.projects : [];
  const certifications = Array.isArray(profile.certifications) ? profile.certifications : [];
  const leadership = Array.isArray(profile.leadership) ? profile.leadership : [];
  const references = Array.isArray(profile.references) ? profile.references : [];

  const contactPieces = [
    identity.email,
    identity.emailUniversity,
    identity.location?.rawAddress || identity.location?.city
  ].filter(Boolean).join('  |  ');

  const linksPieces = [
    links.scholar ? 'Google Scholar' : '',
    links.orcid ? 'ORCID' : '',
    links.researchgate ? 'ResearchGate' : '',
    links.github ? 'GitHub' : '',
    links.linkedin ? 'LinkedIn' : '',
    links.personalWebsite ? 'Portfolio' : ''
  ].filter(Boolean).join('  •  ');

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <!-- Name Header -->
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="0" w:after="60"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:color w:val="0F172A"/>
          <w:sz w:val="34"/>
        </w:rPr>
        <w:t>${xmlEscape(identity.fullName || 'Curriculum Vitae')}</w:t>
      </w:r>
    </w:p>

    <!-- Institution / Role -->
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="0" w:after="40"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:sz w:val="20"/><w:color w:val="334155"/></w:rPr>
        <w:t>${xmlEscape(identity.institution || identity.roleBadge || '')}</w:t>
      </w:r>
    </w:p>

    <!-- Contact Info -->
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="0" w:after="40"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:sz w:val="18"/><w:color w:val="64748B"/></w:rPr>
        <w:t>${xmlEscape(contactPieces)}</w:t>
      </w:r>
    </w:p>

    <!-- Verified Links -->
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="0" w:after="160"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:sz w:val="17"/><w:color w:val="0D9488"/></w:rPr>
        <w:t>${xmlEscape(linksPieces)}</w:t>
      </w:r>
    </w:p>

    <!-- Education -->
    ${education.length ? `
      ${pHeading('Academic Background')}
      ${education.map((e) => pEntry(
        e.degree,
        e.period,
        e.institution,
        [e.details, ...(e.highlights || [])].filter(Boolean)
      )).join('')}
    ` : ''}

    <!-- Research -->
    ${research.length ? `
      ${pHeading('Research Work & Scientific Appointments')}
      ${research.map((r) => pEntry(
        r.title,
        r.period,
        `${r.role || ''} • ${r.institution || ''}`,
        [r.summary].filter(Boolean)
      )).join('')}
    ` : ''}

    <!-- Publications -->
    ${publications.length ? `
      ${pHeading('Publications & Protocols')}
      ${publications.map((pub) => pEntry(
        pub.title,
        String(pub.year || ''),
        `${pub.journal || ''} • Status: ${pub.status || 'Published'}`,
        [pub.authors, pub.doi ? `DOI: ${pub.doi}` : ''].filter(Boolean)
      )).join('')}
    ` : ''}

    <!-- Projects -->
    ${projects.length ? `
      ${pHeading('Scientific Platforms & Software')}
      ${projects.map((p) => pEntry(
        p.title,
        p.category || 'Platform',
        p.badge || '',
        [p.description].filter(Boolean)
      )).join('')}
    ` : ''}

    <!-- Training -->
    ${certifications.length ? `
      ${pHeading('Training & Professional Certifications')}
      ${certifications.map((c) => pEntry(
        c.title,
        c.date || '',
        c.issuer || '',
        []
      )).join('')}
    ` : ''}

    <!-- Leadership -->
    ${leadership.length ? `
      ${pHeading('Leadership & Affiliations')}
      ${leadership.map((l) => pEntry(
        l.role,
        l.period || '',
        l.organization || '',
        [l.description].filter(Boolean)
      )).join('')}
    ` : ''}

    <!-- References -->
    ${references.length ? `
      ${pHeading('Academic References')}
      ${references.map((ref) => pEntry(
        ref.name,
        ref.relationship || '',
        `${ref.designation || ''}, ${ref.institution || ''}`,
        [ref.email, ref.phone].filter(Boolean)
      )).join('')}
    ` : ''}

    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const wordRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`;

  return buildZip([
    { name: '[Content_Types].xml', data: contentTypesXml },
    { name: '_rels/.rels', data: relsXml },
    { name: 'word/_rels/document.xml.rels', data: wordRelsXml },
    { name: 'word/document.xml', data: documentXml }
  ]);
}
