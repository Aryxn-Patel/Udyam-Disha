import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "English" | "Hindi" | "Assamese";

export const LANGS: { code: Lang; label: string }[] = [
  { code: "English", label: "English" },
  { code: "Hindi", label: "हिंदी" },
  { code: "Assamese", label: "অসমীয়া" },
];

type Dict = Record<string, string>;

const en: Dict = {
  brand: "Udyam Disha",
  tagline: "Rural business feasibility and loan readiness advisory",
  notice:
    "This advisory tool provides an indicative assessment to support your government-backed loan application.",
  heroTitle: "Check if your business idea will work in your village",
  heroSub:
    "See your local market data and how much you can borrow — before you apply for a government-backed micro-enterprise loan.",
  formTitle: "Enter your details",
  locationDetails: "Location details",
  locationDetailsSub: "Tell us where your proposed business will operate.",
  businessDetails: "Business details",
  businessDetailsSub: "Choose the category that best describes your proposed enterprise.",
  state: "State",
  district: "District",
  block: "Block",
  village: "Village",
  category: "Business category",
  capital: "Available margin capital",
  selectState: "Select a state",
  selectDistrict: "Select a district",
  selectBlock: "Select a block",
  selectVillage: "Select a village",
  searchVillage: "Type to search your village",
  noVillage: "No matching village",
  maxCapital: "Maximum margin capital:",
  maxCapitalError: "Amount must be between ₹1 and ₹5,00,000.",
  footerNote: "Your details are used only to prepare this indicative report.",
  submit: "Get My Report",
  generating: "Generating your report...",
  patience: "This can take up to 90 seconds on the first request. Please stay on this page.",
  loading: "Loading...",
  retry: "Retry",
  loadFailed: "Could not load this list.",
  aiBusy: "Our AI advisor is briefly busy, please try again in a moment",
  required: "Please complete all fields before continuing.",
  voiceNoMatch: "Could not match what you said. Please try again or type it instead.",
  Dairy: "Dairy",
  Retail: "Retail",
  Textiles: "Textiles",
  "Food Processing": "Food Processing",
  "General Store": "General Store",
  reportTitle: "Feasibility Report",
  marketSnapshot: "Market Snapshot",
  population: "Total population",
  landArea: "Land area (sq km)",
  marketDensity: "Market density",
  saturation: "Business saturation index",
  wealth: "Disposable wealth index",
  infra: "Infrastructure readiness",
  economy: "Economy type ratio",
  competitorDensity: "Nearby competitors",
  populationDesc: "Number of people living in this village, per the latest census data.",
  marketDensityDesc: "People per square kilometre — higher means a more concentrated customer base.",
  saturationDesc: "How many similar businesses already exist relative to demand — higher means more competition.",
  wealthDesc: "Estimated spending power of local households after essential expenses.",
  infraDesc: "Availability of roads, electricity, and other infrastructure needed to run a business.",
  economyDesc: "Balance between formal (registered) and informal economic activity in this area.",
  competitorDensityDesc:
    "Number of similar businesses operating nearby, from live map data (search radius is matched to your business type).",
  govSchemes: "Applicable Government Schemes",
  govSchemesSub: "Central schemes that may support this business, based on your category and project cost.",
  swot: "SWOT Analysis",
  strengths: "Strengths",
  weaknesses: "Weaknesses",
  opportunities: "Opportunities",
  threats: "Threats",
  pricing: "Pricing Suggestion",
  valueEstimate: "Value estimate",
  advisoryUnavailable:
    "The written advisory could not be generated this time. Your market data below is complete — you may retry the report later.",
  next: "View Financial Roadmap",
  back: "Back to form",
  editDetails: "Edit Details",
  roadmapTitle: "Financial Roadmap",
  projectCost: "Project cost",
  loanAmount: "Loan amount",
  ownCapital: "Your capital contribution",
  scheme: "Sanctioned scheme",
  interest: "Interest rate (annual)",
  tenure: "Tenure",
  moratorium: "Moratorium",
  years: "years",
  months: "months",
  emiSchedule: "Quarterly repayment schedule",
  quarter: "Quarter",
  emi: "EMI",
  interestComp: "Interest",
  principalComp: "Principal",
  closing: "Closing balance",
  print: "Download as PDF",
  backReport: "Back to report",
  noData: "No report found. Please fill the form again.",
  footerMission: "Helping first-time rural entrepreneurs plan before they borrow.",
  terms: "Terms",
  privacy: "Privacy",
  contact: "Contact",
  language: "Language",

  // Static scheme catalogue translations — keyed by Scheme.id from scheme_engine.py
  scheme_pmfme_name: "PM Formalisation of Micro Food Processing Enterprises (PMFME)",
  scheme_pmfme_desc:
    "Credit-linked subsidy for micro food processing units — supports setup, branding, and common infrastructure for food-based enterprises.",
  scheme_nlm_name: "National Livestock Mission (NLM)",
  scheme_nlm_desc:
    "Entrepreneurship support for livestock and dairy-based ventures, including capital subsidy for setting up dairy processing and value-addition units.",
  scheme_mudra_name: "Pradhan Mantri Mudra Yojana (PMMY)",
  scheme_mudra_desc:
    "Collateral-free loans up to ₹10 lakh for non-farm micro and small enterprises — retail, trading, and small manufacturing units.",
  scheme_pmegp_name: "Prime Minister's Employment Generation Programme (PMEGP)",
  scheme_pmegp_desc:
    "Margin-money subsidy for setting up new micro-enterprises, covering manufacturing and service-sector projects up to ₹50 lakh.",
  scheme_handloom_name: "National Handloom Development Programme (NHDP)",
  scheme_handloom_desc:
    "Support for weavers and textile artisans — raw material subsidy, design development, and marketing assistance.",
  scheme_standup_india_name: "Stand-Up India",
  scheme_standup_india_desc:
    "Bank loans between ₹10 lakh and ₹1 crore for setting up a greenfield enterprise — geared toward first-time entrepreneurs.",
};

