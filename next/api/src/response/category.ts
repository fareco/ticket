import { Category } from '@/model/Category';
import { TicketFieldVariant } from '@/model/TicketFieldVariant';

export class CategoryResponse {
  constructor(readonly category: Category) {}

  toJSON() {
    return {
      id: this.category.id,
      name: this.category.name,
      parentId: this.category.parentId,
      position: this.category.order ?? this.category.createdAt.getTime(),
      active: !this.category.deletedAt,
      template: this.category.qTemplate,
    };
  }
}

export class CategoryFieldResponse {
  constructor(readonly variant: TicketFieldVariant) {}

  toJSON() {
    return {
      id: this.variant.field!.id,
      title: this.variant.title,
      type: this.variant.field!.type,
      required: this.variant.field!.required,
      options: this.variant.options,
    };
  }
}
