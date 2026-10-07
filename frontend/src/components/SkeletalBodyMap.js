/**
 * MediKiosk Bio-Digital 3D Skeletal Diagnostic Map & Patient Case-Taking Engine
 * Multi-Region Simultaneous Selection with Simplified, Natural Human Language
 */

export const SKELETAL_REGIONS = {
  skull: {
    id: "skull",
    name: "Head & Face",
    hindiName: "सिर और चेहरा",
    latinName: "Cranium & Face",
    snomed: "89546000",
    icd10: "R51 / G44",
    clinicalName: "Head & Craniofacial Area",
    icon: "💀",
    hotspot: { x: 160, y: 50 },
    mcq: {
      character: {
        title: "1. How does your head feel?",
        hindiTitle: "सिर में कैसा दर्द महसूस हो रहा है?",
        options: [
          "Throbbing or pulsing pain on one side of my head",
          "Tight pressure, like a tight band squeezing my forehead",
          "Sharp shooting pain or electric shock in my face",
          "Heavy dull ache with blocked nose or sinus pressure",
          "Sudden, extremely severe headache that hit like a thunderbolt ⚠️"
        ]
      },
      triggers: {
        title: "2. What makes the pain worse?",
        hindiTitle: "किस चीज़ से दर्द बढ़ जाता है?",
        options: [
          "Bright sunlight, loud sounds, or looking at phone/TV screens",
          "Bending down, coughing, or moving my head",
          "Chewing food, talking, or touching my face/jaw",
          "Mental stress, lack of sleep, or skipping meals",
          "Sitting with my neck bent looking down"
        ]
      },
      onset: {
        title: "3. How long have you had this?",
        hindiTitle: "यह समस्या कब से हो रही है?",
        options: [
          "Just started today (less than 24 hours ago)",
          "For the past 2 to 3 days",
          "Comes and goes for weeks or months",
          "Started after a fall or bump to the head"
        ]
      },
      redFlags: {
        title: "4. Any other problems along with this? (Select all that apply)",
        hindiTitle: "क्या इनमें से कोई अन्य परेशानी भी है?",
        options: [
          "Blurry vision or seeing flashes of light",
          "Feeling nauseous or vomiting",
          "Stiff neck along with high fever ⚠️",
          "Trouble speaking, face drooping, or arm feeling weak ⚠️",
          "Feeling dizzy, lightheaded, or confused"
        ]
      }
    }
  },

  cervical_spine: {
    id: "cervical_spine",
    name: "Neck & Upper Spine",
    hindiName: "गर्दन और ऊपरी रीढ़",
    latinName: "Cervical Spine",
    snomed: "122494005",
    icd10: "M54.2 / M50",
    clinicalName: "Neck & Cervical Spine",
    icon: "🦒",
    hotspot: { x: 160, y: 100 },
    mcq: {
      character: {
        title: "1. How does your neck feel?",
        hindiTitle: "गर्दन में कैसी तकलीफ है?",
        options: [
          "Stiff neck and sore muscles, difficult to turn my head",
          "Sharp electric pain shooting down my arm into my fingers",
          "Crunching or grinding sound when turning my head",
          "Burning ache traveling up into the back of my head"
        ]
      },
      triggers: {
        title: "2. What makes it worse?",
        hindiTitle: "किस चीज़ से दर्द बढ़ता है?",
        options: [
          "Working at a desk, laptop, or looking down at phone",
          "Looking up at the ceiling or turning neck to one side",
          "Sudden jerk while riding a bike or car",
          "Woke up after sleeping on a high or uncomfortable pillow"
        ]
      },
      onset: {
        title: "3. How long has this been happening?",
        hindiTitle: "यह दर्द कब से है?",
        options: [
          "Woke up suddenly with severe neck catch this morning",
          "Slowly building up over several days or weeks",
          "Started after a recent jerk, bump, or sports impact",
          "Long-term ache from daily work posture"
        ]
      },
      redFlags: {
        title: "4. Any other warning signs?",
        hindiTitle: "कोई अन्य संकेत?",
        options: [
          "Tingling, numbness, or pins-and-needles in hands/fingers",
          "Hands feel weak or frequently dropping cups/objects",
          "Feeling dizzy or room spinning when turning head",
          "Electric tingling shooting down body when bending neck"
        ]
      }
    }
  },

  shoulder: {
    id: "shoulder",
    name: "Shoulder & Collarbone",
    hindiName: "कंधा और हंसली",
    latinName: "Shoulder & Clavicle",
    snomed: "16953009",
    icd10: "M75.0 / M75.1",
    clinicalName: "Shoulder Joint & Clavicle",
    icon: "🦴",
    hotspot: { x: 114, y: 126 },
    mcq: {
      character: {
        title: "1. How does your shoulder feel?",
        hindiTitle: "कंधे में कैसी तकलीफ महसूस होती है?",
        options: [
          "Pain when lifting my arm up or reaching above my head",
          "Deep ache at night, hurts to sleep on that side",
          "Shoulder feels frozen and stiff, cannot reach behind my back",
          "Sudden sharp pull and cannot lift my arm after a jerk",
          "Chest heaviness spreading into my left shoulder ⚠️"
        ]
      },
      triggers: {
        title: "2. What makes the shoulder hurt?",
        hindiTitle: "किस काम से कंधे में दर्द होता है?",
        options: [
          "Reaching overhead, lifting heavy bags, or hanging clothes",
          "Reaching behind my back (tying clothes, back pocket)",
          "Sleeping on the painful shoulder in bed",
          "Sudden jerk or slipping onto an outstretched hand"
        ]
      },
      onset: {
        title: "3. When did this begin?",
        hindiTitle: "यह कब शुरू हुआ?",
        options: [
          "Suddenly after a pull, jerk, or fall (< 2 days)",
          "Slowly getting stiffer and tighter over months",
          "Gradual ache from daily physical labor"
        ]
      },
      redFlags: {
        title: "4. Any warning signs?",
        hindiTitle: "क्या इनमें से कोई लक्षण है?",
        options: [
          "Chest pressure, breathlessness, or cold sweats ⚠️",
          "Shoulder looks visibly out of place or uneven",
          "Cannot move or lift arm at all due to severe weakness",
          "Loud popping sound with arm giving way"
        ]
      }
    }
  },

  thorax: {
    id: "thorax",
    name: "Chest & Ribs",
    hindiName: "छाती और पसलियां",
    latinName: "Chest & Ribcage",
    snomed: "51185008",
    icd10: "R07.2 / M94.0",
    clinicalName: "Chest & Ribcage",
    icon: "🫁",
    hotspot: { x: 160, y: 150 },
    mcq: {
      character: {
        title: "1. How does your chest feel?",
        hindiTitle: "छाती में कैसा अहसास हो रहा है?",
        options: [
          "Heavy squeezing, crushing weight, or tight pressure ⚠️",
          "Sharp stabbing pain when taking a deep breath or coughing",
          "Burning heartburn feeling or acidity after eating",
          "Tender and sore only when I press on my ribs with fingers",
          "Sharp localized pain at a specific rib after a hit"
        ]
      },
      triggers: {
        title: "2. What makes it worse?",
        hindiTitle: "किससे तकलीफ बढ़ती है?",
        options: [
          "Walking fast, climbing stairs, or physical exertion ⚠️",
          "Taking a deep breath, coughing, or sneezing",
          "Pressing directly on the chest bone with fingers",
          "Twisting my body or lifting things",
          "Lying flat in bed or eating spicy foods"
        ]
      },
      onset: {
        title: "3. When did this chest discomfort start?",
        hindiTitle: "यह तकलीफ कब शुरू हुई?",
        options: [
          "Started suddenly today ⚠️",
          "Started after a heavy cold, cough, or flu",
          "Started after a fall, seatbelt jerk, or direct hit"
        ]
      },
      redFlags: {
        title: "4. Any critical warning signs?",
        hindiTitle: "गंभीर चेतावनी संकेत",
        options: [
          "Shortness of breath / feeling suffocated ⚠️",
          "Cold sweating, dizziness, or feeling faint ⚠️",
          "Pain spreading to jaw, neck, back, or left arm ⚠️",
          "Coughing up blood or pink phlegm ⚠️"
        ]
      }
    }
  },

  upper_limb: {
    id: "upper_limb",
    name: "Arm & Elbow",
    hindiName: "बांह और कोहनी",
    latinName: "Arm & Elbow",
    snomed: "36856001",
    icd10: "M77.1 / M77.0",
    clinicalName: "Arm & Elbow Joint",
    icon: "💪",
    hotspot: { x: 92, y: 198 },
    mcq: {
      character: {
        title: "1. How does your arm or elbow feel?",
        hindiTitle: "बांह या कोहनी में कैसा दर्द है?",
        options: [
          "Pain on the outside of my elbow when gripping or holding things",
          "Pain on the inside of my elbow when bending my wrist",
          "Soft watery swelling or bump at the tip of my elbow",
          "Severe pain and swelling after a hard hit or fall"
        ]
      },
      triggers: {
        title: "2. What makes it hurt?",
        hindiTitle: "किस काम से दर्द बढ़ता है?",
        options: [
          "Opening tight jars, wringing clothes, or turning doorknobs",
          "Typing, using a mouse, or repetitive hand tools",
          "Resting elbow on hard table surfaces",
          "Lifting heavy grocery bags with straight arms"
        ]
      },
      onset: {
        title: "3. How long has this been bothering you?",
        hindiTitle: "यह समस्या कब से है?",
        options: [
          "Gradual ache getting worse over weeks of daily work",
          "Sudden direct blow or fall on my elbow",
          "Painless soft swelling that appeared slowly"
        ]
      },
      redFlags: {
        title: "4. Any warning signs?",
        hindiTitle: "अन्य लक्षण",
        options: [
          "Cannot bend or straighten elbow joint fully",
          "Ring finger and little finger feel numb or tingling",
          "Skin over elbow is hot, red, and swollen with fever",
          "Elbow looks visibly crooked or bent"
        ]
      }
    }
  },

  hand_wrist: {
    id: "hand_wrist",
    name: "Wrist & Hand",
    hindiName: "कलाई और हाथ की उंगलियां",
    latinName: "Wrist & Hand",
    snomed: "85562004",
    icd10: "G56.0 / M18",
    clinicalName: "Wrist, Hand & Fingers",
    icon: "🖐️",
    hotspot: { x: 74, y: 280 },
    mcq: {
      character: {
        title: "1. How does your hand or wrist feel?",
        hindiTitle: "हाथ या कलाई में क्या महसूस हो रहा है?",
        options: [
          "Tingling, numbness, or pins-and-needles waking me up at night",
          "Sharp ache at the base of my thumb when pinching or holding keys",
          "Finger catches, clicks, or gets stuck when trying to open hand",
          "Sharp wrist pain when making a fist with thumb inside",
          "Stiff, swollen finger joints in the morning for over 30 minutes"
        ]
      },
      triggers: {
        title: "2. What makes it worse?",
        hindiTitle: "किससे दर्द बढ़ता है?",
        options: [
          "Holding mobile phone, texting, or continuous computer typing",
          "Opening tight bottle caps, twisting lids, or wringing towels",
          "Fell down onto an outstretched hand",
          "Cold weather makes fingers stiff"
        ]
      },
      onset: {
        title: "3. When did it start?",
        hindiTitle: "यह कब शुरू हुआ?",
        options: [
          "Night tingling getting slowly worse over months",
          "Started immediately after a slip and fall",
          "Finger joints slowly getting bumpy and enlarged over time"
        ]
      },
      redFlags: {
        title: "4. Any warning signs?",
        hindiTitle: "चेतावनी संकेत",
        options: [
          "Thumb muscle looks flat or weak",
          "Frequently dropping glasses, cups, or keys",
          "Fingers turn white, blue, and painful in cold water",
          "Multiple knuckle joints are warm and puffy"
        ]
      }
    }
  },

  thoracolumbar_spine: {
    id: "thoracolumbar_spine",
    name: "Lower Back & Spine",
    hindiName: "कमर और रीढ़ की हड्डी",
    latinName: "Lower Back & Spine",
    snomed: "276887009",
    icd10: "M54.5 / M51.2",
    clinicalName: "Lower Back & Lumbosacral Spine",
    icon: "🧬",
    hotspot: { x: 160, y: 220 },
    mcq: {
      character: {
        title: "1. How does your lower back feel?",
        hindiTitle: "कमर में कैसा दर्द महसूस होता है?",
        options: [
          "Heavy dull ache and muscle stiffness across my lower back",
          "Sharp electric pain shooting down my hip into my leg or foot (Sciatica)",
          "Legs feel heavy and tired after walking, better when sitting down",
          "Stiff back in the morning that eases after moving around",
          "Sudden sharp bone pain after a minor bump or fall"
        ]
      },
      triggers: {
        title: "2. What makes your back hurt more?",
        hindiTitle: "किससे कमर दर्द बढ़ता है?",
        options: [
          "Bending forward, lifting heavy buckets/bags, or twisting",
          "Sitting in a chair, sofa, or driving for a long time",
          "Standing on feet or walking for too long",
          "Coughing, sneezing, or straining in the bathroom"
        ]
      },
      onset: {
        title: "3. How long have you had this back pain?",
        hindiTitle: "यह दर्द कब से है?",
        options: [
          "Sudden severe catch while bending or lifting today",
          "Long-term ache getting worse from sitting work",
          "Started after a slip, fall, or bike jerk"
        ]
      },
      redFlags: {
        title: "4. Any urgent warning signs? (Check carefully)",
        hindiTitle: "गंभीर चेतावनी संकेत (ध्यानपूर्वक चुनें)",
        options: [
          "⚠️ Lost control of urine or stool / trouble urinating (Emergency - Doctor needed now)",
          "⚠️ Numbness between the legs, groin, or private area",
          "Foot feels weak / cannot lift toes up while walking (Foot drop)",
          "High fever with painful tender spot on spine",
          "Unexplained weight loss along with back pain"
        ]
      }
    }
  },

  pelvis_hip: {
    id: "pelvis_hip",
    name: "Hips & Pelvis",
    hindiName: "कूल्हा और पेल्विस",
    latinName: "Hip & Pelvis",
    snomed: "287668000",
    icd10: "M16.9 / M53.3",
    clinicalName: "Hip Joint & Pelvis",
    icon: "🩻",
    hotspot: { x: 136, y: 256 },
    mcq: {
      character: {
        title: "1. How does your hip feel?",
        hindiTitle: "कूल्हे में कैसी तकलीफ है?",
        options: [
          "Deep groin ache that travels down front of my thigh to my knee",
          "Pain on the outer side of my hip, hurts to sleep on it in bed",
          "Pain in the lower buttock when sitting on firm chairs",
          "Tailbone hurts when sitting down",
          "Cannot stand or put weight on leg after a fall ⚠️"
        ]
      },
      triggers: {
        title: "2. What makes it hurt?",
        hindiTitle: "किस काम से दर्द बढ़ता है?",
        options: [
          "Putting on socks, shoes, or crossing my legs",
          "Getting up from a low sofa or getting out of a car",
          "Sleeping on that hip side in bed",
          "Climbing stairs or walking long distances"
        ]
      },
      onset: {
        title: "3. When did it start?",
        hindiTitle: "यह कब शुरू हुआ?",
        options: [
          "Fell down and cannot stand on leg at all ⚠️",
          "Slowly limping and getting stiffer over months or years",
          "Started after pregnancy or childbirth"
        ]
      },
      redFlags: {
        title: "4. Any warning signs?",
        hindiTitle: "चेतावनी संकेत",
        options: [
          "Cannot take 4 steps on this leg at all ⚠️",
          "Leg looks shorter or twisted outward",
          "Severe stiffness in morning lasting over 45 minutes",
          "High fever with inability to move the hip"
        ]
      }
    }
  },

  thigh_femur: {
    id: "thigh_femur",
    name: "Thigh",
    hindiName: "जांघ (Thigh)",
    latinName: "Thigh & Femur",
    snomed: "71341001",
    icd10: "M79.65 / S72",
    clinicalName: "Thigh",
    icon: "🍗",
    hotspot: { x: 132, y: 320 },
    mcq: {
      character: {
        title: "1. How does your thigh feel?",
        hindiTitle: "जांघ में कैसा दर्द है?",
        options: [
          "Sudden sharp pull or muscle tear while running or stretching",
          "Deep bone ache inside thigh, hurts especially at night",
          "Burning, numb, or stinging skin on the outer side of thigh",
          "Severe pain, swelling, and cannot move leg after a hard hit"
        ]
      },
      triggers: {
        title: "2. What makes it worse?",
        hindiTitle: "किससे तकलीफ बढ़ती है?",
        options: [
          "Running, kicking, or sudden quick movements",
          "Wearing tight belts, tight pants, or standing long hours",
          "Walking or jogging on hard paved roads"
        ]
      },
      onset: {
        title: "3. When did this start?",
        hindiTitle: "यह कब शुरू हुआ?",
        options: [
          "Sudden pull during sports, running, or heavy work",
          "Slow ache building up over weeks of exercise",
          "After an accident, fall, or vehicle hit"
        ]
      },
      redFlags: {
        title: "4. Any warning signs?",
        hindiTitle: "चेतावनी संकेत",
        options: [
          "Can feel a dent or soft lump in the muscle",
          "Large dark bruise spreading down the thigh",
          "Cannot put any weight on this leg",
          "Focal pinpoint tender spot on the bone"
        ]
      }
    }
  },

  knee: {
    id: "knee",
    name: "Knees & Kneecap",
    hindiName: "घुटने और पटेला",
    latinName: "Knee Joint",
    snomed: "302540003",
    icd10: "M17.9 / M23.2",
    clinicalName: "Knee Joints",
    icon: "🦵",
    hotspot: { x: 136, y: 388 },
    mcq: {
      character: {
        title: "1. How do your knees feel?",
        hindiTitle: "घुटने में कैसा दर्द या तकलीफ है?",
        options: [
          "Grinding / cracking sound and pain when climbing stairs or squatting",
          "Knee clicks, catches, or suddenly gets locked in place",
          "Heard a 'pop' and knee feels loose or gives way when walking",
          "Ache around kneecap after sitting with knees bent",
          "Knee is hot, red, puffy, and very painful even to touch"
        ]
      },
      triggers: {
        title: "2. What makes your knees hurt more?",
        hindiTitle: "किस काम से घुटने में दर्द बढ़ता है?",
        options: [
          "Climbing up or down stairs, or deep floor squatting",
          "Twisting or turning quickly while foot is on ground",
          "Sitting with knees bent for a long movie or car ride",
          "Walking for a long time or cold damp weather"
        ]
      },
      onset: {
        title: "3. How long have you had this knee trouble?",
        hindiTitle: "यह समस्या कब से है?",
        options: [
          "Long-term wear and tear getting worse over months or years",
          "Sudden sports injury with rapid swelling within hours",
          "Woke up overnight with painful swollen knee"
        ]
      },
      redFlags: {
        title: "4. Any warning signs?",
        hindiTitle: "क्या इनमें से कोई लक्षण है?",
        options: [
          "Noticeable fluid or puffy swelling around kneecap",
          "Cannot fully straighten or bend knee",
          "Knee buckles or gives way unexpectedly while walking",
          "Skin is warm to touch, red, along with fever"
        ]
      }
    }
  },

  leg_tibia: {
    id: "leg_tibia",
    name: "Shin & Calf",
    hindiName: "पिंडली और नली की हड्डी (Shin & Calf)",
    latinName: "Lower Leg & Calf",
    snomed: "30021000",
    icd10: "M76.8 / I80.2",
    clinicalName: "Lower Leg & Calf",
    icon: "🏃",
    hotspot: { x: 134, y: 440 },
    mcq: {
      character: {
        title: "1. How does your lower leg feel?",
        hindiTitle: "पिंडली में कैसी तकलीफ है?",
        options: [
          "Ache along the inner front shin bone when walking or running",
          "Sharp pinpoint bone pain when hopping on one foot",
          "Sudden sharp pop in calf like being hit by a ball from behind",
          "One calf is swollen, warm, tight, and throbbing ⚠️",
          "Extreme tight burning pain in calf muscle"
        ]
      },
      triggers: {
        title: "2. What makes it worse?",
        hindiTitle: "किससे दर्द बढ़ता है?",
        options: [
          "Running, marching, or walking on hard concrete",
          "Recent long bus/flight trip or resting in bed for days ⚠️",
          "Jumping or pushing off on toes"
        ]
      },
      onset: {
        title: "3. When did it start?",
        hindiTitle: "यह कब शुरू हुआ?",
        options: [
          "Gradual ache after starting new exercise or running",
          "Sudden snap during walking, running, or sports",
          "Swelling built up over the last 1 to 2 days ⚠️"
        ]
      },
      redFlags: {
        title: "4. Any critical warning signs?",
        hindiTitle: "गंभीर चेतावनी संकेत",
        options: [
          "One calf is noticeably bigger and swollen than the other ⚠️",
          "Sudden chest pain or shortness of breath ⚠️",
          "Felt a snap and cannot push off on toes (Achilles tear)",
          "Foot feels cold, pale, or completely numb"
        ]
      }
    }
  },

  ankle_foot: {
    id: "ankle_foot",
    name: "Ankle & Foot",
    hindiName: "टखना और पैर का पंजा",
    latinName: "Ankle & Foot",
    snomed: "299849007",
    icd10: "S93.4 / M72.2",
    clinicalName: "Ankle & Foot",
    icon: "🦶",
    hotspot: { x: 130, y: 520 },
    mcq: {
      character: {
        title: "1. How does your foot or ankle feel?",
        hindiTitle: "पैर या टखने में कैसा दर्द है?",
        options: [
          "Sharp heel pain on very first morning steps out of bed, eases after walking",
          "Swollen and bruised after twisting or rolling my ankle inward",
          "Burning, tingling, or loss of feeling on bottom of both feet",
          "Big toe is red, hot, swollen, and very painful even to touch",
          "Sharp pain under ball of foot, like walking on a pebble"
        ]
      },
      triggers: {
        title: "2. What makes it worse?",
        hindiTitle: "किससे दर्द बढ़ता है?",
        options: [
          "Stepping out of bed barefoot onto hard floor in morning",
          "Walking on uneven ground or stepping off stairs/curbs",
          "Wearing flat unpadded slippers or hard footwear",
          "Eating rich purine foods (red meat, dal) or alcohol"
        ]
      },
      onset: {
        title: "3. When did it start?",
        hindiTitle: "यह कब शुरू हुआ?",
        options: [
          "Just twisted or rolled ankle recently",
          "Morning heel pain lasting for weeks or months",
          "Woke up in the middle of night with intense big toe agony",
          "Gradual numbness spreading slowly over months"
        ]
      },
      redFlags: {
        title: "4. Any warning signs?",
        hindiTitle: "चेतावनी संकेत",
        options: [
          "Cannot take 4 steps on this foot at all after injury ⚠️",
          "Sharp bone pain when pressing ankle bone tips",
          "Painless wound, crack, or sore on sole of foot that won't heal ⚠️",
          "Skin is dark red or purplish with heat"
        ]
      }
    }
  }
};

