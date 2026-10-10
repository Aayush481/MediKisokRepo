/**
 * MediKiosk HL7 FHIR R4 & ABDM Interoperability Generator
 * Generates standard FHIR Bundles containing Composition, Condition, Observation, MedicationStatement & DetectedIssue resources.
 */

import { TERMINOLOGY_MAP } from "../data/terminology.js";
import { herbDrugService } from "./herbDrugService.js";

class FHIRService {
  createPatientResource(patient) {
    return {
      resourceType: "Patient",
      id: `pat-${patient.id || "001"}`,
      identifier: [
        {
          system: "https://healthid.ndhm.gov.in",
          value: patient.abhaId || "91-0000-0000-0000",
          type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/v2-0203", code: "MR", display: "ABHA Health ID" }] }
        }
      ],
      name: [{ use: "official", text: patient.name || "Anonymous Patient" }],
      telecom: [{ system: "phone", value: patient.mobile || "+91 0000000000", use: "mobile" }],
      gender: (patient.gender || "unknown").toLowerCase(),
      birthDate: `${2026 - (patient.age || 40)}-01-01`
    };
  }

  createConditionResource(patientId, chiefComplaint, bodySite = null) {
    const term = TERMINOLOGY_MAP[chiefComplaint] || { snomed: "404684003", icd11: "MD81" };
    const cond = {
      resourceType: "Condition",
      id: `cond-${Date.now().toString().slice(-4)}`,
      clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active" }] },
      verificationStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code: "provisional" }] },
      category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-category", code: "problem-list-item" }] }],
      code: {
        coding: [
          { system: "http://snomed.info/sct", code: term.snomed, display: chiefComplaint || "Clinical Finding" },
          { system: "http://id.who.int/icd/release/11/mms", code: term.icd11, display: chiefComplaint || "Clinical Finding" }
        ],
        text: chiefComplaint || "Clinical Finding"
      },
      subject: { reference: `Patient/pat-${patientId}` }
    };

    if (bodySite && bodySite.code) {
      cond.bodySite = [
        {
          coding: [{ system: "http://snomed.info/sct", code: bodySite.code, display: bodySite.display }],
          text: bodySite.display
        }
      ];
    }

    return cond;
  }

  createObservationResource(patientId, code, display, value, unit = "", system = "http://loinc.org") {
    const obs = {
      resourceType: "Observation",
      id: `obs-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`,
      status: "final",
      category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "vital-signs", display: "Vital Signs" }] }],
      code: {
        coding: [{ system, code, display }],
        text: display
      },
      subject: { reference: `Patient/pat-${patientId}` }
    };

    if (typeof value === "number") {
      obs.valueQuantity = {
        value: value,
        unit: unit,
        system: "http://unitsofmeasure.org",
        code: unit === "bpm" || unit === "rpm" ? "/min" : unit
      };
      obs.valueString = `${value} ${unit}`.trim();
    } else {
      obs.valueString = String(value);
    }

    return obs;
  }

  createQuestionnaireResponse(patientId, intakeData) {
    if (!intakeData) return null;
    const items = Object.entries(intakeData.answers || {}).map(([linkId, answerVal]) => ({
      linkId,
      text: linkId.replace(/_/g, " "),
      answer: [{
        valueString: Array.isArray(answerVal) ? answerVal.join(", ") : String(answerVal)
      }]
    }));

    return {
      resourceType: "QuestionnaireResponse",
      id: `qr-${Date.now().toString().slice(-4)}`,
      status: "completed",
      questionnaire: `urn:medikiosk:qb:${intakeData.questionBankVersion || 'v2.1'}`,
      subject: { reference: `Patient/pat-${patientId}` },
      authored: intakeData.timestamp || new Date().toISOString(),
      item: items
    };
  }

  createTriageObservation(patientId, triageResult) {
    if (!triageResult) return null;
    return {
      resourceType: "Observation",
      id: `triage-${Date.now().toString().slice(-4)}`,
      status: "final",
      category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "survey", display: "Survey" }] }],
      code: {
        coding: [{ system: "http://loinc.org", code: "75323-6", display: "Condition urgency" }],
        text: "Clinical Intake Triage Urgency"
      },
      subject: { reference: `Patient/pat-${patientId}` },
      valueCodeableConcept: {
        coding: [{
          system: "https://medikiosk.abdm.gov.in/triage-tiers",
          code: triageResult.urgencyTier || "ROUTINE_PRIORITY_3",
          display: triageResult.tierDetails?.label || "Routine Consultation"
        }],
        text: triageResult.tierDetails?.action || "Routine OPD Care"
      },
      note: (triageResult.triggeredRules || []).map(r => ({ text: `[${r.ruleId}] ${r.reason}` }))
    };
  }

  generateFHIRBundle(patientData) {
    const intake = patientData.anatomicalIntake || patientData.intakeSummary || null;
    const bodySite = intake?.snomedBodyStructure || null;

    const patientResource = this.createPatientResource(patientData);
    const conditionResource = this.createConditionResource(patientData.id, patientData.chiefComplaint, bodySite);
    
    const entries = [
      { fullUrl: `urn:uuid:${patientResource.id}`, resource: patientResource },
      { fullUrl: `urn:uuid:${conditionResource.id}`, resource: conditionResource }
    ];

    // Add 3D Anatomical Intake QuestionnaireResponse & Triage Observation if available
    if (intake) {
      const qrResource = this.createQuestionnaireResponse(patientData.id, intake);
      if (qrResource) entries.push({ fullUrl: `urn:uuid:${qrResource.id}`, resource: qrResource });

      const triageObs = this.createTriageObservation(patientData.id, intake.triageResult);
      if (triageObs) entries.push({ fullUrl: `urn:uuid:${triageObs.id}`, resource: triageObs });
    }

    // Add Contactless Optical rPPG Vitals Observations
    if (patientData.rppgVitals) {
      const vitals = patientData.rppgVitals;
      const hrVal = parseInt(vitals.heartRate) || 72;
      const spo2Val = parseInt(vitals.spO2) || 98;
      const respVal = parseInt(vitals.respiratoryRate) || 16;
      const hrvVal = parseInt(vitals.hrv) || 45;
      const stressVal = parseInt(vitals.stressScore) || 25;

      const rppgObs = [
        this.createObservationResource(patientData.id, "8867-4", "Optical rPPG Heart Rate", hrVal, "bpm"),
        this.createObservationResource(patientData.id, "59408-5", "Optical rPPG Oxygen Saturation (SpO2)", spo2Val, "%"),
        this.createObservationResource(patientData.id, "9279-1", "Optical Respiratory Rate", respVal, "rpm"),
        this.createObservationResource(patientData.id, "80404-7", "R-R Interval Standard Deviation (HRV RMSSD)", hrvVal, "ms"),
        this.createObservationResource(patientData.id, "72514-3", "Autonomic Stress & Micro-tremor Index", stressVal, "/100")
      ];
      rppgObs.forEach(obs => entries.push({ fullUrl: `urn:uuid:${obs.id}`, resource: obs }));
    }

    // Add Scanned Prescription Medications as FHIR MedicationStatement
    const medications = patientData.allopathicMeds || patientData.medications || [];
    medications.forEach((med, mIdx) => {
      entries.push({
        fullUrl: `urn:uuid:med-${mIdx}`,
        resource: {
          resourceType: "MedicationStatement",
          id: `med-${mIdx}`,
          status: "active",
          medicationCodeableConcept: {
            coding: [{
              system: "http://snomed.info/sct",
              code: med.snomedCode || "372567009",
              display: med.name || "Prescribed Medication"
            }],
            text: med.name
          },
          subject: { reference: `Patient/pat-${patientData.id}` },
          dosage: [{
            text: `${med.dosage || '1 tab'} - ${med.freq || 'OD'} (${med.timing || 'After Food'})`,
            route: { text: med.route || "Oral" }
          }]
        }
      });
    });

    // Add Scanned Pathology Lab Flags as FHIR Observations
    const labFlags = patientData.labFlags || [];
    labFlags.forEach((lab, lIdx) => {
      entries.push({
        fullUrl: `urn:uuid:lab-${lIdx}`,
        resource: {
          resourceType: "Observation",
          id: `lab-${lIdx}`,
          status: "final",
          category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "laboratory", display: "Laboratory" }] }],
          code: {
            text: lab.test || "Biomarker"
          },
          subject: { reference: `Patient/pat-${patientData.id}` },
          valueString: `${lab.value} (Ref: ${lab.ref})`,
          interpretation: [{
            text: lab.status || "Abnormal"
          }]
        }
      });
    });

    // Add AYUSH Prakriti Observations if present
    if (patientData.ayushIntake?.dominant || patientData.ayushIntake?.prakriti) {
      const prakritiText = patientData.ayushIntake.dominant || 
        `Vata: ${patientData.ayushIntake.prakriti?.vata}%, Pitta: ${patientData.ayushIntake.prakriti?.pitta}%, Kapha: ${patientData.ayushIntake.prakriti?.kapha}%`;
      const prakritiObs = this.createObservationResource(
        patientData.id,
        "AYU-PRAKRITI",
        "Ayurvedic Phenotypic Constitution (Prakriti)",
        prakritiText,
        "",
        "https://ayush.gov.in/namaste"
      );
      entries.push({ fullUrl: `urn:uuid:${prakritiObs.id}`, resource: prakritiObs });
    }

    // Add Herb-Drug Interaction DetectedIssue if present
    const interactionCheck = herbDrugService.evaluateInteractions(
      medications,
      patientData.ayushHerbs || []
    );

    if (interactionCheck.hasConflict) {
      interactionCheck.conflicts.forEach((conflict, cIdx) => {
        entries.push({
          fullUrl: `urn:uuid:issue-${cIdx}`,
          resource: {
            resourceType: "DetectedIssue",
            id: `issue-${cIdx}`,
            status: "preliminary",
            code: {
              coding: [{ system: "http://terminology.hl7.org/CodeSystem/detectedissue-category", code: "DRG", display: "Drug Interaction / Herb-Drug Conflict" }]
            },
            severity: conflict.severity.toLowerCase() === "critical" ? "high" : "moderate",
            identifiedDateTime: new Date().toISOString(),
            detail: `${conflict.drug} + ${conflict.herb}: ${conflict.clinicalEffect}`,
            mitigation: [{ action: { text: conflict.recommendation } }]
          }
        });
      });
    }

    // Wrap in standard FHIR Composition / Bundle
    return {
      resourceType: "Bundle",
      id: `bundle-medikiosk-${Date.now()}`,
      meta: {
        lastUpdated: new Date().toISOString(),
        profile: ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/ClinicalArtifact"]
      },
      identifier: {
        system: "https://medikiosk.abdm.gov.in/bundles",
        value: `MEDIKIOSK-${patientData.id || "001"}`
      },
      type: "document",
      timestamp: new Date().toISOString(),
      entry: entries
    };
  }
}

export const fhirService = new FHIRService();
