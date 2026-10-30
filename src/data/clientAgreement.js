import {money} from '../lib/model.js';

export const CLIENT_AGREEMENT = {
 id:'client-services',label:'Client — Services & Terms of Agreement',partyLabel:'Client',
 fields:[
  {key:'providerName',label:'Your full legal / trading name',required:true,default:'Codevenient Consulting'},
  {key:'providerEmail',label:'Your notice email',type:'email',required:true},
  {key:'name',label:'Client full legal / business name',required:true},
  {key:'clientEmail',label:'Client notice email',type:'email',required:true},
  {key:'clientSigner',label:'Client authorised signatory',required:true},
  {key:'effectiveDate',label:'Agreement date',type:'date',required:true},
  {key:'projectName',label:'Project name / quote reference',required:true},
  {key:'scope',label:'Included deliverables and milestones',type:'textarea',required:true},
  {key:'exclusions',label:'Excluded work and ongoing costs',type:'textarea',required:true,default:'Hosting, domains, paid licences, ongoing maintenance, and new features unless expressly included above.'},
  {key:'fee',label:'Total project fee (R), including any applicable VAT',type:'number',min:0.01,step:0.01,required:true},
  {key:'depositPct',label:'Deposit (%)',type:'number',min:0,max:100,step:0.01,default:'50',required:true},
  {key:'paymentDays',label:'Invoice payment window (calendar days)',type:'number',min:1,max:90,default:'7',required:true},
  {key:'durationWeeks',label:'Estimated duration after prerequisites (weeks)',type:'number',min:1,max:104,default:'3',required:true},
  {key:'revisions',label:'Included consolidated revision rounds',type:'number',min:0,max:20,default:'2',required:true},
  {key:'feedbackDays',label:'Client review window (business days)',type:'number',min:1,max:30,default:'5',required:true},
  {key:'warrantyDays',label:'Included defect correction period (calendar days)',type:'number',min:1,max:365,default:'30',required:true},
  {key:'directorName',label:'Your authorised signatory',required:true},
 ],
 build:v=>{
  const deposit=Math.round(Number(v.fee)*Number(v.depositPct))/100;
  return `CLIENT SERVICES & TERMS OF AGREEMENT
Draft for review before signature. The completed scope and any attached quote must be provided to both parties before acceptance.
1. Parties and project
Service provider: ${v.providerName}
Provider notice email: ${v.providerEmail}
Client: ${v.name}
Client notice email: ${v.clientEmail}
Authorised client representative: ${v.clientSigner}
Agreement date: ${v.effectiveDate}
Project / quote reference: ${v.projectName}
2. Agreed scope and deliverables
${v.scope}
Exclusions and ongoing costs: ${v.exclusions}
Only the work expressly listed in this signed agreement and its attached quote is included. Changes must be documented and approved by both parties before the changed work starts. Neither party can change the price or scope unilaterally.
3. Fees and payment milestones
Total project fee: ${money(v.fee)}, including any applicable VAT. The provider must identify any VAT on its invoice where applicable.
Deposit: ${v.depositPct}% (${money(deposit)}) payable before work starts.
Balance: ${money(Number(v.fee)-deposit)} payable after delivery for review and written acceptance, before production launch or transfer of project-specific source files, except as required by law.
Payment window: Invoices are payable within ${v.paymentDays} calendar days. Payment is recorded when funds are received. Any different milestones must be set out in an attached schedule signed by both parties.
Disputed charges: The client must promptly explain a disputed amount in writing. Both parties will work to resolve it, and undisputed amounts remain payable. No automatic late-payment interest is imposed by this agreement.
4. Timelines and client responsibilities
Estimated delivery: ${v.durationWeeks} weeks after the signed agreement, cleared deposit, required content, and necessary access have been received. This estimate must be confirmed in the project schedule.
Client responsibilities: Provide accurate content, licensed materials, necessary access and one authorised decision-maker. Give consolidated feedback within ${v.feedbackDays} business days of each review request.
Client delays: Missing content, access or feedback may move the schedule. The provider will explain the impact and agree a revised schedule in writing. Silence is not acceptance, and no additional charge applies without written agreement.
Provider delays: The provider must promptly explain its own delays and propose a revised schedule and reasonable remedy. The client's applicable statutory rights remain available.
5. Revisions and changes
Included revisions: ${v.revisions} consolidated rounds within the agreed scope. A round is one combined set of feedback from the authorised client representative.
Additional work: New features, a changed brief, new pages, or extra revision rounds require a written change request stating the extra price and schedule. The provider must obtain approval before charging or doing that work. Fixing a failure to meet the agreed scope does not consume a revision round.
6. Review and written acceptance
Review process: The provider will supply a review version and identify the deliverables ready for acceptance. Within ${v.feedbackDays} business days, the client should confirm written acceptance or identify specific failures to meet the agreed scope.
Corrections: The provider will correct verified failures and resubmit for review. Failure to respond pauses the schedule and triggers follow-up; it does not automatically waive defects or legal rights.
7. IMPORTANT - suspension, cancellation and refunds
Suspension: For an overdue undisputed payment or missing essential client input, the provider may pause further work after written notice and at least 7 calendar days to remedy. Dates will be rescheduled reasonably. The provider must not delete client data or disable an existing live service as a debt-collection measure.
Cancellation: Either party may give written notice to end the project, subject to applicable statutory notice and cancellation rights. Before ending for a remediable breach, give written details and at least 10 business days to remedy, or any longer period required by law.
Settlement: On cancellation, the provider must itemise work actually completed and approved, unavoidable third-party costs reasonably incurred. Deposits are credited against that amount; unused amounts are refunded within 14 calendar days after agreement of the account, or sooner if law requires. A deposit is not automatically non-refundable. The client is not charged twice for the same work.
Handover: After payment for completed work, the provider will supply that paid-for work and return client-provided materials and access. Any disputed amount and unfinished work will be identified separately.
8. Ownership, licences and access
Client materials: The client retains ownership of its content, brand, data and accounts and confirms it has permission to supply the materials. The provider may use them only to deliver the services.
Project-specific work: Ownership of original project-specific deliverables transfers on payment of the fees for those deliverables. Pre-existing tools and reusable components remain with their owners; the client receives the licence needed to use them as part of the paid deliverable.
Third-party materials: Open-source software, fonts, plugins and services retain their own licence terms and recurring charges. These must be disclosed before approval. Client domains and accounts should be registered in the client's name where practical.
Portfolio: The provider may publish client work or identifying material only with the client's prior written consent.
9. Support, defects and external services
Included corrections: For ${v.warrantyDays} calendar days after written acceptance, the provider will correct reproducible defects in its delivered work that prevent the agreed scope from functioning, without additional charge. This is an additional service promise and does not shorten statutory guarantees or remedies.
Ongoing support: Maintenance, content updates and new features require a separate written agreement unless expressly included in the scope. Neither party guarantees rankings, revenue, uninterrupted third-party services or results outside its reasonable control.
10. Confidentiality and personal information
Both parties must keep non-public business information confidential, restrict access to people who need it, and use reasonable safeguards. This does not prevent disclosures required by law.
Where personal information is processed, each party must comply with applicable South African data-protection law. Before processing client-controlled personal information, agree the required written processing instructions, security duties, incident notification, authorised service providers, retention and return or deletion arrangements. This template does not replace a project-specific data-processing agreement where one is required.
11. Responsibility and disputes
Each party remains responsible for loss caused by its own breach, negligence or unlawful conduct, subject to applicable law. This agreement does not exclude liability for gross negligence, fraud or intentional wrongdoing, or remove any right or liability that cannot lawfully be excluded.
Disputes: First send written details to the notice emails above. Authorised representatives will attempt a good-faith resolution within 10 business days. If unresolved, the parties may agree mediation; either may use a competent court or relevant statutory complaint body. Urgent relief and statutory complaint rights remain available.
Governing law: South African law applies, subject to mandatory laws that protect the client. Nothing here waives rights under applicable consumer, electronic transactions or data-protection law.
12. Signatures and acceptance
Both parties must read the full agreement, including section 7, complete the scope and fee schedule, and keep a signed copy. Changes require written agreement by authorised representatives. Generating or downloading this document is not a signature or proof of acceptance.
For the provider: ${v.providerName}
Authorised name: ${v.directorName}
Signature: ___________________________
Date: ___________________________
For the client: ${v.name}
Authorised name: ${v.clientSigner}
Signature: ___________________________
Date: ___________________________`;
 },
 summary:v=>({title:`Client Services Agreement - ${v.projectName}`,target:v.name,value:money(v.fee),duration:`${v.durationWeeks} weeks`}),
};
