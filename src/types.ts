export type OrderStatus = 'received' | 'confirmed' | 'in_progress' | 'finishing' | 'ready' | 'completed' | 'cancelled'

export const statusLabels: Record<OrderStatus, string> = {
  received: 'Pesanan diterima', confirmed: 'Dikonfirmasi', in_progress: 'Sedang dikerjakan',
  finishing: 'Tahap penyelesaian', ready: 'Siap diambil', completed: 'Selesai', cancelled: 'Dibatalkan',
}

export interface Service { id: string; name: string; description: string | null; starting_price: number | null; icon: string | null; is_active: boolean; sort_order: number }
export interface Portfolio { id: string; title: string; description: string | null; image_url: string; category: string | null; is_active: boolean; sort_order: number }
export interface BusinessSettings { id?: string; business_name: string; tagline: string; description: string; whatsapp: string; address: string; instagram: string | null; hours: string; hero_image_url?: string | null }
export interface Customer { id: string; name: string; whatsapp: string; address: string | null; active_stamps: number; available_rewards: number; created_at: string; customer_measurements?: Array<{ id: string; label: string; measurements: Record<string,string>; notes: string | null }> }
export interface OrderItem { id?: string; clothing_type: string; model: string; quantity: number; unit_price: number; reference_path?: string | null }
export interface Order { id: string; order_number: string; customer_id: string; status: OrderStatus; notes: string | null; total_price: number; estimated_completion: string | null; created_at: string; customers?: Pick<Customer,'name'|'whatsapp'|'address'>; order_items?: OrderItem[] }
export interface Reward { id: string; name: string; description: string | null; stamp_cost: number; stock: number | null; is_active: boolean }
