import React, { useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator, StyleSheet, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import { uploadAvatarApi } from '../../lib/uploadApi';
import { useTheme } from '../../hooks/useTheme';
import { fontSize } from '../../theme/typography';
import { radius } from '../../theme/spacing';

interface AvatarPickerProps {
  name: string;
  currentUri?: string | null;
  size?: number;
  onUploaded: (url: string) => void;
}

export function AvatarPicker({ name, currentUri, size = 80, onUploaded }: AvatarPickerProps) {
  const { theme } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [localUri, setLocalUri] = useState<string | null>(null);

  const displayUri = localUri ?? currentUri;

  const pick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    setLocalUri(uri);
    setUploading(true);
    try {
      const url = await uploadAvatarApi(uri);
      onUploaded(url);
    } catch (err) {
      console.error('[AvatarPicker] upload failed:', err);
      setLocalUri(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <TouchableOpacity onPress={pick} activeOpacity={0.8} style={styles.wrap} disabled={uploading}>
      <Avatar name={name} uri={displayUri} size={size} />
      <View style={[styles.badge, { backgroundColor: theme.primary }]}>
        {uploading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="camera" size={14} color="#fff" />
        )}
      </View>
      <Text style={[styles.hint, { color: theme.text.tertiary }]}>
        {uploading ? 'Uploading…' : 'Tap to change'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6 },
  badge: {
    position: 'absolute',
    bottom: 20,
    right: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { fontSize: fontSize.xs },
});
