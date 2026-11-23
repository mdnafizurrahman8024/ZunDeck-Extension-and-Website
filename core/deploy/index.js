export * from './github-deployer.js';

export const DeployManager = {
  targets: ['github-pages', 'netlify', 'manual-zip'],
  getManifest: (profile, htmlMarkup) => ({
    timestamp: new Date().toISOString(),
    profileId: profile.identity?.shortName || 'user',
    byteLength: typeof Buffer !== 'undefined'
      ? Buffer.byteLength(htmlMarkup, 'utf8')
      : new TextEncoder().encode(htmlMarkup).length
  })
};
