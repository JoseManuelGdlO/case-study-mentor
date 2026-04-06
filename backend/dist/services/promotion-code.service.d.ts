export declare function normalizePromotionCode(raw: string): string;
export type PromotionCodeCreateInput = {
    code: string;
    percentOff: number;
    maxRedemptions?: number | null;
    validFrom?: Date | null;
    validUntil?: Date | null;
};
export type PromotionCodeListRow = {
    id: string;
    code: string;
    percentOff: number;
    maxRedemptions: number | null;
    validFrom: string | null;
    validUntil: string | null;
    isActive: boolean;
    stripeCouponId: string;
    stripePromotionCodeId: string;
    createdAt: string;
    updatedAt: string;
    timesRedeemed: number;
};
export declare function createPromotionCode(input: PromotionCodeCreateInput): Promise<PromotionCodeListRow>;
export type PromotionCodeUpdateInput = PromotionCodeCreateInput & {
    isActive?: boolean;
};
export declare function updatePromotionCode(id: string, input: PromotionCodeUpdateInput): Promise<PromotionCodeListRow>;
export declare function deletePromotionCode(id: string): Promise<void>;
export declare function listPromotionCodes(): Promise<PromotionCodeListRow[]>;
export declare function setPromotionCodeActive(id: string, isActive: boolean): Promise<PromotionCodeListRow>;
/** Devuelve el id de Promotion Code de Stripe o null si no se envió código. */
export declare function resolvePromotionCodeForCheckout(userId: string, rawCode: string | undefined): Promise<{
    stripePromotionCodeId: string;
    promotionCodeId: string;
} | null>;
export type ValidatePromotionResult = {
    valid: true;
    percentOff: number;
} | {
    valid: false;
    message: string;
};
export declare function validatePromotionCodeForUser(userId: string, rawCode: string): Promise<ValidatePromotionResult>;
//# sourceMappingURL=promotion-code.service.d.ts.map