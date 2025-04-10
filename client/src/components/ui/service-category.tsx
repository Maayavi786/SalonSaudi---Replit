import { ServiceCategory } from "@/types";

interface ServiceCategoryProps {
  category: ServiceCategory;
  onClick?: () => void;
}

export function ServiceCategoryItem({ category, onClick }: ServiceCategoryProps) {
  const { name, icon } = category;
  
  return (
    <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={onClick}>
      <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center">
        <span className="material-icons text-primary text-2xl">{icon}</span>
      </div>
      <span className="text-xs text-center">{name}</span>
    </div>
  );
}

interface ServiceCategoriesGridProps {
  categories: ServiceCategory[];
  onCategoryClick?: (category: ServiceCategory) => void;
}

export function ServiceCategoriesGrid({ categories, onCategoryClick }: ServiceCategoriesGridProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {categories.map((category) => (
        <ServiceCategoryItem 
          key={category.id} 
          category={category} 
          onClick={() => onCategoryClick?.(category)} 
        />
      ))}
    </div>
  );
}
