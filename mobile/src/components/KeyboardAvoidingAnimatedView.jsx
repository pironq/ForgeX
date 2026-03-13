
import React, { useRef, useEffect } from 'react';
import { Platform, Keyboard, KeyboardAvoidingView, Animated } from 'react-native';

const KeyboardAvoidingAnimatedView = (props, ref) => {
  const {
    children,
    behavior = Platform.OS === 'ios' ? 'padding' : 'height',
    keyboardVerticalOffset = 0,
    style,
    contentContainerStyle,
    enabled = true,
    onLayout,
    ...leftoverProps
  } = props;

  const animatedViewRef = useRef(null);
  const initialHeightRef = useRef(0);
  const bottomRef = useRef(0);
  const bottomHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!enabled) return;

    const onKeyboardShow = (event) => {
      const { duration, endCoordinates } = event;
      const animatedView = animatedViewRef.current;

      if (!animatedView) return;

      const keyboardY = endCoordinates.screenY - keyboardVerticalOffset;
      const height = Math.max(animatedView.y + animatedView.height - keyboardY, 0);

      Animated.timing(bottomHeight, {
        toValue: height,
        duration: duration > 10 ? duration : 300,
        useNativeDriver: false,
      }).start();
      bottomRef.current = height;
    };

    const onKeyboardHide = () => {
      Animated.timing(bottomHeight, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
      bottomRef.current = 0;
    };

    const showSub = Keyboard.addListener('keyboardWillShow', onKeyboardShow);
    const hideSub = Keyboard.addListener('keyboardWillHide', onKeyboardHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardVerticalOffset, enabled, bottomHeight]);

  const handleLayout = (event) => {
    const layout = event.nativeEvent.layout;
    animatedViewRef.current = layout;

    if (!initialHeightRef.current) {
      initialHeightRef.current = layout.height;
    }

    if (onLayout) {
      onLayout(event);
    }
  };

  const getAnimatedStyle = () => {
    if (behavior === 'height') {
      return {
        height: Animated.subtract(initialHeightRef.current || 0, bottomHeight),
      };
    }
    if (behavior === 'padding') {
      return { paddingBottom: bottomHeight };
    }
    return {};
  };

  const renderContent = () => {
    if (behavior === 'position') {
      return (
        <Animated.View style={[contentContainerStyle, { bottom: bottomHeight }]}>
          {children}
        </Animated.View>
      );
    }
    return children;
  };

  if (Platform.OS === 'web') {
    return (
      <KeyboardAvoidingView
        behavior={behavior}
        style={style}
        contentContainerStyle={contentContainerStyle}
        {...leftoverProps}
      >
        {children}
      </KeyboardAvoidingView>
    );
  }

  return (
    <Animated.View
      ref={ref}
      style={[style, getAnimatedStyle()]}
      onLayout={handleLayout}
      {...leftoverProps}
    >
      {renderContent()}
    </Animated.View>
  );
};

KeyboardAvoidingAnimatedView.displayName = 'KeyboardAvoidingAnimatedView';

export default KeyboardAvoidingAnimatedView;
