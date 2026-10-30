# Codevirus Security — Enterprise VAPT & Cybersecurity Audits
**Registered Entity**: Codevirus Security Private Limited  
**Headquarters**: Kapoorthala, Aliganj, Lucknow, Uttar Pradesh — 226024, India  
**Technical Lead**: Ankit Rai (Founder & Director)  
**Enterprise Desk**: +91 96487-77706 | corporate@codevirussec.in  
**Website**: https://codevirussec.in  

---

## 1. Enterprise VAPT Service Portfolio & Technical Scope

Codevirus Security delivers comprehensive, multi-layered Vulnerability Assessment and Penetration Testing (VAPT) designed for high-assurance enterprise environments, banking and fintech institutions, healthcare providers, e-commerce platforms, and government infrastructure. Our testing combines automated discovery with rigorous manual exploit validation to uncover deep architectural and business logic vulnerabilities.

### A. Web Application Security Assessment (WSTG v4.2 & OWASP Top 10)
- **Methodologies**: Blackbox, Graybox, and Whitebox penetration testing adhering to the OWASP Web Security Testing Guide (WSTG v4.2).
- **Vulnerability Coverage**:
  - OWASP Top 10 (2021 & 2025): Injection (SQLi, NoSQLi, Command Injection, LDAP, XPath), Broken Authentication & Session Management, Sensitive Data Exposure & Cryptographic Failures, XML External Entity (XXE), Broken Access Control & Insecure Direct Object References (IDOR), Security Misconfigurations, Cross-Site Scripting (Reflected, Stored, DOM-based XSS), Insecure Deserialization, Server-Side Request Forgery (SSRF), and Insufficient Logging & Monitoring.
  - Business Logic Flaw identification, multi-step transaction tampering, payment gateway price and currency manipulation, coupon code race conditions, and privilege escalation (vertical and horizontal).
  - WebSockets, Server-Sent Events (SSE), and Single Page Application (SPA) state manipulation.
  - Deliverable: Step-by-step Proof-of-Concept (PoC) exploit scripts, HTTP request/response payloads, and developer remediation code blueprints.

### B. Mobile Application Security Testing (Android & iOS — OWASP MASVS / MSTG)
- **Methodologies**: Static Application Security Testing (SAST) and Dynamic Application Security Testing (DAST) mapped to OWASP Mobile Application Security Verification Standard (MASVS) and Mobile Security Testing Guide (MSTG).
- **Android Assessment**:
  - APK decompilation, source code analysis, AndroidManifest.xml misconfigurations, exported activities, broadcast receivers, and content providers.
  - Insecure data storage: SQLite databases, SharedPreferences, external storage leakage, hardcoded API secrets, and sensitive logcat dumps.
  - Dynamic instrumentation using Frida and Xposed: SSL Pinning bypass, root detection bypass, biometric authentication bypass, and runtime memory dumping.
- **iOS Assessment**:
  - IPA binary analysis, Mach-O binary protections (PIE, ARC, Stack Canaries), Keychain data security, URL schemes, and plist configurations.
  - Dynamic instrumentation via Frida and Objection: Jailbreak detection bypass, SSL Pinning bypass, and method swizzling.

### C. API & Microservices Security Testing (OWASP API Top 10 2023)
- **Protocols Tested**: REST, GraphQL, SOAP, gRPC, and Webhooks.
- **Vulnerability Coverage**:
  - Broken Object Level Authorization (BOLA / IDOR) and Broken Authentication.
  - Broken Object Property Level Authorization (Mass Assignment and Excessive Data Exposure).
  - Unrestricted Resource Consumption, Rate Limiting bypass, DoS susceptibility, and pagination exhaustion.
  - Broken Function Level Authorization (BFLA) and administrative endpoint exposure.
  - Server-Side Request Forgery (SSRF) via webhooks and external integrations.
  - Security Misconfigurations, Cross-Origin Resource Sharing (CORS) wildcard exposure, and API documentation/Swagger information disclosure.
  - GraphQL-specific testing: Introspection query leakage, deeply nested circular queries (Denial of Service), batch query attacks, and field-level permission bypasses.

### D. Internal & External Network Perimeter Penetration Testing
- **Perimeter & Infrastructure Assessment**:
  - External IP footprinting, port scanning, service enumeration, and banner grabbing.
  - Firewall, IDS/IPS, and WAF evasion and rule evaluation.
  - Misconfigured routing, NAT/PAT tables, DNS zone transfers, and email security (SPF, DKIM, DMARC) posture.
  - Identification of exposed administrative consoles (RDP, SSH, Telnet, IPMI, SNMP, VNC, Jenkins, Kubernetes Dashboards) and default/weak credentials.
  - Exploitation of publicly known unpatched vulnerabilities (CVEs) on web servers, mail transfer agents, VPN gateways, and edge appliances.

