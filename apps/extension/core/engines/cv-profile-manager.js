export function getCvProfiles(profile) {
  if (Array.isArray(profile.cvProfiles) && profile.cvProfiles.length > 0) {
    return profile.cvProfiles;
  }
  return [
    {
      id: 'cv-acad-flagship-profile',
      name: 'Flagship Academic CV (Default)',
      targetRole: 'Academic Scholar & DVM Researcher',
      templateId: 'cv-acad-flagship',
      includedSections: ['education', 'research', 'publications', 'projects', 'certifications', 'leadership', 'references'],
      itemOverrides: {}
    },
    {
      id: 'cv-europass-profile',
      name: 'Erasmus Mundus / Europass Academic CV',
      targetRole: 'Graduate Research Candidate',
      templateId: 'cv-acad-europass',
      includedSections: ['education', 'research', 'publications', 'skills', 'certifications', 'languages', 'references'],
      itemOverrides: {}
    },
    {
      id: 'cv-tech-ats-profile',
      name: '1-Page ATS Software & HealthTech Resume',
      targetRole: 'Computational Biologist / Full-Stack Engineer',
      templateId: 'cv-corp-ats-gold',
      includedSections: ['skills', 'projects', 'research', 'education'],
      itemOverrides: {}
    }
  ];
}

export function createCvProfile(profile, newProfileData) {
  const profiles = getCvProfiles(profile);
  const id = newProfileData.id || `cv-custom-${Date.now()}`;
  const newProfile = {
    id,
    name: newProfileData.name || 'Custom Targeted CV',
    targetRole: newProfileData.targetRole || 'Professional Role',
    templateId: newProfileData.templateId || 'cv-acad-flagship',
    includedSections: newProfileData.includedSections || ['education', 'research', 'projects', 'skills'],
    itemOverrides: newProfileData.itemOverrides || {}
  };

  profile.cvProfiles = [...profiles, newProfile];
  return newProfile;
}

export function updateCvProfile(profile, profileId, updates) {
  const profiles = getCvProfiles(profile);
  profile.cvProfiles = profiles.map((p) => {
    if (p.id === profileId) {
      return { ...p, ...updates };
    }
    return p;
  });
  return profile.cvProfiles.find((p) => p.id === profileId);
}

export function deleteCvProfile(profile, profileId) {
  const profiles = getCvProfiles(profile);
  if (profiles.length <= 1) return false;
  profile.cvProfiles = profiles.filter((p) => p.id !== profileId);
  return true;
}

// Bidirectional sync: CV edits update master portfolio items
export function syncCvToMaster(profile, profileId, fieldOverrides = {}) {
  const targetProfile = getCvProfiles(profile).find((p) => p.id === profileId);
  if (!targetProfile) return profile;

  if (fieldOverrides.identity) {
    profile.identity = { ...profile.identity, ...fieldOverrides.identity };
  }

  if (Array.isArray(fieldOverrides.research)) {
    profile.research = fieldOverrides.research;
  }

  if (Array.isArray(fieldOverrides.projects)) {
    profile.projects = fieldOverrides.projects;
  }

  return profile;
}

// Bidirectional sync: Pull latest master portfolio updates into CV profile
export function pullMasterToCv(profile, profileId) {
  const targetProfile = getCvProfiles(profile).find((p) => p.id === profileId);
  if (!targetProfile) return profile;

  // Refresh active profile references with master truth
  targetProfile.lastSyncedWithMaster = new Date().toISOString();
  return profile;
}
