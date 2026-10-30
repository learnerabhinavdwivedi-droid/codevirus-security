# Codevirus Academy — Courses, Syllabus & Training Programs
**Campus**: Kapoorthala, Aliganj, Lucknow, UP, India  
**Modes**: 100% Practical In-Person Labs (Lucknow Campus) & Interactive Live Online Batches  
**Certification & Standards**: Aligned with ISO 27001, NIST, MITRE ATT&CK, CEH Practical, eJPT, and OSCP roadmaps  

---

## 1. Certified SOC Analyst Program (Security Operations Center & Cyber Defense)
- **Target Roles**: Tier-1 / Tier-2 SOC Analyst, SIEM Engineer, Threat Hunter, Incident Responder, Cyber Defense Specialist.
- **Duration**: 6 Months (Specialist Track) / 1 Year (Master Diploma in Enterprise Cyber Defense).
- **Core Modules & Deep-Dive Syllabus**:
  - **Module 1: Enterprise Networking & Traffic Analysis**:
    - TCP/IP model internals, OSI layer breakdowns, IPv4/IPv6 addressing, Subnetting.
    - Deep Packet Inspection (DPI) with Wireshark, tcpdump, and NetworkMiner.
    - Analyzing TCP handshakes, DNS exfiltration, ARP spoofing, and malicious TLS flows.
  - **Module 2: Operating System Internals & Enterprise Auditing**:
    - Linux security architecture, Syslog-ng, auditd, systemd journaling, and user permissions.
    - Windows enterprise internals: Active Directory basics, Windows Event IDs (4624, 4625, 4688, 4720, 7045), and Sysmon configuration.
  - **Module 3: SIEM Architecture & Live Deployment**:
    - **Splunk Enterprise**: Splunk Search Processing Language (SPL), dashboard creation, alert generation, forwarder configuration, and field extraction.
    - **Wazuh Open-Source SIEM**: Wazuh manager, agent deployment, log collection, active response, vulnerability detection, and regulatory compliance dashboards (PCI-DSS, GDPR).
  - **Module 4: Threat Detection, Rule Writing & Threat Intelligence**:
    - Writing custom YARA rules for malware detection and Sigma rules for SIEM-agnostic log correlation.
    - MITRE ATT&CK Framework: Mapping attacker Tactics, Techniques, and Procedures (TTPs).
    - Cyber Threat Intelligence (CTI) integration using MISP, AlienVault OTX, and VirusTotal APIs.
  - **Module 5: Incident Handling & Endpoint Detection and Response (EDR)**:
    - Incident Response lifecycle (NIST SP 800-61r2): Preparation, Detection & Analysis, Containment, Eradication, and Recovery.
    - Working with TheHive / Cortex for security orchestration and alert triage.
    - EDR workflows: Process trees, parent-child process anomalies, live host isolation, and memory dump triage.
  - **Module 6: Blue Team Cyber Range Simulations**:
    - Live attack-defense drills simulating ransomware outbreaks, lateral movement, brute-force attacks, and data exfiltration inside our dedicated cyber range.
- **Prerequisites**: No prior coding experience required; networking and Linux are taught from scratch.
- **Supported Certifications**: Certified SOC Analyst (CSA), CompTIA Security+, CompTIA CySA+.

---

