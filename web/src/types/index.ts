export interface Customer {
  id: number;
  nama: string;
  alamat: string;
  kota: string;
  kode_pos: string;
  telepon: string;
  email: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface DashboardStats {
  total_customers: number;
  active_customers: number;
  inactive_customers: number;
  total_letters: number;
}

export interface Letter {
  id: string;
  nomor: string;
  tanggal: string;
  perihal: string;
  customer_id: number;
  customer_nama: string;
  total_tunggakan?: string;
  total_tagihan?: number;
  status: 'draft' | 'sent';
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// SPK Management Types
export interface Penyegelan {
  rowid?: number;
  'NO.': number | null;
  'TANGGAL': string;
  'NOMOR PELANGGAN': string;
  'NAMA': string;
  'JUMLAH BLN': number;
  'TOTAL REK': number;
  'DENDA': number;
  'JUMLAH': number;
  'KET': string;
}

export interface Pencabutan {
  rowid?: number;
  'NO': number;
  'NO SAMB': string;
  'NAMA': string;
  'ALAMAT': string;
  'TOTAL TUNGGAKAN': number;
  'JUMLAH TUNGGAKAN (Rp)': number;
  'KET': string;
}

export interface SPKStats {
  total_penyegelan: number;
  total_pencabutan: number;
  total_all: number;
  penyegelan_by_ket: Array<{ KET: string; count: number }>;
  pencabutan_by_ket: Array<{ KET: string; count: number }>;
  total_tunggakan_penyegelan: number;
  total_tunggakan_pencabutan: number;
  total_tunggakan_all: number;
}

export interface SPKItem {
  spk_number: string;
  data: Penyegelan | Pencabutan;
  type: 'penyegelan' | 'pencabutan';
  generated_at: string;
}

export interface GenerateSPKResponse {
  spk_list: SPKItem[];
  total: number;
}