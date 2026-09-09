import { useEffect, useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { apiClient, formatGHS } from '@my-app/shared';
import LinkPayLogo from '../components/LinkPayLogo';

const checkoutLink = process.env.EXPO_PUBLIC_STORE_URL || 'http://localhost:5173/';

export default function MerchantOrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const paidOrders = orders.filter((order) => order.paymentStatus === 'paid');
  const sales = paidOrders.reduce((total, order) => total + Number(order.totalAmount || 0), 0);

  useEffect(() => {
    let active = true;
    apiClient.get('/orders')
      .then((response) => { if (active) setOrders(response.data); })
      .catch(() => { if (active) setError('Unable to load orders. Check that the API is running.'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  async function shareStoreLink() {
    await Clipboard.setStringAsync(checkoutLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 58, paddingBottom: 40 }}>
        <View className="rounded-[24px] bg-[#1E3A8A] p-6 shadow-lg">
          <View className="flex-row items-start justify-between">
            <View><Text className="text-xs font-bold uppercase tracking-[3px] text-amber-300">Merchant workspace</Text><LinkPayLogo width={150} height={50} /></View>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=160&q=80' }} className="h-14 w-14 rounded-2xl" />
          </View>
          <Text className="mt-10 text-sm text-white/55">Today&apos;s store pulse</Text>
          <Text className="mt-2 text-4xl font-black text-white">{formatGHS(sales)}</Text>
          <View className="mt-6 flex-row gap-3">
            <View className="flex-1 rounded-2xl bg-white/10 p-3"><Text className="text-xs text-white/50">Paid orders</Text><Text className="mt-1 text-xl font-black text-white">{paidOrders.length}</Text></View>
            <View className="flex-1 rounded-2xl bg-white/10 p-3"><Text className="text-xs text-white/50">All orders</Text><Text className="mt-1 text-xl font-black text-white">{orders.length}</Text></View>
          </View>
        </View>
        <TouchableOpacity onPress={shareStoreLink} className="mt-5 flex-row items-center justify-center rounded-xl bg-[#F59E0B] px-5 py-4 shadow-sm"><Text className="font-black text-[#0F172A]">{copied ? 'Store link copied' : 'Share Store Link'}</Text></TouchableOpacity>
        <View className="mt-10 flex-row items-end justify-between"><View><Text className="text-xs font-bold uppercase tracking-[2px] text-[#2563EB]">Activity</Text><Text className="mt-2 text-2xl font-black text-[#0F172A]">Latest orders</Text></View><Text className="text-sm font-bold text-black/40">{orders.length} total</Text></View>
        {isLoading && <View className="items-center py-16"><ActivityIndicator color="#2563EB" size="large" /></View>}
        {error && <Text className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</Text>}
        {!isLoading && !error && orders.length === 0 && <Text className="mt-6 text-base text-black/50">Your first order will appear here.</Text>}
        <View className="mt-4 gap-4">
          {orders.map((order) => <View key={order._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <View className="flex-row items-start justify-between"><View><Text className="text-lg font-black text-[#0F172A]">{order.customerName}</Text><Text className="mt-1 text-sm text-black/50">{order.customerPhone}</Text></View><Text className={`rounded-full px-3 py-1 text-xs font-bold ${order.paymentStatus === 'paid' ? 'bg-blue-100 text-[#1E3A8A]' : 'bg-orange-100 text-orange-700'}`}>{order.paymentStatus}</Text></View>
            <Text className="mt-5 text-sm text-black/60">{order.items?.map((item) => `${item.title} x${item.quantity}`).join(', ')}</Text>
            <View className="mt-5 flex-row items-end justify-between border-t border-black/10 pt-4"><Text className="max-w-[65%] text-xs text-black/45">{order.deliveryAddress}</Text><Text className="text-lg font-black text-[#111815]">{formatGHS(order.totalAmount)}</Text></View>
          </View>)}
        </View>
      </ScrollView>
    </View>
  );
}
