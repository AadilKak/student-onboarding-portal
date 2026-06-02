// Full enrollment data model — mirrors the sections of the GradeLink form
// (Student, Parents, Family, Contacts, Schools, Medical, Information).
// The whole object is stored as `details` on the StudentRecord; a few core
// fields are also copied to the top level so the roster/portal can query them.

export interface ParentInfo {
  firstName: string; middle: string; lastName: string; suffix: string;
  mobile: string; work: string; ext: string;
  email: string; emailNone: boolean;
  occupation: string; employer: string; employerNone: boolean; employerAddress: string;
  educationLevel: string; ssn: string; communication: string;
  address: string; city: string; state: string; postalCode: string; country: string;
}

export interface PriorSchool { name: string; address: string; phone: string; grades: string; }

export interface AuthorizedContact {
  firstName: string; lastName: string; relationship: string;
  phone: string; phoneExt: string; address: string; authorization: string;
}

export interface PersonContact { first: string; last: string; phone: string; address: string; }

export interface Attachment { name: string; type: string; size: number; dataUrl: string; }

export interface EnrollmentDetails {
  student: {
    given: string; middle: string; last: string; suffix: string;
    birthDate: string; sex: string; enteringGrade: string; mobile: string;
    email: string; recommendedBy: string;
    birthCountry: string; birthCity: string; birthState: string; birthZip: string;
    ethnicityDecline: boolean; ethnicities: string[];
    address: string; city: string; state: string; postalCode: string; country: string;
  };
  parent1: ParentInfo;
  parent2: ParentInfo;
  family: {
    livesWith: { father: boolean; mother: boolean; stepfather: boolean; stepmother: boolean; guardian1: boolean; guardian2: boolean; other: boolean; };
    divorced: boolean;
  };
  contacts: AuthorizedContact[];
  schools: {
    firstTime: boolean; transcriptRequested: boolean;
    principal: string; teacherContact: string; priors: PriorSchool[];
    suspended: boolean; expelled: boolean; lawEncounters: boolean;
    counseling: boolean; learningDisability: boolean; eslProgram: boolean;
  };
  medical: {
    doctor: PersonContact; dentist: PersonContact;
    insuranceNone: boolean; insurance: string;
    hospitalNone: boolean; hospital: string;
    allergies: boolean; medications: boolean;
  };
  info: {
    masjid: string; imam: string; primaryLanguage: string; secondaryLanguage: string;
    releaseContact: boolean; photoConsent: boolean;
    arabicExperience: "none" | "classes" | "native";
    quran: "none" | "memorizes"; quranSurah: string; quranExplain: string;
  };
  attachments: Attachment[];
  submit: { initials: string; };
}

function blankParent(): ParentInfo {
  return { firstName: "", middle: "", lastName: "", suffix: "", mobile: "", work: "", ext: "",
    email: "", emailNone: false, occupation: "", employer: "", employerNone: false, employerAddress: "",
    educationLevel: "", ssn: "", communication: "", address: "", city: "", state: "", postalCode: "", country: "" };
}
function blankContact(): AuthorizedContact {
  return { firstName: "", lastName: "", relationship: "", phone: "", phoneExt: "", address: "", authorization: "" };
}
function blankPerson(): PersonContact { return { first: "", last: "", phone: "", address: "" }; }
function blankPrior(): PriorSchool { return { name: "", address: "", phone: "", grades: "" }; }

export function emptyEnrollment(): EnrollmentDetails {
  return {
    student: { given: "", middle: "", last: "", suffix: "", birthDate: "", sex: "", enteringGrade: "",
      mobile: "", email: "", recommendedBy: "", birthCountry: "", birthCity: "", birthState: "", birthZip: "",
      ethnicityDecline: false, ethnicities: [], address: "", city: "", state: "", postalCode: "", country: "" },
    parent1: blankParent(), parent2: blankParent(),
    family: { livesWith: { father: false, mother: false, stepfather: false, stepmother: false, guardian1: false, guardian2: false, other: false }, divorced: false },
    contacts: [blankContact()],
    schools: { firstTime: true, transcriptRequested: false, principal: "", teacherContact: "",
      priors: [blankPrior()], suspended: false, expelled: false, lawEncounters: false,
      counseling: false, learningDisability: false, eslProgram: false },
    medical: { doctor: blankPerson(), dentist: blankPerson(), insuranceNone: false, insurance: "",
      hospitalNone: false, hospital: "", allergies: false, medications: false },
    info: { masjid: "", imam: "", primaryLanguage: "", secondaryLanguage: "", releaseContact: false,
      photoConsent: false, arabicExperience: "none", quran: "none", quranSurah: "", quranExplain: "" },
    attachments: [],
    submit: { initials: "" },
  };
}

// Realistic sample data for one-click testing (dev only).
export function sampleEnrollment(): EnrollmentDetails {
  const e = emptyEnrollment();
  e.student = { ...e.student, given: "Ikhlas", middle: "Mohamed", last: "Ali", birthDate: "2020-10-25",
    sex: "Female", enteringGrade: "Pre-Kindergarten", mobile: "(717) 601-7929", email: "Aqbal06@gmail.com",
    birthCountry: "United States", birthCity: "Camp Hill", birthState: "Pennsylvania",
    address: "1249 rocky road", city: "Mechanicsburg", state: "Pennsylvania", postalCode: "17055", country: "United States" };
  e.parent1 = { ...e.parent1, firstName: "Fartun", lastName: "Korane", mobile: "(223) 212-8685",
    email: "Fartunsahane2017@gmail.com", emailNone: false, occupation: "Home keeper", employerNone: true,
    educationLevel: "3. High School Diploma", communication: "Student lives with this parent" };
  e.contacts = [
    { firstName: "Sahro", lastName: "Garad", relationship: "Grandmother", phone: "(717) 802-2540", phoneExt: "", address: "", authorization: "Emergency contact, OK to pick up" },
    { firstName: "Ahmed", lastName: "Aden", relationship: "Uncle", phone: "(614) 929-1325", phoneExt: "", address: "", authorization: "Emergency contact, OK to pick up" },
  ];
  e.family.livesWith.father = true; e.family.livesWith.mother = true;
  e.info = { ...e.info, masjid: "All mechanicsburg masjid", imam: "All of them",
    primaryLanguage: "Somali", secondaryLanguage: "Arabic English", quran: "memorizes", quranSurah: "1" };
  e.submit.initials = "MA";
  return e;
}