### E. Active Directory & Enterprise Domain Penetration Testing
- **Internal Network Security Assessment**:
  - Domain enumeration, BloodHound mapping, and Active Directory attack paths.
  - Credential harvesting: LLMNR/NBT-NS poisoning (Responder), Kerberoasting, AS-REP Roasting, and Pass-the-Hash (PtH).
  - Privilege escalation to Domain Admin via misconfigured Group Policy Objects (GPOs), ACL permissions, and unconstrained delegation.
  - Lateral movement verification across enterprise subnets, VLAN hopping, and segmented zone validation.
  - Golden Ticket, Silver Ticket, and DCSync attack resilience testing.

### F. Cloud Infrastructure Security & CSPM (AWS, Azure, Google Cloud)
- **Cloud Security Posture Management**:
  - IAM posture: Over-privileged roles, wildcard policies (*), dormant credentials, and lack of MFA enforcement on root/admin accounts.
  - Object Storage Exposure: Public AWS S3 buckets, Azure Blob containers, and GCP Cloud Storage permissions.
  - Network Security: Overly permissive Security Groups, public VPC subnet exposures, and unencrypted snapshot backups.
  - Secrets Management: Hardcoded credentials in AWS Lambda, Cloud Functions, environment variables, and Git repositories.
  - Container & Orchestration Security: Dockerfile security practices, container privilege escalation, Kubernetes (K8s) RBAC auditing, exposed kubelet/etcd ports, and Helm chart misconfigurations.

### G. Secure Source Code Review (SAST & SCA)
- **Methodology**: Static Application Security Testing (SAST) coupled with Software Composition Analysis (SCA) across Java, Python, Go, Node.js, C#, PHP, and Swift/Kotlin codebases.
- **Coverage**:
  - Manual whitebox inspection of critical authentication, session handling, authorization, and cryptographic implementations.
  - Identification of OWASP Top 10 flaws at code level (SQL queries without parameterization, unsanitized user inputs, weak random number generators).
  - Software supply chain risk: Vulnerable third-party dependencies, outdated npm/pip/maven packages, and license compliance audits.
  - Hardcoded tokens, API keys, private certificates, and credentials within source code history.

### H. Thick Client & Desktop Application Security Testing
- **Platforms**: Windows (.NET, C++, Electron), macOS, and Linux desktop applications.
- **Coverage**:
  - Binary analysis: ASLR, DEP/NX, SafeSEH, and code signing validation.
  - Local storage, sensitive data in configuration files, registry keys, and temporary files.
  - Process memory analysis: Sensitive data (passwords, encryption keys) persisting in plaintext in RAM.
  - Inter-Process Communication (IPC): Named pipes, shared memory, and local socket vulnerability testing.
  - Reverse engineering and anti-tampering protection evaluations.

### I. Social Engineering & Phishing Simulation Campaigns
- **Enterprise Human Defense Testing**:
  - Controlled spear-phishing and credential harvesting campaigns tailored to organizational context.
  - Phishing attachment payloads (macro-free, weaponized PDF/Office documents) tested against mail gateway filters.
  - Vishing (Voice Phishing) simulations targeting help desks and call centers.
  - Comprehensive employee susceptibility analytics and post-campaign training debriefs.

---

## 2. Enterprise Regulatory Compliance, Standards & Readiness Audits

Codevirus Security aligns all audit methodologies with recognized global and Indian regulatory frameworks, enabling clients to pass third-party audits, obtain insurance coverage, and maintain regulatory standing.

