/** Full-area loading state with an orbiting dot animation (pure CSS). */
export default function Loader({ label = 'Preparing for launch…', fullscreen = false }) {
  return (
    <div className={`loader ${fullscreen ? 'loader-full' : ''}`} role="status" aria-live="polite">
      <div className="loader-orbit" aria-hidden="true">
        <span className="loader-planet" />
        <span className="loader-moon" />
      </div>
      <p>{label}</p>
    </div>
  );
}