/**
 * Generates Anatomically Accurate SVG Paths for the Human Skeleton
 * Supports multiple selected regions simultaneously with indexed badges
 * @param {'anterior' | 'posterior'} view
 * @param {string[]} selectedRegionIds
 */
export function generateSkeletonSvg(view = 'anterior', selectedRegionIds = []) {
  const isPosterior = view === 'posterior';
  const selectedList = Array.isArray(selectedRegionIds) ? selectedRegionIds : (selectedRegionIds ? [selectedRegionIds] : []);

  const getRegionClass = (id) => {
    return selectedList.includes(id) ? 'active-bone' : '';
  };

  const getRegionBadge = (id) => {
    const idx = selectedList.indexOf(id);
    if (idx === -1) return '';
    return `<span class="badge-num">${idx + 1}</span>`;
  };

  return `
    <svg class="skeleton-svg-cad" viewBox="0 0 320 590" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Holographic grid pattern -->
        <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(56, 189, 248, 0.07)" stroke-width="0.75"/>
        </pattern>

        <!-- Bioluminescent Bone Glow Filter -->
        <filter id="boneSelectedGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feComponentTransfer in="blur" result="glow">
            <feFuncA type="linear" slope="1.8"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <!-- Depth Drop Shadow for 3D realism -->
        <filter id="boneDepthShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" flood-color="rgba(0,0,0,0.4)" />
        </filter>

        <!-- Gradients for realistic bone depth -->
        <linearGradient id="boneBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F8FAFC" />
          <stop offset="60%" stop-color="#E2E8F0" />
          <stop offset="100%" stop-color="#CBD5E1" />
        </linearGradient>

        <linearGradient id="boneSelectedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38BDF8" />
          <stop offset="50%" stop-color="#0284C7" />
          <stop offset="100%" stop-color="#0369A1" />
        </linearGradient>
      </defs>

      <!-- Background HUD Telemetry Grid -->
      <rect width="320" height="590" fill="url(#cadGrid)" />
      
      <!-- Center plumbline -->
      <line x1="160" y1="10" x2="160" y2="580" stroke="rgba(56, 189, 248, 0.15)" stroke-width="0.75" stroke-dasharray="4,4" />

      <!-- 1. HEAD & FACE -->
      <g class="bone-zone ${getRegionClass('skull')}" data-region="skull" onclick="window.app.toggleSkeletalRegion('skull')" style="cursor: pointer;">
        <title>Head & Face (Tap to select)</title>
        ${!isPosterior ? `
          <path d="M 132,44 C 132,18 144,12 160,12 C 176,12 188,18 188,44 C 188,54 186,60 182,64 L 178,64 L 178,67 C 178,74 172,79 160,79 C 148,79 142,74 142,67 L 142,64 L 138,64 C 134,60 132,54 132,44 Z" class="bone-element" filter="url(#boneDepthShadow)"/>
          <ellipse cx="148" cy="45" rx="6.5" ry="7" class="bone-cavity" />
          <ellipse cx="172" cy="45" rx="6.5" ry="7" class="bone-cavity" />
          <polygon points="159,48 161,48 163,57 157,57" class="bone-cavity" />
          <path d="M 150,62 Q 160,63 170,62" stroke="#475569" stroke-width="1.2" fill="none" stroke-linecap="round"/>
          <path d="M 144,64 C 144,77 152,82 160,82 C 168,82 176,77 176,64" fill="none" stroke="#64748B" stroke-width="1.2"/>
        ` : `
          <path d="M 132,46 C 132,18 144,12 160,12 C 176,12 188,18 188,46 C 188,64 178,76 160,76 C 142,76 132,64 132,46 Z" class="bone-element" filter="url(#boneDepthShadow)"/>
          <circle cx="160" cy="50" r="2.2" class="bone-cavity" />
          <path d="M 144,40 Q 160,48 176,40" stroke="#64748B" stroke-width="1" fill="none" stroke-dasharray="2,2"/>
        `}
        <circle cx="160" cy="46" r="3.5" class="bone-beacon ${selectedList.includes('skull') ? 'pulse' : ''}" />
        ${selectedList.includes('skull') ? `<circle cx="160" cy="46" r="8" fill="none" stroke="#38BDF8" stroke-width="1.2" stroke-dasharray="2,2"/>` : ''}
      </g>

      <!-- 2. NECK -->
      <g class="bone-zone ${getRegionClass('cervical_spine')}" data-region="cervical_spine" onclick="window.app.toggleSkeletalRegion('cervical_spine')" style="cursor: pointer;">
        <title>Neck (Tap to select)</title>
        <rect x="154" y="82" width="12" height="4" rx="1.5" class="bone-element" />
        <rect x="153" y="88" width="14" height="4.5" rx="1.5" class="bone-element" />
        <rect x="152.5" y="94.5" width="15" height="4" rx="1.5" class="bone-element" />
        <rect x="152" y="100.5" width="16" height="4" rx="1.5" class="bone-element" />
        <rect x="151.5" y="106.5" width="17" height="4.2" rx="1.5" class="bone-element" />
        <rect x="150.5" y="112.5" width="19" height="4.5" rx="1.5" class="bone-element" />
        ${isPosterior ? `<line x1="160" y1="84" x2="160" y2="117" stroke="#334155" stroke-width="2.5" stroke-linecap="round" />` : ''}
        <circle cx="160" cy="100" r="3.5" class="bone-beacon ${selectedList.includes('cervical_spine') ? 'pulse' : ''}" />
      </g>

      <!-- 3. SHOULDER -->
      <g class="bone-zone ${getRegionClass('shoulder')}" data-region="shoulder" onclick="window.app.toggleSkeletalRegion('shoulder')" style="cursor: pointer;">
        <title>Shoulders (Tap to select)</title>
        ${!isPosterior ? `
          <path d="M 154,117 C 142,115 125,121 108,120" stroke="currentColor" class="bone-element-path" stroke-width="4.2" stroke-linecap="round" fill="none" filter="url(#boneDepthShadow)"/>
          <path d="M 166,117 C 178,115 195,121 212,120" stroke="currentColor" class="bone-element-path" stroke-width="4.2" stroke-linecap="round" fill="none" filter="url(#boneDepthShadow)"/>
          <path d="M 108,120 C 104,122 103,128 107,131 C 111,133 113,127 108,120 Z" class="bone-element" />
          <path d="M 212,120 C 216,122 217,128 213,131 C 209,133 207,127 212,120 Z" class="bone-element" />
        ` : `
          <path d="M 112,120 L 140,123 L 132,166 L 114,142 Z" class="bone-element" filter="url(#boneDepthShadow)"/>
          <path d="M 208,120 L 180,123 L 188,166 L 206,142 Z" class="bone-element" filter="url(#boneDepthShadow)"/>
        `}
        <circle cx="108" cy="122" r="3.5" class="bone-beacon ${selectedList.includes('shoulder') ? 'pulse' : ''}" />
        <circle cx="212" cy="122" r="3.5" class="bone-beacon ${selectedList.includes('shoulder') ? 'pulse' : ''}" />
      </g>

      <!-- 4. CHEST & RIBS -->
      <g class="bone-zone ${getRegionClass('thorax')}" data-region="thorax" onclick="window.app.toggleSkeletalRegion('thorax')" style="cursor: pointer;">
        <title>Chest & Ribs (Tap to select)</title>
        <path d="M 152,120 C 135,119 126,127 151,128" stroke="currentColor" class="bone-element-rib" stroke-width="2.4" fill="none"/>
        <path d="M 168,120 C 185,119 194,127 169,128" stroke="currentColor" class="bone-element-rib" stroke-width="2.4" fill="none"/>
        <path d="M 150,127 C 128,126 118,137 150,136" stroke="currentColor" class="bone-element-rib" stroke-width="2.6" fill="none"/>
        <path d="M 170,127 C 192,126 202,137 170,136" stroke="currentColor" class="bone-element-rib" stroke-width="2.6" fill="none"/>
        <path d="M 150,135 C 122,134 114,148 150,146" stroke="currentColor" class="bone-element-rib" stroke-width="2.8" fill="none"/>
        <path d="M 170,135 C 198,134 206,148 170,146" stroke="currentColor" class="bone-element-rib" stroke-width="2.8" fill="none"/>
        <path d="M 150,143 C 120,143 112,159 150,156" stroke="currentColor" class="bone-element-rib" stroke-width="2.8" fill="none"/>
        <path d="M 170,143 C 200,143 208,159 170,156" stroke="currentColor" class="bone-element-rib" stroke-width="2.8" fill="none"/>
        <path d="M 150,152 C 118,152 112,170 150,166" stroke="currentColor" class="bone-element-rib" stroke-width="2.8" fill="none"/>
        <path d="M 170,152 C 202,152 208,170 170,166" stroke="currentColor" class="bone-element-rib" stroke-width="2.8" fill="none"/>
        <path d="M 150,161 C 120,162 114,180 151,175" stroke="currentColor" class="bone-element-rib" stroke-width="2.6" fill="none"/>
        <path d="M 170,161 C 200,162 206,180 169,175" stroke="currentColor" class="bone-element-rib" stroke-width="2.6" fill="none"/>
        ${!isPosterior ? `
          <polygon points="154,118 166,118 168,132 152,132" class="bone-element" filter="url(#boneDepthShadow)"/>
          <rect x="154" y="133" width="12" height="38" rx="2" class="bone-element" filter="url(#boneDepthShadow)"/>
          <polygon points="157,171 163,171 160,179" class="bone-element" />
        ` : `
          <line x1="160" y1="120" x2="160" y2="185" stroke="#1E293B" stroke-width="3" />
        `}
        <circle cx="160" cy="150" r="3.5" class="bone-beacon ${selectedList.includes('thorax') ? 'pulse' : ''}" />
      </g>

      <!-- 5. LOWER BACK & SPINE -->
      <g class="bone-zone ${getRegionClass('thoracolumbar_spine')}" data-region="thoracolumbar_spine" onclick="window.app.toggleSkeletalRegion('thoracolumbar_spine')" style="cursor: pointer;">
        <title>Lower Back (Tap to select)</title>
        <rect x="151" y="185" width="18" height="6.5" rx="2" class="bone-element" />
        <rect x="150" y="193" width="20" height="7" rx="2" class="bone-element" />
        <rect x="149" y="201.5" width="22" height="7.5" rx="2.5" class="bone-element" />
        <rect x="148" y="210.5" width="24" height="8" rx="2.5" class="bone-element" />
        <rect x="147" y="220" width="26" height="8.5" rx="3" class="bone-element" />
        ${isPosterior ? `
          <line x1="160" y1="120" x2="160" y2="230" stroke="#0F172A" stroke-width="3.5" stroke-linecap="round" />
        ` : ''}
        <circle cx="160" cy="208" r="3.5" class="bone-beacon ${selectedList.includes('thoracolumbar_spine') ? 'pulse' : ''}" />
      </g>

      <!-- 6. PELVIS & HIPS -->
      <g class="bone-zone ${getRegionClass('pelvis_hip')}" data-region="pelvis_hip" onclick="window.app.toggleSkeletalRegion('pelvis_hip')" style="cursor: pointer;">
        <title>Hips & Pelvis (Tap to select)</title>
        <polygon points="150,229 170,229 164,258 156,258" class="bone-element" />
        <path d="M 150,230 C 136,220 120,226 118,242 C 117,252 124,264 135,266 C 137,263 139,256 142,246 C 145,238 148,234 150,230 Z" class="bone-element" filter="url(#boneDepthShadow)"/>
        <path d="M 170,230 C 184,220 200,226 202,242 C 203,252 196,264 185,266 C 183,263 181,256 178,246 C 175,238 172,234 170,230 Z" class="bone-element" filter="url(#boneDepthShadow)"/>
        <ellipse cx="160" cy="254" rx="14" ry="11" class="bone-cavity" />
        ${!isPosterior ? `
          <path d="M 136,266 C 144,272 156,275 160,275 C 164,275 176,272 184,266 L 176,260 C 170,265 163,266 160,266 C 157,266 150,265 144,260 Z" class="bone-element" />
        ` : ''}
        <circle cx="132" cy="262" r="3.5" class="bone-beacon ${selectedList.includes('pelvis_hip') ? 'pulse' : ''}" />
        <circle cx="188" cy="262" r="3.5" class="bone-beacon ${selectedList.includes('pelvis_hip') ? 'pulse' : ''}" />
      </g>

      <!-- 7. ARMS -->
      <g class="bone-zone ${getRegionClass('upper_limb')}" data-region="upper_limb" onclick="window.app.toggleSkeletalRegion('upper_limb')" style="cursor: pointer;">
        <title>Arm & Elbow (Tap to select)</title>
        <circle cx="103" cy="133" r="5.5" class="bone-element" />
        <path d="M 103,138 C 101,155 97,175 92,194 L 97,195 C 102,175 106,155 107,138 Z" class="bone-element" filter="url(#boneDepthShadow)"/>
        <circle cx="217" cy="133" r="5.5" class="bone-element" />
        <path d="M 217,138 C 219,155 223,175 228,194 L 223,195 C 218,175 214,155 213,138 Z" class="bone-element" filter="url(#boneDepthShadow)"/>
        <circle cx="94" cy="198" r="3.5" class="bone-beacon ${selectedList.includes('upper_limb') ? 'pulse' : ''}" />
        <circle cx="226" cy="198" r="3.5" class="bone-beacon ${selectedList.includes('upper_limb') ? 'pulse' : ''}" />
      </g>

      <!-- 8. HANDS & WRISTS -->
      <g class="bone-zone ${getRegionClass('hand_wrist')}" data-region="hand_wrist" onclick="window.app.toggleSkeletalRegion('hand_wrist')" style="cursor: pointer;">
        <title>Wrist & Hand (Tap to select)</title>
        <path d="M 90,200 L 76,260 L 80,261 L 93,200 Z" class="bone-element" />
        <ellipse cx="80" cy="266" rx="6" ry="4" class="bone-element" />
        <path d="M 75,270 L 68,295 M 78,270 L 73,300 M 81,270 L 78,303 M 84,270 L 83,300 M 87,270 L 88,292" stroke="currentColor" stroke-width="1.8" class="bone-element-path" stroke-linecap="round"/>
        <path d="M 230,200 L 244,260 L 240,261 L 227,200 Z" class="bone-element" />
        <ellipse cx="240" cy="266" rx="6" ry="4" class="bone-element" />
        <path d="M 245,270 L 252,295 M 242,270 L 247,300 M 239,270 L 242,303 M 236,270 L 237,300 M 233,270 L 232,292" stroke="currentColor" stroke-width="1.8" class="bone-element-path" stroke-linecap="round"/>
        <circle cx="78" cy="275" r="3.5" class="bone-beacon ${selectedList.includes('hand_wrist') ? 'pulse' : ''}" />
        <circle cx="242" cy="275" r="3.5" class="bone-beacon ${selectedList.includes('hand_wrist') ? 'pulse' : ''}" />
      </g>

      <!-- 9. THIGHS -->
      <g class="bone-zone ${getRegionClass('thigh_femur')}" data-region="thigh_femur" onclick="window.app.toggleSkeletalRegion('thigh_femur')" style="cursor: pointer;">
        <title>Thighs (Tap to select)</title>
        <circle cx="127" cy="265" r="6" class="bone-element" />
        <path d="M 124,275 C 127,310 131,345 133,375 L 139,375 C 137,345 133,310 130,275 Z" class="bone-element" filter="url(#boneDepthShadow)"/>
        <circle cx="193" cy="265" r="6" class="bone-element" />
        <path d="M 196,275 C 193,310 189,345 187,375 L 181,375 C 183,345 187,310 190,275 Z" class="bone-element" filter="url(#boneDepthShadow)"/>
        <circle cx="132" cy="325" r="3.5" class="bone-beacon ${selectedList.includes('thigh_femur') ? 'pulse' : ''}" />
        <circle cx="188" cy="325" r="3.5" class="bone-beacon ${selectedList.includes('thigh_femur') ? 'pulse' : ''}" />
      </g>

      <!-- 10. KNEES -->
      <g class="bone-zone ${getRegionClass('knee')}" data-region="knee" onclick="window.app.toggleSkeletalRegion('knee')" style="cursor: pointer;">
        <title>Knees (Tap to select)</title>
        <rect x="127" y="386" width="18" height="6" rx="2" class="bone-element" filter="url(#boneDepthShadow)"/>
        ${!isPosterior ? `
          <circle cx="136" cy="384" r="5" class="bone-element-accent" filter="url(#boneDepthShadow)"/>
        ` : `
          <ellipse cx="136" cy="383" rx="5" ry="3.5" class="bone-cavity" />
        `}
        <rect x="175" y="386" width="18" height="6" rx="2" class="bone-element" filter="url(#boneDepthShadow)"/>
        ${!isPosterior ? `
          <circle cx="184" cy="384" r="5" class="bone-element-accent" filter="url(#boneDepthShadow)"/>
        ` : `
          <ellipse cx="184" cy="383" rx="5" ry="3.5" class="bone-cavity" />
        `}
        <circle cx="136" cy="384" r="3.5" class="bone-beacon ${selectedList.includes('knee') ? 'pulse' : ''}" />
        <circle cx="184" cy="384" r="3.5" class="bone-beacon ${selectedList.includes('knee') ? 'pulse' : ''}" />
      </g>

      <!-- 11. SHIN & CALF -->
      <g class="bone-zone ${getRegionClass('leg_tibia')}" data-region="leg_tibia" onclick="window.app.toggleSkeletalRegion('leg_tibia')" style="cursor: pointer;">
        <title>Shin & Calf (Tap to select)</title>
        <path d="M 132,392 C 133,425 131,460 128,495 L 134,495 C 137,460 139,425 138,392 Z" class="bone-element" filter="url(#boneDepthShadow)"/>
        <path d="M 188,392 C 187,425 189,460 192,495 L 186,495 C 183,460 181,425 182,392 Z" class="bone-element" filter="url(#boneDepthShadow)"/>
        <circle cx="131" cy="445" r="3.5" class="bone-beacon ${selectedList.includes('leg_tibia') ? 'pulse' : ''}" />
        <circle cx="189" cy="445" r="3.5" class="bone-beacon ${selectedList.includes('leg_tibia') ? 'pulse' : ''}" />
      </g>

      <!-- 12. ANKLE & FOOT -->
      <g class="bone-zone ${getRegionClass('ankle_foot')}" data-region="ankle_foot" onclick="window.app.toggleSkeletalRegion('ankle_foot')" style="cursor: pointer;">
        <title>Ankle & Foot (Tap to select)</title>
        <ellipse cx="127" cy="508" rx="6.5" ry="5" class="bone-element" filter="url(#boneDepthShadow)"/>
        <path d="M 124,512 L 118,542 M 126,512 L 123,545 M 128,512 L 127,547 M 130,512 L 131,545" stroke="currentColor" stroke-width="2" class="bone-element-path" stroke-linecap="round"/>
        <ellipse cx="193" cy="508" rx="6.5" ry="5" class="bone-element" filter="url(#boneDepthShadow)"/>
        <path d="M 196,512 L 202,542 M 194,512 L 197,545 M 192,512 L 193,547 M 190,512 L 189,545" stroke="currentColor" stroke-width="2" class="bone-element-path" stroke-linecap="round"/>
        <circle cx="127" cy="525" r="3.5" class="bone-beacon ${selectedList.includes('ankle_foot') ? 'pulse' : ''}" />
        <circle cx="193" cy="525" r="3.5" class="bone-beacon ${selectedList.includes('ankle_foot') ? 'pulse' : ''}" />
      </g>
    </svg>
  `;
}

