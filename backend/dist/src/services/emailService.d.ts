export declare class EmailService {
    private static transporter;
    static initialize(): void;
    static sendPasswordResetEmail(email: string, resetToken: string, userName: string): Promise<void>;
    private static getPasswordResetEmailTemplate;
    static testConnection(): Promise<boolean>;
}
//# sourceMappingURL=emailService.d.ts.map