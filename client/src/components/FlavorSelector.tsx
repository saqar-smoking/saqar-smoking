import type { CatalogVariant } from "@/lib/catalog";
import { availabilityLabel } from "@/lib/translations";
import { useCommerce } from "@/contexts/CommerceContext";

type FlavorSelectorProps = {
  productId: string;
  variants: CatalogVariant[];
  value?: string;
  onChange: (variantId: string) => void;
};

export function FlavorSelector({ productId, variants, value, onChange }: FlavorSelectorProps) {
  const { language, t } = useCommerce();
  if (!variants.length) return null;

  return <fieldset className="flavor-selector">
    <legend>{t.flavor}</legend>
    <div className="flavor-selector__options">
      {variants.map((variant) => {
        const unavailable = variant.availability === "out_of_stock";
        return <label className={`flavor-option ${unavailable ? "is-unavailable" : ""} ${value === variant.id ? "is-selected" : ""}`} key={variant.id}>
          <input type="radio" name={`flavor-${productId}`} value={variant.id} checked={value === variant.id} disabled={unavailable} onChange={() => onChange(variant.id)} />
          <span>{variant.name}</span>
          {unavailable ? <small>{availabilityLabel(language, variant.availability)}</small> : null}
        </label>;
      })}
    </div>
    {!value ? <span className="flavor-selector__hint">{t.selectFlavor}</span> : null}
  </fieldset>;
}