const hi: Dict = {
  ...en,
  brand: "उद्यम दिशा",
  tagline: "ग्रामीण व्यवसाय व्यवहार्यता एवं ऋण तैयारी परामर्श",
  notice: "यह सलाहकार उपकरण आपके सरकार-समर्थित ऋण आवेदन हेतु एक संकेतात्मक आकलन प्रदान करता है।",
  heroTitle: "जानिए क्या आपका व्यवसाय आपके गाँव में चलेगा",
  heroSub:
    "सरकारी सूक्ष्म-उद्यम ऋण के लिए आवेदन करने से पहले अपने स्थानीय बाज़ार के आँकड़े और ऋण क्षमता देखें।",
  formTitle: "अपनी जानकारी दर्ज करें",
  locationDetails: "स्थान विवरण",
  locationDetailsSub: "बताएं कि आपका प्रस्तावित व्यवसाय कहाँ संचालित होगा।",
  businessDetails: "व्यवसाय विवरण",
  businessDetailsSub: "वह श्रेणी चुनें जो आपके प्रस्तावित उद्यम का सबसे अच्छा वर्णन करती है।",
  state: "राज्य",
  district: "ज़िला",
  block: "ब्लॉक",
  village: "गाँव",
  category: "व्यवसाय श्रेणी",
  capital: "उपलब्ध मार्जिन पूँजी",
  selectState: "राज्य चुनें",
  selectDistrict: "ज़िला चुनें",
  selectBlock: "ब्लॉक चुनें",
  selectVillage: "गाँव चुनें",
  searchVillage: "गाँव खोजने के लिए टाइप करें",
  noVillage: "कोई मेल खाता गाँव नहीं",
  maxCapital: "अधिकतम मार्जिन पूँजी:",
  maxCapitalError: "राशि ₹1 और ₹5,00,000 के बीच होनी चाहिए।",
  footerNote: "आपकी जानकारी केवल इस संकेतात्मक रिपोर्ट को तैयार करने के लिए उपयोग की जाती है।",
  submit: "मेरी रिपोर्ट प्राप्त करें",
  generating: "आपकी रिपोर्ट तैयार की जा रही है...",
  patience: "पहली बार में इसमें 90 सेकंड तक लग सकते हैं। कृपया इस पृष्ठ पर बने रहें।",
  loading: "लोड हो रहा है...",
  retry: "पुनः प्रयास करें",
  loadFailed: "यह सूची लोड नहीं हो सकी।",
  aiBusy: "हमारा एआई सलाहकार अभी व्यस्त है, कृपया थोड़ी देर बाद पुनः प्रयास करें",
  required: "कृपया आगे बढ़ने से पहले सभी फ़ील्ड भरें।",
  voiceNoMatch: "आपने जो कहा उससे मेल नहीं खाया। कृपया फिर से प्रयास करें या टाइप करें।",
  Dairy: "डेयरी",
  Retail: "खुदरा",
  Textiles: "वस्त्र",
  "Food Processing": "खाद्य प्रसंस्करण",
  "General Store": "किराना दुकान",
  reportTitle: "व्यवहार्यता रिपोर्ट",
  marketSnapshot: "बाज़ार का विवरण",
  population: "कुल जनसंख्या",
  landArea: "क्षेत्रफल (वर्ग किमी)",
  marketDensity: "बाज़ार घनत्व",
  saturation: "व्यवसाय संतृप्ति सूचकांक",
  wealth: "प्रयोज्य आय सूचकांक",
  infra: "बुनियादी ढाँचा तत्परता",
  economy: "अर्थव्यवस्था प्रकार अनुपात",
  competitorDensity: "आसपास के प्रतिस्पर्धी",
  populationDesc: "जनगणना के नवीनतम आँकड़ों के अनुसार इस गाँव में रहने वाले लोगों की संख्या।",
  marketDensityDesc: "प्रति वर्ग किलोमीटर लोगों की संख्या — अधिक घनत्व का मतलब है सघन ग्राहक आधार।",
  saturationDesc: "मांग की तुलना में पहले से मौजूद समान व्यवसायों की संख्या — अधिक होने पर अधिक प्रतिस्पर्धा।",
  wealthDesc: "आवश्यक खर्चों के बाद स्थानीय परिवारों की अनुमानित खर्च क्षमता।",
  infraDesc: "व्यवसाय चलाने के लिए आवश्यक सड़कों, बिजली और अन्य बुनियादी सुविधाओं की उपलब्धता।",
  economyDesc: "इस क्षेत्र में औपचारिक (पंजीकृत) और अनौपचारिक आर्थिक गतिविधि के बीच संतुलन।",
  competitorDensityDesc:
    "लाइव मानचित्र डेटा के अनुसार आसपास चल रहे समान व्यवसायों की संख्या (खोज का दायरा आपके व्यवसाय के प्रकार के अनुसार तय किया गया है)।",
  govSchemes: "लागू सरकारी योजनाएँ",
  govSchemesSub: "केंद्रीय योजनाएँ जो आपकी श्रेणी और परियोजना लागत के आधार पर इस व्यवसाय में मदद कर सकती हैं।",
  swot: "स्वोट विश्लेषण",
  strengths: "शक्तियाँ",
  weaknesses: "कमज़ोरियाँ",
  opportunities: "अवसर",
  threats: "चुनौतियाँ",
  pricing: "मूल्य निर्धारण सुझाव",
  valueEstimate: "अनुमानित मूल्य",
  advisoryUnavailable:
    "लिखित परामर्श इस बार तैयार नहीं हो सका। नीचे दिए गए बाज़ार आँकड़े पूर्ण हैं; आप बाद में पुनः प्रयास कर सकते हैं।",
  next: "वित्तीय रूपरेखा देखें",
  back: "फ़ॉर्म पर वापस जाएँ",
  editDetails: "विवरण संपादित करें",
  roadmapTitle: "वित्तीय रूपरेखा",
  projectCost: "परियोजना लागत",
  loanAmount: "ऋण राशि",
  ownCapital: "आपका पूँजी अंशदान",
  scheme: "स्वीकृत योजना",
  interest: "ब्याज दर (वार्षिक)",
  tenure: "अवधि",
  moratorium: "अधिस्थगन",
  years: "वर्ष",
  months: "माह",
  emiSchedule: "त्रैमासिक भुगतान अनुसूची",
  quarter: "तिमाही",
  emi: "किस्त",
  interestComp: "ब्याज",
  principalComp: "मूलधन",
  closing: "शेष राशि",
  print: "पीडीएफ़ डाउनलोड करें",
  backReport: "रिपोर्ट पर वापस",
  noData: "कोई रिपोर्ट नहीं मिली। कृपया फ़ॉर्म पुनः भरें।",
  footerMission: "पहली बार उद्यम शुरू करने वाले ग्रामीण उद्यमियों की योजना बनाने में सहायता।",
  terms: "नियम",
  privacy: "गोपनीयता",
  contact: "संपर्क",
  language: "भाषा",

  scheme_pmfme_name: "पीएम सूक्ष्म खाद्य प्रसंस्करण उद्यम औपचारीकरण योजना (पीएमएफएमई)",
  scheme_pmfme_desc:
    "सूक्ष्म खाद्य प्रसंस्करण इकाइयों के लिए ऋण-आधारित सब्सिडी — स्थापना, ब्रांडिंग और साझा बुनियादी ढाँचे में सहायता।",
  scheme_nlm_name: "राष्ट्रीय पशुधन मिशन (एनएलएम)",
  scheme_nlm_desc:
    "पशुधन और डेयरी आधारित उद्यमों हेतु सहायता, जिसमें डेयरी प्रसंस्करण इकाई की स्थापना के लिए पूँजी सब्सिडी शामिल है।",
  scheme_mudra_name: "प्रधानमंत्री मुद्रा योजना (पीएमएमवाई)",
  scheme_mudra_desc:
    "गैर-कृषि सूक्ष्म एवं लघु उद्यमों — खुदरा, व्यापार और छोटे विनिर्माण इकाइयों — हेतु ₹10 लाख तक का बिना जमानत ऋण।",
  scheme_pmegp_name: "प्रधानमंत्री रोजगार सृजन कार्यक्रम (पीएमईजीपी)",
  scheme_pmegp_desc:
    "नए सूक्ष्म-उद्यमों की स्थापना हेतु मार्जिन-मनी सब्सिडी, ₹50 लाख तक की विनिर्माण एवं सेवा परियोजनाओं को कवर करती है।",
  scheme_handloom_name: "राष्ट्रीय हथकरघा विकास कार्यक्रम (एनएचडीपी)",
  scheme_handloom_desc: "बुनकरों और वस्त्र कारीगरों हेतु सहायता — कच्चा माल सब्सिडी, डिज़ाइन विकास और विपणन सहायता।",
  scheme_standup_india_name: "स्टैंड-अप इंडिया",
  scheme_standup_india_desc:
    "नए उद्यम की स्थापना हेतु ₹10 लाख से ₹1 करोड़ तक का बैंक ऋण — पहली बार के उद्यमियों के लिए।",
};

