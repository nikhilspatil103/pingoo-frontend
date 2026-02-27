# App Icon Generation Guide

## Design
The app icon is based on the PingooLogo loader design:
- Pink/Purple gradient circle (#F70776 to #FF1493)
- 4 white rounded blocks in a 2x2 grid pattern
- Clean, modern, recognizable design

## Files to Generate

### 1. icon.png (1024x1024)
Main app icon for iOS and Android

### 2. adaptive-icon.png (1024x1024)
Android adaptive icon (foreground layer)

### 3. splash.png (1284x2778)
Splash screen with logo centered

### 4. favicon.png (48x48)
Web favicon

## How to Generate Icons

### Option 1: Use Online Tool
1. Go to https://www.appicon.co/ or https://easyappicon.com/
2. Upload the SVG template (app-icon-template.svg)
3. Download all sizes
4. Replace files in /assets/ folder

### Option 2: Use Expo
```bash
npx expo install expo-app-icon-utils
npx expo-app-icon-utils generate
```

### Option 3: Manual Creation
Use any design tool (Figma, Photoshop, etc.) to create:
- 1024x1024 PNG with the design
- Pink gradient background (#F70776 to #FF1493)
- 4 white rounded squares (90x90px each with 12px border radius)
- 10px gap between squares
- Centered in the canvas

## Current Configuration (app.json)
```json
{
  "icon": "./assets/icon.png",
  "splash": {
    "image": "./assets/splash.png",
    "backgroundColor": "#F70776"
  },
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-icon.png",
      "backgroundColor": "#F70776"
    }
  }
}
```

## Quick Setup
1. Generate icons using one of the methods above
2. Replace files in /assets/ folder
3. Update app.json splash backgroundColor to "#F70776"
4. Run: `expo prebuild --clean`
5. Build APK: `eas build --platform android`

The app icon will now match the loader design!
