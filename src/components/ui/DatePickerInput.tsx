import React, { useEffect, useRef, useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { fontSize, fontWeight } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

// ─── constants ───────────────────────────────────────────────────────────────

const ITEM_H = 48;
const VISIBLE = 5; // items shown at once (2 above + selected + 2 below)
const WHEEL_H = ITEM_H * VISIBLE;

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

// ─── Wheel ───────────────────────────────────────────────────────────────────

interface WheelProps {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  flex?: number;
}

function Wheel({ items, selectedIndex, onSelect, flex = 1 }: WheelProps) {
  const { theme } = useTheme();
  const ref = useRef<ScrollView>(null);

  useEffect(() => {
    // small timeout lets the modal finish its open animation before scrolling
    const t = setTimeout(() => {
      ref.current?.scrollTo({ y: selectedIndex * ITEM_H, animated: false });
    }, 50);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flex, height: WHEEL_H, overflow: 'hidden' }}>
      {/* selection highlight */}
      <View
        pointerEvents="none"
        style={[styles.selectionBar, { top: ITEM_H * 2, backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
      />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
        onMomentumScrollEnd={(e) => {
          const i = Math.max(0, Math.min(
            Math.round(e.nativeEvent.contentOffset.y / ITEM_H),
            items.length - 1,
          ));
          onSelect(i);
        }}
      >
        {items.map((item) => (
          <View key={item} style={styles.item}>
            <Text style={[styles.itemText, { color: theme.text.primary }]}>{item}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── DatePickerInput ─────────────────────────────────────────────────────────

interface DatePickerInputProps {
  label?: string;
  value: string;         // 'YYYY-MM-DD' or ''
  onChangeText: (v: string) => void;
  error?: string;
  placeholder?: string;
  minYear?: number;
  maxYear?: number;
}

export function DatePickerInput({
  label,
  value,
  onChangeText,
  error,
  placeholder = 'Select date',
  minYear = 1940,
  maxYear,
}: DatePickerInputProps) {
  const { theme } = useTheme();
  const currentYear = new Date().getFullYear();
  const resolvedMaxYear = maxYear ?? currentYear + 2;

  const allYears = Array.from(
    { length: resolvedMaxYear - minYear + 1 },
    (_, i) => String(minYear + i),
  );

  const parseDate = (v: string) => {
    if (v && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const [y, m, d] = v.split('-').map(Number);
      return { day: d, month: m, year: y };
    }
    const now = new Date();
    return { day: now.getDate(), month: now.getMonth() + 1, year: now.getFullYear() };
  };

  const [visible, setVisible] = useState(false);
  const [temp, setTemp] = useState(() => parseDate(value));

  const maxDay = daysInMonth(temp.month, temp.year);
  const dayItems = Array.from({ length: maxDay }, (_, i) => String(i + 1));
  const yearIndex = Math.max(0, allYears.indexOf(String(temp.year)));
  const dayIndex = Math.min(temp.day - 1, dayItems.length - 1);
  const monthIndex = temp.month - 1;

  const handleOpen = () => {
    setTemp(parseDate(value));
    setVisible(true);
  };

  const handleConfirm = () => {
    const clampedDay = Math.min(temp.day, daysInMonth(temp.month, temp.year));
    onChangeText(`${pad2(temp.year)}-${pad2(temp.month)}-${pad2(clampedDay)}`);
    setVisible(false);
  };

  const displayValue = (() => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [y, m, d] = value.split('-').map(Number);
    return `${d} ${MONTHS[m - 1]} ${y}`;
  })();

  return (
    <View>
      {label && (
        <Text style={[styles.label, { color: theme.text.secondary }]}>{label}</Text>
      )}
      <TouchableOpacity
        style={[
          styles.trigger,
          { borderColor: error ? theme.danger : theme.border, backgroundColor: theme.surface },
        ]}
        onPress={handleOpen}
        activeOpacity={0.75}
      >
        <Ionicons name="calendar-outline" size={18} color={theme.text.tertiary} />
        <Text style={[styles.triggerText, { color: displayValue ? theme.text.primary : theme.text.tertiary }]}>
          {displayValue ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={theme.text.tertiary} />
      </TouchableOpacity>
      {error && <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>}

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setVisible(false)} />
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          {/* toolbar */}
          <View style={styles.toolbar}>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Text style={[styles.toolbarCancel, { color: theme.text.secondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.toolbarTitle, { color: theme.text.primary }]}>{label ?? 'Select Date'}</Text>
            <TouchableOpacity onPress={handleConfirm}>
              <Text style={[styles.toolbarDone, { color: theme.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.wheels}>
            {/* Day */}
            <Wheel
              items={dayItems}
              selectedIndex={dayIndex}
              onSelect={(i) => setTemp((t) => ({ ...t, day: i + 1 }))}
              flex={2}
            />
            {/* Month */}
            <Wheel
              items={MONTHS}
              selectedIndex={monthIndex}
              onSelect={(i) => setTemp((t) => {
                const newMonth = i + 1;
                const maxD = daysInMonth(newMonth, t.year);
                return { ...t, month: newMonth, day: Math.min(t.day, maxD) };
              })}
              flex={3}
            />
            {/* Year */}
            <Wheel
              items={allYears}
              selectedIndex={yearIndex}
              onSelect={(i) => setTemp((t) => {
                const newYear = parseInt(allYears[i]);
                const maxD = daysInMonth(t.month, newYear);
                return { ...t, year: newYear, day: Math.min(t.day, maxD) };
              })}
              flex={3}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── TimePickerInput ─────────────────────────────────────────────────────────

const HOURS = Array.from({ length: 24 }, (_, i) => pad2(i));
const MINUTES = Array.from({ length: 12 }, (_, i) => pad2(i * 5));

interface TimePickerInputProps {
  label?: string;
  value: string;         // 'HH:MM' or ''
  onChangeText: (v: string) => void;
  error?: string;
  placeholder?: string;
}

export function TimePickerInput({
  label,
  value,
  onChangeText,
  error,
  placeholder = 'Select time',
}: TimePickerInputProps) {
  const { theme } = useTheme();

  const parseTime = (v: string) => {
    if (v && /^\d{2}:\d{2}$/.test(v)) {
      const [h, m] = v.split(':').map(Number);
      return { hour: h, minute: Math.floor(m / 5) * 5 };
    }
    const now = new Date();
    return { hour: now.getHours(), minute: Math.floor(now.getMinutes() / 5) * 5 };
  };

  const [visible, setVisible] = useState(false);
  const [temp, setTemp] = useState(() => parseTime(value));

  const hourIndex = temp.hour;
  const minuteIndex = Math.floor(temp.minute / 5);

  const handleOpen = () => {
    setTemp(parseTime(value));
    setVisible(true);
  };

  const handleConfirm = () => {
    onChangeText(`${pad2(temp.hour)}:${pad2(temp.minute)}`);
    setVisible(false);
  };

  const displayValue = value && /^\d{2}:\d{2}$/.test(value)
    ? (() => {
        const [h, m] = value.split(':').map(Number);
        const period = h < 12 ? 'AM' : 'PM';
        const h12 = h % 12 === 0 ? 12 : h % 12;
        return `${pad2(h12)}:${pad2(m)} ${period}`;
      })()
    : null;

  return (
    <View>
      {label && (
        <Text style={[styles.label, { color: theme.text.secondary }]}>{label}</Text>
      )}
      <TouchableOpacity
        style={[
          styles.trigger,
          { borderColor: error ? theme.danger : theme.border, backgroundColor: theme.surface },
        ]}
        onPress={handleOpen}
        activeOpacity={0.75}
      >
        <Ionicons name="time-outline" size={18} color={theme.text.tertiary} />
        <Text style={[styles.triggerText, { color: displayValue ? theme.text.primary : theme.text.tertiary }]}>
          {displayValue ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={theme.text.tertiary} />
      </TouchableOpacity>
      {error && <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>}

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setVisible(false)} />
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          <View style={styles.toolbar}>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Text style={[styles.toolbarCancel, { color: theme.text.secondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.toolbarTitle, { color: theme.text.primary }]}>{label ?? 'Select Time'}</Text>
            <TouchableOpacity onPress={handleConfirm}>
              <Text style={[styles.toolbarDone, { color: theme.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.wheels}>
            <Wheel
              items={HOURS}
              selectedIndex={hourIndex}
              onSelect={(i) => setTemp((t) => ({ ...t, hour: i }))}
              flex={1}
            />
            <View style={[styles.timeSep, { backgroundColor: theme.surface }]}>
              <Text style={[styles.timeSepText, { color: theme.text.primary }]}>:</Text>
            </View>
            <Wheel
              items={MINUTES}
              selectedIndex={minuteIndex}
              onSelect={(i) => setTemp((t) => ({ ...t, minute: i * 5 }))}
              flex={1}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginBottom: 6 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    borderWidth: 1.5,
    borderRadius: radius.lg,
    paddingHorizontal: spacing[4],
    height: 52,
  },
  triggerText: { flex: 1, fontSize: fontSize.base },
  errorText: { fontSize: fontSize.xs, marginTop: 4 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[10],
    paddingTop: spacing[4],
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  toolbarCancel: { fontSize: fontSize.base },
  toolbarTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  toolbarDone: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  wheels: { flexDirection: 'row', alignItems: 'center' },
  selectionBar: {
    position: 'absolute',
    left: 4,
    right: 4,
    height: ITEM_H,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  item: { height: ITEM_H, justifyContent: 'center', alignItems: 'center' },
  itemText: { fontSize: 17 },
  timeSep: { width: 20, alignItems: 'center' },
  timeSepText: { fontSize: 22, fontWeight: fontWeight.bold },
});
