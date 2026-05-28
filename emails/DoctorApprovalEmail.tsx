export const DoctorApprovalEmail = ({ name }: { name: string }) => (
  <div style={{ fontFamily: 'Arial, sans-serif', color: '#0f172a' }}>
    <h1>Tu verificación fue aprobada</h1>
    <p>Hola {name}, tu cuenta profesional ya está activa.</p>
  </div>
);

export const DoctorRejectionEmail = ({ name, reason }: { name: string; reason: string }) => (
  <div style={{ fontFamily: 'Arial, sans-serif', color: '#0f172a' }}>
    <h1>Tu verificación fue rechazada</h1>
    <p>Hola {name}, tu solicitud no pudo aprobarse.</p>
    <p>Motivo: {reason}</p>
  </div>
);
