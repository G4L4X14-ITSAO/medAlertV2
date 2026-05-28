export const MedicationSuggestionEmail = ({ patientName, medicationName, dose, schedule, notes, patientId }: any) => (
  <div style={{ fontFamily: 'Arial, sans-serif', color: '#0f172a' }}>
    <h1>Nuevo medicamento sugerido</h1>
    <p>Paciente: {patientName}</p>
    <p>Medicamento: {medicationName}</p>
    <p>Dosis: {dose}</p>
    <p>Horario: {schedule}</p>
    <p>Notas: {notes}</p>
    <p>Paciente ID: {patientId}</p>
  </div>
);
