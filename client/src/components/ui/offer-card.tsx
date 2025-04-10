import { SpecialOffer } from "@/types";

interface OfferCardProps {
  offer: SpecialOffer;
  onClick?: () => void;
}

export function OfferCard({ offer, onClick }: OfferCardProps) {
  const { title, description, originalPrice, discountedPrice, imageUrl } = offer;
  const gradientClass = Math.random() > 0.5 
    ? "bg-gradient-to-l from-primary-light to-primary"
    : "bg-gradient-to-l from-secondary to-primary-light";
  
  return (
    <div 
      className={`${gradientClass} rounded-xl overflow-hidden shadow-md cursor-pointer`}
      onClick={onClick}
    >
      <div className="flex">
        <div className="flex-1 p-4 text-white">
          <span className="inline-block bg-accent text-xs px-2 py-0.5 rounded-full mb-2">عرض محدود</span>
          <h3 className="font-bold text-sm">{title}</h3>
          <p className="text-xs opacity-90 mb-2">{description}</p>
          <div className="flex items-baseline">
            <span className="text-sm font-bold">{discountedPrice} ريال</span>
            <span className="text-xs line-through opacity-80 mr-2">{originalPrice} ريال</span>
          </div>
        </div>
        <div className="w-1/3 relative">
          <img 
            src={imageUrl || "https://images.unsplash.com/photo-1588110704195-04133cc1daca?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"} 
            className="h-full w-full object-cover" 
            alt={title} 
          />
        </div>
      </div>
    </div>
  );
}
