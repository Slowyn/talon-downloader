import {z} from 'zod';

export const talonSchema = z.object({
    '#': z.number(),
});
export type TalonSchema = z.infer<typeof talonSchema>;

export const talonSheetSchema = z.array(talonSchema);
export type TalonSheetSchema = z.infer<typeof talonSheetSchema>;
