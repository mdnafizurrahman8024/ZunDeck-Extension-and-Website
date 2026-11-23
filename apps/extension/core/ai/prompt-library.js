/**
 * Production-Grade Pro Prompt Library for ZunDeck Vibe Studio
 * Categorized into 6 core domains with explicit 5-point structure:
 * 1. Role
 * 2. Objective
 * 3. Step-by-Step Commands
 * 4. Design, Animation & UX Specs
 * 5. Security & Privacy Guardrails
 */

export const PROMPT_CATEGORIES = [
  {
    "id": "all",
    "label": "All Prompts (30)"
  },
  {
    "id": "design",
    "label": "Portfolio Redesign (5)"
  },
  {
    "id": "layout",
    "label": "Animations & Themes (5)"
  },
  {
    "id": "academic",
    "label": "Academic & Research (5)"
  },
  {
    "id": "corporate",
    "label": "ATS CV & Corporate (5)"
  },
  {
    "id": "letters",
    "label": "SOP & Cold Outreach (5)"
  },
  {
    "id": "custom",
    "label": "Custom Sections & Widgets (5)"
  }
];

export const PROMPT_LIBRARY = [
  {
    "id": "redesign-flagship-amr",
    "category": "design",
    "categoryLabel": "Portfolio Redesign",
    "title": "Flagship Academic AMR & One Health",
    "summary": "Transform portfolio into an authoritative AMR surveillance showcase with teal accents and dual-column grid.",
    "role": "Lead Academic Portfolio Architect & One Health Specialist",
    "objective": "Reconfigure profile theme and layout to convey authoritative scientific rigor and high-impact pathogen research.",
    "commands": [
      "Switch active portfolio template to acad-flagship.",
      "Set color theme to dark with deep teal accent (#0d9488) and slate backdrop.",
      "Organize cards into a balanced 2-column layout with 5-item initial view.",
      "Position verified first-author journal publications at the top of the research list.",
      "Highlight molecular epidemiology, pathogen genomics, and biostatistics in identity badge."
    ],
    "designSpecs": {
      "theme": "dark",
      "accentColor": "#0d9488",
      "fontFamily": "Plus Jakarta Sans",
      "gridColumns": 2,
      "seeAllLimit": 5,
      "effects": "Perimeter gradient border with radiant 20px teal glow on flagship cards."
    },
    "securityRules": "Zero fabricated citations or synthetic DOIs. Preserve all verified identity links.",
    "prompt": "[ROLE]\nLead Academic Portfolio Architect & One Health Specialist\n\n[OBJECTIVE]\nReconfigure profile theme and layout to convey authoritative scientific rigor and high-impact pathogen research.\n\n[COMMANDS]\n1. Switch active portfolio template to acad-flagship.\n2. Set color theme to dark with deep teal accent (#0d9488) and slate backdrop.\n3. Organize cards into a balanced 2-column layout with 5-item initial view.\n4. Position verified first-author journal publications at the top of the research list.\n5. Highlight molecular epidemiology, pathogen genomics, and biostatistics in identity badge.\n\n[DESIGN SPECS]\n- Theme: dark\n- Accent: #0d9488\n- Typography: Plus Jakarta Sans\n- Grid Columns: 2\n- Effects: Perimeter gradient border with radiant 20px teal glow on flagship cards.\n\n[SECURITY & PRIVACY]\n- Zero fabricated citations or synthetic DOIs. Preserve all verified identity links."
  },
  {
    "id": "redesign-bento-grid",
    "category": "design",
    "categoryLabel": "Portfolio Redesign",
    "title": "Modern Bento Grid & High-Density Cards",
    "summary": "Refactor layout into a dynamic asymmetric Bento grid with high visual density and crisp contrast.",
    "role": "Senior Product Designer & Frontend UI Architect",
    "objective": "Transform portfolio into a high-density modern Bento grid showcasing key metrics and project snapshots.",
    "commands": [
      "Switch portfolio template to corp-executive or modern grid.",
      "Configure 3-column asymmetric card grid with high-density spacing.",
      "Apply emerald (#10b981) key highlights and crisp obsidian border tokens.",
      "Feature latest software projects and field evidence in the primary hero card."
    ],
    "designSpecs": {
      "theme": "dark",
      "accentColor": "#10b981",
      "fontFamily": "Inter",
      "gridColumns": 3,
      "seeAllLimit": 6,
      "effects": "Subtle perimeter border with 1px obsidian hairline borders."
    },
    "securityRules": "Ensure all GitHub repository links and project URLs remain strictly authentic.",
    "prompt": "[ROLE]\nSenior Product Designer & Frontend UI Architect\n\n[OBJECTIVE]\nTransform portfolio into a high-density modern Bento grid showcasing key metrics and project snapshots.\n\n[COMMANDS]\n1. Switch portfolio template to corp-executive or modern grid.\n2. Configure 3-column asymmetric card grid with high-density spacing.\n3. Apply emerald (#10b981) key highlights and crisp obsidian border tokens.\n4. Feature latest software projects and field evidence in the primary hero card.\n\n[DESIGN SPECS]\n- Theme: dark\n- Accent: #10b981\n- Typography: Inter\n- Grid Columns: 3\n- Effects: Subtle perimeter border with 1px obsidian hairline borders.\n\n[SECURITY & PRIVACY]\n- Ensure all GitHub repository links and project URLs remain strictly authentic."
  },
  {
    "id": "redesign-minimal-swiss",
    "category": "design",
    "categoryLabel": "Portfolio Redesign",
    "title": "Minimal Swiss Monochrome Studio",
    "summary": "Editorial black-and-white minimalist portfolio focusing strictly on typography and whitespace.",
    "role": "Editorial Typographer & Swiss Style Designer",
    "objective": "Strip all extraneous visual chrome in favor of immaculate typography, high contrast, and editorial whitespace.",
    "commands": [
      "Switch portfolio template to tech-minimalist.",
      "Set monochrome color palette with neutral steel accents (#64748b).",
      "Use single-column centered content flow for maximum reading focus.",
      "Enforce generous line heights and distinct typographic hierarchy."
    ],
    "designSpecs": {
      "theme": "dark",
      "accentColor": "#94a3b8",
      "fontFamily": "Inter",
      "gridColumns": 1,
      "seeAllLimit": 8,
      "effects": "Zero heavy halos; quiet chrome with 100% content clarity."
    },
    "securityRules": "Zero decorative fluff or emojis. Maintain strict professional sobriety.",
    "prompt": "[ROLE]\nEditorial Typographer & Swiss Style Designer\n\n[OBJECTIVE]\nStrip all extraneous visual chrome in favor of immaculate typography, high contrast, and editorial whitespace.\n\n[COMMANDS]\n1. Switch portfolio template to tech-minimalist.\n2. Set monochrome color palette with neutral steel accents (#64748b).\n3. Use single-column centered content flow for maximum reading focus.\n4. Enforce generous line heights and distinct typographic hierarchy.\n\n[DESIGN SPECS]\n- Theme: dark\n- Accent: #94a3b8\n- Typography: Inter\n- Grid Columns: 1\n- Effects: Zero heavy halos; quiet chrome with 100% content clarity.\n\n[SECURITY & PRIVACY]\n- Zero decorative fluff or emojis. Maintain strict professional sobriety."
  },
  {
    "id": "redesign-corporate-executive",
    "category": "design",
    "categoryLabel": "Portfolio Redesign",
    "title": "Corporate Executive & Leadership Portal",
    "summary": "Polished executive layout with royal navy blue accents, structured leadership credentials, and 3-column grid.",
    "role": "Executive Branding Consultant & Career Strategist",
    "objective": "Position candidate as an authoritative leader in healthcare technology, clinical research, and team stewardship.",
    "commands": [
      "Switch portfolio template to corp-executive.",
      "Apply royal navy accent (#2563eb) with high-contrast card elevation.",
      "Organize leadership appointments and research governance into 3 columns.",
      "Summarize executive credentials and clinical oversight in bio tagline."
    ],
    "designSpecs": {
      "theme": "dark",
      "accentColor": "#2563eb",
      "fontFamily": "Plus Jakarta Sans",
      "gridColumns": 3,
      "seeAllLimit": 6,
      "effects": "Crisp card elevation with 1px border contrast."
    },
    "securityRules": "Only reflect actual held leadership positions and documented institutional affiliations.",
    "prompt": "[ROLE]\nExecutive Branding Consultant & Career Strategist\n\n[OBJECTIVE]\nPosition candidate as an authoritative leader in healthcare technology, clinical research, and team stewardship.\n\n[COMMANDS]\n1. Switch portfolio template to corp-executive.\n2. Apply royal navy accent (#2563eb) with high-contrast card elevation.\n3. Organize leadership appointments and research governance into 3 columns.\n4. Summarize executive credentials and clinical oversight in bio tagline.\n\n[DESIGN SPECS]\n- Theme: dark\n- Accent: #2563eb\n- Typography: Plus Jakarta Sans\n- Grid Columns: 3\n- Effects: Crisp card elevation with 1px border contrast.\n\n[SECURITY & PRIVACY]\n- Only reflect actual held leadership positions and documented institutional affiliations."
  },
  {
    "id": "redesign-dark-matrix",
    "category": "design",
    "categoryLabel": "Portfolio Redesign",
    "title": "Dark Matrix Research Terminal",
    "summary": "Bioinformatics and developer hacker aesthetic with amber terminal accents and JetBrains Mono code typography.",
    "role": "Bioinformatics Developer & Terminal Systems Specialist",
    "objective": "Craft an immersive computational research environment with monospace aesthetics and warm amber telemetry.",
    "commands": [
      "Switch typography pairing to JetBrains Mono.",
      "Set accent color to warm amber (#f59e0b) with pitch black backdrop.",
      "Configure terminal-style card borders and 2-column code-centric layout.",
      "Highlight computational genomics pipelines, Nextflow, Python, and Linux tooling."
    ],
    "designSpecs": {
      "theme": "dark",
      "accentColor": "#f59e0b",
      "fontFamily": "JetBrains Mono",
      "gridColumns": 2,
      "seeAllLimit": 6,
      "effects": "Subtle amber border glow and monospaced telemetry tags."
    },
    "securityRules": "Ensure computational competencies match verified projects and publications.",
    "prompt": "[ROLE]\nBioinformatics Developer & Terminal Systems Specialist\n\n[OBJECTIVE]\nCraft an immersive computational research environment with monospace aesthetics and warm amber telemetry.\n\n[COMMANDS]\n1. Switch typography pairing to JetBrains Mono.\n2. Set accent color to warm amber (#f59e0b) with pitch black backdrop.\n3. Configure terminal-style card borders and 2-column code-centric layout.\n4. Highlight computational genomics pipelines, Nextflow, Python, and Linux tooling.\n\n[DESIGN SPECS]\n- Theme: dark\n- Accent: #f59e0b\n- Typography: JetBrains Mono\n- Grid Columns: 2\n- Effects: Subtle amber border glow and monospaced telemetry tags.\n\n[SECURITY & PRIVACY]\n- Ensure computational competencies match verified projects and publications."
  },
  {
    "id": "anim-perimeter-glow",
    "category": "layout",
    "categoryLabel": "Animations & Visuals",
    "title": "Shifting Perimeter Gradient & 20px Radiant Glow",
    "summary": "Activate Mother Showcase perimeter gradient border shifting animation with radiant 20px glow.",
    "role": "Creative Frontend Motion Engineer",
    "objective": "Inject tasteful, hardware-accelerated motion to card perimeter borders and ambient lighting without performance drops.",
    "commands": [
      "Apply perimeter border gradient with active radiant glow.",
      "Configure smooth 4s cyclic angle shift on key research and hero cards.",
      "Add 20px radiant box-shadow matched to the active accent color.",
      "Ensure prefers-reduced-motion is strictly respected."
    ],
    "designSpecs": {
      "theme": "dark",
      "accentColor": "#0d9488",
      "effects": "Card perimeter gradient shift (@keyframes perimeterRotate) with 20px radiant teal glow."
    },
    "securityRules": "Zero invasive JavaScript animation loops; rely 100% on GPU-accelerated CSS keyframes.",
    "prompt": "[ROLE]\nCreative Frontend Motion Engineer\n\n[OBJECTIVE]\nInject tasteful, hardware-accelerated motion to card perimeter borders and ambient lighting without performance drops.\n\n[COMMANDS]\n1. Apply perimeter border gradient with active radiant glow.\n2. Configure smooth 4s cyclic angle shift on key research and hero cards.\n3. Add 20px radiant box-shadow matched to the active accent color.\n4. Ensure prefers-reduced-motion is strictly respected.\n\n[DESIGN SPECS]\n- Theme: dark\n- Accent: #0d9488\n- Effects: Card perimeter gradient shift (@keyframes perimeterRotate) with 20px radiant teal glow.\n\n[SECURITY & PRIVACY]\n- Zero invasive JavaScript animation loops; rely 100% on GPU-accelerated CSS keyframes."
  },
  {
    "id": "anim-scrolling-ticker",
    "category": "layout",
    "categoryLabel": "Animations & Visuals",
    "title": "Smooth Auto-Scrolling Updates Ticker",
    "summary": "Configure vertical auto-scrolling ticker for research milestones, publications, and grant updates.",
    "role": "Interactive UI Developer",
    "objective": "Create a seamless continuous auto-scrolling news ticker for live research announcements and clinical updates.",
    "commands": [
      "Set updates ticker animation to continuous vertical scroll (22s loop).",
      "Enable pause-on-hover so users can easily read and click milestone items.",
      "Include live date stamps and category badges for each update."
    ],
    "designSpecs": {
      "theme": "dark",
      "effects": "@keyframes scrollVertical 22s linear infinite with hover pause."
    },
    "securityRules": "All ticker announcements must stem directly from verified profile updates.",
    "prompt": "[ROLE]\nInteractive UI Developer\n\n[OBJECTIVE]\nCreate a seamless continuous auto-scrolling news ticker for live research announcements and clinical updates.\n\n[COMMANDS]\n1. Set updates ticker animation to continuous vertical scroll (22s loop).\n2. Enable pause-on-hover so users can easily read and click milestone items.\n3. Include live date stamps and category badges for each update.\n\n[DESIGN SPECS]\n- Theme: dark\n- Effects: @keyframes scrollVertical 22s linear infinite with hover pause.\n\n[SECURITY & PRIVACY]\n- All ticker announcements must stem directly from verified profile updates."
  },
  {
    "id": "anim-gallery-marquee",
    "category": "layout",
    "categoryLabel": "Animations & Visuals",
    "title": "Photo Gallery Marquee with Smooth Hover Physics",
    "summary": "Enable infinite horizontal photo gallery marquee with 110s smooth loop and smooth hover zoom.",
    "role": "Motion UI & Visual Designer",
    "objective": "Showcase lab fieldwork, clinical procedures, and conference presentations via an infinite horizontal marquee.",
    "commands": [
      "Activate horizontal continuous marquee animation (110s smooth loop).",
      "Configure subtle scale-up (1.04x) and depth shadow on card hover.",
      "Ensure touch swipe and mouse drag remain fully responsive."
    ],
    "designSpecs": {
      "effects": "@keyframes scrollHorizontal 110s linear infinite with 1.04x hover scale."
    },
    "securityRules": "Display only consented evidence photos and authentic clinical documentation.",
    "prompt": "[ROLE]\nMotion UI & Visual Designer\n\n[OBJECTIVE]\nShowcase lab fieldwork, clinical procedures, and conference presentations via an infinite horizontal marquee.\n\n[COMMANDS]\n1. Activate horizontal continuous marquee animation (110s smooth loop).\n2. Configure subtle scale-up (1.04x) and depth shadow on card hover.\n3. Ensure touch swipe and mouse drag remain fully responsive.\n\n[DESIGN SPECS]\n- Effects: @keyframes scrollHorizontal 110s linear infinite with 1.04x hover scale.\n\n[SECURITY & PRIVACY]\n- Display only consented evidence photos and authentic clinical documentation."
  },
  {
    "id": "anim-solarized-slate",
    "category": "layout",
    "categoryLabel": "Animations & Visuals",
    "title": "Warm Solarized Slate Palette Transition",
    "summary": "Refined warm solarized slate color theme with muted cyan and amber contrast for prolonged reading comfort.",
    "role": "Colorist & Accessibility Specialist",
    "objective": "Switch theme tokens to an eye-friendly Solarized Slate palette compliant with WCAG AAA contrast ratios.",
    "commands": [
      "Apply solarized theme token palette with rich slate backdrop (#0f172a).",
      "Set accent to warm cyan (#06b6d4) and secondary highlights to golden amber (#d97706).",
      "Ensure all text and badge elements exceed 7:1 contrast ratios."
    ],
    "designSpecs": {
      "theme": "slate",
      "accentColor": "#06b6d4",
      "fontFamily": "Inter"
    },
    "securityRules": "Zero compromise on visual accessibility standards.",
    "prompt": "[ROLE]\nColorist & Accessibility Specialist\n\n[OBJECTIVE]\nSwitch theme tokens to an eye-friendly Solarized Slate palette compliant with WCAG AAA contrast ratios.\n\n[COMMANDS]\n1. Apply solarized theme token palette with rich slate backdrop (#0f172a).\n2. Set accent to warm cyan (#06b6d4) and secondary highlights to golden amber (#d97706).\n3. Ensure all text and badge elements exceed 7:1 contrast ratios.\n\n[DESIGN SPECS]\n- Theme: slate\n- Accent: #06b6d4\n- Typography: Inter\n\n[SECURITY & PRIVACY]\n- Zero compromise on visual accessibility standards."
  },
  {
    "id": "anim-bengali-dark",
    "category": "layout",
    "categoryLabel": "Animations & Visuals",
    "title": "ডার্ক মোড ও ভাইব্রেন্ট অ্যাকসেন্ট টিউনিং (বাংলা)",
    "summary": "বাংলা নির্দেশের মাধ্যমে পোর্টফোলিওকে ডার্ক মোডে পরিবর্তন, নীল অ্যাকসেন্ট ও ২-কলাম লেআউট কনফিগার করুন।",
    "role": "Bengali UI Localization & Frontend Stylist",
    "objective": "বাংলা কম্যান্ডের মাধ্যমে পোর্টফোলিওর থিম, ব্যাকগ্রাউন্ড ও বাটন কালার নিখুঁতভাবে পরিবর্তন করা।",
    "commands": [
      "থিম ডার্ক মোডে পরিবর্তন করো।",
      "বাটন এবং অ্যাকসেন্ট কালার ভাইব্রেন্ট ব্লু (#3b82f6) করো।",
      "কার্ডগুলোকে ২-কলাম গ্রিডে সাজাও।",
      "ফন্ট Plus Jakarta Sans এ সেট করো।"
    ],
    "designSpecs": {
      "theme": "dark",
      "accentColor": "#3b82f6",
      "fontFamily": "Plus Jakarta Sans",
      "gridColumns": 2
    },
    "securityRules": "প্রোফাইলের বিদ্যমান তথ্য ও ভেরিফাইড পাবলিকেশন অক্ষুণ্ণ রাখা।",
    "prompt": "[ROLE]\nBengali UI Localization & Frontend Stylist\n\n[OBJECTIVE]\nবাংলা কম্যান্ডের মাধ্যমে পোর্টফোলিওর থিম, ব্যাকগ্রাউন্ড ও বাটন কালার নিখুঁতভাবে পরিবর্তন করা।\n\n[COMMANDS]\n1. থিম ডার্ক মোডে পরিবর্তন করো।\n2. বাটন এবং অ্যাকসেন্ট কালার ভাইব্রেন্ট ব্লু (#3b82f6) করো।\n3. কার্ডগুলোকে ২-কলাম গ্রিডে সাজাও।\n4. ফন্ট Plus Jakarta Sans এ সেট করো।\n\n[DESIGN SPECS]\n- Theme: dark\n- Accent: #3b82f6\n- Typography: Plus Jakarta Sans\n- Grid Columns: 2\n\n[SECURITY & PRIVACY]\n- প্রোফাইলের বিদ্যমান তথ্য ও ভেরিফাইড পাবলিকেশন অক্ষুণ্ণ রাখা।"
  },
  {
    "id": "acad-first-author-pubs",
    "category": "academic",
    "categoryLabel": "Academic & Research",
    "title": "Highlight First-Author & High-Impact Papers",
    "summary": "Prioritize peer-reviewed journal articles with verified DOIs, author lists, and impact metrics.",
    "role": "Academic Publishing Advisor & Bibliometrics Expert",
    "objective": "Reorder and format publications to highlight first-author contributions, journal impact, and open-access DOIs.",
    "commands": [
      "Reorder publications so first-author journal articles appear at the top.",
      "Format citations strictly adhering to APA 7th style with verified DOIs.",
      "Add badges for Peer-Reviewed, Open Access, and High-Impact Journal.",
      "Ensure author name is bolded in all citation strings."
    ],
    "designSpecs": {
      "effects": "Golden DOI badges and verified checkmark pills on indexed papers."
    },
    "securityRules": "Verify that every publication exists in authentic profile records. NEVER generate fabricated DOIs.",
    "prompt": "[ROLE]\nAcademic Publishing Advisor & Bibliometrics Expert\n\n[OBJECTIVE]\nReorder and format publications to highlight first-author contributions, journal impact, and open-access DOIs.\n\n[COMMANDS]\n1. Reorder publications so first-author journal articles appear at the top.\n2. Format citations strictly adhering to APA 7th style with verified DOIs.\n3. Add badges for Peer-Reviewed, Open Access, and High-Impact Journal.\n4. Ensure author name is bolded in all citation strings.\n\n[DESIGN SPECS]\n- Effects: Golden DOI badges and verified checkmark pills on indexed papers.\n\n[SECURITY & PRIVACY]\n- Verify that every publication exists in authentic profile records. NEVER generate fabricated DOIs."
  },
  {
    "id": "acad-molecular-pathogen",
    "category": "academic",
    "categoryLabel": "Academic & Research",
    "title": "Molecular Pathogen & Genomic Surveillance Polish",
    "summary": "Refine research appointments to emphasize AMR genomics, molecular virology, and bioinformatic pipelines.",
    "role": "Principal Investigator in Infectious Pathogens & Genomics",
    "objective": "Polish research experience bullet points to reflect rigorous molecular methodologies and public health surveillance.",
    "commands": [
      "Refine research appointment bullets emphasizing PCR, Sanger/NGS sequencing, and phylogenetics.",
      "Highlight One Health cross-species transmission models and antimicrobial resistance profiling.",
      "Mention computational tools: BLAST+, Biopython, Nextstrain, and GeoPandas."
    ],
    "designSpecs": {
      "effects": "Category-specific methodological tags and grant tracking pills."
    },
    "securityRules": "Ground all laboratory methodologies strictly in the researcher's actual verified experience.",
    "prompt": "[ROLE]\nPrincipal Investigator in Infectious Pathogens & Genomics\n\n[OBJECTIVE]\nPolish research experience bullet points to reflect rigorous molecular methodologies and public health surveillance.\n\n[COMMANDS]\n1. Refine research appointment bullets emphasizing PCR, Sanger/NGS sequencing, and phylogenetics.\n2. Highlight One Health cross-species transmission models and antimicrobial resistance profiling.\n3. Mention computational tools: BLAST+, Biopython, Nextstrain, and GeoPandas.\n\n[DESIGN SPECS]\n- Effects: Category-specific methodological tags and grant tracking pills.\n\n[SECURITY & PRIVACY]\n- Ground all laboratory methodologies strictly in the researcher's actual verified experience."
  },
  {
    "id": "acad-fellowships-grants",
    "category": "academic",
    "categoryLabel": "Academic & Research",
    "title": "Research Grants & Dean's Fellowships Structuring",
    "summary": "Structure competitive awards, dean's grants, and travel fellowships with funding amounts and PI roles.",
    "role": "University Research Grants Administrator",
    "objective": "Highlight competitive research funding, grant leadership, and merit fellowships with clear dollar amounts.",
    "commands": [
      "Structure awards into competitive categories: Research Grants, Fellowships, and Merit Honors.",
      "Display funding figures ($ USD or local currency) alongside granting agencies.",
      "Highlight role as Principal Investigator or Lead Student Researcher."
    ],
    "designSpecs": {
      "effects": "Gold grant badge and structured agency funding cards."
    },
    "securityRules": "Zero inflation of award values or phantom sponsorships.",
    "prompt": "[ROLE]\nUniversity Research Grants Administrator\n\n[OBJECTIVE]\nHighlight competitive research funding, grant leadership, and merit fellowships with clear dollar amounts.\n\n[COMMANDS]\n1. Structure awards into competitive categories: Research Grants, Fellowships, and Merit Honors.\n2. Display funding figures ($ USD or local currency) alongside granting agencies.\n3. Highlight role as Principal Investigator or Lead Student Researcher.\n\n[DESIGN SPECS]\n- Effects: Gold grant badge and structured agency funding cards.\n\n[SECURITY & PRIVACY]\n- Zero inflation of award values or phantom sponsorships."
  },
  {
    "id": "acad-bio-refinement",
    "category": "academic",
    "categoryLabel": "Academic & Research",
    "title": "Authoritative Two-Paragraph Academic Bio",
    "summary": "Synthesize academic career, veterinary medicine background, and computational genomics into 2 crisp paragraphs.",
    "role": "Academic Biography Editor & Faculty Recruiter",
    "objective": "Craft a compelling 2-paragraph professional bio blending clinical veterinary medicine with computational pathogen research.",
    "commands": [
      "Draft Paragraph 1 focusing on clinical foundation (DVM, clinical pathology, animal disease surveillance).",
      "Draft Paragraph 2 focusing on computational genomics, AMR research output, and doctoral aspiration.",
      "Ensure tone is scholarly, concise, and devoid of empty hype."
    ],
    "designSpecs": {
      "fontFamily": "Plus Jakarta Sans"
    },
    "securityRules": "Only reflect verified educational degrees, institutional honors, and real research interests.",
    "prompt": "[ROLE]\nAcademic Biography Editor & Faculty Recruiter\n\n[OBJECTIVE]\nCraft a compelling 2-paragraph professional bio blending clinical veterinary medicine with computational pathogen research.\n\n[COMMANDS]\n1. Draft Paragraph 1 focusing on clinical foundation (DVM, clinical pathology, animal disease surveillance).\n2. Draft Paragraph 2 focusing on computational genomics, AMR research output, and doctoral aspiration.\n3. Ensure tone is scholarly, concise, and devoid of empty hype.\n\n[DESIGN SPECS]\n- Typography: Plus Jakarta Sans\n\n[SECURITY & PRIVACY]\n- Only reflect verified educational degrees, institutional honors, and real research interests."
  },
  {
    "id": "acad-computational-skills",
    "category": "academic",
    "categoryLabel": "Academic & Research",
    "title": "Add Computational & Laboratory Skills Matrix",
    "summary": "Append verified wet-lab techniques and bioinformatics software competencies to technical skills.",
    "role": "Bioinformatics Lead & Lab Manager",
    "objective": "Categorize skills into Laboratory Molecular Techniques, Computational Pipelines, and Web Development.",
    "commands": [
      "Add computational skills: Python, Nextflow, BLAST+, Biopython, Linux Bash, GeoPandas.",
      "Add laboratory skills: RT-PCR, Gel Electrophoresis, Pathogen Isolation, Antibiotic Susceptibility Testing.",
      "Add full-stack skills: JavaScript, Node.js, WebSockets, HTML5/CSS3."
    ],
    "designSpecs": {
      "gridColumns": 3
    },
    "securityRules": "Ensure candidate genuinely possesses working familiarity with added tools.",
    "prompt": "[ROLE]\nBioinformatics Lead & Lab Manager\n\n[OBJECTIVE]\nCategorize skills into Laboratory Molecular Techniques, Computational Pipelines, and Web Development.\n\n[COMMANDS]\n1. Add computational skills: Python, Nextflow, BLAST+, Biopython, Linux Bash, GeoPandas.\n2. Add laboratory skills: RT-PCR, Gel Electrophoresis, Pathogen Isolation, Antibiotic Susceptibility Testing.\n3. Add full-stack skills: JavaScript, Node.js, WebSockets, HTML5/CSS3.\n\n[DESIGN SPECS]\n- Grid Columns: 3\n\n[SECURITY & PRIVACY]\n- Ensure candidate genuinely possesses working familiarity with added tools."
  },
  {
    "id": "ats-google-xyz",
    "category": "corporate",
    "categoryLabel": "ATS CV & Resume",
    "title": "Google XYZ Formula Action-Verb Bullets",
    "summary": "Refactor all experience bullets into the Google XYZ formula: \"Accomplished [X], measured by [Y], by doing [Z]\".",
    "role": "Principal Technical Recruiter & ATS Architect",
    "objective": "Transform resume bullets into high-impact quantifiable metrics using the Google XYZ structure.",
    "commands": [
      "Rewrite project and research bullets following: Accomplished [X], as measured by [Y], by doing [Z].",
      "Begin every bullet with strong past-tense action verbs (Pioneered, Architected, Engineered, Formulated).",
      "Eliminate passive phrases like \"Responsible for\" or \"Assisted with\".",
      "Incorporate quantifiable metrics (percentages, sample sizes, processing speed, dollar values)."
    ],
    "designSpecs": {
      "theme": "dark",
      "fontFamily": "Inter"
    },
    "securityRules": "Keep metrics grounded in real project scopes without fabricating numbers.",
    "prompt": "[ROLE]\nPrincipal Technical Recruiter & ATS Architect\n\n[OBJECTIVE]\nTransform resume bullets into high-impact quantifiable metrics using the Google XYZ structure.\n\n[COMMANDS]\n1. Rewrite project and research bullets following: Accomplished [X], as measured by [Y], by doing [Z].\n2. Begin every bullet with strong past-tense action verbs (Pioneered, Architected, Engineered, Formulated).\n3. Eliminate passive phrases like \"Responsible for\" or \"Assisted with\".\n4. Incorporate quantifiable metrics (percentages, sample sizes, processing speed, dollar values).\n\n[DESIGN SPECS]\n- Theme: dark\n- Typography: Inter\n\n[SECURITY & PRIVACY]\n- Keep metrics grounded in real project scopes without fabricating numbers."
  },
  {
    "id": "ats-tailor-bioinformatics",
    "category": "corporate",
    "categoryLabel": "ATS CV & Resume",
    "title": "Tailor CV Profile for Bioinformatics Analyst",
    "summary": "Create a dedicated targeted CV profile emphasizing genomic pipelines, statistical modeling, and Python.",
    "role": "Genomics Talent Acquisition Director",
    "objective": "Create a tailored CV profile highlighting NGS analysis, sequence alignment, and algorithmic data processing.",
    "commands": [
      "Create targeted CV profile named \"Bioinformatics Analyst\".",
      "Include sections: education, research, publications, projects, skills.",
      "Prioritize computational projects (BLAST+ parser, genomic variant caller, phylogenetic pipeline).",
      "Set target opportunity title to \"Bioinformatics Analyst / Computational Biologist\"."
    ],
    "designSpecs": {
      "templateId": "cv-tech-minimalist"
    },
    "securityRules": "Do not modify the master profile; save cleanly into cvProfiles array.",
    "prompt": "[ROLE]\nGenomics Talent Acquisition Director\n\n[OBJECTIVE]\nCreate a tailored CV profile highlighting NGS analysis, sequence alignment, and algorithmic data processing.\n\n[COMMANDS]\n1. Create targeted CV profile named \"Bioinformatics Analyst\".\n2. Include sections: education, research, publications, projects, skills.\n3. Prioritize computational projects (BLAST+ parser, genomic variant caller, phylogenetic pipeline).\n4. Set target opportunity title to \"Bioinformatics Analyst / Computational Biologist\".\n\n[DESIGN SPECS]\n- Clean minimal styling with deliberate spacing.\n\n[SECURITY & PRIVACY]\n- Do not modify the master profile; save cleanly into cvProfiles array."
  },
  {
    "id": "ats-compact-one-page",
    "category": "corporate",
    "categoryLabel": "ATS CV & Resume",
    "title": "Compact 1-Page Industry Tech Resume",
    "summary": "Streamline CV for corporate and industry roles fitting cleanly on a single high-impact A4 sheet.",
    "role": "Silicon Valley Engineering Manager & Resume Coach",
    "objective": "Condense candidate profile into a high-density 1-page tech resume with zero overflow.",
    "commands": [
      "Switch CV template to cv-tech-minimalist.",
      "Limit visible publications to top 3 flagship papers.",
      "Feature top 3 production software projects with live URLs.",
      "Consolidate technical skills into a compact inline matrix."
    ],
    "designSpecs": {
      "templateId": "cv-tech-minimalist",
      "seeAllLimit": 3
    },
    "securityRules": "Maintain full authenticity while prioritizing highest-signal achievements.",
    "prompt": "[ROLE]\nSilicon Valley Engineering Manager & Resume Coach\n\n[OBJECTIVE]\nCondense candidate profile into a high-density 1-page tech resume with zero overflow.\n\n[COMMANDS]\n1. Switch CV template to cv-tech-minimalist.\n2. Limit visible publications to top 3 flagship papers.\n3. Feature top 3 production software projects with live URLs.\n4. Consolidate technical skills into a compact inline matrix.\n\n[DESIGN SPECS]\n- Clean minimal styling with deliberate spacing.\n\n[SECURITY & PRIVACY]\n- Maintain full authenticity while prioritizing highest-signal achievements."
  },
  {
    "id": "ats-europass-grid",
    "category": "corporate",
    "categoryLabel": "ATS CV & Resume",
    "title": "Europass Academic CV with CEFR Language Grid",
    "summary": "Configure official Europass template with structured CEFR self-assessment table and EU academic sections.",
    "role": "European Academic Mobility Coordinator",
    "objective": "Prepare a compliant European CV adhering to the official Europass layout and CEFR language framework.",
    "commands": [
      "Switch CV template to cv-acad-europass.",
      "Include official CEFR language self-assessment grid (Listening, Reading, Spoken Interaction, Production, Writing).",
      "Format academic appointments and clinical qualifications with European date formats (DD/MM/YYYY)."
    ],
    "designSpecs": {
      "templateId": "cv-acad-europass"
    },
    "securityRules": "Strictly adhere to CEFR levels (A1 through C2) without exaggerated ratings.",
    "prompt": "[ROLE]\nEuropean Academic Mobility Coordinator\n\n[OBJECTIVE]\nPrepare a compliant European CV adhering to the official Europass layout and CEFR language framework.\n\n[COMMANDS]\n1. Switch CV template to cv-acad-europass.\n2. Include official CEFR language self-assessment grid (Listening, Reading, Spoken Interaction, Production, Writing).\n3. Format academic appointments and clinical qualifications with European date formats (DD/MM/YYYY).\n\n[DESIGN SPECS]\n- Clean minimal styling with deliberate spacing.\n\n[SECURITY & PRIVACY]\n- Strictly adhere to CEFR levels (A1 through C2) without exaggerated ratings."
  },
  {
    "id": "ats-clinical-vet-lead",
    "category": "corporate",
    "categoryLabel": "ATS CV & Resume",
    "title": "Clinical Veterinary Lead & Hospital Director CV",
    "summary": "Tailor CV profile for veterinary hospital leadership, surgical caseload, and clinical pathology oversight.",
    "role": "Veterinary Medical Board Reviewer & Hospital Director",
    "objective": "Highlight surgical competency, diagnostic imaging, herd health management, and clinical team mentorship.",
    "commands": [
      "Create targeted CV profile named \"Lead Veterinary Clinician\".",
      "Emphasize surgical procedures, small animal medicine, and pathology diagnostics.",
      "Feature veterinary registration credentials and clinical honors."
    ],
    "designSpecs": {
      "templateId": "cv-corp-clean"
    },
    "securityRules": "Only state valid clinical licensing and authenticated surgical procedures.",
    "prompt": "[ROLE]\nVeterinary Medical Board Reviewer & Hospital Director\n\n[OBJECTIVE]\nHighlight surgical competency, diagnostic imaging, herd health management, and clinical team mentorship.\n\n[COMMANDS]\n1. Create targeted CV profile named \"Lead Veterinary Clinician\".\n2. Emphasize surgical procedures, small animal medicine, and pathology diagnostics.\n3. Feature veterinary registration credentials and clinical honors.\n\n[DESIGN SPECS]\n- Clean minimal styling with deliberate spacing.\n\n[SECURITY & PRIVACY]\n- Only state valid clinical licensing and authenticated surgical procedures."
  },
  {
    "id": "sop-phd-amr",
    "category": "letters",
    "categoryLabel": "SOP & Outreach",
    "title": "PhD Statement of Purpose in AMR & One Health",
    "summary": "Draft a rigorous 800-word PhD SOP connecting veterinary field research to molecular antimicrobial resistance.",
    "role": "Graduate Admissions Chair in Infectious Disease & One Health",
    "objective": "Draft a compelling, scholarly Statement of Purpose connecting veterinary field pathology to molecular AMR genomics.",
    "commands": [
      "Draft SOP for PhD in Pathobiology / Infectious Pathogens.",
      "Section 1: Intellectual Hook — field observations of antimicrobial misuse and zoonotic spillover.",
      "Section 2: Research Foundation — laboratory molecular diagnostics and genomic sequencing outputs.",
      "Section 3: Methodological Competence — computational phylogenetic modeling and AST profiling.",
      "Section 4: Proposed Doctoral Trajectory and alignment with target lab focus."
    ],
    "designSpecs": {
      "mode": "sop"
    },
    "securityRules": "Zero fabricated research findings or fake lab references. Grounded 100% in candidate's real portfolio.",
    "prompt": "[ROLE]\nGraduate Admissions Chair in Infectious Disease & One Health\n\n[OBJECTIVE]\nDraft a compelling, scholarly Statement of Purpose connecting veterinary field pathology to molecular AMR genomics.\n\n[COMMANDS]\n1. Draft SOP for PhD in Pathobiology / Infectious Pathogens.\n2. Section 1: Intellectual Hook — field observations of antimicrobial misuse and zoonotic spillover.\n3. Section 2: Research Foundation — laboratory molecular diagnostics and genomic sequencing outputs.\n4. Section 3: Methodological Competence — computational phylogenetic modeling and AST profiling.\n5. Section 4: Proposed Doctoral Trajectory and alignment with target lab focus.\n\n[DESIGN SPECS]\n- Clean minimal styling with deliberate spacing.\n\n[SECURITY & PRIVACY]\n- Zero fabricated research findings or fake lab references. Grounded 100% in candidate's real portfolio."
  },
  {
    "id": "sop-european-fellowship",
    "category": "letters",
    "categoryLabel": "SOP & Outreach",
    "title": "Motivation Letter for European Research Fellowship",
    "summary": "Craft a structured motivation letter for European Union Erasmus Mundus or DAAD doctoral scholarships.",
    "role": "European Research Council (ERC) Fellowship Reviewer",
    "objective": "Draft a motivation letter highlighting international research collaboration, One Health policy, and scientific impact.",
    "commands": [
      "Draft motivation letter adhering to European fellowship standards (500-700 words).",
      "Articulate clear research objectives aligned with EU Horizon Europe and Global Health priorities.",
      "Highlight candidate's adaptability, field resilience, and computational competencies."
    ],
    "designSpecs": {
      "mode": "motivation"
    },
    "securityRules": "Reflect verified academic milestones and genuine institutional motivations.",
    "prompt": "[ROLE]\nEuropean Research Council (ERC) Fellowship Reviewer\n\n[OBJECTIVE]\nDraft a motivation letter highlighting international research collaboration, One Health policy, and scientific impact.\n\n[COMMANDS]\n1. Draft motivation letter adhering to European fellowship standards (500-700 words).\n2. Articulate clear research objectives aligned with EU Horizon Europe and Global Health priorities.\n3. Highlight candidate's adaptability, field resilience, and computational competencies.\n\n[DESIGN SPECS]\n- Clean minimal styling with deliberate spacing.\n\n[SECURITY & PRIVACY]\n- Reflect verified academic milestones and genuine institutional motivations."
  },
  {
    "id": "sop-cold-email-pi",
    "category": "letters",
    "categoryLabel": "SOP & Outreach",
    "title": "Targeted Cold Email to Prospective Faculty PI",
    "summary": "Draft a concise 200-word cold email to a university professor proposing PhD/Postdoc research collaboration.",
    "role": "Tenured Professor & Laboratory Principal Investigator",
    "objective": "Draft a concise, high-response cold email connecting the candidate's published work to the professor's latest papers.",
    "commands": [
      "Craft high-impact subject line referencing specific research intersection.",
      "Paragraph 1: Concise hook mentioning professor's recent publication.",
      "Paragraph 2: Candidate's direct relevant skills (wet lab + computational) and first-author publications.",
      "Paragraph 3: Explicit funding inquiry (GRA/GTA/Fellowship) and offer to discuss on a brief 15-minute call.",
      "Keep entire body under 220 words for maximum reading completion on mobile."
    ],
    "designSpecs": {
      "mode": "email"
    },
    "securityRules": "Zero sycophancy or generic spam templates. Must cite genuine research connections.",
    "prompt": "[ROLE]\nTenured Professor & Laboratory Principal Investigator\n\n[OBJECTIVE]\nDraft a concise, high-response cold email connecting the candidate's published work to the professor's latest papers.\n\n[COMMANDS]\n1. Craft high-impact subject line referencing specific research intersection.\n2. Paragraph 1: Concise hook mentioning professor's recent publication.\n3. Paragraph 2: Candidate's direct relevant skills (wet lab + computational) and first-author publications.\n4. Paragraph 3: Explicit funding inquiry (GRA/GTA/Fellowship) and offer to discuss on a brief 15-minute call.\n5. Keep entire body under 220 words for maximum reading completion on mobile.\n\n[DESIGN SPECS]\n- Clean minimal styling with deliberate spacing.\n\n[SECURITY & PRIVACY]\n- Zero sycophancy or generic spam templates. Must cite genuine research connections."
  },
  {
    "id": "sop-cover-letter-industry",
    "category": "letters",
    "categoryLabel": "SOP & Outreach",
    "title": "R&D Cover Letter for Biotechnology Industry",
    "summary": "Professional cover letter for Scientist / Research Associate roles in biotech and veterinary pharma.",
    "role": "Biotech VP of Human Resources & Hiring Scientist",
    "objective": "Position candidate as an adaptable R&D scientist bridging biological laboratory assays with software engineering.",
    "commands": [
      "Draft industry cover letter highlighting assay development, diagnostic validation, and data pipelines.",
      "Translate academic publications into quantifiable industrial competencies (QC, protocols, throughput).",
      "Convey enthusiasm for target company's commercial therapeutics or diagnostic platforms."
    ],
    "designSpecs": {
      "mode": "cover"
    },
    "securityRules": "Only claim experience with equipment and techniques actually utilized in career.",
    "prompt": "[ROLE]\nBiotech VP of Human Resources & Hiring Scientist\n\n[OBJECTIVE]\nPosition candidate as an adaptable R&D scientist bridging biological laboratory assays with software engineering.\n\n[COMMANDS]\n1. Draft industry cover letter highlighting assay development, diagnostic validation, and data pipelines.\n2. Translate academic publications into quantifiable industrial competencies (QC, protocols, throughput).\n3. Convey enthusiasm for target company's commercial therapeutics or diagnostic platforms.\n\n[DESIGN SPECS]\n- Clean minimal styling with deliberate spacing.\n\n[SECURITY & PRIVACY]\n- Only claim experience with equipment and techniques actually utilized in career."
  },
  {
    "id": "sop-postdoc-inquiry",
    "category": "letters",
    "categoryLabel": "SOP & Outreach",
    "title": "Postdoctoral Research Fellowship Inquiry",
    "summary": "Formal letter of inquiry to lab heads regarding funded postdoctoral positions in pathogen genomics.",
    "role": "Senior Postdoctoral Mentor & Research Director",
    "objective": "Position graduating researcher for high-impact postdoctoral appointments with independent project proposals.",
    "commands": [
      "Draft formal postdoctoral inquiry letter.",
      "Detail doctoral/master's thesis contributions and independent grant leadership.",
      "Propose specific symbiotic research directions benefiting the target host laboratory."
    ],
    "designSpecs": {
      "mode": "cover"
    },
    "securityRules": "Preserve authentic publication records and documented thesis topics.",
    "prompt": "[ROLE]\nSenior Postdoctoral Mentor & Research Director\n\n[OBJECTIVE]\nPosition graduating researcher for high-impact postdoctoral appointments with independent project proposals.\n\n[COMMANDS]\n1. Draft formal postdoctoral inquiry letter.\n2. Detail doctoral/master's thesis contributions and independent grant leadership.\n3. Propose specific symbiotic research directions benefiting the target host laboratory.\n\n[DESIGN SPECS]\n- Clean minimal styling with deliberate spacing.\n\n[SECURITY & PRIVACY]\n- Preserve authentic publication records and documented thesis topics."
  },
  {
    "id": "widget-google-map",
    "category": "custom",
    "categoryLabel": "Custom Sections & Widgets",
    "title": "Interactive Google Maps Field Coordinates Hub",
    "summary": "Configure interactive Google Map with Satellite toggle and GPS coordinate copy pill for field research sites.",
    "role": "GIS Specialist & Field Research Coordinator",
    "objective": "Display an interactive fieldwork map pinpointing clinical research surveillance locations with GPS copy utility.",
    "commands": [
      "Enable interactive Google Maps section in portfolio display configuration.",
      "Set primary research coordinates (e.g. 24.374043° N, 88.644182° E for Rajshahi, Bangladesh).",
      "Enable Satellite / Standard terrain toggle.",
      "Add one-click GPS coordinate copy pill with visual feedback."
    ],
    "designSpecs": {
      "effects": "Embedded responsive map iframe with dark-themed wrapper and interactive coordinate pills."
    },
    "securityRules": "Use public institutional or research district coordinates; do not expose private residential addresses.",
    "prompt": "[ROLE]\nGIS Specialist & Field Research Coordinator\n\n[OBJECTIVE]\nDisplay an interactive fieldwork map pinpointing clinical research surveillance locations with GPS copy utility.\n\n[COMMANDS]\n1. Enable interactive Google Maps section in portfolio display configuration.\n2. Set primary research coordinates (e.g. 24.374043° N, 88.644182° E for Rajshahi, Bangladesh).\n3. Enable Satellite / Standard terrain toggle.\n4. Add one-click GPS coordinate copy pill with visual feedback.\n\n[DESIGN SPECS]\n- Effects: Embedded responsive map iframe with dark-themed wrapper and interactive coordinate pills.\n\n[SECURITY & PRIVACY]\n- Use public institutional or research district coordinates; do not expose private residential addresses."
  },
  {
    "id": "widget-pdf-floating-pill",
    "category": "custom",
    "categoryLabel": "Custom Sections & Widgets",
    "title": "Floating Quick-Action CV PDF & Print Pill",
    "summary": "Add fixed bottom-right floating pill for instant 1-click vector PDF download and ATS CV viewing.",
    "role": "Conversion Rate Optimization (CRO) UX Specialist",
    "objective": "Add a persistent floating action pill enabling visitors to instantly preview or download the vector CV PDF.",
    "commands": [
      "Inject floating action pill positioned at bottom-right viewport.",
      "Link button directly to CV preview mode or printable PDF export.",
      "Include file size badge and download icon.",
      "Ensure it does not obscure footer or mobile content."
    ],
    "designSpecs": {
      "effects": "Floating pill with 0 8px 24px rgba(0,0,0,0.3) elevation and backdrop-filter: blur(8px)."
    },
    "securityRules": "Point strictly to client-side rendered PDF; never route to third-party tracking URLs.",
    "prompt": "[ROLE]\nConversion Rate Optimization (CRO) UX Specialist\n\n[OBJECTIVE]\nAdd a persistent floating action pill enabling visitors to instantly preview or download the vector CV PDF.\n\n[COMMANDS]\n1. Inject floating action pill positioned at bottom-right viewport.\n2. Link button directly to CV preview mode or printable PDF export.\n3. Include file size badge and download icon.\n4. Ensure it does not obscure footer or mobile content.\n\n[DESIGN SPECS]\n- Effects: Floating pill with 0 8px 24px rgba(0,0,0,0.3) elevation and backdrop-filter: blur(8px).\n\n[SECURITY & PRIVACY]\n- Point strictly to client-side rendered PDF; never route to third-party tracking URLs."
  },
  {
    "id": "widget-digital-evidence",
    "category": "custom",
    "categoryLabel": "Custom Sections & Widgets",
    "title": "Verified Digital Evidence & Certificate Viewer",
    "summary": "Create custom section showcasing verified lab certificates, clinical licenses, and institutional letters.",
    "role": "Academic Credentials Verifier",
    "objective": "Create a dedicated \"Verified Evidence & Documentation\" custom section with inline PDF and image previews.",
    "commands": [
      "Create custom section titled \"Verified Credentials & Lab Evidence\".",
      "Add cards for: Veterinary Medical License, Dean's Award Certificate, Bioethics Clearance.",
      "Support inline preview for Google Drive and local documents."
    ],
    "designSpecs": {
      "gridColumns": 3
    },
    "securityRules": "Redact sensitive government ID numbers and personal phone numbers.",
    "prompt": "[ROLE]\nAcademic Credentials Verifier\n\n[OBJECTIVE]\nCreate a dedicated \"Verified Evidence & Documentation\" custom section with inline PDF and image previews.\n\n[COMMANDS]\n1. Create custom section titled \"Verified Credentials & Lab Evidence\".\n2. Add cards for: Veterinary Medical License, Dean's Award Certificate, Bioethics Clearance.\n3. Support inline preview for Google Drive and local documents.\n\n[DESIGN SPECS]\n- Grid Columns: 3\n\n[SECURITY & PRIVACY]\n- Redact sensitive government ID numbers and personal phone numbers."
  },
  {
    "id": "widget-research-pipeline",
    "category": "custom",
    "categoryLabel": "Custom Sections & Widgets",
    "title": "Laboratory Computational Pipeline Architecture",
    "summary": "Visual flowchart section diagramming sample collection, DNA extraction, NGS sequencing, and bioinformatic analysis.",
    "role": "Computational Workflow Architect",
    "objective": "Showcase the laboratory's end-to-end methodology from field specimen collection to high-throughput sequencing analysis.",
    "commands": [
      "Add custom section titled \"End-to-End Surveillance Pipeline\".",
      "Step 1: Clinical Sample Collection & Cold Chain Logistics.",
      "Step 2: Pathogen Nucleic Acid Extraction & Quality Control.",
      "Step 3: High-Throughput Sequencing & Antimicrobial Profiling.",
      "Step 4: Phylogenetic Tree Inference & Public Health Alerting."
    ],
    "designSpecs": {
      "gridColumns": 4
    },
    "securityRules": "Accurately portray the laboratory's real operational capabilities.",
    "prompt": "[ROLE]\nComputational Workflow Architect\n\n[OBJECTIVE]\nShowcase the laboratory's end-to-end methodology from field specimen collection to high-throughput sequencing analysis.\n\n[COMMANDS]\n1. Add custom section titled \"End-to-End Surveillance Pipeline\".\n2. Step 1: Clinical Sample Collection & Cold Chain Logistics.\n3. Step 2: Pathogen Nucleic Acid Extraction & Quality Control.\n4. Step 3: High-Throughput Sequencing & Antimicrobial Profiling.\n5. Step 4: Phylogenetic Tree Inference & Public Health Alerting.\n\n[DESIGN SPECS]\n- Grid Columns: 4\n\n[SECURITY & PRIVACY]\n- Accurately portray the laboratory's real operational capabilities."
  },
  {
    "id": "widget-custom-calculator",
    "category": "custom",
    "categoryLabel": "Custom Sections & Widgets",
    "title": "Veterinary Clinical Dosage & Fluid Calculator",
    "summary": "Interactive interactive widget for calculating veterinary fluid therapy and drug dosages based on animal body weight.",
    "role": "Veterinary Pharmacologist & Web Application Engineer",
    "objective": "Embed an interactive clinical calculator demonstrating web engineering and veterinary pharmacology competency.",
    "commands": [
      "Add interactive custom card containing a weight-based veterinary dosage calculator.",
      "Calculate maintenance fluid rates (ml/kg/hr) based on animal weight input.",
      "Provide clear disclaimer: \"For educational and demonstration purposes only\"."
    ],
    "designSpecs": {
      "gridColumns": 1
    },
    "securityRules": "Include clear veterinary clinical disclaimers on all calculators.",
    "prompt": "[ROLE]\nVeterinary Pharmacologist & Web Application Engineer\n\n[OBJECTIVE]\nEmbed an interactive clinical calculator demonstrating web engineering and veterinary pharmacology competency.\n\n[COMMANDS]\n1. Add interactive custom card containing a weight-based veterinary dosage calculator.\n2. Calculate maintenance fluid rates (ml/kg/hr) based on animal weight input.\n3. Provide clear disclaimer: \"For educational and demonstration purposes only\".\n\n[DESIGN SPECS]\n- Grid Columns: 1\n\n[SECURITY & PRIVACY]\n- Include clear veterinary clinical disclaimers on all calculators."
  }
];

