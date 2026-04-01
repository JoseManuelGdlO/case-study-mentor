import { z } from 'zod';
export declare const specialtyCreateSchema: z.ZodObject<{
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
}, {
    name: string;
}>;
export declare const specialtyUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
}, {
    name?: string | undefined;
}>;
export declare const areaCreateSchema: z.ZodObject<{
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
}, {
    name: string;
}>;
export declare const phraseCreateSchema: z.ZodObject<{
    text: z.ZodString;
    author: z.ZodString;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    text: string;
    author: string;
    isActive?: boolean | undefined;
}, {
    text: string;
    author: string;
    isActive?: boolean | undefined;
}>;
export declare const phraseUpdateSchema: z.ZodObject<{
    text: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    text?: string | undefined;
    author?: string | undefined;
    isActive?: boolean | undefined;
}, {
    text?: string | undefined;
    author?: string | undefined;
    isActive?: boolean | undefined;
}>;
export declare const examDateCreateSchema: z.ZodObject<{
    name: z.ZodString;
    date: z.ZodString;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    date: string;
    name: string;
    isActive?: boolean | undefined;
}, {
    date: string;
    name: string;
    isActive?: boolean | undefined;
}>;
export declare const examDateUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    date: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    date?: string | undefined;
    name?: string | undefined;
    isActive?: boolean | undefined;
}, {
    date?: string | undefined;
    name?: string | undefined;
    isActive?: boolean | undefined;
}>;
export declare const planCreateSchema: z.ZodObject<{
    name: z.ZodString;
    price: z.ZodNumber;
    duration: z.ZodNumber;
    features: z.ZodString;
    isActive: z.ZodOptional<z.ZodBoolean>;
    highlighted: z.ZodOptional<z.ZodBoolean>;
    /** monthly | semester | annual — recomendado para enlazar con el checkout. */
    tier: z.ZodOptional<z.ZodEnum<["monthly", "semester", "annual"]>>;
    /** Plan de facturación PayPal (P-...), opcional si se crea por API. */
    paypalPlanId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    price: number;
    duration: number;
    features: string;
    tier?: "monthly" | "semester" | "annual" | undefined;
    isActive?: boolean | undefined;
    highlighted?: boolean | undefined;
    paypalPlanId?: string | undefined;
}, {
    name: string;
    price: number;
    duration: number;
    features: string;
    tier?: "monthly" | "semester" | "annual" | undefined;
    isActive?: boolean | undefined;
    highlighted?: boolean | undefined;
    paypalPlanId?: string | undefined;
}>;
export declare const planUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodNumber>;
    duration: z.ZodOptional<z.ZodNumber>;
    features: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    highlighted: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    tier: z.ZodOptional<z.ZodOptional<z.ZodEnum<["monthly", "semester", "annual"]>>>;
    paypalPlanId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    tier?: "monthly" | "semester" | "annual" | undefined;
    isActive?: boolean | undefined;
    price?: number | undefined;
    duration?: number | undefined;
    features?: string | undefined;
    highlighted?: boolean | undefined;
    paypalPlanId?: string | undefined;
}, {
    name?: string | undefined;
    tier?: "monthly" | "semester" | "annual" | undefined;
    isActive?: boolean | undefined;
    price?: number | undefined;
    duration?: number | undefined;
    features?: string | undefined;
    highlighted?: boolean | undefined;
    paypalPlanId?: string | undefined;
}>;
export declare const userRoleUpdateSchema: z.ZodObject<{
    roles: z.ZodArray<z.ZodEnum<["admin", "editor", "user"]>, "many">;
}, "strip", z.ZodTypeAny, {
    roles: ("admin" | "editor" | "user")[];
}, {
    roles: ("admin" | "editor" | "user")[];
}>;
/** Admin: actualizar correo y/o rol(es). Al menos uno de los dos. */
export declare const backofficeUserUpdateSchema: z.ZodEffects<z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    roles: z.ZodOptional<z.ZodArray<z.ZodEnum<["admin", "editor", "user"]>, "many">>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    roles?: ("admin" | "editor" | "user")[] | undefined;
}, {
    email?: string | undefined;
    roles?: ("admin" | "editor" | "user")[] | undefined;
}>, {
    email?: string | undefined;
    roles?: ("admin" | "editor" | "user")[] | undefined;
}, {
    email?: string | undefined;
    roles?: ("admin" | "editor" | "user")[] | undefined;
}>;
export declare const backofficeUserCreateSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    roles: z.ZodArray<z.ZodEnum<["admin", "editor", "user"]>, "many">;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roles: ("admin" | "editor" | "user")[];
}, {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roles: ("admin" | "editor" | "user")[];
}>;
export declare const backofficeUsersQuerySchema: z.ZodObject<{
    search: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<["admin", "editor", "user"]>>;
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    search?: string | undefined;
    role?: "admin" | "editor" | "user" | undefined;
    limit?: number | undefined;
    page?: number | undefined;
}, {
    search?: string | undefined;
    role?: "admin" | "editor" | "user" | undefined;
    limit?: number | undefined;
    page?: number | undefined;
}>;
//# sourceMappingURL=backoffice.schema.d.ts.map