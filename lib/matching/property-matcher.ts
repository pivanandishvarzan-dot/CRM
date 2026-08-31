import type { Property } from '@/lib/types';

export type ApplicantPreferences = {
  requestType?: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  cities?: string[];
  districts?: string[];
  propertyTypes?: string[];
  minRooms?: number | null;
  requiredFeatures?: string[];
};

export type PropertyMatch = {
  property: Property;
  score: number;
  reasons: string[];
};

export function matchProperties(applicant: ApplicantPreferences, properties: Property[]): PropertyMatch[] {
  return properties
    .map((property) => {
      let score = 0;
      const reasons: string[] = [];

      if (!applicant.requestType || property.deal.includes(applicant.requestType) || applicant.requestType.includes(property.deal)) {
        score += 20;
        reasons.push('نوع معامله متناسب');
      }

      if (applicant.budgetMax != null) {
        if (property.price <= applicant.budgetMax && (applicant.budgetMin == null || property.price >= applicant.budgetMin)) {
          score += 30;
          reasons.push('داخل بازه بودجه');
        } else if (property.price <= applicant.budgetMax * 1.1) {
          score += 12;
          reasons.push('کمی بالاتر از بودجه');
        }
      } else {
        score += 10;
      }

      if (!applicant.cities?.length || applicant.cities.includes(property.city)) {
        score += 10;
        if (applicant.cities?.length) reasons.push('شهر موردنظر');
      }

      if (!applicant.districts?.length || applicant.districts.includes(property.district)) {
        score += applicant.districts?.length ? 20 : 5;
        if (applicant.districts?.length) reasons.push('محله موردنظر');
      }

      if (!applicant.propertyTypes?.length || applicant.propertyTypes.includes(property.type)) {
        score += applicant.propertyTypes?.length ? 10 : 5;
        if (applicant.propertyTypes?.length) reasons.push('نوع ملک مناسب');
      }

      if (applicant.minRooms == null || property.rooms >= applicant.minRooms) {
        score += 5;
        if (applicant.minRooms != null) reasons.push('تعداد خواب کافی');
      }

      const required = applicant.requiredFeatures || [];
      if (required.length) {
        const matchedFeatures = required.filter((feature) => property.features.includes(feature));
        const featureScore = Math.round((matchedFeatures.length / required.length) * 5);
        score += featureScore;
        if (matchedFeatures.length) reasons.push(`${matchedFeatures.length} امکان ضروری موجود`);
      } else {
        score += 5;
      }

      if (property.status === 'فعال' || property.status === 'ویژه') {
        score += 5;
        reasons.push('فایل قابل اقدام');
      }

      return { property, score: Math.min(score, 100), reasons };
    })
    .filter((item) => item.score >= 25)
    .sort((a, b) => b.score - a.score);
}