/**
 * Main Render Function for the 3D Skeletal Map & Multi-Region Case-Taking
 * Features Simplified, Patient-Friendly Everyday Language
 * @param {any} app
 * @param {any} i18n
 */
export function renderSkeletalBodyMap(app, i18n) {
  const currentView = app.patient.skeletalView || 'anterior';
  const selectedIds = app.patient.skeletalRegions || (app.patient.skeletalRegion ? [app.patient.skeletalRegion] : []);
  const activeFocusId = app.patient.skeletalRegion || selectedIds[0] || null;
  const activeRegion = activeFocusId ? SKELETAL_REGIONS[activeFocusId] : null;

  return `
    <div class="skeleton-hardware-bay">
      <!-- HUD Header -->
      <div class="skeleton-hud-header">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="hud-live-tag">3D BODY MAP</span>
            <h4 style="font-size: 1.02rem; font-weight: 800; color: var(--text-primary); margin: 0;">
              Where does it hurt?
            </h4>
          </div>
          <p style="font-size: 0.78rem; color: var(--text-muted); margin: 3px 0 0 0;">
            Tap one or more body parts on the 3D body below to tell us where you feel discomfort
          </p>
        </div>

        <!-- View Projection Switcher -->
        <div class="skeleton-view-controls">
          <button 
            type="button"
            class="view-switch-btn ${currentView === 'anterior' ? 'active' : ''}" 
            onclick="window.app.setSkeletalView('anterior')">
            <span>👤 Front View</span>
          </button>
          <button 
            type="button"
            class="view-switch-btn ${currentView === 'posterior' ? 'active' : ''}" 
            onclick="window.app.setSkeletalView('posterior')">
            <span>🔄 Back (Spine) View</span>
          </button>
        </div>
      </div>

      <!-- Color Legend & Multi-Selection Status Ribbon -->
      <div class="skeleton-legend-bar">
        <div class="legend-indicators">
          <span class="legend-item"><span class="legend-dot active-dot"></span> Selected Area (चुना हुआ भाग)</span>
          <span class="legend-item"><span class="legend-dot default-dot"></span> Tap to choose (चुनने के लिए दबाएं)</span>
        </div>

        ${selectedIds.length > 0 ? `
          <div class="active-selection-tags">
            <span style="font-size: 0.72rem; font-weight: 700; color: #38BDF8;">Selected (${selectedIds.length}):</span>
            ${selectedIds.map((id, index) => {
              const reg = SKELETAL_REGIONS[id];
              if (!reg) return '';
              return `
                <span class="selection-pill ${id === activeFocusId ? 'focused' : ''}" onclick="window.app.setActiveSkeletalRegion('${id}')">
                  <span class="pill-num">#${index + 1}</span> ${reg.icon} ${reg.name}
                  <button type="button" class="pill-remove" onclick="event.stopPropagation(); window.app.removeSkeletalRegion('${id}')" title="Remove">✕</button>
                </span>
              `;
            }).join('')}
            <button type="button" class="btn-clear-all" onclick="window.app.clearSkeletalSelection()">
              ✕ Clear All
            </button>
          </div>
        ` : ''}
      </div>

      <!-- Quick Body Part Selection Chips -->
      <div class="skeleton-quick-chips">
        ${Object.values(SKELETAL_REGIONS).map(r => {
          const isSelected = selectedIds.includes(r.id);
          return `
            <button 
              type="button"
              class="quick-bone-chip ${isSelected ? 'active' : ''}" 
              onclick="window.app.toggleSkeletalRegion('${r.id}')">
              <span>${r.icon} ${r.name.split(' ')[0]}</span>
              ${isSelected ? `<span class="check-mark">✓</span>` : ''}
            </button>
          `;
        }).join('')}
      </div>

      <!-- 3D Holographic Skeleton Viewport -->
      <div class="skeleton-viewport-3d">
        <div class="hud-corner-tl"></div>
        <div class="hud-corner-tr"></div>
        <div class="hud-corner-bl"></div>
        <div class="hud-corner-br"></div>

        <div class="hud-telemetry-overlay">
          <div class="telemetry-item">
            <span class="telemetry-lbl">VIEW:</span>
            <span class="telemetry-val">${currentView === 'anterior' ? 'FRONT VIEW' : 'BACK VIEW'}</span>
          </div>
          <div class="telemetry-item">
            <span class="telemetry-lbl">SELECTED:</span>
            <span class="telemetry-val ${selectedIds.length > 0 ? 'target-locked' : ''}">
              ${selectedIds.length > 0 ? `${selectedIds.length} BODY AREA(S)` : 'TAP ANY BODY AREA...'}
            </span>
          </div>
        </div>

        <!-- Render CAD SVG Skeleton -->
        <div class="skeleton-svg-wrapper">
          ${generateSkeletonSvg(currentView, selectedIds)}
        </div>

        <div class="hud-reticle-footer">
          <span>💡 You can tap multiple body parts at the same time</span>
        </div>
      </div>

      <!-- ========================================================
           DYNAMIC CASE-TAKING QUESTIONNAIRE (GROUPED BY REGION)
           ======================================================== -->
      <div class="mcq-intake-bay">
        ${selectedIds.length > 0 ? `
          <div class="mcq-multi-region-container">
            <!-- Region Switcher Tabs if Multiple Selected -->
            ${selectedIds.length > 1 ? `
              <div class="region-tabs-header">
                <span style="font-size: 0.74rem; font-weight: 700; color: var(--text-muted); align-self: center; margin-right: 4px;">
                  Questions for:
                </span>
                ${selectedIds.map((id, index) => {
                  const reg = SKELETAL_REGIONS[id];
                  if (!reg) return '';
                  const isCurrent = id === activeFocusId;
                  return `
                    <button 
                      type="button"
                      class="region-tab-btn ${isCurrent ? 'active-tab' : ''}" 
                      onclick="window.app.setActiveSkeletalRegion('${id}')">
                      <span>#${index + 1} ${reg.icon} ${reg.name}</span>
                    </button>
                  `;
                }).join('')}
              </div>
            ` : ''}

            <!-- Active Focused Region Questions -->
            ${activeRegion ? (() => {
              const mcqAnswers = app.patient.skeletalMcqAnswers?.[activeRegion.id] || {};
              return `
                <div class="mcq-assessment-panel animate-fade-in">
                  <!-- Header Card -->
                  <div class="mcq-header-card">
                    <div style="display: flex; align-items: center; gap: 12px;">
                      <div class="mcq-region-avatar">${activeRegion.icon}</div>
                      <div>
                        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                          <h3 style="font-size: 1.05rem; font-weight: 800; color: #FFFFFF; margin: 0;">
                            ${activeRegion.name} (${activeRegion.hindiName})
                          </h3>
                        </div>
                        <p style="font-size: 0.74rem; color: #94A3B8; margin: 2px 0 0 0;">
                          Please answer these quick questions about your ${activeRegion.name.toLowerCase()}
                        </p>
                      </div>
                    </div>

                    <button 
                      type="button" 
                      class="btn-clear-selection" 
                      onclick="window.app.removeSkeletalRegion('${activeRegion.id}')"
                      title="Remove this region">
                      ✕ Remove
                    </button>
                  </div>

                  <!-- Laterality / Sidedness Selector -->
                  <div class="mcq-section">
                    <label class="mcq-section-title">
                      <span>Which side does it affect? (किस तरफ तकलीफ है?)</span>
                    </label>
                    <div class="laterality-rack">
                      ${[
                        { id: 'Left', label: 'Left Side (बाईं तरफ)' },
                        { id: 'Right', label: 'Right Side (दाहिनी तरफ)' },
                        { id: 'Bilateral', label: 'Both Sides (दोनों तरफ)' },
                        { id: 'Center', label: 'Middle / Center (बीच में)' }
                      ].map(side => `
                        <button 
                          type="button"
                          class="laterality-btn ${(mcqAnswers.laterality || 'Both Sides') === side.id ? 'selected' : ''}" 
                          onclick="window.app.setSkeletalLaterality('${side.id}')">
                          ${side.label}
                        </button>
                      `).join('')}
                    </div>
                  </div>

                  <!-- Q1: How does it feel? -->
                  <div class="mcq-section">
                    <label class="mcq-section-title">
                      <span>${activeRegion.mcq.character.title}</span>
                      <span class="mcq-section-hi">${activeRegion.mcq.character.hindiTitle}</span>
                    </label>
                    <div class="mcq-options-grid">
                      ${activeRegion.mcq.character.options.map(opt => {
                        const isSelected = mcqAnswers.character === opt;
                        return `
                          <div 
                            class="mcq-option-card ${isSelected ? 'selected' : ''}" 
                            onclick="window.app.setSkeletalMcq('${activeRegion.id}', 'character', '${opt.replace(/'/g, "\\'")}', false)">
                            <div class="mcq-radio-dot ${isSelected ? 'checked' : ''}"></div>
                            <span class="mcq-opt-text">${opt}</span>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  </div>

                  <!-- Q2: What makes it worse? -->
                  <div class="mcq-section">
                    <label class="mcq-section-title">
                      <span>${activeRegion.mcq.triggers.title}</span>
                      <span class="mcq-section-hi">${activeRegion.mcq.triggers.hindiTitle}</span>
                    </label>
                    <div class="mcq-options-grid">
                      ${activeRegion.mcq.triggers.options.map(opt => {
                        const isSelected = mcqAnswers.triggers === opt;
                        return `
                          <div 
                            class="mcq-option-card ${isSelected ? 'selected' : ''}" 
                            onclick="window.app.setSkeletalMcq('${activeRegion.id}', 'triggers', '${opt.replace(/'/g, "\\'")}', false)">
                            <div class="mcq-radio-dot ${isSelected ? 'checked' : ''}"></div>
                            <span class="mcq-opt-text">${opt}</span>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  </div>

                  <!-- Q3: How long have you had this? -->
                  <div class="mcq-section">
                    <label class="mcq-section-title">
                      <span>${activeRegion.mcq.onset.title}</span>
                      <span class="mcq-section-hi">${activeRegion.mcq.onset.hindiTitle}</span>
                    </label>
                    <div class="mcq-chips-row">
                      ${activeRegion.mcq.onset.options.map(opt => {
                        const isSelected = mcqAnswers.onset === opt;
                        return `
                          <button 
                            type="button"
                            class="mcq-chip-btn ${isSelected ? 'active' : ''}" 
                            onclick="window.app.setSkeletalMcq('${activeRegion.id}', 'onset', '${opt.replace(/'/g, "\\'")}', false)">
                            ${opt}
                          </button>
                        `;
                      }).join('')}
                    </div>
                  </div>

                  <!-- Q4: Any other warning signs? (Multi-select) -->
                  <div class="mcq-section">
                    <label class="mcq-section-title">
                      <span>${activeRegion.mcq.redFlags.title}</span>
                      <span class="mcq-section-hi">${activeRegion.mcq.redFlags.hindiTitle}</span>
                    </label>
                    <div class="mcq-chips-row">
                      ${activeRegion.mcq.redFlags.options.map(opt => {
                        const selectedList = mcqAnswers.redFlags || [];
                        const isSelected = selectedList.includes(opt);
                        return `
                          <button 
                            type="button"
                            class="mcq-redflag-chip ${isSelected ? 'flag-active' : ''}" 
                            onclick="window.app.setSkeletalMcq('${activeRegion.id}', 'redFlags', '${opt.replace(/'/g, "\\'")}', true)">
                            <span class="flag-icon">${isSelected ? '✓' : '⚪'}</span>
                            <span>${opt}</span>
                          </button>
                        `;
                      }).join('')}
                    </div>
                  </div>
                </div>
              `;
            })() : ''}

            <!-- Real-Time Patient Summary Box -->
            <div class="clinical-synthesis-card">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 0.72rem; font-weight: 800; color: #38BDF8; font-family: var(--font-mono); text-transform: uppercase;">
                  📝 Your Symptom Summary (आपकी समस्या का विवरण)
                </span>
                <span style="font-size: 0.68rem; color: #10B981; font-family: var(--font-mono);">
                  RECORDED FOR DOCTOR
                </span>
              </div>
              <p class="synthesis-text">
                "${app.patient.chiefComplaint || 'Select answers above to build your medical summary.'}"
              </p>
            </div>
          </div>
        ` : `
          <!-- Friendly Empty State Prompt -->
          <div class="skeleton-empty-prompt">
            <div class="empty-icon-pulse">✨</div>
            <h4 style="font-size: 0.98rem; font-weight: 700; color: var(--text-primary); margin: 8px 0 4px 0;">
              Tap any body part to get started
            </h4>
            <p style="font-size: 0.8rem; color: var(--text-muted); max-width: 440px; margin: 0 auto 14px auto;">
              You can tap multiple places where you feel pain or discomfort (for example: Head, Chest, or Knees).
            </p>
            <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
              <button type="button" class="btn-sample-bone" onclick="window.app.toggleSkeletalRegion('knee')">
                🦵 Knees (घुटने)
              </button>
              <button type="button" class="btn-sample-bone" onclick="window.app.toggleSkeletalRegion('thoracolumbar_spine')">
                🧬 Lower Back (कमर)
              </button>
              <button type="button" class="btn-sample-bone" onclick="window.app.toggleSkeletalRegion('skull')">
                💀 Head (सिर)
              </button>
              <button type="button" class="btn-sample-bone" onclick="window.app.toggleSkeletalRegion('thorax')">
                🫁 Chest (छाती)
              </button>
            </div>
          </div>
        `}
      </div>
    </div>
  `;
}
