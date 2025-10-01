# Flutter Installation Guide for Windows

## Manual Installation Steps

### 1. Download Flutter SDK
1. Go to: https://docs.flutter.dev/get-started/install/windows
2. Download the latest stable release (Flutter SDK)
3. Extract to `C:\flutter` (or your preferred location)

### 2. Add Flutter to PATH
1. Open System Properties (Windows + R → `sysdm.cpl`)
2. Click "Environment Variables"
3. Under "User variables", find "Path" and click "Edit"
4. Click "New" and add: `C:\flutter\bin`
5. Click "OK" to save

### 3. Verify Installation
Open a new PowerShell window and run:
```bash
flutter doctor
```

### 4. Install Android Studio (for Android development)
1. Download from: https://developer.android.com/studio
2. Install with default settings
3. Open Android Studio → Configure → SDK Manager
4. Install latest Android SDK

### 5. Set up VS Code for Flutter
1. Install "Flutter" extension in VS Code
2. Install "Dart" extension in VS Code
3. Restart VS Code

### 6. Create Your First Flutter Project
```bash
# Navigate to your development directory
cd E:\

# Create new Flutter project
flutter create spiritof_mobile

# Navigate into project
cd spiritof_mobile

# Run the app
flutter run
```

## Next Steps After Installation
Once Flutter is installed, we'll:
1. Create a basic Christmas-themed app
2. Learn Dart language fundamentals
3. Understand Flutter widgets
4. Build your first QR code display
5. Connect to your existing API

Let me know when you've completed the installation!