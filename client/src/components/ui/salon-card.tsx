import { Salon } from "@/types";
import { Link } from "wouter";

interface SalonCardProps {
  salon: Salon;
  type?: "featured" | "list";
}

export function SalonCard({ salon, type = "featured" }: SalonCardProps) {
  const { id, name, district, city, rating, reviewCount, imageUrl, isFemaleOnly } = salon;
  
  if (type === "featured") {
    return (
      <Link href={`/salon/${id}`}>
        <div className="min-w-[200px] max-w-[200px] rounded-lg overflow-hidden shadow-md bg-white cursor-pointer">
          <div className="relative">
            <img 
              src={imageUrl || "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"} 
              className="w-full h-28 object-cover" 
              alt={name} 
            />
            {isFemaleOnly && (
              <div className="absolute top-2 right-2 bg-accent text-white text-xs py-0.5 px-2 rounded-full">
                صالون نسائي
              </div>
            )}
          </div>
          <div className="p-3">
            <h3 className="font-bold text-sm mb-1">{name}</h3>
            <div className="flex items-center text-xs text-neutral-600 mb-2">
              <span className="material-icons text-xs">location_on</span>
              <span>{district}, {city}</span>
            </div>
            <div className="flex items-center">
              <div className="flex items-center">
                <span className="material-icons text-amber-400 text-sm">star</span>
                <span className="text-xs font-medium mr-1">{rating || 0}</span>
              </div>
              <span className="mx-2 text-neutral-300">|</span>
              <span className="text-xs text-neutral-600">+{reviewCount || 0} تقييم</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }
  
  return (
    <Link href={`/salon/${id}`}>
      <div className="flex bg-white rounded-lg shadow-sm border border-neutral-100 overflow-hidden cursor-pointer">
        <img 
          src={imageUrl || "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"} 
          className="w-24 h-24 object-cover" 
          alt={name} 
        />
        <div className="flex-1 p-3">
          <div className="flex justify-between">
            <h3 className="font-bold text-sm">{name}</h3>
            {isFemaleOnly && (
              <div className="bg-accent text-white text-xs py-0.5 px-2 rounded-full">
                صالون نسائي
              </div>
            )}
          </div>
          <div className="flex items-center text-xs text-neutral-600 mt-1 mb-2">
            <span className="material-icons text-xs">location_on</span>
            <span className="mr-1">{district}, {city}</span>
          </div>
          <div className="flex items-center">
            <div className="flex items-center">
              <span className="material-icons text-amber-400 text-sm">star</span>
              <span className="text-xs font-medium mr-1">{rating || 0}</span>
            </div>
            <span className="mx-2 text-neutral-300">|</span>
            <span className="text-xs text-neutral-600">+{reviewCount || 0} تقييم</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
