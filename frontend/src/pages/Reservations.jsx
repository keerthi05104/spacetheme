import Reservation from '../components/Reservation';

export default function Reservations() {
  return (
    <section className="page-pad container">
      <header className="page-head">
        <span className="eyebrow">Reserve a table</span>
        <h1 className="page-title">Book your seat among the stars</h1>
        <p className="muted">Pick a date, a package and the planet you want outside your window.</p>
      </header>
      <Reservation />
    </section>
  );
}
