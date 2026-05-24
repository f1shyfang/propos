import { TopBar } from "@/components/shared/top-bar";
import { Icon } from "@/components/shared/icon";
import { demoProperties, formatCurrency } from "@/lib/demo-data";

export default function PropertiesPage() {
  return (
    <div>
      <TopBar eyebrow={`${demoProperties.length} seeded properties`} title="Properties" />
      <div style={{ padding: "24px 32px 48px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {demoProperties.map((property, index) => (
            <a key={property.id} href={`/properties/${property.id}`} className="pg-card" style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{ height: 130, background: `linear-gradient(135deg, hsl(${index * 31} 34% 88%), hsl(${index * 31 + 30} 28% 78%))`, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(0,0,0,0.35)", fontWeight: 600, textTransform: "capitalize" }}>
                {property.property_type}
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ fontWeight: 600 }} className="pg-truncate">{property.canonical_address}</div>
                <div style={{ color: "var(--pg-text-dim)", fontSize: 12, marginTop: 3 }}>{property.suburb}, {property.state}</div>
                <div style={{ display: "flex", gap: 10, marginTop: 10, color: "var(--pg-text-dim)", fontSize: 12 }}>
                  <span><Icon name="bed" size={11} /> {property.bedrooms}</span>
                  <span><Icon name="bath" size={11} /> {property.bathrooms}</span>
                  <span><Icon name="car" size={11} /> {property.car_spaces}</span>
                </div>
                <div className="pg-mono" style={{ marginTop: 12, fontWeight: 600 }}>{formatCurrency(property.listing_price)}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
