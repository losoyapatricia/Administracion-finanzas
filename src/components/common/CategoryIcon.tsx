import React from 'react';
import * as LucideIcons from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
  color?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ 
  name, 
  className = 'w-4 h-4', 
  size = 16,
  color
}) => {
  // Map icon names safely to Lucide icons
  const iconMap: Record<string, any> = {
    Utensils: LucideIcons.Utensils,
    Home: LucideIcons.Home,
    Car: LucideIcons.Car,
    HeartPulse: LucideIcons.HeartPulse,
    GraduationCap: LucideIcons.GraduationCap,
    Film: LucideIcons.Film,
    Shirt: LucideIcons.Shirt,
    Zap: LucideIcons.Zap,
    CreditCard: LucideIcons.CreditCard,
    HelpCircle: LucideIcons.HelpCircle,
    ShoppingCart: LucideIcons.ShoppingCart,
    Coffee: LucideIcons.Coffee,
    Smartphone: LucideIcons.Smartphone,
    Plane: LucideIcons.Plane,
    Gift: LucideIcons.Gift,
    Briefcase: LucideIcons.Briefcase,
    Activity: LucideIcons.Activity,
    BookOpen: LucideIcons.BookOpen,
    PiggyBank: LucideIcons.PiggyBank,
    DollarSign: LucideIcons.DollarSign,
    Shield: LucideIcons.Shield,
    Tag: LucideIcons.Tag,
  };

  const IconComponent = iconMap[name] || LucideIcons.Tag;

  return <IconComponent className={className} size={size} style={color ? { color } : undefined} />;
};
