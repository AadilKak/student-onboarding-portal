// The content of each wizard step. Every step receives the full enrollment
// object plus a `patch` callback to update a section immutably.
import type { EnrollmentDetails, ParentInfo, AuthorizedContact, PriorSchool } from "./model";
import { TextField, TextArea, SelectField, YesNo, CheckBox } from "./fields";

type Patch = (d: Partial<EnrollmentDetails>) => void;
interface StepProps { data: EnrollmentDetails; patch: Patch; }

const GRADES = ["Pre-Kindergarten", "Kindergarten", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const SEX = ["Female", "Male"];
const EDU = ["1. Some High School", "2. GED", "3. High School Diploma", "4. Associate", "5. Bachelor", "6. Master", "7. Doctorate"];
const AUTH = ["Emergency contact, OK to pick up", "Emergency contact only", "Do not release to"];

// ---------- Step 1: Student ----------
export function StudentStep({ data, patch }: StepProps) {
  const s = data.student;
  const set = (p: Partial<typeof s>) => patch({ student: { ...s, ...p } });
  return (
    <>
      <h3 className="step-h">Student Information</h3>
      <div className="grid4">
        <TextField label="First / Given Name" value={s.given} onChange={(v) => set({ given: v })} />
        <TextField label="Middle" value={s.middle} onChange={(v) => set({ middle: v })} />
        <TextField label="Last / Family Name" value={s.last} onChange={(v) => set({ last: v })} />
        <TextField label="Suffix" value={s.suffix} onChange={(v) => set({ suffix: v })} />
      </div>
      <div className="grid4">
        <TextField label="Birth Date" type="date" value={s.birthDate} onChange={(v) => set({ birthDate: v })} />
        <SelectField label="Sex" value={s.sex} onChange={(v) => set({ sex: v })} options={SEX} />
        <SelectField label="Entering Grade/Program" value={s.enteringGrade} onChange={(v) => set({ enteringGrade: v })} options={GRADES} />
        <TextField label="Mobile" value={s.mobile} onChange={(v) => set({ mobile: v })} />
      </div>
      <div className="grid2">
        <TextField label="Email" value={s.email} onChange={(v) => set({ email: v })} />
        <TextField label="Who recommended us?" value={s.recommendedBy} onChange={(v) => set({ recommendedBy: v })} />
      </div>
      <div className="grid4">
        <TextField label="Birth Country" value={s.birthCountry} onChange={(v) => set({ birthCountry: v })} />
        <TextField label="Birth City" value={s.birthCity} onChange={(v) => set({ birthCity: v })} />
        <TextField label="Birth State (if US)" value={s.birthState} onChange={(v) => set({ birthState: v })} />
        <TextField label="Birth Zip (US)" value={s.birthZip} onChange={(v) => set({ birthZip: v })} />
      </div>
      <div className="ef ef--full yesno">
        <span className="ef-label">Ethnicity</span>
        <CheckBox label="Decline responses" checked={s.ethnicityDecline} onChange={(v) => set({ ethnicityDecline: v })} />
      </div>
      <h3 className="step-h">Mailing / Home Address</h3>
      <TextField label="Address" value={s.address} onChange={(v) => set({ address: v })} />
      <div className="grid4">
        <TextField label="City" value={s.city} onChange={(v) => set({ city: v })} />
        <TextField label="State / Province" value={s.state} onChange={(v) => set({ state: v })} />
        <TextField label="Postal Code" value={s.postalCode} onChange={(v) => set({ postalCode: v })} />
        <TextField label="Country / Region" value={s.country} onChange={(v) => set({ country: v })} />
      </div>
    </>
  );
}

// ---------- Step 2: Parents ----------
function ParentForm({ p, set, title, primary }: { p: ParentInfo; set: (x: Partial<ParentInfo>) => void; title: string; primary?: boolean }) {
  return (
    <>
      <h3 className="step-h">{title}</h3>
      <div className="grid4">
        <TextField label="First Name" value={p.firstName} onChange={(v) => set({ firstName: v })} />
        <TextField label="Middle" value={p.middle} onChange={(v) => set({ middle: v })} />
        <TextField label="Last Name" value={p.lastName} onChange={(v) => set({ lastName: v })} />
        <TextField label="Suffix" value={p.suffix} onChange={(v) => set({ suffix: v })} />
      </div>
      <div className="grid4">
        <TextField label={primary ? "Mobile *" : "Mobile"} value={p.mobile} onChange={(v) => set({ mobile: v })} />
        <TextField label="Work/Other (if different)" value={p.work} onChange={(v) => set({ work: v })} />
        <TextField label="Ext." value={p.ext} onChange={(v) => set({ ext: v })} />
        <SelectField label="Educational Level" value={p.educationLevel} onChange={(v) => set({ educationLevel: v })} options={EDU} />
      </div>
      <div className="grid4">
        <TextField label="Email" value={p.email} onChange={(v) => set({ email: v })} />
        <TextField label="Occupation" value={p.occupation} onChange={(v) => set({ occupation: v })} />
        <TextField label="Employer" value={p.employer} onChange={(v) => set({ employer: v })} />
        <TextField label="Communication" value={p.communication} onChange={(v) => set({ communication: v })} />
      </div>
      <div className="checkrow">
        <CheckBox label="No email" checked={p.emailNone} onChange={(v) => set({ emailNone: v })} />
        <CheckBox label="No employer" checked={p.employerNone} onChange={(v) => set({ employerNone: v })} />
      </div>
      <h4 className="step-sub">Mailing / Home Address (if different from student)</h4>
      <TextField label="Address" value={p.address} onChange={(v) => set({ address: v })} />
      <div className="grid4">
        <TextField label="City" value={p.city} onChange={(v) => set({ city: v })} />
        <TextField label="State / Province" value={p.state} onChange={(v) => set({ state: v })} />
        <TextField label="Postal Code" value={p.postalCode} onChange={(v) => set({ postalCode: v })} />
        <TextField label="Country / Region" value={p.country} onChange={(v) => set({ country: v })} />
      </div>
    </>
  );
}
export function ParentsStep({ data, patch }: StepProps) {
  return (
    <>
      <ParentForm primary p={data.parent1} title="Parent 1 — Father / Guardian" set={(x) => patch({ parent1: { ...data.parent1, ...x } })} />
      <ParentForm p={data.parent2} title="Parent 2 — Mother / Guardian" set={(x) => patch({ parent2: { ...data.parent2, ...x } })} />
    </>
  );
}

// ---------- Step 3: Family & Contacts ----------
export function FamilyContactsStep({ data, patch }: StepProps) {
  const lw = data.family.livesWith;
  const setLW = (k: keyof typeof lw, v: boolean) => patch({ family: { ...data.family, livesWith: { ...lw, [k]: v } } });
  const setContact = (i: number, x: Partial<AuthorizedContact>) =>
    patch({ contacts: data.contacts.map((c, idx) => (idx === i ? { ...c, ...x } : c)) });
  const addContact = () => patch({ contacts: [...data.contacts, { firstName: "", lastName: "", relationship: "", phone: "", phoneExt: "", address: "", authorization: "" }] });
  const removeContact = (i: number) => patch({ contacts: data.contacts.filter((_, idx) => idx !== i) });

  return (
    <>
      <h3 className="step-h">Family Information</h3>
      <p className="ef-label">Student lives with (check all that apply)…</p>
      <div className="checkrow">
        {(["father", "mother", "stepfather", "stepmother", "guardian1", "guardian2", "other"] as const).map((k) => (
          <CheckBox key={k} label={k} checked={lw[k]} onChange={(v) => setLW(k, v)} />
        ))}
      </div>
      <YesNo label="Are parents divorced?" value={data.family.divorced} onChange={(v) => patch({ family: { ...data.family, divorced: v } })} />

      <h3 className="step-h">Authorized Contacts</h3>
      {data.contacts.map((c, i) => (
        <div key={i} className="subcard">
          <div className="grid4">
            <TextField label="First Name" value={c.firstName} onChange={(v) => setContact(i, { firstName: v })} />
            <TextField label="Last Name" value={c.lastName} onChange={(v) => setContact(i, { lastName: v })} />
            <TextField label="Relationship" value={c.relationship} onChange={(v) => setContact(i, { relationship: v })} />
            <SelectField label="Authorization" value={c.authorization} onChange={(v) => setContact(i, { authorization: v })} options={AUTH} />
          </div>
          <div className="grid4">
            <TextField label="Phone" value={c.phone} onChange={(v) => setContact(i, { phone: v })} />
            <TextField label="Phone (Ext)" value={c.phoneExt} onChange={(v) => setContact(i, { phoneExt: v })} />
            <TextField label="Full Address" value={c.address} onChange={(v) => setContact(i, { address: v })} />
            <div className="ef ef--end">
              {data.contacts.length > 1 && <button className="btn btn--small btn--bad" onClick={() => removeContact(i)}>Remove</button>}
            </div>
          </div>
        </div>
      ))}
      <button className="btn btn--small" onClick={addContact}>+ Add contact</button>
    </>
  );
}

// ---------- Step 4: Schools / Background ----------
export function SchoolsStep({ data, patch }: StepProps) {
  const sc = data.schools;
  const set = (x: Partial<typeof sc>) => patch({ schools: { ...sc, ...x } });
  const setPrior = (i: number, x: Partial<PriorSchool>) => set({ priors: sc.priors.map((p, idx) => (idx === i ? { ...p, ...x } : p)) });
  return (
    <>
      <h3 className="step-h">Prior Schools</h3>
      <YesNo label="Is this the first time the applicant has attended any school including homeschool?" value={sc.firstTime} onChange={(v) => set({ firstTime: v })} />
      {!sc.firstTime && (
        <>
          <YesNo label="Have you requested that a current transcript be sent to our school?" value={sc.transcriptRequested} onChange={(v) => set({ transcriptRequested: v })} />
          <div className="grid2">
            <TextField label="Principal(s) at last school" value={sc.principal} onChange={(v) => set({ principal: v })} />
            <TextField label="Teacher contact(s) at last school" value={sc.teacherContact} onChange={(v) => set({ teacherContact: v })} />
          </div>
          {sc.priors.map((p, i) => (
            <div key={i} className="grid4">
              <TextField label="Name of Prior School" value={p.name} onChange={(v) => setPrior(i, { name: v })} />
              <TextField label="Address (City, State)" value={p.address} onChange={(v) => setPrior(i, { address: v })} />
              <TextField label="Phone" value={p.phone} onChange={(v) => setPrior(i, { phone: v })} />
              <TextField label="Grade(s)/Year(s)" value={p.grades} onChange={(v) => setPrior(i, { grades: v })} />
            </div>
          ))}
          <button className="btn btn--small" onClick={() => set({ priors: [...sc.priors, { name: "", address: "", phone: "", grades: "" }] })}>+ Add prior school</button>
        </>
      )}
      <h4 className="step-sub">Background</h4>
      <YesNo label="Has the applicant ever been suspended?" value={sc.suspended} onChange={(v) => set({ suspended: v })} />
      <YesNo label="Has the applicant ever been expelled?" value={sc.expelled} onChange={(v) => set({ expelled: v })} />
      <YesNo label="Any encounters with law enforcement or juvenile authorities?" value={sc.lawEncounters} onChange={(v) => set({ lawEncounters: v })} />
      <YesNo label="Received testing/counseling by a psychologist, psychiatrist, or family counselor?" value={sc.counseling} onChange={(v) => set({ counseling: v })} />
      <YesNo label="Ever been diagnosed or in a program for a learning disability?" value={sc.learningDisability} onChange={(v) => set({ learningDisability: v })} />
      <YesNo label="Ever been in a bilingual, ESL or LEP program?" value={sc.eslProgram} onChange={(v) => set({ eslProgram: v })} />
    </>
  );
}

// ---------- Step 5: Medical ----------
export function MedicalStep({ data, patch }: StepProps) {
  const m = data.medical;
  const set = (x: Partial<typeof m>) => patch({ medical: { ...m, ...x } });
  return (
    <>
      <h3 className="step-h">Doctor Contact</h3>
      <div className="grid4">
        <TextField label="First Name" value={m.doctor.first} onChange={(v) => set({ doctor: { ...m.doctor, first: v } })} />
        <TextField label="Last Name" value={m.doctor.last} onChange={(v) => set({ doctor: { ...m.doctor, last: v } })} />
        <TextField label="Phone" value={m.doctor.phone} onChange={(v) => set({ doctor: { ...m.doctor, phone: v } })} />
        <TextField label="Address" value={m.doctor.address} onChange={(v) => set({ doctor: { ...m.doctor, address: v } })} />
      </div>
      <h3 className="step-h">Dentist Contact</h3>
      <div className="grid4">
        <TextField label="First Name" value={m.dentist.first} onChange={(v) => set({ dentist: { ...m.dentist, first: v } })} />
        <TextField label="Last Name" value={m.dentist.last} onChange={(v) => set({ dentist: { ...m.dentist, last: v } })} />
        <TextField label="Phone" value={m.dentist.phone} onChange={(v) => set({ dentist: { ...m.dentist, phone: v } })} />
        <TextField label="Address" value={m.dentist.address} onChange={(v) => set({ dentist: { ...m.dentist, address: v } })} />
      </div>
      <div className="checkrow">
        <CheckBox label="No insurance" checked={m.insuranceNone} onChange={(v) => set({ insuranceNone: v })} />
        <CheckBox label="No hospital preference" checked={m.hospitalNone} onChange={(v) => set({ hospitalNone: v })} />
      </div>
      <div className="grid2">
        {!m.insuranceNone && <TextField label="Insurance Company" value={m.insurance} onChange={(v) => set({ insurance: v })} />}
        {!m.hospitalNone && <TextField label="Hospital Preference" value={m.hospital} onChange={(v) => set({ hospital: v })} />}
      </div>
      <YesNo label="Does child have any allergies?" value={m.allergies} onChange={(v) => set({ allergies: v })} />
      <YesNo label="Does your child regularly take medications?" value={m.medications} onChange={(v) => set({ medications: v })} />
    </>
  );
}

// ---------- Step 6: Information & Consent ----------
export function InfoStep({ data, patch }: StepProps) {
  const info = data.info;
  const set = (x: Partial<typeof info>) => patch({ info: { ...info, ...x } });
  return (
    <>
      <h3 className="step-h">Other Information</h3>
      <TextField label="What Masjid do you attend?" value={info.masjid} onChange={(v) => set({ masjid: v })} />
      <TextField label="Which Imaam do you consult with?" value={info.imam} onChange={(v) => set({ imam: v })} />
      <div className="grid2">
        <TextField label="Primary language spoken at home" value={info.primaryLanguage} onChange={(v) => set({ primaryLanguage: v })} />
        <TextField label="Secondary language spoken at home" value={info.secondaryLanguage} onChange={(v) => set({ secondaryLanguage: v })} />
      </div>
      <YesNo label="Permission to release child's name/contact to other families (carpooling, events)?" value={info.releaseContact} onChange={(v) => set({ releaseContact: v })} />
      <YesNo label="Permission to photograph/videotape my child for promotional materials?" value={info.photoConsent} onChange={(v) => set({ photoConsent: v })} />
      <div className="ef ef--full">
        <span className="ef-label">Child's Arabic experience</span>
        <div className="yesno-opts">
          {(["none", "classes", "native"] as const).map((o) => (
            <label key={o}><input type="radio" checked={info.arabicExperience === o} onChange={() => set({ arabicExperience: o })} /> {o === "none" ? "No Knowledge" : o === "classes" ? "Taken Classes" : "Native Speaker"}</label>
          ))}
        </div>
      </div>
      <div className="ef ef--full">
        <span className="ef-label">In Qur'an my child has</span>
        <div className="yesno-opts">
          <label><input type="radio" checked={info.quran === "none"} onChange={() => set({ quran: "none" })} /> No Knowledge</label>
          <label><input type="radio" checked={info.quran === "memorizes"} onChange={() => set({ quran: "memorizes" })} /> Memorizes #</label>
        </div>
      </div>
      {info.quran === "memorizes" && <TextField label="of surah" value={info.quranSurah} onChange={(v) => set({ quranSurah: v })} />}
      <TextArea label="Explain your child's experience with Qur'an and/or Arabic" value={info.quranExplain} onChange={(v) => set({ quranExplain: v })} />
    </>
  );
}

// ---------- Step 7: Review & Submit ----------
export function ReviewStep({ data, patch }: StepProps) {
  const s = data.student;
  return (
    <>
      <h3 className="step-h">Review &amp; Submit</h3>
      <p><strong>Student:</strong> {s.given} {s.middle} {s.last} · {s.enteringGrade || "—"} · DOB {s.birthDate || "—"}</p>
      <p><strong>Parent 1:</strong> {data.parent1.firstName} {data.parent1.lastName} · {data.parent1.mobile}</p>
      <p><strong>Parent 2:</strong> {data.parent2.firstName} {data.parent2.lastName}</p>
      <p><strong>Authorized contacts:</strong> {data.contacts.filter((c) => c.firstName).length}</p>
      <p><strong>First time at school:</strong> {data.schools.firstTime ? "Yes" : "No"}</p>
      <p className="muted-count">By submitting you confirm the information is accurate. The school is required by PA law to report cases of child abuse to Child Protective Services.</p>
      <TextField label="Initial here when ready to submit" value={data.submit.initials} onChange={(v) => patch({ submit: { initials: v } })} />
    </>
  );
}

// ---------- Step: Attachments ----------
export function AttachmentsStep(_props: StepProps) {
  return (
    <>
      <h3 className="step-h">File Attachments</h3>
      <p className="ef-label">
        Required documents (e.g. Medical Form, Dental Form) can be uploaded from
        your Parent Portal once this application is submitted. This keeps large
        files out of the application form and stored securely on the server.
      </p>
    </>
  );
}
