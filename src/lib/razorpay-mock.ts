// Mock for Expo Go — react-native-razorpay requires a dev build
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
        'Razorpay requires a development build. Use "eas build --profile development" to test payments.',
        [{ text: 'OK', onPress: () => reject(new Error('Expo Go — payment not supported')) }],
      );
    });
  },
};

export default RazorpayCheckout;
