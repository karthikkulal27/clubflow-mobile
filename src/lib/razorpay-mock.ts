// Mock for Expo Go — react-native-razorpay requires a dev build.
// In __DEV__ mode usePayNow bypasses this entirely and calls /mock-pay directly,
// so this module is only here to satisfy the import and avoid a crash.
import { Alert } from 'react-native';

interface RazorpaySuccessData {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

const RazorpayCheckout = {
  open(_options: object): Promise<RazorpaySuccessData> {
    return new Promise((_resolve, reject) => {
      Alert.alert(
        'Payment Unavailable',
        'Razorpay requires a development build. Use "eas build --profile development" to test real payments.',
        [{ text: 'OK', onPress: () => reject(new Error('Razorpay not available in Expo Go')) }],
      );
    });
  },
};

export default RazorpayCheckout;
