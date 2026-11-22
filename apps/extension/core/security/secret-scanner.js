const SECRET_PATTERNS = [
  {
    type: 'google_api_key',
    label: 'Google / Gemini API Key',
    regex: /\bAIza[0-9A-Za-z\-_]{30,40}\b/g
  },
  {
    type: 'openai_anthropic_key',
    label: 'OpenAI / Anthropic Secret Key',
    regex: /\bsk-(?:proj-|live-)?[A-Za-z0-9_\-]{20,}\b/g
  },
  {
    type: 'github_pat_classic',
    label: 'GitHub Personal Access Token (Classic)',
    regex: /\bghp_[A-Za-z0-9]{36}\b/g
  },
  {
    type: 'github_pat_fine_grained',
    label: 'GitHub Fine-Grained Personal Access Token',
    regex: /\bgithub_pat_[A-Za-z0-9_]{82}\b/g
  },
  {
    type: 'github_oauth_token',
    label: 'GitHub OAuth / App Token',
    regex: /\b(?:gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}\b/g
  },
  {
    type: 'aws_access_key',
    label: 'AWS Access Key ID',
    regex: /\bAKIA[0-9A-Z]{16}\b/g
  },
  {
    type: 'private_key_header',
    label: 'Private Cryptographic Key Block',
    regex: /-----BEGIN (?:[A-Z0-9_-]+ )?PRIVATE KEY-----/g
  }
];

const PRIVATE_VAULT_KEYS = [
  'geminiKey',
  'openaiKey',
  'anthropicKey',
  'openrouterKey',
  'githubPat',
  'apiKeys',
  'privateNotes',
  'chatHistory'
];

export function maskSecret(secret = '') {
  const str = String(secret).trim();
  if (str.length <= 8) return '[REDACTED]';
  return `${str.slice(0, 4)}...${str.slice(-4)}`;
}

export function scanString(text = '', fieldName = 'text', fileName = '') {
  if (typeof text !== 'string') return [];
  const violations = [];

  for (const pat of SECRET_PATTERNS) {
    pat.regex.lastIndex = 0;
    let match;
    while ((match = pat.regex.exec(text)) !== null) {
      violations.push({
        type: pat.type,
        label: pat.label,
        field: fieldName,
        file: fileName,
        maskedSnippet: maskSecret(match[0])
      });
    }
  }

  return violations;
}

export function scanForSecrets(data, contextName = 'root', fileName = '') {
  const violations = [];

  function walk(node, path) {
    if (node === null || node === undefined) return;

    if (typeof node === 'string') {
      const found = scanString(node, path, fileName);
      if (found.length) violations.push(...found);
      return;
    }

    if (Array.isArray(node)) {
      node.forEach((item, index) => walk(item, `${path}[${index}]`));
      return;
    }

    if (typeof node === 'object') {
      for (const [key, value] of Object.entries(node)) {
        if (PRIVATE_VAULT_KEYS.includes(key) && value) {
          violations.push({
            type: 'private_vault_leak',
            label: `Private Vault Key Detected (${key})`,
            field: `${path}.${key}`,
            file: fileName,
            maskedSnippet: typeof value === 'string' ? maskSecret(value) : '[OBJECT]'
          });
        }
        walk(value, `${path}.${key}`);
      }
    }
  }

  walk(data, contextName);

  return {
    clean: violations.length === 0,
    blockedCount: violations.length,
    violations
  };
}

export function assertNoSecrets(data, contextName = 'payload') {
  const result = scanForSecrets(data, contextName);
  if (!result.clean) {
    const errorDetails = result.violations
      .map((v) => `• [${v.label}] in "${v.field}": ${v.maskedSnippet}`)
      .join('\n');
    const err = new Error(`Secret Scanner Blocked Export/Push:\n${errorDetails}`);
    err.violations = result.violations;
    throw err;
  }
  return true;
}
