/** Generated "food photo": a lit plate on a hue-matched nebula backdrop (no image files needed). */
export default function FoodArt({ item, size = 'md' }) {
  return (
    <div className={`food-art food-art-${size}`} style={{ '--h': item.hue }} role="img" aria-label={item.name}>
      <span className="food-glow" aria-hidden="true" />
      <span className="food-plate" aria-hidden="true" />
      <span className="food-emoji" aria-hidden="true">{item.emoji}</span>
      {item.badge && <span className="food-badge">{item.badge}</span>}
    </div>
  );
}
