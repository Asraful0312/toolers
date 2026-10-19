import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming
} from 'react-native-reanimated';

interface FavoriteButtonProps {
    initialChecked?: boolean;
    checked?: boolean;
    onToggle?: (checked: boolean) => void;
    style?: ViewStyle;
    labelAdd?: string;
    labelAdded?: string;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
    initialChecked = false,
    checked: controlledChecked,
    onToggle,
    style,
    labelAdd = 'Save',
    labelAdded = 'Saved',
}) => {
    const isControlled = controlledChecked !== undefined;
    const [internalChecked, setInternalChecked] = useState(initialChecked);
    const isChecked = isControlled ? controlledChecked : internalChecked;
    const textColor = useThemeColor({}, 'text');

    const progress = useSharedValue(isChecked ? 1 : 0);
    const scaleHeart = useSharedValue(1);

    useEffect(() => {
        progress.value = withTiming(isChecked ? 1 : 0, { duration: 300 });

        if (isChecked) {
            // Heartbeat animation: 0% -> 25%(1.3) -> 50%(1) -> 75%(1.3) -> 100%(1)
            const duration = 1000;
            const step = duration / 4;
            scaleHeart.value = withSequence(
                withTiming(1.3, { duration: step }),
                withTiming(1, { duration: step }),
                withTiming(1.3, { duration: step }),
                withTiming(1, { duration: step })
            );
        } else {
            scaleHeart.value = withTiming(1, { duration: 200 });
        }
    }, [isChecked]);

    const handlePress = () => {
        const newValue = !isChecked;
        if (!isControlled) {
            setInternalChecked(newValue);
        }
        onToggle?.(newValue);
    };

    const rOutlineStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(progress.value, [0, 0.2], [1, 0]),
            transform: [{ scale: scaleHeart.value }],
        };
    });

    const rFilledStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(progress.value, [0, 0.2], [0, 1]),
            transform: [{ scale: scaleHeart.value }],
        };
    });

    const rTextStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: interpolate(progress.value, [0, 1], [0, -20]) }],
        };
    });

    const rTextOneStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(progress.value, [0, 0.5], [1, 0]),
        };
    });

    const rTextTwoStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(progress.value, [0.5, 1], [0, 1]),
        };
    });

    return (
        <Pressable onPress={handlePress} style={[styles.container, style]}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Animated.View style={[styles.iconLayer, rOutlineStyle]}>
                        <Ionicons name="heart-outline" size={20} color={textColor} />
                    </Animated.View>
                    <Animated.View style={[styles.iconLayer, rFilledStyle]}>
                        <Ionicons name="heart" size={20} color="#ef4444" />
                    </Animated.View>
                </View>

                <View style={styles.textWrapper}>
                    <Animated.View style={[styles.textSlider, rTextStyle]}>
                        <Animated.View style={[styles.textContainer, rTextOneStyle]}>
                            <Text style={[styles.text, { color: textColor }]}>{labelAdd}</Text>
                        </Animated.View>
                        <Animated.View style={[styles.textContainer, rTextTwoStyle]}>
                            <Text style={[styles.text, { color: textColor }]}>{labelAdded}</Text>
                        </Animated.View>
                    </Animated.View>
                </View>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {

    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconContainer: {
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconLayer: {
        position: 'absolute',
    },
    textWrapper: {
        height: 20,
        overflow: 'hidden',
        justifyContent: 'flex-start',
    },
    textSlider: {
        flexDirection: 'column',
    },
    textContainer: {
        height: 20,
        justifyContent: 'center',
    },
    text: {
        fontSize: 15,
        color: 'black',
        fontWeight: '500',
    },
});

export default FavoriteButton;
