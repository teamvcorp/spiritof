# Snow Effects System

A modular snow effects system that adds winter magic to page transitions and provides interactive snow that collects on the footer.

## Components

### 1. `SnowEffect.tsx`
The core snow animation component that creates:
- Falling snowflakes with realistic physics
- Snow that accumulates at the bottom of the screen
- Interactive snow that moves away when the mouse gets close
- Customizable snowflake count and ground height

### 2. `PageTransitionSnow.tsx`
A wrapper component that triggers snow effects during page transitions:
- Automatically detects route changes
- Shows snow for a configurable duration
- Adds a subtle transition overlay
- Can be easily enabled/disabled

### 3. `SnowControls.tsx`
Provides context management and UI controls:
- `SnowProvider`: React context for global snow state
- `useSnow`: Hook to access snow controls
- `SnowToggleButton`: Ready-to-use toggle button

## Usage

### Basic Setup
The system is already integrated into your app via `Providers.client.tsx`:

```tsx
<SnowProvider>
  <PageTransitionSnow enabled={true}>
    {children}
  </PageTransitionSnow>
</SnowProvider>
```

### Toggle Button
A snow toggle button has been added to the header. Users can enable/disable snow effects at any time.

### Customization
You can customize the snow effects by modifying props:

```tsx
<PageTransitionSnow 
  enabled={true}
  transitionDuration={500}
  snowDuration={3000}
>
  <SnowEffect 
    snowflakeCount={150}
    maxGroundHeight={60}
  />
</PageTransitionSnow>
```

## Features

- ❄️ **Realistic Physics**: Snowflakes fall with natural drift and wind effects
- 🖱️ **Mouse Interaction**: Snow moves away from the cursor when it gets close
- 📱 **Responsive**: Works on all screen sizes
- ⚡ **Performance**: Optimized canvas rendering with requestAnimationFrame
- 🎛️ **Configurable**: Easy to customize or completely disable
- 🔌 **Modular**: Can be easily removed if not desired

## Performance Notes

- Uses HTML5 Canvas for efficient rendering
- Automatically cleans up animation frames and event listeners
- Snow effects only run during transitions (configurable duration)
- Minimal impact on page performance when not active

## Easy Removal

To completely remove snow effects:

1. Remove the SnowProvider and PageTransitionSnow from `Providers.client.tsx`
2. Remove the SnowToggleButton from `Header.client.tsx`
3. Delete the `components/effects/` folder

The modular design ensures no other parts of the app are affected.