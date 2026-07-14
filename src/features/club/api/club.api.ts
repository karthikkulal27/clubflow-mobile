import { api } from "../../../lib/api";
import type { ApiResponse } from "../../../types";
import { supabase } from "../../../lib/supabase";
import * as FileSystem from 'expo-file-system/legacy';

export interface Club {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  slogan?: string;
  monthlyFee?: number;
  currency?: string;
  createdAt: string;
  _count: { memberships: number };
}

export interface ClubBranding {
  id: string;
  name: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  slogan?: string;
}

export async function getClubApi(): Promise<Club> {
  const { data } = await api.get<ApiResponse<Club>>("/club");
  return data.data;
}

export async function updateClubApi(payload: { name?: string; description?: string }): Promise<Club> {
  const { data } = await api.patch<ApiResponse<Club>>("/club", payload);
  return data.data;
}

export async function getClubBrandingApi(): Promise<ClubBranding> {
  const { data } = await api.get<ApiResponse<ClubBranding>>("/club/branding");
  return data.data;
}

export async function updateClubBrandingApi(payload: {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  slogan?: string;
}): Promise<ClubBranding> {
  const { data } = await api.patch<ApiResponse<ClubBranding>>("/club/branding", payload);
  return data.data;
}

export async function uploadLogoApi(file: any, oldLogoUrl?: string): Promise<string> {
  // Delete old logo if it exists
  if (oldLogoUrl) {
    try {
      const oldPath = oldLogoUrl.split('/logos/')[1];
      if (oldPath) {
        await supabase.storage.from('avatars').remove([`logos/${oldPath}`]);
      }
    } catch (err) {
      console.warn('[uploadLogoApi] Failed to delete old logo:', err);
    }
  }

  try {
    const storagePath = `logos/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

    console.log('[LOGO] Reading file from URI...');
    const base64Data = await FileSystem.readAsStringAsync(file.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log('[LOGO] File size:', (base64Data.length * 0.75) / 1024, 'KB');

    // Convert base64 to Uint8Array for Supabase
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log('[LOGO] Uploading to Supabase...');
    const { error } = await supabase.storage
      .from('avatars')
      .upload(storagePath, bytes, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('[LOGO] Upload error:', error.message);
      throw new Error(error.message);
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(storagePath);
    console.log('[LOGO] URL:', data.publicUrl);
    return data.publicUrl;
  } catch (err: any) {
    console.error('[LOGO] Error:', err.message);
    throw err;
  }
}
