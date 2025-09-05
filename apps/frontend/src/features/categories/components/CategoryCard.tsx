import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Folder, Target } from 'lucide-react';
import type { Category } from '@/lib/database/schemas';

interface CategoryCardProps {
  category: Category;
  onEdit?: (category: Category) => void;
  onDelete?: (categoryId: number) => void;
}

const categoryTypeIcons = {
  income: Target,
  expense: Folder,
  debt: Folder,
  investment: Target,
  savings: Target,
} as const;

export function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  const IconComponent = categoryTypeIcons[category.type];
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-muted-foreground border border-[#000]/90">
              <IconComponent className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{category.name}</h3>
              <p className="text-xs text-muted-foreground capitalize">{category.type}</p>
            </div>
          </div>
          <div className="flex space-x-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(category)}
                className="h-8 w-8 p-0"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(category.id)}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      {category.description && (
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">{category.description}</p>
        </CardContent>
      )}
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {category.isActive ? 'Active' : 'Inactive'}
          </Badge>
          {category.monthlyBudgetLimit && (
            <span className="text-xs text-muted-foreground">
              Budget: ${category.monthlyBudgetLimit}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
