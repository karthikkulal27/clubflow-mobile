import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { spacing, radius } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const { theme } = useTheme();
  const [hexInput, setHexInput] = useState(value || '#2563eb');

  const handleHexChange = (text: string) => {
    // Allow typing without the # symbol
    let hexValue = text.startsWith('#') ? text : `#${text}`;

    // Validate hex format (must be 7 chars: #RRGGBB or less while typing)
    if (hexValue.length <= 7 && /^#[0-9A-Fa-f]*$/.test(hexValue)) {
      setHexInput(hexValue.toUpperCase());

      // Only update if valid 6-digit hex
      if (hexValue.length === 7) {
        onChange(hexValue.toUpperCase());
      }
    }
  };

  const handlePickerColor = (color: string) => {
    setHexInput(color.toUpperCase());
    onChange(color.toUpperCase());
  };

  const displayColor = value || '#2563eb';

  return (
    <View style={styles.container}>
      {/* Color Preview Bar */}
      <View
        style={[
          styles.colorPreview,
          { backgroundColor: displayColor },
        ]}
      />

      {/* Color Picker + Hex Input Row */}
      <View style={styles.inputRow}>
        {/* Native Color Picker Button */}
        <TouchableOpacity
          style={[
            styles.pickerButton,
            { backgroundColor: theme.primaryLight, borderColor: theme.border }
          ]}
          onPress={() => {
            // On React Native, we can't use native color picker easily
            // But we provide a visual button that opens the hex input
          }}
        >
          <View
            style={[
              styles.pickerPreview,
              { backgroundColor: displayColor }
            ]}
          />
          <Text style={[styles.pickerButtonText, { color: theme.text.secondary }]}>
            Pick
          </Text>
        </TouchableOpacity>

        {/* Hex Code Input */}
        <TextInput
          style={[
            styles.hexInput,
            {
              borderColor: theme.border,
              color: theme.text.primary,
              backgroundColor: theme.surface
            }
          ]}
          placeholder="#2563eb"
          placeholderTextColor={theme.text.tertiary}
          value={hexInput}
          onChangeText={handleHexChange}
          maxLength={7}
        />
      </View>

      {/* Quick Color Suggestions */}
      <View style={styles.suggestionsContainer}>
        <Text style={[styles.suggestionsLabel, { color: theme.text.secondary }]}>Quick colors:</Text>
        <View style={styles.suggestionsRow}>
          {['#FF0000', '#000000', '#14a295', '#2563eb', '#10b981', '#f59e0b'].map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.quickColor,
                {
                  backgroundColor: color,
                  borderColor: displayColor === color ? theme.primary : theme.border,
                  borderWidth: displayColor === color ? 3 : 1,
                }
              ]}
              onPress={() => handlePickerColor(color)}
            >
              {displayColor === color && (
                <Ionicons
                  name="checkmark"
                  size={14}
                  color={color === '#FFFFFF' || color === '#f59e0b' ? '#000' : '#fff'}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[3],
    marginVertical: spacing[2],
  },
  colorPreview: {
    width: '100%',
    height: 60,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing[2],
    alignItems: 'center',
  },
  pickerButton: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
  },
  pickerPreview: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pickerButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  hexInput: {
    flex: 1,
    fontSize: fontSize.base,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontWeight: fontWeight.medium,
  },
  suggestionsContainer: {
    gap: spacing[2],
  },
  suggestionsLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  suggestionsRow: {
    flexDirection: 'row',
    gap: spacing[2],
    justifyContent: 'space-between',
  },
  quickColor: {
    width: '15%',
    aspectRatio: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
