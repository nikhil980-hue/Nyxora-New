const presentationThemes = {

  // ====================================================
  // NYXORA ORIGINAL — PRESERVED
  // ====================================================

  nyxoraPremium: {
    name: "Nyxora Premium Education",
    description: "Original Nyxora premium education presentation design.",
    category: "Nyxora",
    templateId: "nyxoraOriginal",

    colors: {
      background: "FFFFFF",
      surface: "F8FAFC",
      text: "111827",
      title: "0F172A",
      subtitle: "64748B",
      mutedText: "64748B",
      primary: "2563EB",
      accent: "2563EB",
      secondary: "38BDF8",
      tertiary: "06B6D4",
      card: "F8FAFC",
      border: "E2E8F0",
    },

    typography: {
      title: "Aptos Display",
      body: "Aptos",
      titleSize: 32,
      bodySize: 18,
    },

    style: {
      backgroundStyle: "clean",
      roundedCards: true,
      shadows: false,
      decorativeShapes: false,
      gradient: false,
      glow: false,
      glass: false,
      imageStyle: "rounded",
      accentStyle: "solid",
    },
  },

  // ====================================================
  // MODERN CLASSROOM — DISTINCT PREMIUM TEMPLATE
  // ====================================================

  education: {
    name: "Modern Classroom",
    description: "Premium classroom editorial system with professional typography, photography-led layouts, lesson-path sequencing and structured learning visuals.",
    category: "Education",
    templateId: "modernClassroom",

    colors: {
      background: "F7F8FA",
      surface: "F0F4F8",
      text: "16263A",
      title: "0C2340",
      subtitle: "5B6B7A",
      mutedText: "5B6B7A",
      primary: "0B4F6C",
      accent: "0B4F6C",
      secondary: "20B2AA",
      tertiary: "D89B2B",
      card: "F0F4F8",
      border: "D6DEE6",
    },

    typography: {
      title: "Montserrat",
      body: "Aptos",
      titleSize: 30,
      bodySize: 16,
    },

    style: {
      backgroundStyle: "reference-modern-classroom",
      roundedCards: false,
      shadows: false,
      decorativeShapes: true,
      gradient: false,
      glow: false,
      glass: false,
      imageStyle: "education-editorial",
      imageDensity: "high",
      imageFrequency: "every-slide",
      accentStyle: "lesson-editorial",
    },
  },

  // ====================================================
  // ENGINEERING PROJECT PROPOSAL
  // ====================================================

  engineering: {
    name: "Engineering Project Proposal",
    description: "Premium editorial proposal system with large Pexels photography, serif display typography, warm neutral geometry, oversized numbering and print-inspired composition.",
    category: "Reference",
    templateId: "engineering",

    colors: {
      background: "FFFFFF",
      surface: "F4F0E8",
      text: "434343",
      title: "212121",
      subtitle: "595959",
      mutedText: "595959",
      primary: "908269",
      accent: "908269",
      secondary: "CFC3AC",
      tertiary: "976E26",
      card: "EEEEEE",
      border: "CFC3AC",
    },

    typography: {
      title: "Georgia",
      body: "Segoe UI",
      titleSize: 38,
      bodySize: 15,
    },

    style: {
      backgroundStyle: "reference-engineering-premium",
      roundedCards: false,
      shadows: false,
      decorativeShapes: true,
      gradient: false,
      glow: false,
      glass: false,
      imageStyle: "editorial-full-bleed",
      imageDensity: "high",
      imageFrequency: "every-slide",
      accentStyle: "editorial-line",
    },
  },

  // ====================================================
  // AQUATIC & PHYSICAL THERAPY
  // ====================================================

  aquatic: {
    name: "Aquatic & Physical Therapy",
    description: "Premium healthcare storytelling system with Pexels wellness photography, fluid wave bands, circular milestones, strong whitespace and polished clinical typography.",
    category: "Reference",
    templateId: "aquatic",

    colors: {
      background: "FFFFFF",
      surface: "F8FCFD",
      text: "1A4568",
      title: "1A4568",
      subtitle: "66A5BB",
      mutedText: "66A5BB",
      primary: "285E89",
      accent: "285E89",
      secondary: "9DCEDF",
      tertiary: "80C9DD",
      card: "EFEFEF",
      border: "9DCEDF",
    },

    typography: {
      title: "Segoe UI",
      body: "Segoe UI",
      titleSize: 38,
      bodySize: 15,
    },

    style: {
      backgroundStyle: "reference-aquatic-premium",
      roundedCards: false,
      shadows: false,
      decorativeShapes: true,
      gradient: false,
      glow: false,
      glass: false,
      imageStyle: "wellness-editorial",
      imageDensity: "high",
      imageFrequency: "every-slide",
      accentStyle: "fluid-line",
    },
  },

  // ====================================================
  // BUSINESS ANNUAL REPORT
  // ====================================================

  businessAnnualReport: {
    name: "Business Annual Report",
    description: "Premium annual-report system with large Pexels corporate photography, navy/cyan geometry, oversized metrics, data-editorial layouts and executive typography.",
    category: "Reference",
    templateId: "businessAnnualReport",

    colors: {
      background: "FEFEFE",
      surface: "F6FBFD",
      text: "00094A",
      title: "00094A",
      subtitle: "516CEE",
      mutedText: "516CEE",
      primary: "00094A",
      accent: "00649F",
      secondary: "63DBF5",
      tertiary: "516CEE",
      card: "FFFFFF",
      border: "B9DCE8",
    },

    typography: {
      title: "Montserrat",
      body: "Segoe UI",
      titleSize: 38,
      bodySize: 15,
    },

    style: {
      backgroundStyle: "reference-business-premium",
      roundedCards: false,
      shadows: false,
      decorativeShapes: true,
      gradient: false,
      glow: false,
      glass: false,
      imageStyle: "corporate-editorial",
      imageDensity: "high",
      imageFrequency: "every-slide",
      accentStyle: "geometric-report",
    },
  },
};

export function getPresentationTheme(theme) {
  return presentationThemes[theme] || presentationThemes.nyxoraPremium;
}

export function getAvailableThemes() {
  return Object.keys(presentationThemes);
}

export function getThemesByCategory(category) {
  if (!category) {
    return Object.entries(presentationThemes);
  }

  return Object.entries(presentationThemes).filter(
    ([, theme]) => theme.category === category
  );
}

export default presentationThemes;
