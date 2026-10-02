// Pre-built contract templates for common Codevenient roles. Each template
// defines the fields to collect and a build() function that produces the
// same "N. Heading" / "Label: value" formatted text the legal document
// parser and PDF export already understand.

const COMPANY_BLOCK = (v) =>
  `Client: Codevenient Consulting (Pty) Ltd ("Company")
${v.partyLabel}: ${v.name} ("${v.partyLabel}")`;

const SIGNATURE_BLOCK = (v, contractorIdLabel) =>
  `6. Signatures & Acceptance
By signing below, both parties acknowledge that they have read, understood, and agreed to the terms outlined in this Agreement.
For Codevenient Consulting (Pty) Ltd
Signature: ___________________________
Name: ${v.directorName}
Title: ${v.directorTitle}
Date: ________________________
${v.partyLabel}
Signature: ___________________________
Name: ${v.name}
${contractorIdLabel}: ____________________
Date: ________________________`;

export const CONTRACT_TEMPLATES = [
  {
    id: "sales-contractor",
    label: "Independent Contractor — Sales & Lead Generation",
    partyLabel: "Contractor",
    fields: [
      { key: "name", label: "Contractor name", placeholder: "Full legal name" },
      { key: "effectiveDate", label: "Effective date", type: "date" },
      { key: "commissionRate", label: "Commission rate (%)", type: "number", default: "30" },
      { key: "noticeDays", label: "Notice period (days)", type: "number", default: "7" },
      { key: "payoutDays", label: "Payout window (business days)", type: "number", default: "5" },
      { key: "directorName", label: "Signing director", default: "" },
      { key: "directorTitle", label: "Director title", default: "Director / Managing Lead" },
    ],
    build: (v) => `This Independent Contractor Agreement ("Agreement") is entered into as of ${v.effectiveDate} ("Effective Date"), by and between:
${COMPANY_BLOCK(v)}
1. Scope of Services
Role: The Contractor shall perform remote cold calling, lead generation, and client acquisition services on behalf of the Company.
Location: The Contractor will perform all services remotely using their own equipment, internet connection, and working hours.
Standard of Conduct: The Contractor agrees to represent the Company professionally, ethically, and in alignment with brand values.
2. Compensation & Payment Terms
Commission Structure: The Contractor shall receive a performance-based fee equal to ${v.commissionRate}% of the total revenue per successfully closed project directly resulting from their cold calling leads or outreach efforts.
Payment Trigger: Commission is earned only upon full or partial receipt of payment from the client secured through the Contractor's outreach.
Payout Schedule: Payments will be disbursed via electronic transfer within ${v.payoutDays} business days of client funds clearing into the Company's account.
3. Relationship of Parties
Independent Contractor: The Contractor is an independent service provider and not an employee, agent, or partner of the Company.
Taxes & Benefits: The Contractor is responsible for all personal income taxes, statutory obligations, and benefits. The Company will not provide leave pay, medical aid, or unemployment insurance.
4. Confidentiality & Intellectual Property
Confidential Information: The Contractor agrees not to disclose, share, or misuse any proprietary company data, client databases, script templates, pricing strategies, or trade secrets during or after this engagement.
Work Product: All leads, call logs, customer profiles, and communication records generated during the service remain the exclusive property of the Company.
5. Term & Termination
At-Will Agreement: Either party may terminate this Agreement at any time with ${v.noticeDays} days written notice via email or messaging.
Outstanding Commissions: Upon termination, the Contractor will remain entitled to the ${v.commissionRate}% commission on any active project pipeline initiated prior to notice, provided the client signs and pays within 30 days of termination.
${SIGNATURE_BLOCK(v, "ID / Passport No.")}`,
    summary: (v) => ({
      title: `Independent Contractor Agreement — ${v.name}`,
      target: `${v.name} (Contractor)`,
      value: `${v.commissionRate}% commission per closed project`,
      duration: "Ongoing / at-will",
    }),
  },
  {
    id: "freelance-developer",
    label: "Independent Contractor — Developer / Designer",
    partyLabel: "Contractor",
    fields: [
      { key: "name", label: "Contractor name", placeholder: "e.g. Thabo Mokoena" },
      { key: "effectiveDate", label: "Effective date", type: "date" },
      { key: "projectName", label: "Project name", placeholder: "e.g. Harbor View Guest House site" },
      { key: "fee", label: "Project fee (R)", type: "number", placeholder: "e.g. 15000" },
      { key: "depositPct", label: "Deposit (%)", type: "number", default: "50" },
      { key: "durationWeeks", label: "Expected duration (weeks)", type: "number", default: "3" },
      { key: "noticeDays", label: "Notice period (days)", type: "number", default: "7" },
      { key: "directorName", label: "Signing director", default: "" },
      { key: "directorTitle", label: "Director title", default: "Director / Managing Lead" },
    ],
    build: (v) => `This Independent Contractor Agreement ("Agreement") is entered into as of ${v.effectiveDate} ("Effective Date"), by and between:
${COMPANY_BLOCK(v)}
1. Scope of Services
Project: The Contractor shall design and/or develop "${v.projectName}" for the Company on a project basis.
Deliverables: All source files, assets, and a working deployed build handed over on completion.
Standard of Conduct: The Contractor agrees to follow Codevenient's build standards and communicate progress at agreed milestones.
2. Compensation & Payment Terms
Project Fee: The total fee for this project is R${v.fee}.
Payment Schedule: ${v.depositPct}% deposit before work begins, with the remaining balance due on delivery and sign-off.
Timeline: The Contractor will aim to deliver the completed project within ${v.durationWeeks} weeks of the Effective Date, barring delays caused by late client feedback.
3. Relationship of Parties
Independent Contractor: The Contractor is an independent service provider and not an employee, agent, or partner of the Company.
Taxes & Benefits: The Contractor is responsible for all personal income taxes, statutory obligations, and benefits.
4. Confidentiality & Intellectual Property
Confidential Information: The Contractor agrees not to disclose, share, or misuse any proprietary company data, client information, designs, or trade secrets during or after this engagement.
Work Product: All code, designs, and deliverables produced for this project become the exclusive property of the Company upon full payment.
5. Term & Termination
At-Will Agreement: Either party may terminate this Agreement at any time with ${v.noticeDays} days written notice via email or messaging.
Incomplete Work: Upon termination before completion, the Contractor will be paid for work completed to date on a pro-rata basis.
${SIGNATURE_BLOCK(v, "ID / Passport No.")}`,
    summary: (v) => ({
      title: `Developer Agreement — ${v.name}`,
      target: `${v.name} (Contractor) — ${v.projectName}`,
      value: `R${v.fee} project fee`,
      duration: `${v.durationWeeks} weeks`,
    }),
  },
  {
    id: "full-time-employee",
    label: "Employee — Full-Time",
    partyLabel: "Employee",
    fields: [
      { key: "name", label: "Employee name", placeholder: "e.g. Naledi Dube" },
      { key: "effectiveDate", label: "Start date", type: "date" },
      { key: "jobTitle", label: "Job title", placeholder: "e.g. Junior Frontend Developer" },
      { key: "salary", label: "Monthly salary (R)", type: "number", placeholder: "e.g. 12000" },
      { key: "probationMonths", label: "Probation period (months)", type: "number", default: "3" },
      { key: "noticeDays", label: "Notice period after probation (days)", type: "number", default: "30" },
      { key: "directorName", label: "Signing director", default: "" },
      { key: "directorTitle", label: "Director title", default: "Director / Managing Lead" },
    ],
    build: (v) => `This Employment Agreement ("Agreement") is entered into as of ${v.effectiveDate} ("Effective Date"), by and between:
${COMPANY_BLOCK(v)}
1. Position & Duties
Job Title: The Employee is appointed as ${v.jobTitle}, reporting to the Company's director.
Duties: The Employee will perform the duties reasonably associated with this role, plus any other reasonable tasks assigned from time to time.
Standard of Conduct: The Employee agrees to represent the Company professionally and in line with its values.
2. Compensation
Salary: The Employee will be paid a gross monthly salary of R${v.salary}, paid via electronic transfer.
Deductions: Standard statutory deductions (PAYE, UIF) will be applied in line with South African law.
3. Probation
Probation Period: The first ${v.probationMonths} months of employment are a probationary period, during which either party may terminate with 1 week's written notice.
Review: Performance will be reviewed before the end of the probation period to confirm permanent appointment.
4. Leave & Benefits
Annual Leave: The Employee is entitled to statutory annual leave in accordance with the Basic Conditions of Employment Act.
Sick Leave: Sick leave will be provided in accordance with the Basic Conditions of Employment Act.
5. Confidentiality & Intellectual Property
Confidential Information: The Employee agrees not to disclose any proprietary company data, client information, or trade secrets during or after employment.
Work Product: All work created during employment and using company resources remains the exclusive property of the Company.
6. Termination
Notice Period: After probation, either party may terminate this Agreement with ${v.noticeDays} days written notice.
Misconduct: The Company reserves the right to terminate immediately for serious misconduct, in accordance with South African labour law.
7. Signatures & Acceptance
By signing below, both parties acknowledge that they have read, understood, and agreed to the terms outlined in this Agreement.
For Codevenient Consulting (Pty) Ltd
Signature: ___________________________
Name: ${v.directorName}
Title: ${v.directorTitle}
Date: ________________________
Employee
Signature: ___________________________
Name: ${v.name}
ID Number: ____________________
Date: ________________________`,
    summary: (v) => ({
      title: `Employment Agreement — ${v.name}`,
      target: `${v.name} (${v.jobTitle})`,
      value: `R${v.salary}/month`,
      duration: `Permanent, ${v.probationMonths}-month probation`,
    }),
  },
];
