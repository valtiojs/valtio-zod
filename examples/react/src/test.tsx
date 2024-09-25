import { ImageMetadataSchema, ImageMetadata } from './types'
import { schema } from '../../../src/index'

const store = schema(ImageMetadataSchema).proxy<ImageMetadata>({
  base64: null
})
