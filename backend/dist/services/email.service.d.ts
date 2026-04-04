/** Usa process.env tras dotenv: evita desajustes si env se evaluó antes de cargar SMTP. */
export declare function isSmtpConfigured(): boolean;
export declare function sendTemporaryPasswordEmail(to: string, plainPassword: string): Promise<void>;
export declare function sendGoogleAccountNoticeEmail(to: string): Promise<void>;
/** Aviso a administradores: registro público nuevo. */
export declare function sendAdminNewRegistrationEmail(to: string, payload: {
    displayName: string;
    email: string;
    userId: string;
}): Promise<void>;
/** Aviso a administradores: usuario pasó a plan de pago. */
export declare function sendAdminNewSubscriptionEmail(to: string, payload: {
    displayName: string;
    email: string;
    userId: string;
    planLabel: string;
}): Promise<void>;
//# sourceMappingURL=email.service.d.ts.map