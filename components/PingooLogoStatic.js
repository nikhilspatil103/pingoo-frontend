import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Rect, Polygon, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';

export default function PingooLogoStatic({ size = 80 }) {
  const burstRotation = useRef(new Animated.Value(0)).current;
  const particleRotation = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;


  const burstSpin = burstRotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const particleSpin = particleRotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });

  return (
    <View style={{ width: size, height: size }}>
      {/* Static base SVG */}
      <Svg width={size} height={size} viewBox="0 0 512 512">
        <Defs>
          <LinearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FF69B4" />
            <Stop offset="100%" stopColor="#FF2D7A" />
          </LinearGradient>
          <LinearGradient id="cubeFace" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#F2F2F2" />
          </LinearGradient>
        </Defs>

        {/* Background */}
        <Rect width="512" height="512" rx="160" fill="url(#bg)" />

        {/* Cubes */}
        {/* <Rect x="135" y="135" width="80" height="80" rx="18" fill="url(#cubeFace)" />
        <Rect x="297" y="135" width="80" height="80" rx="18" fill="url(#cubeFace)" />
        <Rect x="135" y="297" width="80" height="80" rx="18" fill="url(#cubeFace)" />
        <Rect x="297" y="297" width="80" height="80" rx="18" fill="url(#cubeFace)" /> */}

        
        

        {/* Center Core */}
        <Circle cx="256" cy="256" r="24" fill="#FFFFFF" />
        <Circle cx="256" cy="256" r="10" fill="#FFD6E8" />
      </Svg>

      {/* Rotating burst layer */}
      {/* <Animated.View style={{ position: 'absolute', top: 0, left: 0, width: size, height: size, transform: [{ rotate: burstSpin }] }}> */}
      <Animated.View
  style={{
    position: 'absolute',
    top: 0,
    left: 0,
    width: size,
    height: size,
    transform: [
      { rotate: burstSpin },
      { scale: 1.08 }, // try 1.05 - 1.15
    ],
  }}
>
        <Svg width={size} height={size} viewBox="0 0 512 512">
          <Defs>
            <RadialGradient id="sn2" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
              <Stop offset="45%" stopColor="#FF9FC4" stopOpacity="0.2" />
              <Stop offset="100%" stopColor="#FF2D7A" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="256" cy="256" r="115" fill="url(#sn2)" />
          <Polygon points="256,256 256,40 270,180" fill="#FFD3E4" opacity="1" />
          <Polygon points="256,256 385,65 310,185" fill="#FFD3E4" opacity="1" />
          <Polygon points="256,256 465,165 330,220" fill="#FFD3E4" opacity="1" />
          <Polygon points="256,256 480,256 340,270" fill="#FFD3E4" opacity="1" />
          <Polygon points="256,256 465,347 330,292" fill="#FFD3E4" opacity="1" />
          <Polygon points="256,256 385,447 310,327" fill="#FFD3E4" opacity="1" />
          <Polygon points="256,256 256,472 242,332" fill="#FFD3E4" opacity="1" />
          <Polygon points="256,256 127,447 202,327" fill="#FFD3E4" opacity="1" />
          <Polygon points="256,256 47,347 182,292" fill="#FFD3E4" opacity="1" />
          <Polygon points="256,256 32,256 172,242" fill="#FFD3E4" opacity="1" />
          <Polygon points="256,256 47,165 182,220" fill="#FFD3E4" opacity="1" />
          <Polygon points="256,256 127,65 202,185" fill="#FFD3E4" opacity="1" />
          
          <Polygon points="256,256 105,105 205,205" fill="#FFE3ED" opacity="0.4" />
          <Polygon points="256,256 407,105 307,205" fill="#FFE3ED" opacity="0.4" />
          <Polygon points="256,256 407,407 307,307" fill="#FFE3ED" opacity="0.4" />
          <Polygon points="256,256 105,407 205,307" fill="#FFE3ED" opacity="0.4" />
        </Svg>
      </Animated.View>

      {/* Rotating particles layer */}
      {/* <Animated.View style={{ position: 'absolute', top: 0, left: 0, width: size, height: size, transform: [{ rotate: particleSpin }] }}>
        <Svg width={size} height={size} viewBox="0 0 512 512">
        <Circle cx="105" cy="145" r="8" fill="#FFFFFF" opacity="0.7" />
        <Circle cx="140" cy="90" r="6" fill="#FFFFFF" opacity="0.7" />
        <Circle cx="210" cy="60" r="8" fill="#FFFFFF" opacity="0.7" />
        <Circle cx="310" cy="55" r="8" fill="#FFFFFF" opacity="0.7" />
        <Circle cx="390" cy="90" r="6" fill="#FFFFFF" opacity="0.7" />
        <Circle cx="425" cy="145" r="8" fill="#FFFFFF" opacity="0.7" />
        <Circle cx="460" cy="256" r="10" fill="#FFFFFF" opacity="0.7" />
        <Circle cx="430" cy="360" r="8" fill="#FFFFFF" opacity="0.7" />
        <Circle cx="360" cy="430" r="8" fill="#FFFFFF" opacity="0.7" />
        <Circle cx="256" cy="465" r="10" fill="#FFFFFF" opacity="0.7" />
        <Circle cx="150" cy="425" r="8" fill="#FFFFFF" opacity="0.7" />
        <Circle cx="85" cy="360" r="8" fill="#FFFFFF" opacity="0.7" />
        <Circle cx="55" cy="256" r="10" fill="#FFFFFF" opacity="0.7" />
        </Svg>
      </Animated.View> */}

      {/* Pulsing core overlay */}
      <Animated.View style={{ position: 'absolute', top: 0, left: 0, width: size, height: size, transform: [{ scale: pulseAnim }] }}>
        <Svg width={size} height={size} viewBox="0 0 512 512">
          <Circle cx="256" cy="256" r="24" fill="#FFFFFF" />
          <Circle cx="256" cy="256" r="10" fill="#FFD6E8" />
        </Svg>
      </Animated.View>
    </View>
  );
}
