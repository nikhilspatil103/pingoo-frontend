import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const Avatar = ({ name, gender, size = 70, online = false, showGenderBadge = true }) => {
  const { theme } = useTheme();

  const getInitials = (name) => {
    return name.charAt(0).toUpperCase();
  };

  const getGenderIcon = (gender) => gender === 'female' ? '♀' : '♂';
  const getGenderColor = (gender) => gender === 'female' ? '#FF69B4' : '#4A90E2';
  
  const getAvatarGradient = (name) => {
    const gradients = [
      ['#FF6B6B', '#FF8E53'],
      ['#4A90E2', '#357ABD'],
      ['#9B59B6', '#8E44AD'],
      ['#1ABC9C', '#16A085'],
      ['#F39C12', '#E67E22'],
      ['#E91E63', '#C2185B'],
    ];
    const index = name.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  const [color1, color2] = getAvatarGradient(name);
  const genderColor = getGenderColor(gender);
  const badgeSize = size * 0.28;
  const dotSize = size * 0.18;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View 
        style={[
          styles.avatar, 
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            backgroundColor: color1,
          }
        ]}
      >
        <Text style={[styles.initials, { fontSize: size * 0.35 }]}>
          {getInitials(name)}
        </Text>
      </View>

      {online && (
        <View 
          style={[
            styles.onlineDot, 
            { 
              width: dotSize, 
              height: dotSize, 
              borderRadius: dotSize / 2,
              top: size * 0.05,
              right: size * 0.05,
              borderWidth: size * 0.03,
            }
          ]} 
        />
      )}

      {showGenderBadge && (
        <View 
          style={[
            styles.genderBadge, 
            { 
              width: badgeSize, 
              height: badgeSize, 
              borderRadius: badgeSize / 2,
              backgroundColor: genderColor,
              borderWidth: size * 0.03,
            }
          ]}
        >
          <Text style={[styles.genderIcon, { fontSize: badgeSize * 0.5 }]}>
            {getGenderIcon(gender)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontWeight: 'bold',
    color: '#fff',
  },
  onlineDot: {
    position: 'absolute',
    backgroundColor: '#4CAF50',
    borderColor: '#fff',
  },
  genderBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#fff',
  },
  genderIcon: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default Avatar;
