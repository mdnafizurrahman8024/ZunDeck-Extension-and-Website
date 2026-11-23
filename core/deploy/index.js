export * from './github-deployer.js';

export const DeployManager = {
  targets: ['github-pages', 'netlify', 'manual-zip'],
  getManifest: (profile, htmlMarkup) => ({
    timestamp: new Date().toISOString(),
    profileId: profile.identity?.shortName || 'user',
    byteLength: Buffer.byteLength(htmlMarkup, 'utf8')
  })
};
