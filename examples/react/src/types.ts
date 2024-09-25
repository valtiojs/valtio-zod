import { z } from 'zod';

export type ImageMetadataType = {
  base64: string;
  filename: string;
  tags: string[];
  title: string;
  contentType: string;
  width: number;
  height: number;
};

export type SelectFieldOption = { label: string; value: string };

// Base64 validation regex
const base64Regex =
  /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

// Content type validation regex (matches any MIME type starting with 'image/')
const contentTypeRegex = /^image\/[a-zA-Z0-9+\.-]+$/;

// Filename validation regex (simple validation to exclude invalid filename characters)
const filenameRegex = /^[^<>:"/\\|?*\x00-\x1F]+$/;

// Define the ImageMetadata schema
export const ImageMetadataSchema = z.object({
  base64: z.string().regex(base64Regex, { message: 'Invalid image data' }),
  filename: z
    .string({ required_error: 'Filename cannot be empty' })
    .regex(filenameRegex, { message: 'Filename contains invalid characters' }),
  tags: z.array(z.string({ required_error: 'Tags cannot be empty strings' })),
  title: z.string({ required_error: 'Title cannot be empty' }),
  contentType: z.string().regex(contentTypeRegex, {
    message:
      'Content type must start with "image/" and contain valid characters',
  }),
  width: z
    .number()
    .int({ message: 'Width must be an integer' })
    .positive({ message: 'Width must be a positive number' }),
  height: z
    .number()
    .int({ message: 'Height must be an integer' })
    .positive({ message: 'Height must be a positive number' }),
});

// Export the TypeScript type inferred from the schema
export type ImageMetadata = z.infer<typeof ImageMetadataSchema>;
