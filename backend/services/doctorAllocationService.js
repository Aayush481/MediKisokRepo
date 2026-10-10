/**
 * MediKiosk Deterministic Doctor Allocation & Triage Routing Service
 * Allocates optimal hospital doctor based on clinical specialty match,
 * current queue backlog, doctor availability, and triage urgency priority.
 */

// Hospital Doctor Registry (Simulated live OPD hospital staffing)
export const HOSPITAL_DOCTORS = [
  { id: "doc_cardio_1", name: "Dr. Rajesh Sharma", specialty: "Cardiology", cabin: "Cabin 101", floor: "1st Floor", activeQueueCount: 3, avgConsultMins: 10 },
  { id: "doc_cardio_2", name: "Dr. Ananya Roy", specialty: "Cardiology", cabin: "Cabin 102", floor: "1st Floor", activeQueueCount: 1, avgConsultMins: 12 },
  { id: "doc_ortho_1", name: "Dr. Vikram Sethi", specialty: "Orthopedics", cabin: "Cabin 201", floor: "2nd Floor", activeQueueCount: 2, avgConsultMins: 8 },
  { id: "doc_ortho_2", name: "Dr. Meera Nambiar", specialty: "Orthopedics", cabin: "Cabin 202", floor: "2nd Floor", activeQueueCount: 4, avgConsultMins: 9 },
  { id: "doc_gastro_1", name: "Dr. Arvind Kulkarni", specialty: "Gastroenterology", cabin: "Cabin 108", floor: "1st Floor", activeQueueCount: 2, avgConsultMins: 10 },
  { id: "doc_pulmo_1", name: "Dr. Sunita Deshmukh", specialty: "Pulmonology", cabin: "Cabin 105", floor: "1st Floor", activeQueueCount: 1, avgConsultMins: 11 },
  { id: "doc_uro_1", name: "Dr. Farhan Qureshi", specialty: "Urology", cabin: "Cabin 205", floor: "2nd Floor", activeQueueCount: 2, avgConsultMins: 9 },
  { id: "doc_neuro_1", name: "Dr. Preeti Sengupta", specialty: "Neurology", cabin: "Cabin 301", floor: "3rd Floor", activeQueueCount: 3, avgConsultMins: 15 },
  { id: "doc_endo_1", name: "Dr. Kavita Joshi", specialty: "Endocrinology", cabin: "Cabin 110", floor: "1st Floor", activeQueueCount: 1, avgConsultMins: 8 },
  { id: "doc_gyn_1", name: "Dr. Ritu Agarwal", specialty: "Gynecology", cabin: "Cabin 210", floor: "2nd Floor", activeQueueCount: 2, avgConsultMins: 10 },
  { id: "doc_gen_1", name: "Dr. Amit Verma", specialty: "General Medicine", cabin: "Cabin 001", floor: "Ground Floor", activeQueueCount: 2, avgConsultMins: 7 },
  { id: "doc_gen_2", name: "Dr. Neha Kapoor", specialty: "General Medicine", cabin: "Cabin 002", floor: "Ground Floor", activeQueueCount: 1, avgConsultMins: 7 },
  { id: "doc_emg_1", name: "Dr. Emergency On-Duty", specialty: "Emergency Medicine", cabin: "Resuscitation Bay 1", floor: "Ground Floor - ER", activeQueueCount: 0, avgConsultMins: 0 }
];

export class DoctorAllocationService {
  /**
   * Deterministically allocates treating physician based on intake triage & queue score.
   *
   * @param {object} params
   * @param {Array<string>} params.suggestedSpecialties - Specialties ordered by clinical priority
   * @param {string} params.urgencyTier - Urgency code (e.g. EMERGENCY_PRIORITY_1)
   * @param {string} params.patientId - Patient identifier or token string
   * @returns {object} Allocation record with doctor details, cabin, ETA, and priority
   */
  static allocateDoctor(params = {}) {
    const {
      suggestedSpecialties = ["General Medicine"],
      urgencyTier = "ROUTINE_PRIORITY_3",
      patientId = "P-" + Math.floor(1000 + Math.random() * 9000)
    } = params;

    const isEmergency = urgencyTier === "EMERGENCY_PRIORITY_1";

    // If emergency, direct to ER Bay immediately
    if (isEmergency) {
      const erDoc = HOSPITAL_DOCTORS.find(d => d.specialty === "Emergency Medicine") || HOSPITAL_DOCTORS[HOSPITAL_DOCTORS.length - 1];
      return {
        allocatedDoctor: erDoc,
        specialtyMatched: "Emergency Medicine",
        queuePosition: 0,
        estimatedWaitMinutes: 0,
        tokenNumber: "EMG-" + Math.floor(100 + Math.random() * 900),
        status: "IMMEDIATE_TRIAGE_ACTIVE",
        allocatedAt: new Date().toISOString(),
        instructions: "Patient triaged as PRIORITY 1. Proceed immediately to Emergency Bay 1."
      };
    }

    // Match candidate doctors by requested specialties
    let candidateDoctors = [];
    let matchedSpecialty = "General Medicine";

    for (const spec of suggestedSpecialties) {
      const docs = HOSPITAL_DOCTORS.filter(d => 
        d.specialty.toLowerCase().includes(spec.toLowerCase()) || 
        spec.toLowerCase().includes(d.specialty.toLowerCase())
      );
      if (docs.length > 0) {
        candidateDoctors = docs;
        matchedSpecialty = spec;
        break;
      }
    }

    // Fall back to General Medicine if specialty not available
    if (candidateDoctors.length === 0) {
      candidateDoctors = HOSPITAL_DOCTORS.filter(d => d.specialty === "General Medicine");
      matchedSpecialty = "General Medicine";
    }

    // Score candidates based on shortest wait time (activeQueueCount * avgConsultMins)
    candidateDoctors.sort((a, b) => {
      const waitA = a.activeQueueCount * a.avgConsultMins;
      const waitB = b.activeQueueCount * b.avgConsultMins;
      return waitA - waitB;
    });

    const chosenDoc = candidateDoctors[0];
    const queuePosition = chosenDoc.activeQueueCount + 1;
    const estimatedWaitMinutes = chosenDoc.activeQueueCount * chosenDoc.avgConsultMins;

    // Increment simulated queue atomically
    chosenDoc.activeQueueCount += 1;

    // Generate token prefix
    const prefix = chosenDoc.specialty.substring(0, 3).toUpperCase();
    const tokenNumber = `${prefix}-${10 + queuePosition}`;

    return {
      allocatedDoctor: {
        id: chosenDoc.id,
        name: chosenDoc.name,
        specialty: chosenDoc.specialty,
        cabin: chosenDoc.cabin,
        floor: chosenDoc.floor
      },
      specialtyMatched: matchedSpecialty,
      queuePosition,
      estimatedWaitMinutes,
      tokenNumber,
      status: "QUEUED_ROUTINE",
      allocatedAt: new Date().toISOString(),
      instructions: `Please proceed to ${chosenDoc.cabin} (${chosenDoc.floor}). Estimated wait: ${estimatedWaitMinutes} minutes.`
    };
  }
}
