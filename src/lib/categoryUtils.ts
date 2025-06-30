/**
 * Utility functions for handling place categories
 */

/**
 * Map of place category codes to their Japanese display names
 */
const categoryMap: Record<string, string> = {
  // Common categories
  restaurant: "レストラン",
  cafe: "カフェ",
  hotel: "ホテル",
  other: "その他",

  // Shopping and commerce
  shopping: "ショッピング",
  shop: "ショップ",

  // Entertainment and culture
  entertainment: "エンターテイメント",
  culture: "文化施設",
  museum: "博物館",
  attraction: "観光地",

  // Nature and outdoors
  nature: "自然",
  park: "公園",

  // Historical and religious
  historical: "歴史的建造物",
  religious: "宗教施設",
  temple: "寺院・神社",

  // Infrastructure and services
  transportation: "交通機関",
  hospital: "医療機関",
  education: "教育機関",
  office: "オフィス",
};

/**
 * Get the Japanese display name for a place category
 * @param category - The category code
 * @returns The Japanese display name for the category, or the original category if not found
 */
export function getCategoryDisplayName(category: string): string {
  return categoryMap[category] || category;
}

/**
 * Get all available category mappings
 * @returns Record of all category codes to display names
 */
export function getAllCategories(): Record<string, string> {
  return { ...categoryMap };
}

/**
 * Check if a category code is valid/supported
 * @param category - The category code to check
 * @returns True if the category is supported
 */
export function isValidCategory(category: string): boolean {
  return category in categoryMap;
}
