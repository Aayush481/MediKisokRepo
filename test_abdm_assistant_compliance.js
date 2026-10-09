/**
 * Automated Verification Script for ABDM-Compliant Healthcare Intake Assistant
 * Verifies all 8 strict rules:
 * 1. Validate ABHA ID format. If invalid, return: {"error":"Invalid ABHA ID"}
 * 2. Request and confirm patient consent via ABDM Consent Manager before fetching data
 * 3. Use ABDM FHIR R4 resources only: Patient, Encounter, Observation, DiagnosticReport
 * 4. Fetch only fields authorized in consent artifact (never return extra data)
 * 5. Structured JSON strictly FHIR R4 compliant (matches specification example)
 * 6. If consent is missing or expired, return: {"error":"Consent required"}
 * 7. Never hallucinate or invent patient details
 * 8. Log every fetch attempt with timestamp and consent artifact ID
 */

import { 
  AbdmSandboxService, 
  ABDM_FETCH_AUDIT_LOGS, 
  ABDM_CONSENT_REGISTRY 
} from "./frontend/src/services/abdmSandboxService.js";
import { registerAbhaCitizen } from "./frontend/src/services/abhaService.js";

async function verifyCompliance() {
  console.log("================================================================================");
  console.log("   ABDM-COMPLIANT HEALTHCARE INTAKE ASSISTANT - 8 STRICT RULES VERIFICATION");
  console.log("================================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition, name) {
    total++;
    if (condition) {
      console.log(`  [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name}`);
    }
  }

  // Setup test environment data fixtures
  registerAbhaCitizen({
    abhaNumber: "91-8274-1923-0194",
    name: "Ravi Kumar",
    gender: "Male",
    dob: "15/06/1985",
    mobile: "+91 98450 11223"
  });

  registerAbhaCitizen({
    abhaNumber: "91-7210-4491-8023",
    name: "Sunita Verma",
    gender: "Female",
    dob: "20/05/1988",
    mobile: "+91 99801 88990"
  });

  // Active full consent
  ABDM_CONSENT_REGISTRY["CONSENT-RAVI-01"] = {
    consentId: "CONSENT-RAVI-01",
    abhaId: "91-8274-1923-0194",
    patientName: "Ravi Kumar",
    status: "GRANTED",
    hiTypes: ["Patient", "Encounter", "Observation", "DiagnosticReport"],
    permission: {
      dateRange: {
        to: new Date(Date.now() + 86400000 * 30).toISOString()
      }
    }
  };

  // Revoked consent
  ABDM_CONSENT_REGISTRY["CONSENT-REVOKED-02"] = {
    consentId: "CONSENT-REVOKED-02",
    abhaId: "91-4820-9182-3741",
    patientName: "Revoked Patient",
    status: "REVOKED",
    hiTypes: ["Patient"]
  };

  // Expired consent
  ABDM_CONSENT_REGISTRY["CONSENT-EXPIRED-03"] = {
    consentId: "CONSENT-EXPIRED-03",
    abhaId: "91-8274-1923-0194",
    patientName: "Ravi Kumar",
    status: "GRANTED",
    hiTypes: ["Patient"],
    permission: {
      dateRange: {
        to: "2024-01-01T00:00:00.000Z" // Expired in the past
      }
    }
  };

  // Restricted consent (Patient + Observation only)
  ABDM_CONSENT_REGISTRY["CONSENT-RESTRICTED-04"] = {
    consentId: "CONSENT-RESTRICTED-04",
    abhaId: "91-7210-4491-8023",
    patientName: "Sunita Verma",
    status: "GRANTED",
    hiTypes: ["Patient", "Observation"],
    permission: {
      dateRange: {
        to: new Date(Date.now() + 86400000 * 30).toISOString()
      }
    }
  };

  AbdmSandboxService.linkClinicalRecords("91-8274-1923-0194", {
    encounters: [{ id: "enc-1", type: "OPD Consultation", reason: "Routine evaluation", date: "2026-09-15" }],
    observations: [{ code: "8867-4", display: "Heart rate", value: "72", unit: "beats/min" }],
    diagnosticReports: [{ id: "rep-1", code: "CBC", display: "Complete Blood Count", conclusion: "Normal" }]
  });

  AbdmSandboxService.linkClinicalRecords("91-7210-4491-8023", {
    encounters: [{ id: "enc-2", type: "Emergency", reason: "Fever", date: "2026-09-20" }],
    observations: [{ code: "8310-5", display: "Body Temperature", value: "98.6", unit: "degF" }],
    diagnosticReports: [{ id: "rep-2", code: "Lipid", display: "Lipid Profile", conclusion: "Optimal" }]
  });

  // RULE 1: Validate ABHA ID format before any request. If invalid, return: {"error":"Invalid ABHA ID"}
  console.log("Testing Rule 1: ABHA ID format validation & exact error return...");
  const invalidIdRes = await AbdmSandboxService.fetchPatient({
    abhaId: "invalid-id-xyz",
    consentArtifactId: "CONSENT-RAVI-01"
  });
  assert(JSON.stringify(invalidIdRes) === JSON.stringify({ error: "Invalid ABHA ID" }), 'Invalid ABHA returns exact: {"error":"Invalid ABHA ID"}');

  const invalidRecordsRes = await AbdmSandboxService.fetchPatientRecords({
    abhaId: "999-bad-format",
    consentArtifactId: "CONSENT-RAVI-01"
  });
  assert(JSON.stringify(invalidRecordsRes) === JSON.stringify({ error: "Invalid ABHA ID" }), 'Invalid format in records returns exact: {"error":"Invalid ABHA ID"}');

  // RULE 2 & 6: Missing or expired consent -> return: {"error":"Consent required"}
  console.log("\nTesting Rule 2 & 6: Consent Manager checks (missing/expired/revoked)...");
  const missingConsentRes = await AbdmSandboxService.fetchPatient({
    abhaId: "91-8274-1923-0194",
    consentArtifactId: null
  });
  assert(JSON.stringify(missingConsentRes) === JSON.stringify({ error: "Consent required" }), 'Missing consent returns exact: {"error":"Consent required"}');

  const expiredConsentRes = await AbdmSandboxService.fetchPatient({
    abhaId: "91-8274-1923-0194",
    consentArtifactId: "CONSENT-EXPIRED-03"
  });
  assert(JSON.stringify(expiredConsentRes) === JSON.stringify({ error: "Consent required" }), 'Expired consent returns exact: {"error":"Consent required"}');

  const revokedConsentRes = await AbdmSandboxService.fetchPatientRecords({
    abhaId: "91-4820-9182-3741",
    consentArtifactId: "CONSENT-REVOKED-02"
  });
  assert(JSON.stringify(revokedConsentRes) === JSON.stringify({ error: "Consent required" }), 'Revoked consent returns exact: {"error":"Consent required"}');

  const unknownConsentRes = await AbdmSandboxService.fetchPatientRecords({
    abhaId: "91-8274-1923-0194",
    consentArtifactId: "CONSENT-NON-EXISTENT"
  });
  assert(JSON.stringify(unknownConsentRes) === JSON.stringify({ error: "Consent required" }), 'Unregistered consent returns exact: {"error":"Consent required"}');

  // RULE 3 & 5: FHIR R4 Patient resource matching specification example
  console.log("\nTesting Rule 3 & 5: FHIR R4 Patient structured JSON output...");
  const patientRes = await AbdmSandboxService.fetchPatient({
    abhaId: "91-8274-1923-0194",
    consentArtifactId: "CONSENT-RAVI-01"
  });

  assert(patientRes.resourceType === "Patient", 'resourceType is "Patient"');
  assert(Boolean(patientRes.id), `Patient has id: ${patientRes.id}`);
  assert(Array.isArray(patientRes.identifier), 'identifier is an array');
  assert(patientRes.identifier.some(i => i.system === "https://abdm.gov.in/abha-id" && i.value === "91-8274-1923-0194"), 'identifier contains system "https://abdm.gov.in/abha-id" with ABHA value');
  assert(Array.isArray(patientRes.name) && patientRes.name[0].text === "Ravi Kumar", `name is [{"text":"Ravi Kumar"}]`);
  assert(patientRes.gender === "male", 'gender is "male"');
  assert(patientRes.birthDate === "1985-06-15", 'birthDate is "1985-06-15"');

  // RULE 3 & 5: Multi-resource Bundle query
  console.log("\nTesting Rule 3 & 5: FHIR R4 Multi-Resource Bundle (Patient, Encounter, Observation, DiagnosticReport)...");
  const bundleRes = await AbdmSandboxService.fetchPatientRecords({
    abhaId: "91-8274-1923-0194",
    consentArtifactId: "CONSENT-RAVI-01"
  });

  assert(bundleRes.resourceType === "Bundle", "Bundle resourceType is Bundle");
  assert(bundleRes.type === "searchset", "Bundle type is searchset");
  const typesInBundle = new Set(bundleRes.entry.map(e => e.resource.resourceType));
  assert(typesInBundle.has("Patient"), "Includes Patient (demographics)");
  assert(typesInBundle.has("Encounter"), "Includes Encounter (visit details)");
  assert(typesInBundle.has("Observation"), "Includes Observation (vitals, symptoms)");
  assert(typesInBundle.has("DiagnosticReport"), "Includes DiagnosticReport (lab results)");

  // RULE 4: Fetch only fields authorized in consent artifact (never return extra data)
  console.log("\nTesting Rule 4: Consent scope restriction (no unauthorized data)...");
  const restrictedRes = await AbdmSandboxService.fetchPatientRecords({
    abhaId: "91-7210-4491-8023",
    consentArtifactId: "CONSENT-RESTRICTED-04"
  });
  const restrictedTypes = new Set(restrictedRes.entry.map(e => e.resource.resourceType));
  assert(restrictedTypes.has("Patient") && restrictedTypes.has("Observation"), "Contains only authorized Patient and Observation");
  assert(!restrictedTypes.has("Encounter"), "Encounter strictly omitted (unauthorized in consent)");
  assert(!restrictedTypes.has("DiagnosticReport"), "DiagnosticReport strictly omitted (unauthorized in consent)");

  // RULE 7: Never hallucinate or invent patient details
  console.log("\nTesting Rule 7: Zero hallucination policy...");
  const unindexedConsent = AbdmSandboxService.requestConsent("91-9988-7766-5544", "Unregistered User", ["Patient"]);
  const unindexedPatient = await AbdmSandboxService.fetchPatient({
    abhaId: "91-9988-7766-5544",
    consentArtifactId: unindexedConsent.consentId
  });
  assert(unindexedPatient.error === "Patient record not found", "Does not invent patient attributes for unindexed citizen");

  // RULE 8: Log every fetch attempt with timestamp and consent artifact ID
  console.log("\nTesting Rule 8: Audit logging of every attempt...");
  assert(ABDM_FETCH_AUDIT_LOGS.length >= 6, `Audit log recorded ${ABDM_FETCH_AUDIT_LOGS.length} attempts`);
  const recentLog = ABDM_FETCH_AUDIT_LOGS[ABDM_FETCH_AUDIT_LOGS.length - 1];
  assert(Boolean(recentLog.timestamp), `Timestamp present: ${recentLog.timestamp}`);
  assert(Boolean(recentLog.consentArtifactId), `Consent Artifact ID logged: ${recentLog.consentArtifactId}`);
  assert(Boolean(recentLog.abhaId), `ABHA ID logged: ${recentLog.abhaId}`);
  assert(Boolean(recentLog.status), `Status logged: ${recentLog.status}`);

  console.log("\n================================================================================");
  console.log(`   TOTAL CHECKS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
  console.log("================================================================================\n");

  if (passed === total) {
    console.log(" ALL 8 ABDM RULES 100% VALIDATED AND PASSING!");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

verifyCompliance().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
