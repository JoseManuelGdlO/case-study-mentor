/** Usa process.env tras dotenv: evita desajustes si env se evaluó antes de cargar SMTP. */
export declare function isSmtpConfigured(): boolean;
export declare function sendTemporaryPasswordEmail(to: string, plainPassword: string): Promise<void>;
export declare function sendGoogleAccountNoticeEmail(to: string): Promise<void>;
//# sourceMappingURL=email.service.d.ts.map