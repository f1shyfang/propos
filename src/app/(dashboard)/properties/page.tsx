import { TopBar } from "@/components/shared/top-bar";
import { Icon } from "@/components/shared/icon";
import { demoProperties, formatCurrency } from "@/lib/demo-data";
import Link from "next/link";

export default function PropertiesPage() {
  return (
    <div className="flex flex-col h-full bg-[var(--pg-surface)]">
      <TopBar eyebrow={`${demoProperties.length} seeded properties`} title="Properties" />
      <div className="flex-1 p-6 md:p-8 xl:p-10 overflow-auto pg-scroll">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {demoProperties.map((property, index) => (
            <Link key={property.id} href={`/properties/${property.id}`} className="pg-card p-0 flex flex-col no-underline text-inherit shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
              <div 
                className="h-32 flex items-center justify-center text-black/30 font-semibold capitalize relative" 
                style={{ background: `linear-gradient(135deg, hsl(${index * 31} 34% 88%), hsl(${index * 31 + 30} 28% 78%))` }}
              >
                {property.property_type}
                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent"></div>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="font-semibold text-[15px] pg-truncate">{property.canonical_address}</div>
                <div className="text-[var(--pg-text-dim)] text-xs mt-1">{property.suburb}, {property.state}</div>
                <div className="flex gap-3 mt-4 text-[var(--pg-text-dim)] text-xs">
                  <span className="flex items-center gap-1"><Icon name="bed" size={11} /> {property.bedrooms}</span>
                  <span className="flex items-center gap-1"><Icon name="bath" size={11} /> {property.bathrooms}</span>
                  <span className="flex items-center gap-1"><Icon name="car" size={11} /> {property.car_spaces}</span>
                </div>
                <div className="pg-mono mt-auto pt-4 font-semibold text-[13.5px]">{formatCurrency(property.listing_price)}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