const as: Dict = {
  ...en,
  brand: "উদ্যম দিশা",
  tagline: "গ্ৰামীণ ব্যৱসায় সম্ভাৱ্যতা আৰু ঋণ প্ৰস্তুতি পৰামৰ্শ",
  notice: "এই পৰামৰ্শদাতা সঁজুলিয়ে আপোনাৰ চৰকাৰী ঋণ আবেদনৰ বাবে এক সাংকেতিক মূল্যায়ন প্ৰদান কৰে।",
  heroTitle: "আপোনাৰ ব্যৱসায়ৰ ধাৰণা গাঁৱত চলিবনে জানক",
  heroSub:
    "চৰকাৰী ক্ষুদ্ৰ-উদ্যোগ ঋণৰ বাবে আবেদন কৰাৰ আগতে স্থানীয় বজাৰৰ তথ্য আৰু ঋণ ক্ষমতা চাওক।",
  formTitle: "আপোনাৰ তথ্য দিয়ক",
  locationDetails: "স্থানৰ বিৱৰণ",
  locationDetailsSub: "আপোনাৰ প্ৰস্তাৱিত ব্যৱসায় ক'ত পৰিচালিত হ'ব ক'ব।",
  businessDetails: "ব্যৱসায়ৰ বিৱৰণ",
  businessDetailsSub: "আপোনাৰ প্ৰস্তাৱিত উদ্যোগৰ সৈতে সঠিকভাৱে মিল থকা শ্ৰেণী বাছনি কৰক।",
  state: "ৰাজ্য",
  district: "জিলা",
  block: "ব্লক",
  village: "গাঁও",
  category: "ব্যৱসায় শ্ৰেণী",
  capital: "উপলব্ধ মাৰ্জিন মূলধন",
  selectState: "ৰাজ্য বাছনি কৰক",
  selectDistrict: "জিলা বাছনি কৰক",
  selectBlock: "ব্লক বাছনি কৰক",
  selectVillage: "গাঁও বাছনি কৰক",
  searchVillage: "গাঁও বিচাৰিবলৈ টাইপ কৰক",
  noVillage: "মিল থকা গাঁও নাই",
  maxCapital: "সৰ্বোচ্চ মাৰ্জিন মূলধন:",
  maxCapitalError: "পৰিমাণ ₹1 আৰু ₹5,00,000ৰ মাজত হ'ব লাগিব।",
  footerNote: "আপোনাৰ তথ্য কেৱল এই সাংকেতিক প্ৰতিবেদন প্ৰস্তুত কৰিবলৈহে ব্যৱহাৰ কৰা হয়।",
  submit: "মোৰ প্ৰতিবেদন লওক",
  generating: "আপোনাৰ প্ৰতিবেদন প্ৰস্তুত হৈ আছে...",
  patience: "প্ৰথমবাৰ ৯০ ছেকেণ্ড পৰ্যন্ত লাগিব পাৰে। অনুগ্ৰহ কৰি এই পৃষ্ঠাতে থাকক।",
  loading: "লোড হৈ আছে...",
  retry: "পুনৰ চেষ্টা কৰক",
  loadFailed: "এই তালিকা লোড কৰিব পৰা নগ'ল।",
  aiBusy: "আমাৰ এআই পৰামৰ্শদাতা অলপ ব্যস্ত, অনুগ্ৰহ কৰি পিছত পুনৰ চেষ্টা কৰক",
  required: "আগবাঢ়িবলৈ সকলো ঘৰ পূৰণ কৰক।",
  voiceNoMatch: "আপুনি কোৱাটোৰ সৈতে মিল নাখালে। অনুগ্ৰহ কৰি পুনৰ চেষ্টা কৰক বা টাইপ কৰক।",
  Dairy: "গাখীৰ উদ্যোগ",
  Retail: "খুচুৰা",
  Textiles: "বস্ত্ৰ",
  "Food Processing": "খাদ্য প্ৰক্ৰিয়াকৰণ",
  "General Store": "সাধাৰণ দোকান",
  reportTitle: "সম্ভাৱ্যতা প্ৰতিবেদন",
  marketSnapshot: "বজাৰৰ চমু বিৱৰণ",
  population: "মুঠ জনসংখ্যা",
  landArea: "মাটিৰ কালি (বৰ্গ কিমি)",
  marketDensity: "বজাৰ ঘনত্ব",
  saturation: "ব্যৱসায় সংপৃক্ততা সূচক",
  wealth: "ব্যয়যোগ্য সম্পদ সূচক",
  infra: "আন্তঃগাঁথনি প্ৰস্তুতি",
  economy: "অৰ্থনীতিৰ ধৰণৰ অনুপাত",
  competitorDensity: "ওচৰৰ প্ৰতিদ্বন্দ্বী",
  populationDesc: "শেহতীয়া লোকপিয়ল অনুসাৰে এই গাঁৱত বাস কৰা লোকৰ সংখ্যা।",
  marketDensityDesc: "প্ৰতি বৰ্গ কিলোমিটাৰত লোকৰ সংখ্যা — অধিক ঘনত্বৰ অৰ্থ হ'ল ঘনীভূত গ্ৰাহক ভিত্তি।",
  saturationDesc: "চাহিদাৰ তুলনাত ইতিমধ্যে থকা একে ধৰণৰ ব্যৱসায়ৰ সংখ্যা — অধিক হ'লে অধিক প্ৰতিযোগিতা।",
  wealthDesc: "প্ৰয়োজনীয় খৰচৰ পিছত স্থানীয় পৰিয়ালৰ আনুমানিক খৰচ ক্ষমতা।",
  infraDesc: "ব্যৱসায় চলাবলৈ প্ৰয়োজনীয় ৰাস্তা, বিদ্যুৎ আৰু অন্যান্য আন্তঃগাঁথনিৰ উপলব্ধতা।",
  economyDesc: "এই অঞ্চলত আনুষ্ঠানিক (পঞ্জীয়নভুক্ত) আৰু অনানুষ্ঠানিক অৰ্থনৈতিক কাৰ্যকলাপৰ মাজৰ ভাৰসাম্য।",
  competitorDensityDesc:
    "লাইভ মেপ ডেটা অনুসৰি ওচৰত চলি থকা একে ধৰণৰ ব্যৱসায়ৰ সংখ্যা (সন্ধানৰ ব্যাসাৰ্ধ আপোনাৰ ব্যৱসায়ৰ প্ৰকাৰ অনুসৰি নিৰ্ধাৰণ কৰা হৈছে)।",
  govSchemes: "প্ৰযোজ্য চৰকাৰী আঁচনি",
  govSchemesSub: "কেন্দ্ৰীয় আঁচনি যি আপোনাৰ শ্ৰেণী আৰু প্ৰকল্পৰ খৰচৰ ওপৰত ভিত্তি কৰি এই ব্যৱসায়ক সহায় কৰিব পাৰে।",
  swot: "SWOT বিশ্লেষণ",
  strengths: "শক্তি",
  weaknesses: "দুৰ্বলতা",
  opportunities: "সুযোগ",
  threats: "প্ৰত্যাহ্বান",
  pricing: "মূল্য নিৰ্ধাৰণ পৰামৰ্শ",
  valueEstimate: "আনুমানিক মূল্য",
  advisoryUnavailable:
    "লিখিত পৰামৰ্শ এইবাৰ প্ৰস্তুত কৰিব পৰা নগ'ল। তলৰ বজাৰ তথ্য সম্পূৰ্ণ; পিছত পুনৰ চেষ্টা কৰিব পাৰে।",
  next: "বিত্তীয় ৰোডমেপ চাওক",
  back: "ফৰ্মলৈ উভতি যাওক",
  editDetails: "বিৱৰণ সম্পাদনা কৰক",
  roadmapTitle: "বিত্তীয় ৰোডমেপ",
  projectCost: "প্ৰকল্পৰ ব্যয়",
  loanAmount: "ঋণৰ পৰিমাণ",
  ownCapital: "আপোনাৰ মূলধন অংশ",
  scheme: "অনুমোদিত আঁচনি",
  interest: "সুতৰ হাৰ (বাৰ্ষিক)",
  tenure: "ম্যাদ",
  moratorium: "স্থগিত কাল",
  years: "বছৰ",
  months: "মাহ",
  emiSchedule: "ত্ৰৈমাসিক পৰিশোধ সূচী",
  quarter: "ত্ৰৈমাসিক",
  emi: "কিস্তি",
  interestComp: "সুত",
  principalComp: "মূলধন",
  closing: "বাকী থকা ধন",
  print: "পিডিএফ ডাউনলোড কৰক",
  backReport: "প্ৰতিবেদনলৈ উভতি যাওক",
  noData: "কোনো প্ৰতিবেদন পোৱা নগ'ল। অনুগ্ৰহ কৰি ফৰ্ম পুনৰ পূৰণ কৰক।",
  footerMission: "প্ৰথমবাৰ ব্যৱসায় আৰম্ভ কৰা গ্ৰামীণ উদ্যোগীক পৰিকল্পনাত সহায়।",
  terms: "চৰ্তাৱলী",
  privacy: "গোপনীয়তা",
  contact: "যোগাযোগ",
  language: "ভাষা",

  scheme_pmfme_name: "পিএম সূক্ষ্ম খাদ্য প্ৰক্ৰিয়াকৰণ উদ্যোগ আনুষ্ঠানিকীকৰণ আঁচনি (পিএমএফএমই)",
  scheme_pmfme_desc:
    "সূক্ষ্ম খাদ্য প্ৰক্ৰিয়াকৰণ ইউনিটৰ বাবে ঋণ-সংযুক্ত ভৰ্তুকি — স্থাপন, ব্ৰেণ্ডিং আৰু সাধাৰণ পৰিকাঠামোত সহায়।",
  scheme_nlm_name: "ৰাষ্ট্ৰীয় পশুধন অভিযান (এনএলএম)",
  scheme_nlm_desc:
    "পশুধন আৰু গাখীৰ-আধাৰিত উদ্যোগৰ বাবে সহায়, ডেয়াৰী প্ৰক্ৰিয়াকৰণ ইউনিট স্থাপনৰ বাবে মূলধন ভৰ্তুকিসহ।",
  scheme_mudra_name: "প্ৰধানমন্ত্ৰী মুদ্ৰা যোজনা (পিএমএমৱাই)",
  scheme_mudra_desc:
    "অ-কৃষি সূক্ষ্ম আৰু ক্ষুদ্ৰ উদ্যোগ — খুচুৰা, ব্যৱসায় আৰু সৰু উৎপাদন ইউনিট — ৰ বাবে ₹10 লাখলৈ বন্ধকমুক্ত ঋণ।",
  scheme_pmegp_name: "প্ৰধানমন্ত্ৰী কৰ্মসংস্থান সৃষ্টি কাৰ্যসূচী (পিএমইজিপি)",
  scheme_pmegp_desc:
    "নতুন সূক্ষ্ম-উদ্যোগ স্থাপনৰ বাবে মাৰ্জিন-মানি ভৰ্তুকি, ₹50 লাখলৈ উৎপাদন আৰু সেৱা প্ৰকল্প কভাৰ কৰে।",
  scheme_handloom_name: "ৰাষ্ট্ৰীয় হাতৰ শিল্প বিকাশ কাৰ্যসূচী (এনএইচডিপি)",
  scheme_handloom_desc: "তাঁতী আৰু বস্ত্ৰ শিল্পীৰ বাবে সহায় — কেঁচামাল ভৰ্তুকি, ডিজাইন বিকাশ আৰু বিপণন সহায়।",
  scheme_standup_india_name: "ষ্টেণ্ড-আপ ইণ্ডিয়া",
  scheme_standup_india_desc:
    "নতুন উদ্যোগ স্থাপনৰ বাবে ₹10 লাখৰ পৰা ₹1 কোটিলৈ বেংক ঋণ — প্ৰথমবাৰৰ উদ্যোগীৰ বাবে।",
};