## 2. VAPT & Bug Bounty Mastery (Offensive Penetration Testing)
- **Target Roles**: Penetration Tester, Vulnerability Researcher, Web App Pentester, Bug Bounty Hunter, Application Security Engineer.
- **Duration**: 6 Months (Hands-On Lab Intensive).
- **Core Modules & Deep-Dive Syllabus**:
  - **Module 1: Web Application Architecture & HTTP Protocols**:
    - HTTP/HTTPS protocol mechanics, headers, status codes, cookies, sessions, and state management.
    - Single Page Applications (SPA), client-side vs server-side rendering, and WebSocket communications.
  - **Module 2: Professional Tooling & Interception Proxies**:
    - Burp Suite Professional mastery: Target Scope, Proxy, Repeater, Intruder (attack types: Sniper, Battering Ram, Pitchfork, Cluster Bomb), Decoder, Comparer, Collaborator, and Extensions (BApp Store).
    - Automated reconnaissance and scanning using OWASP ZAP, Nuclei, Nikto, and SQLmap.
  - **Module 3: OWASP Top 10 (2021 / 2025) Exploitation**:
    - **Injection**: In-band, Error-based, Blind (Boolean/Time-based) SQL Injection, NoSQL Injection, Command Injection.
    - **Broken Access Control & IDOR**: Insecure Direct Object References, horizontal/vertical privilege escalation, CORS misconfigurations.
    - **Cross-Site Scripting (XSS)**: Reflected, Stored, and DOM-based XSS; filter bypasses, cookie theft, and CSP evasion.
    - **Server-Side Request Forgery (SSRF)**: Blind and full SSRF, cloud metadata exfiltration (AWS/Azure/GCP instance credentials).
    - **Authentication Flaws**: Password reset race conditions, JWT token tampering, brute-force attacks, and 2FA bypass techniques.
    - **Business Logic Vulnerabilities**: Payment gateway price tampering, quantity manipulation, cart state desynchronization, and coupon reuse.
  - **Module 4: API & Microservice Penetration Testing**:
    - OWASP API Security Top 10 (2023): BOLA, Broken Authentication, Mass Assignment, BFLA, Lack of Resources & Rate Limiting.
    - Testing REST, GraphQL (introspection exploitation, circular query DoS), and SOAP services using Postman and Burp Suite.
  - **Module 5: Mobile Application Security Testing (Android & iOS)**:
    - Android APK decompilation and analysis using Jadx, APKTool, and Mobile Security Framework (MobSF).
    - Dynamic instrumentation using Frida and Objection: SSL Pinning bypass, root detection bypass, and live memory dumping.
    - iOS app security basics, Keychain analysis, and Mach-O binary checks.
  - **Module 6: Bug Bounty Methodology & Responsible Disclosure**:
    - Advanced reconnaissance: Subdomain enumeration (Amass, Sublist3r, assetfinder), directory fuzzing (ffuf, gobuster), GitHub dorking, JavaScript file analysis.
    - Triaging vulnerabilities, writing impactful CVSS-scored vulnerability reports, and participating in live programs on HackerOne and Bugcrowd.
- **Supported Certifications**: CEH (Practical), eJPT (Junior Penetration Tester), eWPTX, OSCP roadmap.

---

## 3. Network & Cloud Security (CCNA & AWS Cloud Defense)
- **Target Roles**: Network Security Engineer, Cloud Security Administrator, Infrastructure Defense Analyst.
- **Duration**: 3 to 6 Months.
- **Core Modules & Deep-Dive Syllabus**:
  - **Module 1: Cisco CCNA Routing & Switching**:
    - IPv4/IPv6 subnetting, VLANs, Inter-VLAN routing, Trunking (802.1Q), Spanning Tree Protocol (STP).
    - Dynamic routing protocols: OSPF, EIGRP.
    - Network Access Control Lists (ACLs), NAT/PAT, DHCP snooping, and Dynamic ARP Inspection (DAI).
  - **Module 2: Enterprise Firewalls & UTM Systems**:
    - pfSense open-source firewall deployment, rule configuration, and gateway failover.
    - Next-Generation Firewall (NGFW) concepts: SSL/TLS inspection, intrusion prevention rules (IPS), application control, and VPN tunnels (IPsec & OpenVPN).
  - **Module 3: AWS Cloud Defense & Security**:
    - AWS Identity & Access Management (IAM): Least privilege policies, roles, permission boundaries, and MFA.
    - Amazon Virtual Private Cloud (VPC): Public/Private subnets, Route Tables, NAT Gateways, Security Groups, and Network ACLs.
    - Storage & Data Hardening: S3 bucket policies, public access blocking, KMS customer managed keys, and EBS snapshot encryption.
    - Cloud Threat Monitoring: AWS CloudTrail audit logs, Amazon GuardDuty intelligent threat detection, AWS Security Hub, and VPC Flow Logs.
  - **Module 4: Linux Server Administration & Hardening**:
    - Hardening SSH, enforcing sudo policies, configuring UFW/iptables, and automated vulnerability patching.

