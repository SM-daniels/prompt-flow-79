import { supabase } from './supabase';
import { sanitizeFilename } from './mediaValidation';

export interface MediaItem {
  id: string;
  type: 'image' | 'audio' | 'video' | 'document';
  url: string;
  name: string;
  size: number;
  mime_type: string;
  thumbnail_url?: string;
}

export const uploadMedia = async (
  file: File,
  organizationId: string,
  messageId: string
): Promise<MediaItem> => {
  const sanitizedName = sanitizeFilename(file.name);
  const filePath = `${organizationId}/${messageId}/${Date.now()}-${sanitizedName}`;

  const { data, error } = await supabase.storage
    .from('messages-media')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('messages-media')
    .getPublicUrl(data.path);

  const mediaType = file.type.startsWith('image/')
    ? 'image'
    : file.type.startsWith('audio/')
    ? 'audio'
    : file.type.startsWith('video/')
    ? 'video'
    : 'document';

  return {
    id: crypto.randomUUID(),
    type: mediaType,
    url: urlData.publicUrl,
    name: file.name,
    size: file.size,
    mime_type: file.type,
  };
};

export const deleteMedia = async (path: string): Promise<void> => {
  const { error } = await supabase.storage
    .from('messages-media')
    .remove([path]);

  if (error) throw error;
};

export const getMediaUrl = (path: string): string => {
  const { data } = supabase.storage
    .from('messages-media')
    .getPublicUrl(path);

  return data.publicUrl;
};
