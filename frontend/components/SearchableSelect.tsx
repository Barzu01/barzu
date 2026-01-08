import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Option {
  label: string;
  value: string | number;
  id?: number;
}

interface SearchableSelectProps {
  title: string;
  placeholder: string;
  value: string;
  options: Option[];
  onSelect: (option: Option) => void;
  onSearch?: (query: string) => void;
  loading?: boolean;
  disabled?: boolean;
  disabledPlaceholder?: string;
  emptyText?: string;
}

export default function SearchableSelect({
  title,
  placeholder,
  value,
  options,
  onSelect,
  onSearch,
  loading = false,
  disabled = false,
  disabledPlaceholder = 'Выберите значение',
  emptyText = 'Нет результатов',
}: SearchableSelectProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Filter options locally if no onSearch provided
  const filteredOptions = onSearch
    ? options
    : options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text);

      if (onSearch) {
        // Debounce API calls
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = setTimeout(() => {
          onSearch(text);
        }, 300);
      }
    },
    [onSearch]
  );

  const handleSelect = (option: Option) => {
    onSelect(option);
    setModalVisible(false);
    setSearchQuery('');
  };

  const openModal = () => {
    if (disabled) return;
    setModalVisible(true);
    // Focus search input after modal opens
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSearchQuery('');
    Keyboard.dismiss();
  };

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <>
      <TouchableOpacity
        style={[styles.selectButton, disabled && styles.selectButtonDisabled]}
        onPress={openModal}
        disabled={disabled}
      >
        <Text
          style={[
            styles.selectButtonText,
            !value && styles.selectButtonPlaceholder,
            disabled && styles.selectButtonTextDisabled,
          ]}
        >
          {disabled ? disabledPlaceholder : value || placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={disabled ? '#C7C7CC' : '#8E8E93'}
        />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="#000000" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={20}
                color="#8E8E93"
                style={styles.searchIcon}
              />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={handleSearchChange}
                placeholder="Поиск..."
                placeholderTextColor="#8E8E93"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    if (onSearch) onSearch('');
                  }}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color="#8E8E93" />
                </TouchableOpacity>
              )}
            </View>

            {/* Options List */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0066CC" />
                <Text style={styles.loadingText}>Загрузка...</Text>
              </View>
            ) : filteredOptions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="car-sport-outline" size={48} color="#C7C7CC" />
                <Text style={styles.emptyText}>{emptyText}</Text>
              </View>
            ) : (
              <FlatList
                data={filteredOptions}
                keyExtractor={(item, index) =>
                  `${item.value}-${item.id || index}`
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => handleSelect(item)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        value === item.label && styles.optionTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {value === item.label && (
                      <Ionicons name="checkmark" size={24} color="#0066CC" />
                    )}
                  </TouchableOpacity>
                )}
                keyboardShouldPersistTaps="handled"
                initialNumToRender={20}
                maxToRenderPerBatch={20}
                windowSize={10}
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selectButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  selectButtonDisabled: {
    backgroundColor: '#F2F2F7',
    borderColor: '#E5E5EA',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#000000',
  },
  selectButtonPlaceholder: {
    color: '#8E8E93',
  },
  selectButtonTextDisabled: {
    color: '#C7C7CC',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    margin: 16,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#000000',
  },
  clearButton: {
    padding: 4,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  optionText: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
  optionTextSelected: {
    color: '#0066CC',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
