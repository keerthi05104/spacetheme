import { useApp } from '../context/AppContext';

export default function NotFound() {
  const { navigate } = useApp();
  return (
    <section className="page-pad container center-col">
      <div className="empty-orb" aria-hidden="true" />
      <h1 className="page-title">Lost in space</h1>
      <p className="muted">That page drifted out of range. Let's get you back to the station.</p>
      <button type="button" className="btn btn-primary" onClick={() => navigate('/')}>Return home</button>
    </section>
  );
}