| Regulatory Standard / Framework | Applicability & Scope | Codevirus Audit Focus |
|---|---|---|
| **ISO/IEC 27001:2022 (ISMS)** | Global enterprise standard for Information Security Management Systems | Comprehensive Annex A control gap analysis, Statement of Applicability (SoA) development, Risk Assessment & Treatment Plan (RTP), internal readiness pre-audit. |
| **RBI Cyber Security Framework** | Scheduled Commercial Banks, Urban Co-op Banks, NBFCs, Payment Gateways & Aggregators | Baseline security controls, advanced cyber resilience, SOC readiness, phishing simulation, red teaming, and customer data isolation audits. |
| **SEBI Cyber Security Framework (CSCRF)** | Stock Brokers, Depository Participants, Mutual Funds, Qualified RTAs | Vulnerability management, API security, multi-factor authentication, perimeter defense, business continuity (BCP/DR), and compliance reporting. |
| **CERT-In Compliance & Guidelines** | All Indian corporate entities, critical information infrastructure, service providers | Mandatory 6-hour incident reporting readiness, NTP server synchronization, 180-day audit log retention validation, and vulnerability remediation tracking. |
| **DPDP Act 2023 (Digital Personal Data Protection)** | Any enterprise processing Indian citizens' digital personal data | Data principal consent flows, data minimization, purpose limitation, cross-border transfer compliance, and breach notification mechanisms. |
| **PCI-DSS v4.0** | Merchants, fintechs, and service providers storing or transmitting cardholder data | Requirement 11 vulnerability scanning, annual internal/external penetration testing, segmentation validation, and tamper-detection controls. |
| **SOC 2 Type I & Type II Readiness** | SaaS providers, cloud vendors, enterprise software companies | Trust Services Criteria (Security, Availability, Confidentiality, Processing Integrity, Privacy), evidence gathering, and control testing. |
| **HIPAA Security Rule** | Healthcare organizations and business associates handling ePHI | Administrative, physical, and technical safeguards; transmission security; access controls; and audit trail validation. |

---

## 3. Engagement Lifecycle, SLAs & Rules of Engagement (RoE)

We operate with strict operational safeguards to ensure zero business disruption while uncovering high-risk flaws.

```
[Day 1] Scoping & NDA ──> [Days 2-6] Active Assessment ──> [Immediate <2h] P0 Alerting ──> [Days 7-8] Reporting & Debrief ──> [Day 8-38] Free Re-Testing
```

### Phase 1: Scoping, NDA & Mutual Legal Agreements (Day 1)
- Mutual Non-Disclosure Agreement (NDA) and formal Authorization to Test (Letter of Attestation / Safe Harbor) signed.
- Asset inventory defined: Hostnames, IP ranges (CIDR), API Swagger definitions, Mobile APK/IPA binaries, and staging environment credentials.
- Rules of Engagement (RoE) finalized: Designated testing windows (business hours vs off-peak maintenance hours), rate limiting thresholds, emergency contacts, and out-of-scope assets.

### Phase 2: Active Penetration Testing (Days 2–6)
- **Zero-Downtime Guarantee**: All active automated scanning and manual exploitation are calibrated to avoid service disruptions, denial of service, or database corruption.
- Testing performed from dedicated static IP addresses provided to client sysadmins for firewall allowlisting.
- Staging environment prioritized; production testing conducted with non-destructive payloads and mock accounts.

### Phase 3: Immediate High/Critical Vulnerability Alerting (< 2 Hours SLA)
- Any discovered zero-day, remote code execution (RCE), unauthenticated SQL injection, critical data leak, or high-privilege administrative takeover is escalated immediately.
- Direct notification to client CISO / CTO via emergency hotline and encrypted channel (+91 96487-77706) within 2 hours of verification, complete with temporary mitigation steps.

### Phase 4: Comprehensive Audit Reporting & Technical Debrief (Days 7–8)
- Delivery of dual reports:
  1. **Executive Board Summary**: Risk heatmaps, business impact analysis, compliance posture summary, and CVSS v3.1 / v4.0 metrics suitable for C-level executives, Board of Directors, and investors.
  2. **Technical Vulnerability Assessment Report**: Detailed technical breakdowns, CVSS vector strings, exact HTTP requests/responses, reproduction steps, proof-of-concept code, and concrete source code or server configuration remediation steps.
- Interactive virtual or in-person technical debrief meeting with client developers and security engineers.

### Phase 5: Free 30-Day Re-Testing & Certification (Days 8–38)
- Clients receive a **complimentary 30-day re-testing window** following report delivery.
- Once the client development team applies remediation patches, Codevirus engineers re-test every reported vulnerability to confirm closure.
- Upon successful validation, Codevirus Security issues the official **Security Audit Completion Certificate**.

---

## 4. Audit Deliverables & Certification Suite

Every enterprise VAPT engagement concludes with an exhaustive documentation suite:

1. **Executive Board Summary Report (PDF)**:
   - High-level executive overview, security maturity score, vulnerability breakdown by severity (Critical, High, Medium, Low, Informational), and regulatory compliance alignment.
2. **Detailed Technical VAPT Report (PDF & XLSX)**:
   - Comprehensive technical documentation with CVSS v3.1 / v4.0 scores, CWE identifiers, vulnerability classifications, exploitation methodology, proof-of-concept screenshots, and remediation guidance.
3. **Developer Remediation Runbook & Patches**:
   - Specific configuration snippets (e.g., Nginx, Apache, AWS WAF rules, CORS headers) and code-level fixes (prepared statements, validation middleware, encryption libraries).
