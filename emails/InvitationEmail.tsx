export const InvitationEmail = ({ doctorName, token, expiresInDays }: { doctorName: string; token: string; expiresInDays: number }) => (
  <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', color: '#0f172a', lineHeight: 1.6 }}>
    <h1>Has sido invitado a MedAlert</h1>
    <p>El Dr. {doctorName} te ha invitado a unirte a su red de seguimiento clínico.</p>
    <p>Código de acceso temporal: <strong>{token}</strong></p>
    <p>Este enlace expira en {expiresInDays} días.</p>
  </div>
);
