# Create macOS Dock App - Step by Step Guide

## Method 1: Using Automator (Recommended - Built into macOS)

### Step 1: Open Automator
1. Press `Cmd + Space` to open Spotlight
2. Type "Automator" and press Enter
3. Click "New Document"
4. Select **"Application"** and click "Choose"

### Step 2: Create the App
1. In the left sidebar, search for "Run Shell Script"
2. Double-click "Run Shell Script" to add it to your workflow
3. In the Shell dropdown, make sure `/bin/bash` is selected
4. **Delete** the default text in the script area
5. **Copy and paste** this entire script:

```bash
#!/bin/bash

# Get the directory where the app is located
APP_DIR="/Users/devrimcelikay/accountabilityCentre"
cd "$APP_DIR"

# Launch the app
./launch-app.sh
```

6. At the top, change "Pass input" to **"as arguments"**

### Step 3: Save the Application
1. Click `File > Save` (or press `Cmd + S`)
2. Name it: **"Accountability Centre"**
3. Save location: Choose **Applications** folder (or Desktop)
4. Click "Save"

### Step 4: Add to Dock
1. Open Finder
2. Go to Applications (or Desktop, wherever you saved it)
3. Find "Accountability Centre.app"
4. Drag it to your Dock

### Step 5: Run It!
1. Click the app icon in your Dock
2. If you see a security warning, go to:
   - System Settings → Privacy & Security
   - Click "Open Anyway" next to the Accountability Centre app
3. The app will start and open in your browser automatically!

---

## Method 2: Using Platypus (More Control, Needs Installation)

### Step 1: Install Platypus
```bash
brew install --cask platypus
```

Or download from: https://sveinbjorn.org/platypus

### Step 2: Create the App with Platypus
1. Open Platypus
2. Fill in these settings:
   - **App Name**: Accountability Centre
   - **Script Type**: Shell (bash)
   - **Script Path**: Click "Select" and choose: `/Users/devrimcelikay/accountabilityCentre/launch-app.sh`
   - **Output**: None
   - **Identifier**: com.accountability.centre
   - Check ✓ **Runs in background**
   - Check ✓ **Remain running after completion**

3. (Optional) Add an icon:
   - Click the default icon
   - Choose an icon file (see Icon section below)

4. Click "Create App"
5. Save to Applications folder

### Step 3: Add to Dock
1. Drag the app from Applications to your Dock
2. Click to launch!

---

## Adding a Custom Icon

### Option A: Quick Icon (Using an Emoji or Image)
1. Find an image you like (or create one)
2. Open Preview and resize it to 512x512 pixels
3. Save as PNG
4. Right-click your app → Get Info
5. Drag the PNG onto the icon in the top-left corner

### Option B: Generate Professional Icon
1. Visit: https://www.appicon.co
2. Upload a 1024x1024 image
3. Download the .icns file
4. Use with Platypus or:
   - Right-click app → Show Package Contents
   - Navigate to Contents/Resources/
   - Replace applet.icns with your icon
   - Rename your icon to applet.icns

---

## Stopping the App

The app runs in the background. To stop it, run:
```bash
cd /Users/devrimcelikay/accountabilityCentre
./stop.sh
```

Or create a "Stop Accountability Centre" app using the same Automator method, but with this script:
```bash
cd /Users/devrimcelikay/accountabilityCentre && ./stop.sh
```

---

## Troubleshooting

### App won't open
- Check Security & Privacy settings
- Open Terminal and run: `chmod +x /Users/devrimcelikay/accountabilityCentre/launch-app.sh`

### App opens but nothing happens
- Check logs: `/Users/devrimcelikay/accountabilityCentre/app.log`
- Make sure you have Node.js and Python 3 installed

### Port already in use
- Run the stop script first: `./stop.sh`
- Or restart your computer

### Need to see logs while running
- Open Terminal
- Run: `tail -f /Users/devrimcelikay/accountabilityCentre/app.log`

---

## Making it Start at Login (Optional)

1. Go to System Settings → General → Login Items
2. Click the "+" button
3. Navigate to and select your "Accountability Centre" app
4. It will now start automatically when you log in!
