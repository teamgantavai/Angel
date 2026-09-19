import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, ThemeColors } from "@/components/constants/colors";
import PremiumDialogModal from "./PremiumDialogModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CIRCLE_SIZE = Math.min(SCREEN_WIDTH - 64, 280);

const MIN_ZOOM = 1.0;
const MAX_ZOOM = 4.0;
const SLIDER_WIDTH = 190;
const THUMB_SIZE = 18;

export interface PhotoEditorModalProps {
  visible: boolean;
  imageUri: string | null;
  initialWidth?: number;
  initialHeight?: number;
  isDark?: boolean;
  onClose: () => void;
  onSave: (finalUri: string) => Promise<void> | void;
}

export default function PhotoEditorModal({
  visible,
  imageUri,
  initialWidth,
  initialHeight,
  isDark = true,
  onClose,
  onSave,
}: PhotoEditorModalProps) {
  const insets = useSafeAreaInsets();
  const theme: ThemeColors = isDark ? Colors.dark : Colors.light;

  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({
    width: initialWidth || 1000,
    height: initialHeight || 1000,
  });
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load natural image dimensions when imageUri changes
  useEffect(() => {
    if (visible && imageUri) {
      setZoomLevel(1.0);
      setRotationDegrees(0);
      setFlipH(false);
      setPanOffset({ x: 0, y: 0 });

      if (initialWidth && initialHeight && initialWidth > 0 && initialHeight > 0) {
        setImageSize({ width: initialWidth, height: initialHeight });
      } else {
        Image.getSize(
          imageUri,
          (w, h) => {
            if (w > 0 && h > 0) {
              setImageSize({ width: w, height: h });
            }
          },
          (err) => {
            console.warn("Could not get image dimensions:", err);
          }
        );
      }
    }
  }, [visible, imageUri, initialWidth, initialHeight]);

  // Base scale calculation: image covers the CIRCLE_SIZE at zoomLevel = 1.0 with natural aspect ratio
  const origW = imageSize.width || 1000;
  const origH = imageSize.height || 1000;

  const scaleBase = CIRCLE_SIZE / Math.min(origW, origH);
  const baseImgWidth = origW * scaleBase;
  const baseImgHeight = origH * scaleBase;

  const isRotatedSideways = rotationDegrees === 90 || rotationDegrees === 270;
  const currentVisualW = (isRotatedSideways ? baseImgHeight : baseImgWidth) * zoomLevel;
  const currentVisualH = (isRotatedSideways ? baseImgWidth : baseImgHeight) * zoomLevel;

  const maxPanX = Math.max(0, (currentVisualW - CIRCLE_SIZE) / 2);
  const maxPanY = Math.max(0, (currentVisualH - CIRCLE_SIZE) / 2);

  // Smooth direct touch pan/drag & pinch-to-zoom on photo canvas
  const panOffsetRef = useRef({ x: 0, y: 0 });
  panOffsetRef.current = panOffset;
  const zoomLevelRef = useRef(zoomLevel);
  zoomLevelRef.current = zoomLevel;
  const maxPanRef = useRef({ x: maxPanX, y: maxPanY });
  maxPanRef.current = { x: maxPanX, y: maxPanY };

  const startPanRef = useRef({ x: 0, y: 0 });
  const initialPinchDistRef = useRef<number | null>(null);
  const initialZoomRef = useRef(1.0);
  const wasTwoFingersRef = useRef(false);

  const canvasPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startPanRef.current = {
          x: panOffsetRef.current.x,
          y: panOffsetRef.current.y,
        };
        initialPinchDistRef.current = null;
        wasTwoFingersRef.current = false;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Two-finger pinch to zoom gesture
        if (evt.nativeEvent.touches && evt.nativeEvent.touches.length === 2) {
          wasTwoFingersRef.current = true;
          const t1 = evt.nativeEvent.touches[0];
          const t2 = evt.nativeEvent.touches[1];
          const dist = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
          if (initialPinchDistRef.current === null) {
            initialPinchDistRef.current = dist;
            initialZoomRef.current = zoomLevelRef.current;
          } else {
            const scale = dist / initialPinchDistRef.current;
            const newZ = Math.max(
              MIN_ZOOM,
              Math.min(MAX_ZOOM, initialZoomRef.current * scale)
            );
            setZoomLevel(Number(newZ.toFixed(2)));
          }
        } else if (
          evt.nativeEvent.touches &&
          evt.nativeEvent.touches.length === 1
        ) {
          if (wasTwoFingersRef.current) {
            wasTwoFingersRef.current = false;
            startPanRef.current = {
              x: panOffsetRef.current.x - gestureState.dx,
              y: panOffsetRef.current.y - gestureState.dy,
            };
          }
          initialPinchDistRef.current = null;

          const curMaxX = maxPanRef.current.x;
          const curMaxY = maxPanRef.current.y;
          const targetX = startPanRef.current.x + gestureState.dx;
          const targetY = startPanRef.current.y + gestureState.dy;

          setPanOffset({
            x: Math.max(-curMaxX, Math.min(curMaxX, targetX)),
            y: Math.max(-curMaxY, Math.min(curMaxY, targetY)),
          });
        }
      },
      onPanResponderRelease: () => {
        initialPinchDistRef.current = null;
        wasTwoFingersRef.current = false;
      },
      onPanResponderTerminate: () => {
        initialPinchDistRef.current = null;
        wasTwoFingersRef.current = false;
      },
    })
  ).current;

  // Hand gesture slider pan responder for the zoom in/out bar
  const sliderStartZoomRef = useRef(1.0);

  const sliderPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (evt) => {
        const touchX = Math.max(
          0,
          Math.min(SLIDER_WIDTH, evt.nativeEvent.locationX)
        );
        const ratio = touchX / SLIDER_WIDTH;
        const newZoom = Math.max(
          MIN_ZOOM,
          Math.min(MAX_ZOOM, MIN_ZOOM + ratio * (MAX_ZOOM - MIN_ZOOM))
        );
        sliderStartZoomRef.current = newZoom;
        setZoomLevel(Number(newZoom.toFixed(2)));
      },
      onPanResponderMove: (_, gestureState) => {
        const deltaRatio = gestureState.dx / SLIDER_WIDTH;
        const newZoom = Math.max(
          MIN_ZOOM,
          Math.min(
            MAX_ZOOM,
            sliderStartZoomRef.current + deltaRatio * (MAX_ZOOM - MIN_ZOOM)
          )
        );
        setZoomLevel(Number(newZoom.toFixed(2)));
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  // Clamp panOffset when max bounds shrink on zoom out
  useEffect(() => {
    setPanOffset((prev) => {
      const clampedX = Math.max(-maxPanX, Math.min(maxPanX, prev.x));
      const clampedY = Math.max(-maxPanY, Math.min(maxPanY, prev.y));
      if (clampedX !== prev.x || clampedY !== prev.y) {
        return { x: clampedX, y: clampedY };
      }
      return prev;
    });
  }, [maxPanX, maxPanY]);

  if (!visible || !imageUri) return null;

  const handleRotate = () => {
    setRotationDegrees((prev) => (prev + 90) % 360);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleFlip = () => {
    setFlipH((prev) => !prev);
  };

  const handleReset = () => {
    setZoomLevel(1.0);
    setRotationDegrees(0);
    setFlipH(false);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleDone = async () => {
    try {
      setIsProcessing(true);

      const actions: ImageManipulator.Action[] = [];

      // 1. Apply user rotation if any
      if (rotationDegrees !== 0) {
        actions.push({ rotate: rotationDegrees });
      }

      // 2. Apply user horizontal flip if any
      if (flipH) {
        actions.push({ flip: ImageManipulator.FlipType.Horizontal });
      }

      // 3. Exact geometric square crop calculation
      const rotW = isRotatedSideways ? origH : origW;
      const rotH = isRotatedSideways ? origW : origH;

      const totalScale = scaleBase * zoomLevel;
      const R = 1 / totalScale;

      const rawCropSize = CIRCLE_SIZE * R;
      const cropSize = Math.min(rawCropSize, rotW, rotH);

      const rawOriginX = (rotW - cropSize) / 2 - panOffset.x * R;
      const rawOriginY = (rotH - cropSize) / 2 - panOffset.y * R;

      const maxOriginX = Math.max(0, rotW - cropSize);
      const maxOriginY = Math.max(0, rotH - cropSize);

      const originX = Math.max(0, Math.min(maxOriginX, Math.round(rawOriginX)));
      const originY = Math.max(0, Math.min(maxOriginY, Math.round(rawOriginY)));

      const finalCropW = Math.min(Math.round(cropSize), rotW - originX);
      const finalCropH = Math.min(Math.round(cropSize), rotH - originY);
      const squareSize = Math.min(finalCropW, finalCropH);

      actions.push({
        crop: {
          originX,
          originY,
          width: squareSize,
          height: squareSize,
        },
      });

      // 4. High-resolution standard square output (1024x1024)
      actions.push({
        resize: { width: 1024, height: 1024 },
      });

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        actions,
        {
          compress: 0.95,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      await onSave(result.uri);
      setIsProcessing(false);
      onClose();
    } catch (err) {
      setIsProcessing(false);
      setErrorMessage(
        err instanceof Error ? err.message : "Could not process photo."
      );
    }
  };

  // Slider knob position calculation
  const zoomFraction = Math.min(
    1,
    Math.max(0, (zoomLevel - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM))
  );
  const knobLeft = zoomFraction * (SLIDER_WIDTH - THUMB_SIZE);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={onClose}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.background,
            paddingTop: insets.top,
          },
        ]}>
        {/* Top Header: Clean Centered Title */}
        <View
          style={[styles.topHeader, { borderBottomColor: theme.divider }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Move and Scale
          </Text>
        </View>

        {/* Center Circular Viewport */}
        <View style={styles.centerStage} {...canvasPanResponder.panHandlers}>
          <View
            style={[
              styles.circleFrame,
              {
                borderColor: theme.text,
                backgroundColor: isDark ? "#111218" : "#F1F5F9",
              },
            ]}>
            <View
              style={{
                width: CIRCLE_SIZE,
                height: CIRCLE_SIZE,
                alignItems: "center",
                justifyContent: "center",
                transform: [
                  { translateX: panOffset.x },
                  { translateY: panOffset.y },
                  { scale: zoomLevel },
                ],
              }}>
              <Image
                source={{ uri: imageUri }}
                style={{
                  width: baseImgWidth,
                  height: baseImgHeight,
                  transform: [
                    { rotate: `${rotationDegrees}deg` },
                    { scaleX: flipH ? -1 : 1 },
                  ],
                }}
                resizeMode="cover"
              />
            </View>
          </View>
        </View>

        {/* Editing Tools Section */}
        <View style={styles.toolsSection}>
          {/* Hand Gesture Interactive Zoom Bar */}
          <View style={styles.zoomBar}>
            <Pressable
              hitSlop={12}
              onPress={() =>
                setZoomLevel((z) =>
                  Math.max(MIN_ZOOM, Number((z - 0.2).toFixed(2)))
                )
              }>
              <Ionicons
                name="remove"
                size={18}
                color={theme.textSecondary}
              />
            </Pressable>

            {/* Gesture-enabled draggable zoom track */}
            <View
              style={styles.sliderTouchTarget}
              {...sliderPanResponder.panHandlers}>
              <View
                style={[
                  styles.zoomTrack,
                  {
                    width: SLIDER_WIDTH,
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.18)"
                      : "rgba(0, 0, 0, 0.12)",
                  },
                ]}>
                {/* Active Fill */}
                <View
                  style={[
                    styles.zoomFill,
                    {
                      backgroundColor: theme.text,
                      width: `${zoomFraction * 100}%`,
                    },
                  ]}
                />
                {/* Draggable Knob / Thumb */}
                <View
                  style={[
                    styles.sliderThumb,
                    {
                      left: knobLeft,
                      backgroundColor: theme.text,
                      shadowColor: isDark ? "#000000" : "rgba(0,0,0,0.5)",
                    },
                  ]}
                />
              </View>
            </View>

            <Pressable
              hitSlop={12}
              onPress={() =>
                setZoomLevel((z) =>
                  Math.min(MAX_ZOOM, Number((z + 0.2).toFixed(2)))
                )
              }>
              <Ionicons
                name="add"
                size={18}
                color={theme.textSecondary}
              />
            </Pressable>
          </View>

          {/* Quick Action Buttons: Rotate, Flip, Reset */}
          <View style={styles.iconButtonsRow}>
            {/* Rotate */}
            <Pressable
              accessibilityLabel="Rotate 90 degrees"
              style={({ pressed }) => [
                styles.circleIconBtn,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.05)",
                  borderColor: theme.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              onPress={handleRotate}>
              <Ionicons name="sync-outline" size={20} color={theme.text} />
            </Pressable>

            {/* Flip */}
            <Pressable
              accessibilityLabel="Flip horizontally"
              style={({ pressed }) => [
                styles.circleIconBtn,
                {
                  backgroundColor: flipH
                    ? theme.text
                    : isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.05)",
                  borderColor: theme.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              onPress={handleFlip}>
              <Ionicons
                name="swap-horizontal-outline"
                size={20}
                color={flipH ? theme.background : theme.text}
              />
            </Pressable>

            {/* Reset */}
            <Pressable
              accessibilityLabel="Reset adjustments"
              style={({ pressed }) => [
                styles.circleIconBtn,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.05)",
                  borderColor: theme.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              onPress={handleReset}>
              <Ionicons
                name="refresh-outline"
                size={20}
                color={theme.textSecondary}
              />
            </Pressable>
          </View>
        </View>

        {/* Dedicated Bottom Footer Bar: Cancel & Done at the very bottom */}
        <View
          style={[
            styles.bottomFooterBar,
            {
              borderTopColor: theme.divider,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            style={({ pressed }) => [
              styles.bottomCancelBtn,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.05)",
                borderColor: theme.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
            onPress={onClose}>
            <Text style={[styles.bottomCancelText, { color: theme.text }]}>
              Cancel
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Done"
            disabled={isProcessing}
            style={({ pressed }) => [
              styles.bottomDoneBtn,
              {
                backgroundColor: theme.buttonPrimary,
                opacity: pressed || isProcessing ? 0.8 : 1,
              },
            ]}
            onPress={handleDone}>
            {isProcessing ? (
              <ActivityIndicator
                color={theme.buttonPrimaryText}
                size="small"
              />
            ) : (
              <Text
                style={[
                  styles.bottomDoneText,
                  { color: theme.buttonPrimaryText },
                ]}>
                Done
              </Text>
            )}
          </Pressable>
        </View>

        {/* Premium Save Error Dialog */}
        <PremiumDialogModal
          visible={Boolean(errorMessage)}
          title="Save Failed"
          message={errorMessage ?? "Could not process photo."}
          iconName="alert-circle-outline"
          primaryButtonText="OK"
          onClose={() => setErrorMessage(null)}
          isDark={isDark}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    zIndex: 99999,
    ...(Platform.OS === "web"
      ? {
          position: "fixed" as any,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }
      : {}),
  },
  topHeader: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  toolsSection: {
    paddingHorizontal: 24,
    gap: 14,
    paddingBottom: 8,
  },
  bottomFooterBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  bottomCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  bottomCancelText: {
    fontSize: 15,
    fontWeight: "600",
  },
  bottomDoneBtn: {
    flex: 1.25,
    paddingVertical: 13,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomDoneText: {
    fontSize: 15,
    fontWeight: "700",
  },

  /* Center Circular Stage */
  centerStage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  circleFrame: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    overflow: "hidden",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },

  zoomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 10,
  },
  sliderTouchTarget: {
    height: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  zoomTrack: {
    height: 4,
    borderRadius: 2,
    position: "relative",
    justifyContent: "center",
  },
  zoomFill: {
    height: "100%",
    borderRadius: 2,
    position: "absolute",
    left: 0,
  },
  sliderThumb: {
    position: "absolute",
    top: -(THUMB_SIZE / 2 - 2),
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 5,
  },
  iconButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },
  circleIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
