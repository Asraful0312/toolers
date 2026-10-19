import { useAds } from '@/context/AdContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const BUTTONS = [
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '⌫', '='],
];

export default function CalculatorTool() {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);
  const { onToolComplete } = useAds();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = "#22c55e";

  const handlePress = (value: string) => {
    if (value === 'C') {
      setDisplay('0');
      setEquation('');
      return;
    }

    if (value === '⌫') {
      setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
      return;
    }

    if (value === '±') {
      setDisplay(display.startsWith('-') ? display.slice(1) : '-' + display);
      return;
    }

    if (value === '%') {
      setDisplay(String(parseFloat(display) / 100));
      return;
    }

    if (['+', '−', '×', '÷'].includes(value)) {
      setEquation(display + ' ' + value + ' ');
      setShouldResetDisplay(true);
      return;
    }

    if (value === '=') {
      try {
        const expr = (equation + display)
          .replace(/×/g, '*')
          .replace(/÷/g, '/')
          .replace(/−/g, '-');
        const result = eval(expr);
        setDisplay(String(result));
        setEquation('');
        onToolComplete();
      } catch {
        setDisplay('Error');
      }
      return;
    }

    if (shouldResetDisplay) {
      setDisplay(value);
      setShouldResetDisplay(false);
    } else {
      setDisplay(display === '0' && value !== '.' ? value : display + value);
    }
  };

  const isOperator = (v: string) => ['C', '±', '%', '÷', '×', '−', '+', '='].includes(v);
  const screenWidth = Dimensions.get('window').width;
  const buttonSize = (screenWidth - 80) / 4;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={[styles.displayContainer, { backgroundColor: cardColor }]}>
        <Text style={[styles.equation, { color: textSecondaryColor }]}>{equation}</Text>

        <Text style={[styles.display, { color: textColor }]} numberOfLines={1} adjustsFontSizeToFit>
          {display}
        </Text>
      </View>

      <View style={styles.buttonsContainer}>
        {BUTTONS.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((btn) => (
              <TouchableOpacity
                key={btn}
                style={[
                  styles.button,
                  { width: buttonSize, height: buttonSize },
                  btn === '=' && { backgroundColor: primaryColor },
                  isOperator(btn) && btn !== '=' && { backgroundColor: primaryColor + '1A' },
                  !isOperator(btn) && { backgroundColor: cardColor },
                ]}
                onPress={() => handlePress(btn)}
              >
                <Text
                  style={[
                    styles.buttonText,
                    btn === '=' && { color: 'white' },
                    isOperator(btn) && btn !== '=' && { color: primaryColor },
                    !isOperator(btn) && { color: textColor },
                  ]}
                >
                  {btn}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  displayContainer: { flex: 1, borderRadius: 24, padding: 24, justifyContent: 'flex-end', marginBottom: 20 },
  equation: { fontSize: 20, textAlign: 'right', marginBottom: 8 },
  display: { fontSize: 56, fontWeight: 'bold', textAlign: 'right' },
  buttonsContainer: { gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  button: { borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 28, fontWeight: '500' },
});
