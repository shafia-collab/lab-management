// ---------- DATA (loaded from browser storage; starts empty) ----------
function load(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (e) {
    return [];
  }
}

function save() {
  try {
    localStorage.setItem("lab_patients", JSON.stringify(patients));
    localStorage.setItem("lab_orders", JSON.stringify(orders));
    localStorage.setItem("lab_samples", JSON.stringify(samples));
    localStorage.setItem("lab_reports", JSON.stringify(reports));
  } catch (e) {
    console.error("Could not save data:", e);
  }
}

let patients = load("lab_patients");
let orders   = load("lab_orders");
let samples  = load("lab_samples");
let reports  = load("lab_reports");

// ---------- HELPERS ----------
const $ = (id) => document.getElementById(id);

function getResult(value) {
  if (value <= 100) return "Normal";
  if (value <= 150) return "Moderate";
  return "High";
}

function emptyRow(cols, msg) {
  return `<tr><td colspan="${cols}" style="color:#777;">${msg}</td></tr>`;
}

function resultClass(result) {
  return "res-" + result.toLowerCase();
}

// ---------- RENDER ----------
function renderPatients() {
  $("patientTable").innerHTML = patients.length === 0 ? emptyRow(5, "No patients added yet") : patients.map(p =>
    `<tr><td>${p.id}</td><td>${p.name}</td><td>${p.age}</td><td>${p.gender}</td><td>${p.phone}</td></tr>`
  ).join("");

  $("orderPatient").innerHTML = '<option value="">-- Select Patient --</option>' +
    patients.map(p => `<option value="${p.name}">${p.name}</option>`).join("");
}

function renderOrders() {
  $("orderTable").innerHTML = orders.length === 0 ? emptyRow(3, "No test orders yet") : orders.map(o =>
    `<tr><td>${o.id}</td><td>${o.patient}</td><td>${o.test}</td></tr>`
  ).join("");

  $("sampleOrder").innerHTML = '<option value="">-- Select Test Order --</option>' +
    orders.map(o => `<option value="${o.id}">#${o.id} - ${o.patient} - ${o.test}</option>`).join("");
}

function renderSamples() {
  $("sampleTable").innerHTML = samples.length === 0 ? emptyRow(5, "No samples added yet") : samples.map(s =>
    `<tr><td>${s.id}</td><td>${s.patient}</td><td>${s.test}</td><td>${s.type}</td><td>${s.value}</td></tr>`
  ).join("");
}

function renderReports() {
  $("reportTable").innerHTML = reports.length === 0 ? emptyRow(6, "No reports generated yet") : reports.map(r =>
    `<tr><td>${r.id}</td><td>${r.patient}</td><td>${r.test}</td><td>${r.type}</td><td>${r.value}</td>
     <td class="${resultClass(r.result)}">${r.result}</td></tr>`
  ).join("");
}

// ---------- PATIENTS ----------
$("addPatientBtn").addEventListener("click", () => {
  const name = $("pName").value.trim();
  const age = $("pAge").value.trim();
  const gender = $("pGender").value;
  const phone = $("pPhone").value.trim();

  if (!name || !age || !phone) {
    alert("Please fill in all patient details.");
    return;
  }
  if (!/^\d{10}$/.test(phone)) {
    alert("Phone number must be 10 digits.");
    return;
  }

  patients.push({ id: patients.length + 1, name, age, gender, phone });
  save();
  renderPatients();

  $("pName").value = "";
  $("pAge").value = "";
  $("pPhone").value = "";
  $("pGender").selectedIndex = 0;
});

// ---------- TEST ORDERS ----------
$("addOrderBtn").addEventListener("click", () => {
  const patient = $("orderPatient").value;
  const test = $("orderTest").value;

  if (!patient || !test) {
    alert("Please select a patient and a test.");
    return;
  }

  orders.push({ id: orders.length + 1, patient, test });
  save();
  renderOrders();

  $("orderPatient").selectedIndex = 0;
  $("orderTest").selectedIndex = 0;
});

// ---------- SAMPLES ----------
$("sampleOrder").addEventListener("change", () => {
  const order = orders.find(o => o.id == $("sampleOrder").value);
  $("samplePatient").value = order ? order.patient : "";
  $("sampleTest").value = order ? order.test : "";
});

$("addSampleBtn").addEventListener("click", () => {
  const order = orders.find(o => o.id == $("sampleOrder").value);
  const type = $("sampleType").value;
  const value = $("sampleValue").value;

  if (!order || !type || value === "") {
    alert("Please select a test order, sample type and enter the test value.");
    return;
  }

  const num = Number(value);
  const sampleId = samples.length + 1;

  samples.push({ id: sampleId, patient: order.patient, test: order.test, type, value: num });
  reports.push({
    id: "R" + (reports.length + 1),
    patient: order.patient,
    test: order.test,
    type,
    value: num,
    result: getResult(num)
  });

  save();
  renderSamples();
  renderReports();

  $("sampleOrder").selectedIndex = 0;
  $("samplePatient").value = "";
  $("sampleTest").value = "";
  $("sampleType").selectedIndex = 0;
  $("sampleValue").value = "";
});

// ---------- DOWNLOAD LAST REPORT ----------
$("downloadBtn").addEventListener("click", () => {
  if (reports.length === 0) {
    alert("No reports available to download.");
    return;
  }

  const r = reports[reports.length - 1];
  const patient = patients.find(p => p.name === r.patient);
  const date = new Date().toLocaleString();

  const content =
`==========================================
        LABORATORY REPORT
==========================================
Report ID    : ${r.id}
Date         : ${date}

Patient Name : ${r.patient}
Age / Gender : ${patient ? patient.age + " / " + patient.gender : "-"}
Phone        : ${patient ? patient.phone : "-"}

Test Name    : ${r.test}
Sample Type  : ${r.type}
Actual Value : ${r.value}
Result       : ${r.result}
==========================================
`;

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Report_${r.id}_${r.patient}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// ---------- INIT ----------
renderPatients();
renderOrders();
renderSamples();
renderReports();