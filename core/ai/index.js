export const AiPromptBuilder = {
  tailorCV: (profile, jobDescription) => ({
    system: 'You are an ATS CV optimizer. Align bullet points without fabricating achievements.',
    user: `Target Job:\n${jobDescription}\n\nCandidate Profile:\n${JSON.stringify(profile.identity)}`
  }),
  draftSOP: (profile, programTitle) => ({
    system: 'You are an academic Statement of Purpose mentor. Focus on research alignment and evidence.',
    user: `Target Program: ${programTitle}\nResearch History: ${JSON.stringify(profile.research)}`
  })
};
