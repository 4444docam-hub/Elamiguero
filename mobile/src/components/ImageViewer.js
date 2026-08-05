import React from 'react';
import { Modal, View, Image, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

const ImageViewer = ({ visible, imageUrl, onClose }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
        ) : null}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={28} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: { width: '100%', height: '100%' },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 0,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ImageViewer;
