// ============================================================================
// PeakGuard Roofing — Master Business Configuration
// ============================================================================
//
// REUSABILITY CRITICAL CONTRACT:
// Every business detail lives in this single file.
// Changing the company name, phone, email, services, pricing, colors, or plan IDs
// requires editing ONLY THIS FILE — ZERO component edits.
//
// To rebrand this template for any roofing (or home services) company:
//   1. Edit `company` (name, phone, license, address, etc.)
//   2. Edit `brand` (primary/accent colors, taglines)
//   3. Edit `services` (names, descriptions, inclusions)
//   4. Edit `plans` (fill in real plan_ IDs after creating them via CLI/dashboard)
//   5. Edit `serviceAreas`, `reviews`, `faqs`
// ============================================================================

export interface SiteConfig {
  company: {
    name: string;
    tagline: string;
    phone: string;
    phoneDisplay: string;
    email: string;
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
      formatted: string;
    };
    license: string;
    insurance: string;
    yearsInBusiness: number;
    hours: string;
    emergencyHours: string;
  };
  brand: {
    primaryColor: string;      // Deep slate / navy
    primaryHover: string;
    accentColor: string;       // Safety amber / gold
    accentHover: string;
    bgColor: string;           // Light slate background
    darkBg: string;            // Footer / dark sections
    logoText: string;
    logoHighlight: string;
  };
  // Whop account & plan configuration
  whop: {
    // Your Whop Account ID (begins with biz_). Found in dashboard > Developer.
    accountId: string;
    // Whop plans for direct checkout. Created via CLI or Dashboard.
    plans: {
      inspection: {
        id: string;             // plan_xxxxxxxxxxxxx
        name: string;
        price: number;          // in USD
        priceDisplay: string;
        billingType: "one_time";
        description: string;
        features: string[];
      };
      deposit: {
        id: string;             // plan_xxxxxxxxxxxxx
        name: string;
        price: number;          // in USD
        priceDisplay: string;
        billingType: "one_time";
        description: string;
        features: string[];
        // Saves card on file for final balance invoicing via setupFutureUsage="off_session"
        savesCardOnFile: true;
      };
      tuneUp: {
        id: string;             // plan_xxxxxxxxxxxxx
        name: string;
        price: number;          // in USD
        priceDisplay: string;
        billingType: "one_time";
        description: string;
        features: string[];
      };
    };
  };
  services: Array<{
    id: string;
    title: string;
    shortDesc: string;
    fullDesc: string;
    icon: string;               // icon name for dynamic lookup
    features: string[];
    turnaround: string;
    warranty: string;
    hasPlanCheckout?: keyof SiteConfig["whop"]["plans"];
  }>;
  serviceAreas: Array<{
    name: string;
    counties: string[];
    zipCodes: string[];
    responseTime: string;
  }>;
  reviews: Array<{
    author: string;
    location: string;
    rating: number;
    date: string;
    service: string;
    text: string;
    verified: boolean;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  trustStats: Array<{
    value: string;
    label: string;
    detail: string;
  }>;
}