---

## 4. Digital Forensics & Incident Response (DFIR)
- **Target Roles**: Digital Forensics Investigator, Cyber Crime Analyst, DFIR Consultant.
- **Duration**: 3 Months (Advanced Module).
- **Core Modules & Deep-Dive Syllabus**:
  - **Module 1: Forensic Acquisition & Chain of Custody**:
    - Legal compliance, evidence handling procedures, chain of custody documentation, and write-blockers.
    - Bit-stream disk imaging using FTK Imager, Guymager, and dd/dc3dd.
  - **Module 2: Windows Artifact Analysis**:
    - Analyzing Registry hives (NTUSER.DAT, SYSTEM, SAM, SOFTWARE).
    - Execution evidence: Prefetch files, Shimcache, Amcache, UserAssist, and Background Activity Moderator (BAM).
    - Browser forensics: Cache, history, cookies, and session restore data.
  - **Module 3: Live Memory Forensics**:
    - Capturing volatile RAM using DumpIt and WinPmem.
    - Memory analysis with Volatility 3 framework: Extracting running processes (pstree, pslist), network connections (netscan), injected DLLs (malfind), and password hashes.
  - **Module 4: Malware Analysis Basics**:
    - Static analysis: File hashing, PE header inspection, strings extraction, and packing detection.
    - Dynamic analysis in isolated sandboxes: Process Monitor, RegShot, and Wireshark traffic monitoring.

---

## 5. 100% Placement Support, Hiring Partners & Career Mentorship
Codevirus Academy maintains an active Industry Placement Cell dedicated to launching each graduate's cybersecurity career:

- **Hiring Partner Network**:
  - Active hiring pipelines with 50+ enterprise cybersecurity firms, Big 4 consultancies, managed security service providers (MSSPs), and IT MNCs across Noida, Gurugram, Bengaluru, Pune, Hyderabad, and Lucknow.
- **Career Support Modules Included**:
  - Technical Mock Interviews with experienced SOC Leads and Penetration Testers.
  - Professional Resume Building & LinkedIn Personal Branding.
  - GitHub portfolio setup with verified lab writeups and open-source contributions.
  - Soft skills, behavioral interview preparation, and client presentation training.
- **Industry Salary Benchmarks (India)**:
  - Freshers / Junior SOC Analysts: ₹4.5 LPA to ₹8 LPA.
  - Penetration Testers / Security Engineers: ₹6.5 LPA to ₹12 LPA.
  - Senior Analysts & Specialized Consultants (2–4 yrs exp): ₹12 LPA to ₹20+ LPA.

---

## 6. Batch Schedules & Timings (Kapoorthala Campus)
- **Weekday Batches (Monday to Friday)**:
  - Morning Batch: 10:00 AM — 12:00 PM IST
  - Afternoon Batch: 02:00 PM — 04:00 PM IST
  - Evening Batch: 06:00 PM — 08:00 PM IST
- **Weekend Batches (Saturday & Sunday)**:
  - Intensive Track: 11:00 AM — 03:00 PM IST (Ideal for working professionals and college students)
- **Free 1-on-1 Counseling & Lab Demo**:
  - Free personal consultation and live lab tour available daily (Monday to Saturday 10:00 AM to 7:00 PM IST).
  - Walk-ins welcome at Kapoorthala campus or bookable via Sarah AI voice receptionist (+91 96487-77706).
