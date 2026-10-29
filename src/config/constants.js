/**
 * Codevirus Security — Enterprise Configuration Constants
 */

module.exports = {
  COMPANY: {
    NAME: 'Codevirus Security Private Limited',
    ACADEMY: 'Codevirus Academy',
    TAGLINE: 'Leading Cybersecurity Excellence — Building Industry-Ready Cybersecurity Professionals & Securing Digital Ecosystems',
    CAMPUS_ADDRESS: 'House No. A-76 / 545C/115F, Near Chandganj Garden Road, Kapoorthala, Aliganj, Lucknow, Uttar Pradesh – 226024, India',
    HELPLINES: ['+91 96487-77706', '+91 89049-37164'],
    WEBSITES: ['codevirussec.in', 'codevirussec.academy'],
    MAPS_URL: 'https://maps.google.com/?q=Codevirus+Security+Lucknow',
    WORKING_HOURS: {
      MON_SAT: '10:00 AM – 8:00 PM IST',
      SUN: '10:00 AM – 4:00 PM IST'
    }
  },

  OFFICE_HOURS: {
    OPEN_MINUTES: 10 * 60, // 10:00 AM
    CLOSE_MINUTES: 22 * 60, // 10:00 PM
    SLOT_MINUTES: 30
  },

  STANDARD_SLOTS: [
    '10:00 AM',
    '11:30 AM',
    '02:00 PM',
    '03:30 PM',
    '05:00 PM',
    '06:30 PM'
  ],

  SERVICES: [
    'SOC Analyst Career Counseling',
    'VAPT & Network Security Audit',
    'Ethical Hacking & Bug Bounty',
    'Cloud Security (AWS/Azure) & CCNA',
    'ISO 27001 & Compliance Scoping'
  ],

  LEAD_EXTRACTION_PROMPT: 'Extract from this cybersecurity training or IT security inquiry message for Codevirus Security. Return ONLY JSON: {"name": string|null, "phone": string|null (E.164 format, assume India +91 if no country code is provided), "treatment": string|null (the requested course, internship, VAPT audit, or service), "notes": string|null (background, goal, company/college name, or urgency)}. No markdown, no explanation.'
};