export const siteConfig: SiteConfig = {
  company: {
    name: "PeakGuard Roofing Co.",
    tagline: "Precision Roofing & Protection for American Homes",
    phone: "+15557325482",
    phoneDisplay: "(555) PEAK-GUARD",
    email: "service@peakguardroofing.com",
    address: {
      street: "1420 Commercial Parkway, Suite 200",
      city: "Dallas",
      state: "TX",
      zip: "75201",
      formatted: "1420 Commercial Pkwy, Ste 200, Dallas, TX 75201",
    },
    license: "TX-RCL #849201-A",
    insurance: "$2,000,000 Commercial General Liability + Full Workman's Comp",
    yearsInBusiness: 18,
    hours: "Monday – Saturday: 7:00 AM – 7:00 PM CST",
    emergencyHours: "24/7 Emergency Storm Response Dispatch",
  },

  brand: {
    primaryColor: "#0f172a",    // slate-900: trustworthy, institutional
    primaryHover: "#1e293b",    // slate-800
    accentColor: "#f59e0b",     // amber-500: high-visibility contractor gold
    accentHover: "#d97706",     // amber-600
    bgColor: "#f8fafc",         // slate-50
    darkBg: "#020617",          // slate-950
    logoText: "PEAKGUARD",
    logoHighlight: "ROOFING",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // WHOP COMMERCE CONFIGURATION
  // ──────────────────────────────────────────────────────────────────────────
  // Replace these placeholder plan IDs with real plan_ IDs after creating them
  // via the Whop CLI or Dashboard. See README.md for instructions.
  // ──────────────────────────────────────────────────────────────────────────
  whop: {
    accountId: "biz_test_peakguard_roofing",
    plans: {
      // 1. Roof Inspection — one-time $149
      inspection: {
        id: "plan_roof_inspection_149",
        name: "Comprehensive Roof Inspection",
        price: 149,
        priceDisplay: "$149",
        billingType: "one_time",
        description: "Full 21-point physical + aerial drone attic-to-eave inspection report delivered in 24 hours.",
        features: [
          "21-point structural & shingle health check",
          "High-resolution 4K aerial drone photography",
          "Attic decking, ventilation & moisture scan",
          "Insurance-ready detailed assessment report",
          "$149 credited back toward any repair or replacement over $1,000",
        ],
      },
      // 2. Project Deposit — one-time $500 (Saves card on file for final balance invoicing)
      deposit: {
        id: "plan_project_deposit_500",
        name: "Roof Project Reservation Deposit",
        price: 500,
        priceDisplay: "$500",
        billingType: "one_time",
        description: "Locks your installation date on our crew schedule and reserves materials. Card is securely saved on file for your final balance invoice upon project completion.",
        features: [
          "Locks guaranteed installation calendar date",
          "Secures manufacturer material allotment",
          "Deducted 100% from your final balance invoice",
          "Card saved on file for seamless final balance invoice at completion",
          "Fully refundable up to 72 hours before tear-off",
        ],
        savesCardOnFile: true,
      },
      // 3. Flat-Rate Service — Roof Tune-Up & Storm Prep Flat Rate $299
      tuneUp: {
        id: "plan_roof_tuneup_299",
        name: "Roof Tune-Up & Preventative Maintenance",
        price: 299,
        priceDisplay: "$299",
        billingType: "one_time",
        description: "Complete seasonal preventative maintenance: reseal penetrations, secure flashings, replace up to 5 shingles, and storm-readiness audit.",
        features: [
          "Reseal all pipe boots, vents, and roof penetrations",
          "Flashing reseal and re-nailing at chimneys and headwalls",
          "Replacement of up to 5 damaged shingles (materials included)",
          "Minor gutter clear at valleys and downspout entries",
          "Complete photo report before & after tune-up",
        ],
      },
    },
  },

  services: [
    {
      id: "roof-repair",
      title: "Roof Repair & Emergency Leak Stop",
      shortDesc: "Rapid-response repair for storm damage, missing shingles, flashing failures, and active leaks.",
      fullDesc: "Water intrusion cannot wait. Our repair teams arrive fully equipped with color-matched architectural shingles, commercial flashing sealant, and decking repair stock. We pinpoint the root cause — not just the symptom — to ensure your roof stands strong against the next front.",
      icon: "Wrench",
      features: [
        "2-hour emergency tarping available 24/7",
        "Color-matched asphalt, metal, or tile patching",
        "Chimney, skylight & valley flashing rebuilding",
        "Attic moisture assessment with every repair",
        "1-year leak-free workmanship guarantee",
      ],
      turnaround: "Same-day emergency response; scheduled repairs within 48 hours",
      warranty: "1-Year Workmanship Warranty on all spot repairs",
    },
    {
      id: "roof-replacement",
      title: "Full Roof Replacement & Restoration",
      shortDesc: "Complete tear-off and installation with 50-year architectural shingles and lifetime system warranties.",
      fullDesc: "When a roof reaches its end of life or suffers widespread storm devastation, a full replacement is the only responsible choice. As a GAF and Owens Corning certified installer, we strip to the deck, inspect and re-deck where rotted, install synthetic underlayment, ice-and-water shields, and complete lifetime shingle systems.",
      icon: "Home",
      features: [
        "Certified GAF Master Elite & Owens Corning Preferred Contractor",
        "Complete tear-off with magnetic ground sweep for nail cleanup",
        "Continuous ridge ventilation and ice & water shield in valleys",
        "Financing available at checkout for approved merchants",
        "50-year non-prorated manufacturer warranty available",
      ],
      turnaround: "Most residential roofs completed in 1–2 days",
      warranty: "50-Year Non-Prorated System Warranty + 10-Year Workmanship Warranty",
      hasPlanCheckout: "deposit",
    },
    {
      id: "roof-inspection",
      title: "21-Point Drone & Physical Roof Inspection",
      shortDesc: "Complete forensic analysis of shingles, decking, ventilation, and gutters with 4K drone photography.",
      fullDesc: "Whether buying a home, planning maintenance, or filing an insurance claim after a hailstorm, our certified inspectors give you an uncompromising assessment. We examine every slope, penetration, valley, gutter line, and the attic structure beneath. The full cost is credited back if you book repairs or replacement with us.",
      icon: "ShieldCheck",
      features: [
        "4K aerial drone imagery of hard-to-reach pitches",
        "Granule loss, hail bruising & wind crease analysis",
        "Attic decking, insulation, and baffle inspection",
        "Written photographic report delivered within 24 hours",
        "Cost credited 100% back toward any work over $1,000",
      ],
      turnaround: "Inspection within 24–48 hours of booking; report in 24 hours",
      warranty: "Accurate, unbiased report backed by licensed adjusters",
      hasPlanCheckout: "inspection",
    },
    {
      id: "roof-tuneup",
      title: "Flat-Rate Roof Tune-Up & Storm Prep",
      shortDesc: "Proactive maintenance: reseal boots, secure flashings, replace damaged shingles, clear key valleys.",
      fullDesc: "Small vulnerabilities become expensive leaks during 60 MPH rainstorms. Our flat-rate tune-up addresses the five most common leak sources before the storm hits: deteriorated pipe boot collars, loose chimney counter-flashing, lifted shingles, and clogged valley transitions.",
      icon: "Sparkles",
      features: [
        "Reseal all plumbing vent boots and exhaust flues",
        "Replace up to 5 wind-damaged or cracked shingles",
        "Secure loose ridge caps and step flashing",
        "Minor valley gutter debris clearance",
        "Before-and-after photo documentation",
      ],
      turnaround: "Scheduled within 3–5 business days",
      warranty: "30-Day Workmanship Warranty on resealed flashings",
      hasPlanCheckout: "tuneUp",
    },
  ],

  serviceAreas: [
    {
      name: "Dallas Metro",
      counties: ["Dallas County"],
      zipCodes: ["75201", "75202", "75204", "75205", "75206", "75214", "75219", "75225", "75230"],
      responseTime: "Under 60 minutes for emergencies",
    },
    {
      name: "North Collin County",
      counties: ["Collin County"],
      zipCodes: ["75023", "75024", "75025", "75070", "75071", "75074", "75075", "75093"],
      responseTime: "Same-day service",
    },
    {
      name: "Tarrant County & Fort Worth",
      counties: ["Tarrant County"],
      zipCodes: ["76102", "76107", "76109", "76116", "76132", "76051", "76092"],
      responseTime: "Same-day service",
    },
    {
      name: "Denton & Lewisville",
      counties: ["Denton County"],
      zipCodes: ["75028", "75056", "75067", "76201", "76205", "76210"],
      responseTime: "Next-day scheduled appointments",
    },
  ],

  reviews: [
    {
      author: "Robert M.",
      location: "North Dallas, TX",
      rating: 5,
      date: "October 2026",
      service: "Full Roof Replacement",
      text: "After the spring hail storm, three different companies knocked on our door. PeakGuard was the only one that didn't use high-pressure tactics. They did a thorough drone inspection, showed me every bruised shingle, and handled the entire insurance coordination. Crew finished our 3,200 sq ft roof in two days and left the yard spotless.",
      verified: true,
    },
    {
      author: "Sarah K.",
      location: "Plano, TX",
      rating: 5,
      date: "September 2026",
      service: "Emergency Leak Repair",
      text: "Water was dripping through our master bedroom ceiling during a Saturday night deluge. PeakGuard had a tech out with an emergency tarp in 90 minutes. Returned Monday morning to replace the failed pipe flashing permanently. Cannot recommend their response time enough.",
      verified: true,
    },
    {
      author: "David & Elena G.",
      location: "Frisco, TX",
      rating: 5,
      date: "August 2026",
      service: "Roof Inspection & Maintenance",
      text: "Booked their $149 inspection online before selling our home. The report was 18 pages of detailed 4K photos and a complete checklist. The buyer's inspector tried to claim we needed a full roof replacement; PeakGuard's report proved the shingles still had 10+ years of life. Saved us $14,000 at closing.",
      verified: true,
    },
    {
      author: "Marcus T.",
      location: "Fort Worth, TX",
      rating: 5,
      date: "November 2026",
      service: "Roof Tune-Up & Storm Prep",
      text: "Bought the $299 tune-up package directly through their site. Tech resealed all four plumbing stacks, replaced six cracked shingles, and cleared the valley gutters. Great communication, on time, and gave me peace of mind heading into storm season.",
      verified: true,
    },
  ],

  faqs: [
    {
      question: "How does the $149 inspection fee work?",
      answer: "You can book and pay the $149 inspection fee directly on this site through Whop Payments. If our inspector identifies damage and you choose PeakGuard for any repair or replacement over $1,000, the entire $149 is credited directly against your final invoice.",
    },
    {
      question: "What does the $500 project deposit cover?",
      answer: "The $500 deposit secures your installation date on our crew calendar and locks in your materials order with our supplier. When you pay the deposit, your card is securely saved on file via Whop Payments so your final balance invoice can be seamlessly settled upon completion and final walk-through. Fully refundable up to 72 hours before work begins.",
    },
    {
      question: "Do you offer financing?",
      answer: "Yes! Flexible financing options appear directly at checkout for approved merchants through Whop Payments. Depending on your credit profile and the merchant configuration, terms like 0% promotional APR or low-monthly installments may be available without impacting your initial credit check.",
    },
    {
      question: "How long does a typical roof replacement take?",
      answer: "The vast majority of residential roof replacements (up to 3,500 sq ft) are completed in a single day, with tear-off starting at 7:00 AM and final magnetic nail sweep completed by 6:00 PM. Larger roofs or complex architectural tile may take two days.",
    },
    {
      question: "Are you licensed and insured?",
      answer: "Yes. PeakGuard carries $2,000,000 in Commercial General Liability coverage, full Workers' Compensation insurance on every crew member, and holds Texas Roofing Contractor License #849201-A.",
    },
  ],

  trustStats: [
    { value: "18+", label: "Years Serving DFW", detail: "Family-owned & operated since 2008" },
    { value: "4,200+", label: "Roofs Completed", detail: "Zero BBB complaints on record" },
    { value: "50-Yr", label: "Warranty Available", detail: "GAF Master Elite certified installer" },
    { value: "4.9 ★", label: "Average Review Rating", detail: "Across 450+ verified customer reviews" },
  ],
};