const dicts: Record<Lang, Dict> = { English: en, Hindi: hi, Assamese: as };

// Formats a radius like 1.5 or 3 without a trailing ".0".
function formatRadiusKm(radiusKm: number): string {
  return Number.isInteger(radiusKm) ? String(radiusKm) : radiusKm.toFixed(1);
}

// competitorDensityDesc needs a live number (the resolved search radius)
// interpolated into the sentence, which a flat string dictionary can't do.
// Kept as its own small per-language map — rather than overloading t()'s
// signature — so every other static key keeps working exactly as before.
const competitorRadiusText: Record<Lang, (radiusKm: number) => string> = {
  English: (km) =>
    `Number of similar businesses operating within a ${formatRadiusKm(km)} km radius, from live map data.`,
  Hindi: (km) =>
    `लाइव मानचित्र डेटा के अनुसार ${formatRadiusKm(km)} किमी के दायरे में चल रहे समान व्यवसायों की संख्या।`,
  Assamese: (km) =>
    `লাইভ মেপ ডেটা অনুসৰি ${formatRadiusKm(km)} কিমি ব্যাসাৰ্ধত চলি থকা একে ধৰণৰ ব্যৱসায়ৰ সংখ্যা।`,
};

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: string) => string;
  tRadius: (radiusKm: number) => string;
};
const LangContext = createContext<Ctx>({
  lang: "English",
  setLang: () => {},
  t: (k) => en[k] ?? k,
  tRadius: (km) => competitorRadiusText.English(km),
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("English");

  useEffect(() => {
    const saved = window.localStorage.getItem("ud-lang") as Lang | null;
    if (saved && saved in dicts) setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    window.localStorage.setItem("ud-lang", l);
  };

  const t = (k: string) => dicts[lang][k] ?? en[k] ?? k;
  const tRadius = (radiusKm: number) => (competitorRadiusText[lang] ?? competitorRadiusText.English)(radiusKm);

  return <LangContext.Provider value={{ lang, setLang, t, tRadius }}>{children}</LangContext.Provider>;
}

export function useI18n() {
  return useContext(LangContext);
}

/**
 * State names are intentionally left untranslated per product decision —
 * this is a passthrough so callers can still import it without breaking,
 * in case per-state translation is wanted later.
 */
export function translateStateName(stateName: string, _lang: Lang): string {
  return stateName;
}