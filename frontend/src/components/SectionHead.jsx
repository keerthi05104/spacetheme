import Reveal from './Reveal';

export default function SectionHead({ eyebrow, title, children, align = 'left' }) {
  return (
    <Reveal className={`section-head align-${align}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </Reveal>
  );
}
