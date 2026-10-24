import { Audio } from 'expo-av';

let currentSound = null;

async function ensureAudioMode() {
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, shouldDuckAndroid: true, staysActiveInBackground: false });
  } catch (error) {
    // ignore audio mode issues
  }
}

export async function playButtonSound() {
  try {
    await ensureAudioMode();
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/button_tap.wav'),
      { shouldPlay: true, volume: 0.35 }
    );

    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
      }
    });
  } catch (error) {
    console.log('Button sound error:', error);
  }
}

export async function playCheckoutSound() {
  try {
    await ensureAudioMode();
    if (currentSound) {
      try {
        await currentSound.stopAsync();
      } catch (error) {
        // ignore stop errors
      }
      try {
        await currentSound.unloadAsync();
      } catch (error) {
        // ignore unload errors
      }
    }

    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/success_chime.wav'),
      { shouldPlay: true, volume: 0.8 }
    );

    currentSound = sound;
    await sound.playAsync();

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
        currentSound = null;
      }
    });
  } catch (error) {
    console.log('Checkout sound error:', error);
  }
}
