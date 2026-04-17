export type CollaboratorCodeListRow = {
    id: string;
    code: string;
    displayName: string;
    promotionCodeId: string | null;
    percentOff: number | null;
    isActive: boolean;
    signupCount: number;
    createdAt: string;
    updatedAt: string;
};
export type CollaboratorCodeCreateInput = {
    code: string;
    displayName: string;
    /** Si true, solo atribución; si false, se crea también PromotionCode con descuento. */
    attributionOnly: boolean;
    /** Requerido cuando attributionOnly es false */
    percentOff?: number;
    maxRedemptions?: number | null;
    validFrom?: Date | null;
    validUntil?: Date | null;
};
export declare function listCollaboratorCodes(): Promise<CollaboratorCodeListRow[]>;
export declare function createCollaboratorCode(input: CollaboratorCodeCreateInput): Promise<CollaboratorCodeListRow>;
export declare function setCollaboratorCodeActive(id: string, isActive: boolean): Promise<CollaboratorCodeListRow>;
export declare function updateCollaboratorCodeDisplayName(id: string, displayName: string): Promise<CollaboratorCodeListRow>;
export declare function deleteCollaboratorCode(id: string): Promise<void>;
/** Resuelve colaborador primero; si no hay, código promocional standalone. */
/** PayPal no aplica cupones Stripe; rechazar código promocional “solo descuento” sin colaborador. */
export declare function assertPayPalSubscriptionCheckoutCodes(resolved: {
    promotion: {
        stripePromotionCodeId: string;
        promotionCodeId: string;
    } | null;
    collaboratorCodeId: string | null;
}): void;
export declare function resolveSubscriptionCheckoutCodes(userId: string, rawCode: string | undefined): Promise<{
    promotion: {
        stripePromotionCodeId: string;
        promotionCodeId: string;
    } | null;
    collaboratorCodeId: string | null;
}>;
export type ValidateCheckoutCodeResult = {
    valid: true;
    kind: 'collaborator';
    displayName: string;
    percentOff: number;
} | {
    valid: true;
    kind: 'promotion';
    percentOff: number;
} | {
    valid: false;
    message: string;
};
export declare function validateCheckoutCodeForUser(userId: string, rawCode: string): Promise<ValidateCheckoutCodeResult>;
/**
 * Asigna colaborador al perfil la primera vez (no sobrescribe).
 * Valida que el id exista y esté activo.
 */
export declare function assignCollaboratorCodeToProfileIfEmpty(userId: string, collaboratorCodeId: string | null | undefined): Promise<void>;
//# sourceMappingURL=collaborator-code.service.d.ts.map