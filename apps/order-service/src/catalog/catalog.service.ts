import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE_ORM, DrizzleDB } from '../drizzle/drizzle.module';
import { serviceCategories, serviceItems } from '@spinzo/db';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class CatalogService {
  constructor(@Inject(DRIZZLE_ORM) private db: DrizzleDB) {}

  /**
   * Returns all active service categories with their items.
   * Supports multi-store by filtering on storeId when provided.
   * Falls back to global catalog when no storeId is given.
   */
  async getServices(storeId?: string) {
    const categoryConditions: any[] = [eq(serviceCategories.isActive, true)];
    if (storeId) {
      // Store-specific catalog takes precedence, global (null storeId) is fallback
      categoryConditions.push(eq(serviceCategories.storeId, storeId));
    }

    const categories = await this.db
      .select()
      .from(serviceCategories)
      .where(and(...categoryConditions))
      .orderBy(serviceCategories.sortOrder);

    // Enrich each category with its items
    const enriched = await Promise.all(
      categories.map(async (cat) => {
        const items = await this.db
          .select()
          .from(serviceItems)
          .where(
            and(
              eq(serviceItems.categoryId, cat.id),
              eq(serviceItems.isActive, true),
            ),
          )
          .orderBy(serviceItems.sortOrder);
        return { ...cat, items };
      }),
    );

    return enriched;
  }

  async getCategoryBySlug(slug: string) {
    const [cat] = await this.db
      .select()
      .from(serviceCategories)
      .where(
        and(eq(serviceCategories.slug, slug), eq(serviceCategories.isActive, true)),
      );

    if (!cat) return null;

    const items = await this.db
      .select()
      .from(serviceItems)
      .where(
        and(
          eq(serviceItems.categoryId, cat.id),
          eq(serviceItems.isActive, true),
        ),
      )
      .orderBy(serviceItems.sortOrder);

    return { ...cat, items };
  }
}