export function getPromptsByCategory(categoryId = 'all') {
  if (!categoryId || categoryId === 'all') return PROMPT_LIBRARY;
  return PROMPT_LIBRARY.filter((p) => p.category === categoryId);
}

export function searchPrompts(query = '') {
  const clean = (query || '').trim().toLowerCase();
  if (!clean) return PROMPT_LIBRARY;
  return PROMPT_LIBRARY.filter((p) =>
    p.title.toLowerCase().includes(clean) ||
    p.summary.toLowerCase().includes(clean) ||
    p.categoryLabel.toLowerCase().includes(clean) ||
    p.prompt.toLowerCase().includes(clean)
  );
}

export function generateStructuredPrompt({
  role = 'Lead Portfolio Architect & Full-Stack Specialist',
  objective = 'Refine portfolio styling and layout.',
  commands = [],
  designSpecs = {},
  securityRules = 'Zero fabricated credentials. Preserve all verified profile records.'
} = {}) {
  const cmdList = commands.length ? commands : ['Apply requested visual styling and content refinements.'];
  const formattedCmds = cmdList.map((cmd, i) => `${i + 1}. ${cmd}`).join('\n');

  const designLines = [];
  if (designSpecs.theme) designLines.push(`- Theme: ${designSpecs.theme}`);
  if (designSpecs.accentColor) designLines.push(`- Accent: ${designSpecs.accentColor}`);
  if (designSpecs.fontFamily) designLines.push(`- Typography: ${designSpecs.fontFamily}`);
  if (designSpecs.gridColumns) designLines.push(`- Grid Columns: ${designSpecs.gridColumns}`);
  if (designSpecs.seeAllLimit) designLines.push(`- Initial Items: ${designSpecs.seeAllLimit}`);
  if (designSpecs.templateId) designLines.push(`- Target Template: ${designSpecs.templateId}`);
  if (designSpecs.mode) designLines.push(`- Document Mode: ${designSpecs.mode}`);
  if (designSpecs.effects) designLines.push(`- Effects: ${designSpecs.effects}`);
  const designText = designLines.length ? designLines.join('\n') : '- Clean responsive layout and typography.';

  return `[ROLE]
${role}

[OBJECTIVE]
${objective}

[COMMANDS]
${formattedCmds}

[DESIGN SPECS]
${designText}

[SECURITY & PRIVACY]
- ${securityRules}`;
}