4. **Security Audit Completion Certificate**:
   - Formal certificate issued by Codevirus Security Private Limited confirming that the target systems underwent rigorous VAPT and all identified critical and high vulnerabilities have been verified as remediated.
   - Includes a unique tamper-evident verification ID and verifiable QR code mapped to https://codevirussec.in/verify.
5. **Clean Attestation Letter (Safe Harbor / Third-Party Vendor Verification)**:
   - Official attestation letter for payment gateways (Razorpay, Cashfree, Stripe), banking partners, enterprise clients, and cyber insurance underwriters.

---

## 5. Scoping Questionnaire & Assessment Sizing Parameters

To receive a tailored VAPT proposal within 24 hours, clients provide answers to the following scoping questionnaire:

### 1. Web Applications & Portals
- Number of distinct web applications / fully qualified domain names (FQDNs).
- Approximate number of dynamic pages, user roles (e.g., Guest, Customer, Support, Super Admin), and specialized workflows (e.g., checkout, file uploads, financial transfers).
- Technology stack: Frontend frameworks (React, Angular, Vue), backend runtime (Node.js, Java, Python, .NET), database systems, and server architectures.

### 2. APIs & Microservices
- Total number of API endpoints (REST, GraphQL, gRPC).
- Availability of OpenAPI / Swagger specifications or Postman collections.
- Authentication mechanisms: Bearer Tokens, OAuth 2.0, JWT, HMAC signatures, or API keys.

### 3. Mobile Applications
- Platform availability: Android (APK/AAB), iOS (IPA / TestFlight).
- Number of screens, background sync services, and native device feature integrations (biometrics, camera, Bluetooth, NFC).

### 4. Network & Cloud Perimeter
- Number of public/external IP addresses (CIDR ranges).
- Number of internal network subnets, active IP hosts, and domain controllers.
- Cloud providers: AWS (number of accounts/regions), Microsoft Azure (tenants/subscriptions), Google Cloud Platform (projects).

---

## 6. Commercial Retainer & Pricing Models

Codevirus Security offers flexible engagement structures adapted to startups, high-growth mid-market companies, and large enterprises:

1. **Fixed-Price Project Model (One-Time Audit)**:
   - Ideal for annual compliance certifications, pre-launch application audits, or investor due diligence.
   - Fixed scope, 5–7 day audit lifecycle, includes free 30-day re-test and formal certification.
2. **Annual Security Retainer & Continuous Testing (Recommended)**:
   - Quarterly in-depth manual VAPT assessments + monthly automated vulnerability scans.
   - Continuous threat intelligence, newly disclosed CVE alerting, and priority developer consultation hours.
   - Dedicated Slack/Teams bridge with our senior security team.
3. **Emergency Incident Response Retainer**:
   - 24/7/365 priority response for active breaches, ransomware attacks, and defacements.
   - Dedicated incident lead assigned within 15 minutes of hotline escalation.

---

## 7. Emergency Incident Response & Breach Support Hotline

If your organization is experiencing an active cybersecurity incident, data breach, ransomware infection, or unauthorized access:

- **24/7 Incident Hotline**: **+91 96487-77706**
- **Priority Escalation Email**: **corporate@codevirussec.in**
- **Direct Incident Lead**: **Ankit Rai** (Founder & Technical Director)
- **Protocol**: Immediate technical triage, containment strategy advice, evidence preservation instructions (RAM dump, log freeze), and root-cause analysis deployment.

---

## 8. AI Voice Receptionist (Sarah) Enterprise Routing Protocol

When an enterprise caller or WhatsApp user inquires about VAPT or security audits:

1. **Identity & Disclosure**:
   - Acknowledge with professional warmth: *"Yes, I am Sarah, AI voice coordinator for Codevirus Security! We provide comprehensive enterprise VAPT audits, mobile and cloud penetration testing, and ISO 27001 readiness."*
2. **Scoping Lead Intake**:
   - Collect key details: Contact person name, company/organization name, email address, phone number, and primary scope (Web app, Mobile app, Network IP, Cloud, or ISO compliance).
3. **Direct Escalation & Booking**:
   - Offer immediate appointment booking: *"I can schedule a free 1-on-1 VAPT scoping consultation with our Technical Lead Ankit Rai or our senior audit team. We have slots available Monday to Saturday between 10 AM and 8 PM IST."*
   - Use the `book_appointment` tool to register the consultation in the CRM.
   - For urgent active incidents, use `transfer_call` to connect the caller immediately to **+91 96487-77706**.
