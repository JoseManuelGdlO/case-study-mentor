export declare function processBulkUpload(buffer: Buffer, userId: string): Promise<{
    data: {
        success: number;
        errors: {
            row: number;
            error: string;
        }[];
    };
}>;
//# sourceMappingURL=bulkUpload.service.d.ts.map