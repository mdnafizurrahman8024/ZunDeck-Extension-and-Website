export function runAtsXRay(profile) {
  const identity = profile.identity || {};
  const education = Array.isArray(profile.education) ? profile.education : [];
  const research = Array.isArray(profile.research) ? profile.research : [];
  const projects = Array.isArray(profile.projects) ? profile.projects : [];
  const publications = Array.isArray(profile.publications) ? profile.publications : [];
  const certifications = Array.isArray(profile.certifications) ? profile.certifications : [];
  const skills = profile.skills || {};

  const lines = [];

  // Header linear stream
  lines.push('--- [HEADER PARSE] ---');
  lines.push(identity.fullName || 'MISSING_NAME');
  if (identity.roleBadge) lines.push(identity.roleBadge);
  if (identity.institution) lines.push(identity.institution);
  if (identity.email) lines.push(`EMAIL: ${identity.email}`);
  if (identity.emailUniversity) lines.push(`EMAIL_ALT: ${identity.emailUniversity}`);
  if (identity.location?.rawAddress || identity.location?.city) {
    lines.push(`LOCATION: ${identity.location.rawAddress || identity.location.city}`);
  }

  // Education
  lines.push('\n--- [EDUCATION PARSE] ---');
  education.forEach((edu) => {
    lines.push(`${edu.degree || 'Degree'} | ${edu.institution || ''} | ${edu.period || 'No Date'}`);
    if (edu.details) lines.push(`  Details: ${edu.details}`);
  });

  // Experience & Research
  lines.push('\n--- [EXPERIENCE / RESEARCH PARSE] ---');
  research.forEach((r) => {
    lines.push(`${r.title || 'Untitled'} | ${r.role || 'Role'} | ${r.period || 'No Date'}`);
    if (r.institution) lines.push(`  Institution: ${r.institution}`);
    if (r.summary) lines.push(`  Summary: ${r.summary}`);
  });

  // Publications
  lines.push('\n--- [PUBLICATIONS PARSE] ---');
  publications.forEach((pub) => {
    lines.push(`${pub.title || ''} (${pub.year || 'n.d.'}) - ${pub.journal || ''}`);
    if (pub.authors) lines.push(`  Authors: ${pub.authors}`);
    if (pub.doi) lines.push(`  DOI: ${pub.doi}`);
  });

  // Projects
  lines.push('\n--- [PROJECTS & PLATFORMS PARSE] ---');
  projects.forEach((p) => {
    lines.push(`${p.title || ''} | ${p.category || 'Platform'}`);
    if (p.description) lines.push(`  Description: ${p.description}`);
  });

  // Certifications
  lines.push('\n--- [CERTIFICATIONS PARSE] ---');
  certifications.forEach((c) => {
    lines.push(`${c.title || ''} - ${c.issuer || ''} (${c.date || ''})`);
  });

  // Perform checks and scoring
  const checks = [];
  let score = 100;
  const warnings = [];

  // Name check
  if (identity.fullName && identity.fullName.length > 2) {
    checks.push({ label: 'Candidate Name', pass: true, message: `Detected: "${identity.fullName}"` });
  } else {
    checks.push({ label: 'Candidate Name', pass: false, message: 'Missing candidate name' });
    score -= 25;
    warnings.push('Critical: ATS parser could not detect candidate full name.');
  }

  // Email check
  if (identity.email && identity.email.includes('@')) {
    checks.push({ label: 'Primary Email', pass: true, message: `Valid email: ${identity.email}` });
  } else {
    checks.push({ label: 'Primary Email', pass: false, message: 'Missing valid contact email' });
    score -= 20;
    warnings.push('Critical: Contact email is missing or malformed.');
  }

  // Location check
  if (identity.location?.city || identity.location?.rawAddress) {
    checks.push({ label: 'Location & Region', pass: true, message: 'Geographic location present' });
  } else {
    checks.push({ label: 'Location & Region', pass: false, message: 'Missing city/country' });
    score -= 5;
    warnings.push('Warning: Geographic location is blank.');
  }

  // Education check
  if (education.length > 0) {
    checks.push({ label: 'Education Section', pass: true, message: `${education.length} degree entries parsed` });
  } else {
    checks.push({ label: 'Education Section', pass: false, message: 'No education entries detected' });
    score -= 15;
    warnings.push('Warning: No formal education or degree detected.');
  }

  // Chronology / Date check
  const missingDates = research.filter((r) => !r.period).length + education.filter((e) => !e.period).length;
  if (missingDates === 0) {
    checks.push({ label: 'Chronological Dates', pass: true, message: 'All experience & education items have dates' });
  } else {
    checks.push({ label: 'Chronological Dates', pass: false, message: `${missingDates} entries lack date ranges` });
    score -= 10;
    warnings.push(`Warning: ${missingDates} items have missing date ranges.`);
  }

  // Density / Readability
  const totalLength = lines.join('\n').length;
  if (totalLength > 200) {
    checks.push({ label: 'Text Density & Length', pass: true, message: `Healthy text density (${totalLength} chars)` });
  } else {
    checks.push({ label: 'Text Density & Length', pass: false, message: 'Resume appears sparse' });
    score -= 10;
  }

  return {
    score: Math.max(0, score),
    checks,
    warnings,
    rawText: lines.join('\n')
  };
}
