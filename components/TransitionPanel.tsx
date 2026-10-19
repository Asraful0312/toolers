import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
    AnimatedProps,
    Easing,
    Keyframe,
    LinearTransition
} from 'react-native-reanimated';

export type TransitionSpec = {
    opacity?: number;
    x?: number;
    y?: number;
    scale?: number;
    rotate?: string;
};

export type TransitionPanelProps = AnimatedProps<ViewStyle> & {
    children: React.ReactNode[];
    activeIndex: number;
    transition?: {
        duration?: number;
        easing?: (value: number) => number;
    };
    variants?: {
        enter: TransitionSpec;
        center: TransitionSpec;
        exit: TransitionSpec;
    };
    style?: ViewStyle;
};

const DEFAULT_VARIANTS = {
    enter: { opacity: 0, scale: 0.9 },
    center: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
};

export function TransitionPanel({
    children,
    activeIndex,
    transition = { duration: 300 },
    variants = DEFAULT_VARIANTS,
    style,
    ...rest
}: TransitionPanelProps) {
    if (activeIndex < 0 || activeIndex >= React.Children.count(children)) {
        return null;
    }

    // Convert separate x/y props to transform array for Reanimated
    const buildTransform = (spec: TransitionSpec) => {
        const transform: any[] = [];
        if (spec.x !== undefined) transform.push({ translateX: spec.x });
        if (spec.y !== undefined) transform.push({ translateY: spec.y });
        if (spec.scale !== undefined) transform.push({ scale: spec.scale });
        if (spec.rotate !== undefined) transform.push({ rotate: spec.rotate });
        return transform;
    };

    const EnteringAnimation = new Keyframe({
        0: {
            opacity: variants.enter.opacity ?? 0,
            transform: buildTransform(variants.enter),
        },
        100: {
            opacity: variants.center.opacity ?? 1,
            transform: buildTransform(variants.center),
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        },
    }).duration(transition.duration ?? 250);

    const ExitingAnimation = new Keyframe({
        0: {
            opacity: variants.center.opacity ?? 1,
            transform: buildTransform(variants.center),
        },
        100: {
            opacity: variants.exit.opacity ?? 0,
            transform: buildTransform(variants.exit),
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        },
    }).duration(transition.duration ?? 250);

    return (
        <View style={[styles.container, style]} >
            <Animated.View
                key={activeIndex}
                entering={EnteringAnimation}
                exiting={ExitingAnimation}
                layout={LinearTransition.springify().damping(20).stiffness(200)}
                style={styles.animatedChild}
            >
                {children[activeIndex]}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        overflow: 'hidden',
    },
    animatedChild: {
        width: '100%',
    },
});