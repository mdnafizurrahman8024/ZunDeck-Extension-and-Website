export const Exporters = {
  html: (markup) => markup,
  json: (profile) => JSON.stringify(profile, null, 2)
};
