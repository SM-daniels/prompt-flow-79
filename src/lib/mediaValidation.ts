export type MediaType = 'image' | 'audio' | 'video' | 'document';

export interface MediaValidationResult {
  valid: boolean;
  error?: string;
  type?: MediaType;
}

const MIME_TYPE_MAP: Record<string, MediaType> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'audio/mpeg': 'audio',
  'audio/mp3': 'audio',
  'audio/wav': 'audio',
  'audio/ogg': 'audio',
  'video/mp4': 'video',
  'video/webm': 'video',
  'application/pdf': 'document',
};

const MAX_SIZE_BY_TYPE: Record<MediaType, number> = {
  image: 10 * 1024 * 1024, // 10MB
  audio: 50 * 1024 * 1024, // 50MB
  video: 50 * 1024 * 1024, // 50MB
  document: 20 * 1024 * 1024, // 20MB
};

export const validateMediaFile = (file: File): MediaValidationResult => {
  const mediaType = MIME_TYPE_MAP[file.type];

  if (!mediaType) {
    return {
      valid: false,
      error: 'Tipo de arquivo não suportado. Use imagens, áudios, vídeos ou PDFs.',
    };
  }

  const maxSize = MAX_SIZE_BY_TYPE[mediaType];
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo para ${mediaType}: ${maxSizeMB}MB`,
    };
  }

  return {
    valid: true,
    type: mediaType,
  };
};

export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
};
