import React, { useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Plus, Trash2, X } from '@/components/common/CustomIcons';
import { useChecklistStore } from '../../store/useChecklistStore';

interface ChecklistModalProps {
  visible: boolean;
  onClose: () => void;
  tripId: string;
  tripTitle?: string;
}

export const ChecklistModal: React.FC<ChecklistModalProps> = ({
  visible,
  onClose,
  tripId,
  tripTitle,
}) => {
  const insets = useSafeAreaInsets();
  const { itemsByTrip, initTripChecklist, toggleItem, addItem, removeItem } = useChecklistStore();
  const [newItemText, setNewItemText] = useState('');

  useEffect(() => {
    if (visible && tripId) {
      initTripChecklist(tripId);
      setNewItemText('');
    }
  }, [visible, tripId, initTripChecklist]);

  const items = itemsByTrip[tripId] || [];
  const checkedCount = items.filter((i) => i.checked).length;
  const progressPercent = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0;

  const handleAdd = () => {
    if (!newItemText.trim()) return;
    addItem(tripId, newItemText);
    setNewItemText('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.header}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.title}>여행 준비물 체크리스트</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {tripTitle ? `${tripTitle} · ` : ''}
                {checkedCount} / {items.length} 완료 ({progressPercent}%)
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.75}>
              <X size={18} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>

          {/* Add Item Input */}
          <View style={styles.addRow}>
            <TextInput
              value={newItemText}
              onChangeText={setNewItemText}
              onSubmitEditing={handleAdd}
              placeholder="준비물 추가 (예: 선크림, 우산, 돼지코)"
              placeholderTextColor="#9CA3AF"
              style={styles.addInput}
              returnKeyType="done"
            />
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleAdd}
              disabled={!newItemText.trim()}
              style={[styles.addBtn, !newItemText.trim() && { opacity: 0.45 }]}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.addBtnText}>추가</Text>
            </TouchableOpacity>
          </View>

          {/* Checklist */}
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: 360 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>등록된 준비물이 없습니다.</Text>
                <TouchableOpacity
                  onPress={() => initTripChecklist(tripId)}
                  style={styles.restoreDefaultBtn}
                >
                  <Text style={styles.restoreDefaultBtnText}>기본 준비물 채우기</Text>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => toggleItem(tripId, item.id)}
                style={[styles.itemRow, item.checked && styles.itemRowChecked]}
              >
                <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
                  {item.checked && <Check size={13} color="#FFFFFF" />}
                </View>
                <Text style={[styles.itemLabel, item.checked && styles.itemLabelChecked]}>
                  {item.label}
                </Text>
                <TouchableOpacity
                  onPress={() => removeItem(tripId, item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.deleteBtn}
                >
                  <Trash2 size={15} color="#9CA3AF" />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1B2A4A',
    borderRadius: 3,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  addInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    fontSize: 13.5,
    color: '#111827',
  },
  addBtn: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#1B2A4A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  itemRowChecked: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#1B2A4A',
    borderColor: '#1B2A4A',
  },
  itemLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  itemLabelChecked: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  deleteBtn: {
    paddingLeft: 8,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  emptyText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 10,
  },
  restoreDefaultBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#EEF2F8',
  },
  restoreDefaultBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1B2A4A',
  },
});
