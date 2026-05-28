export const CriticalAlertEmail = ({ patientId, pas, pad, glucose }: { patientId: string; pas: number; pad: number; glucose: number }) => (
  <div style={{ fontFamily: 'Arial, sans-serif', color: '#0f172a' }}>
    <h1>Alerta crítica de signos</h1>
    <p>Paciente: {patientId}</p>
    <p>PAS: {pas} / PAD: {pad} / Glucosa: {glucose}</p>
  </div>
);
