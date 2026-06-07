import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

export async function uploadAvatarApi(localUri: string): Promise<string> {
  const filename = localUri.split('/').pop() ?? 'avatar.jpg';
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const arrayBuffer = decode(base64);
  const storagePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(storagePath, arrayBuffer, { contentType: mimeType, upsert: false });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from('avatars').getPublicUrl(storagePath);
  return data.publicUrl;
}
