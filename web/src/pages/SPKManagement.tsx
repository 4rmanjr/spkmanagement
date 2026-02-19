import { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Search, 
  FilePlus, 
  Printer, 
  AlertCircle, 
  UserX, 
  CheckSquare, 
  Square,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  Table as TableIcon,
  X,
  Trash2,
  FileDown,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { api } from '../api';
import type { Penyegelan, Pencabutan, SPKItem } from '../types';
import jsPDF from 'jspdf';
import logoImage from '../../logo/images.png';

type TabType = 'penyegelan' | 'pencabutan';
type ViewMode = 'table' | 'cards';
type SortOption = 'name-asc' | 'name-desc' | 'amount-high' | 'amount-low';

const KET_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'LUNAS', label: 'Lunas' },
  { value: 'BYR/LUNAS', label: 'Bayar/Lunas' },
  { value: 'CABUT', label: 'Cabut' },
  { value: 'PERMOHONAN', label: 'Permohonan' },
  { value: 'BELUM LUNAS', label: 'Belum Lunas' },
  { value: 'PROSES', label: 'Proses' },
];

const ITEMS_PER_PAGE_OPTIONS = [25, 50, 100];

// Skeleton Components
function TableRowSkeleton({ activeTab }: { activeTab: TabType }) {
  return (
    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
      <td style={{ padding: '0.75rem' }}><div style={{ width: 20, height: 20, background: 'var(--bg-secondary)', borderRadius: 4, animation: 'pulse 2s infinite' }} /></td>
      <td style={{ padding: '0.75rem' }}><div style={{ width: 40, height: 16, background: 'var(--bg-secondary)', borderRadius: 4, animation: 'pulse 2s infinite' }} /></td>
      <td style={{ padding: '0.75rem' }}><div style={{ width: 120, height: 16, background: 'var(--bg-secondary)', borderRadius: 4, animation: 'pulse 2s infinite' }} /></td>
      <td style={{ padding: '0.75rem' }}><div style={{ width: 150, height: 16, background: 'var(--bg-secondary)', borderRadius: 4, animation: 'pulse 2s infinite' }} /></td>
      {activeTab === 'penyegelan' ? (
        <>
          <td style={{ padding: '0.75rem' }}><div style={{ width: 60, height: 16, background: 'var(--bg-secondary)', borderRadius: 4, animation: 'pulse 2s infinite' }} /></td>
          <td style={{ padding: '0.75rem' }}><div style={{ width: 100, height: 16, background: 'var(--bg-secondary)', borderRadius: 4, animation: 'pulse 2s infinite' }} /></td>
          <td style={{ padding: '0.75rem' }}><div style={{ width: 80, height: 16, background: 'var(--bg-secondary)', borderRadius: 4, animation: 'pulse 2s infinite' }} /></td>
          <td style={{ padding: '0.75rem' }}><div style={{ width: 100, height: 16, background: 'var(--bg-secondary)', borderRadius: 4, animation: 'pulse 2s infinite' }} /></td>
        </>
      ) : (
        <>
          <td style={{ padding: '0.75rem' }}><div style={{ width: 200, height: 16, background: 'var(--bg-secondary)', borderRadius: 4, animation: 'pulse 2s infinite' }} /></td>
          <td style={{ padding: '0.75rem' }}><div style={{ width: 80, height: 16, background: 'var(--bg-secondary)', borderRadius: 4, animation: 'pulse 2s infinite' }} /></td>
          <td style={{ padding: '0.75rem' }}><div style={{ width: 100, height: 16, background: 'var(--bg-secondary)', borderRadius: 4, animation: 'pulse 2s infinite' }} /></td>
        </>
      )}
      <td style={{ padding: '0.75rem' }}><div style={{ width: 80, height: 24, background: 'var(--bg-secondary)', borderRadius: 4, animation: 'pulse 2s infinite' }} /></td>
    </tr>
  );
}

function CardSkeleton() {
  return (
    <div style={{
      padding: '1rem',
      borderRadius: '0.5rem',
      border: '1px solid var(--border-color)',
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ width: 100, height: 16, background: 'var(--bg-secondary)', borderRadius: 4, animation: 'pulse 2s infinite' }} />
        <div style={{ width: 60, height: 24, background: 'var(--bg-secondary)', borderRadius: 4, animation: 'pulse 2s infinite' }} />
      </div>
      <div style={{ width: '80%', height: 20, background: 'var(--bg-secondary)', borderRadius: 4, animation: 'pulse 2s infinite' }} />
      <div style={{ width: '60%', height: 16, background: 'var(--bg-secondary)', borderRadius: 4, animation: 'pulse 2s infinite' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
        <div style={{ width: 80, height: 16, background: 'var(--bg-secondary)', borderRadius: 4, animation: 'pulse 2s infinite' }} />
        <div style={{ width: 100, height: 16, background: 'var(--bg-secondary)', borderRadius: 4, animation: 'pulse 2s infinite' }} />
      </div>
    </div>
  );
}

export function SPKManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('penyegelan');
  const [penyegelanData, setPenyegelanData] = useState<Penyegelan[]>([]);
  const [pencabutanData, setPencabutanData] = useState<Pencabutan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [ketFilter, setKetFilter] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [generatedSPK, setGeneratedSPK] = useState<SPKItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'penyegelan') {
        const data = await api.getPenyegelan(searchTerm, ketFilter || undefined);
        setPenyegelanData(data);
      } else {
        const data = await api.getPencabutan(searchTerm, ketFilter || undefined);
        setPencabutanData(data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchTerm, ketFilter]);

  useEffect(() => {
    loadData();
    setCurrentPage(1);
    setSelectedItems(new Set());
  }, [loadData]);

  // Sort and filter data
  const sortedData = useMemo(() => {
    const data = activeTab === 'penyegelan' ? penyegelanData : pencabutanData;
    const sorted = [...data];
    
    switch (sortBy) {
      case 'name-asc':
        sorted.sort((a, b) => a['NAMA'].localeCompare(b['NAMA']));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b['NAMA'].localeCompare(a['NAMA']));
        break;
      case 'amount-high':
        sorted.sort((a, b) => {
          const aAmount = activeTab === 'penyegelan' 
            ? (a as Penyegelan)['JUMLAH'] 
            : (a as Pencabutan)['JUMLAH TUNGGAKAN (Rp)'];
          const bAmount = activeTab === 'penyegelan' 
            ? (b as Penyegelan)['JUMLAH'] 
            : (b as Pencabutan)['JUMLAH TUNGGAKAN (Rp)'];
          return bAmount - aAmount;
        });
        break;
      case 'amount-low':
        sorted.sort((a, b) => {
          const aAmount = activeTab === 'penyegelan' 
            ? (a as Penyegelan)['JUMLAH'] 
            : (a as Pencabutan)['JUMLAH TUNGGAKAN (Rp)'];
          const bAmount = activeTab === 'penyegelan' 
            ? (b as Penyegelan)['JUMLAH'] 
            : (b as Pencabutan)['JUMLAH TUNGGAKAN (Rp)'];
          return aAmount - bAmount;
        });
        break;
    }
    return sorted;
  }, [activeTab, penyegelanData, pencabutanData, sortBy]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  // Handlers
  const handleSelectAll = () => {
    if (selectedItems.size === paginatedData.length) {
      setSelectedItems(new Set());
    } else {
      const start = (currentPage - 1) * itemsPerPage;
      const allIds = new Set(paginatedData.map((_, index) => start + index));
      setSelectedItems(allIds);
    }
  };

  const handleSelectItem = (index: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const handleGenerateSPK = async () => {
    if (selectedItems.size === 0) return;
    setShowConfirmModal(true);
  };

  const confirmGenerateSPK = async () => {
    setIsGenerating(true);
    try {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const spkList: SPKItem[] = [];
      
      const sortedIndices = Array.from(selectedItems).sort((a, b) => a - b);
      
      sortedIndices.forEach((index, i) => {
        const item = sortedData[index];
        if (item) {
          const spkNumber = `SPK/${month}/${year}/${String(i + 1).padStart(4, '0')}`;
          spkList.push({
            spk_number: spkNumber,
            data: item,
            type: activeTab,
            generated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
          });
        }
      });
      
      setGeneratedSPK(spkList);
      setShowConfirmModal(false);
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Error generating SPK:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSPKPDF = async (spk: SPKItem) => {
    setPdfError(null);
    setGeneratingPdfId(spk.spk_number);

    try {
      await new Promise(resolve => setTimeout(resolve, 0));

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      const drawSPKSection = (xOffset: number) => {
        const startX = xOffset + 14;
        const endX = xOffset + 134.5;
        const centerX = xOffset + 74.25;
        
        doc.addImage(logoImage, 'PNG', startX + 1, 8, 20, 20);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('PERUSAHAAN UMUM DAERAH AIR MINUM', centerX + 10, 15, { align: 'center' });
        doc.setFontSize(11);
        doc.text('TIRTA TARUM KABUPATEN KARAWANG', centerX + 10, 20, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('Jl. Surotokunto No.205 Karawang Timur', centerX + 10, 25, { align: 'center' });
        
        doc.setLineWidth(0.4);
        doc.line(startX, 30, endX, 30);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        const titleText = spk.type === 'penyegelan' 
          ? 'SURAT PERINTAH KERJA PENYEGELAN' 
          : 'SURAT PERINTAH KERJA PENCABUTAN';
        doc.text(titleText, centerX, 40, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text(`Nomor: ${spk.spk_number}`, centerX, 45, { align: 'center' });
        
        doc.setFontSize(9);
        const labelX = startX;
        const colonX = startX + 18;
        
        doc.text('Dari', labelX, 55);
        doc.text(': Manager Kotabaru', colonX, 55);
        doc.text('Untuk', labelX, 61);
        doc.text(': Distribusi', colonX, 61);
        
        const introText = spk.type === 'penyegelan'
          ? 'Untuk melaksanakan pekerjaan PENYEGELAN sambungan pelanggan'
          : 'Untuk melaksanakan pekerjaan PENCABUTAN sambungan pelanggan';
        doc.text(introText, labelX, 72);
        doc.text('sebagaimana data dibawah ini :', labelX, 77);
        
        const dataX = startX + 15;
        const dataColonX = startX + 45;
        const dataY = 88;
        const stepY = 6;
        
        doc.text('No pelanggan', dataX, dataY);
        if (spk.type === 'penyegelan') {
          const data = spk.data as Penyegelan;
          doc.text(`: ${data['NOMOR PELANGGAN']}`, dataColonX, dataY);
          doc.text('Nama', dataX, dataY + stepY);
          doc.setFont('helvetica', 'bold');
          doc.text(`: ${data['NAMA']}`, dataColonX, dataY + stepY);
          doc.setFont('helvetica', 'normal');
          doc.setFont('helvetica', 'italic');
          doc.text('Rincian tunggakan air / Non air', dataX, dataY + stepY * 2.5);
          doc.setFont('helvetica', 'normal');
          doc.text('Jumlah Bulan', dataX, dataY + stepY * 3.5);
          doc.text(`: ${data['JUMLAH BLN']} Bulan`, dataColonX, dataY + stepY * 3.5);
          doc.text('Jumlah Total', dataX, dataY + stepY * 4.5);
          doc.text(`: ${formatCurrency(data['JUMLAH'])}`, dataColonX, dataY + stepY * 4.5);
        } else {
          const data = spk.data as Pencabutan;
          doc.text(`: ${data['NO SAMB']}`, dataColonX, dataY);
          doc.text('Nama', dataX, dataY + stepY);
          doc.setFont('helvetica', 'bold');
          doc.text(`: ${data['NAMA']}`, dataColonX, dataY + stepY);
          doc.setFont('helvetica', 'normal');
          doc.setFont('helvetica', 'italic');
          doc.text('Rincian tunggakan air / Non air', dataX, dataY + stepY * 2.5);
          doc.setFont('helvetica', 'normal');
          doc.text('Total Tunggakan', dataX, dataY + stepY * 3.5);
          doc.text(`: ${data['TOTAL TUNGGAKAN']} Bulan`, dataColonX, dataY + stepY * 3.5);
          doc.text('Jumlah Tunggakan', dataX, dataY + stepY * 4.5);
          doc.text(`: ${formatCurrency(data['JUMLAH TUNGGAKAN (Rp)'])}`, dataColonX, dataY + stepY * 4.5);
        }
        
        doc.text('Demikian untuk dilaksanakan dengan penuh tanggung jawab', labelX, dataY + stepY * 8.5, { maxWidth: 120 });
        
        const techY = 182;
        const techStepY = 4.5;
        const techColonX = startX + 35;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('Merk Meter', startX, techY);
        doc.text(':', techColonX, techY);
        doc.text('No Meter', startX, techY + techStepY);
        doc.text(':', techColonX, techY + techStepY);
        doc.text('Stand Meter Segel', startX, techY + techStepY * 2);
        doc.text(':', techColonX, techY + techStepY * 2);
        doc.text('No Segel', startX, techY + techStepY * 3);
        doc.text(':', techColonX, techY + techStepY * 3);
        doc.text('Digit Meter', startX, techY + techStepY * 4);
        doc.text(':', techColonX, techY + techStepY * 4);
        
        const sigY = 150;
        const sigLineY = 172;
        doc.setFontSize(9);
        doc.text('Tanda tangan Pelanggan', startX + 30, sigY, { align: 'center' });
        doc.text('(........................................)', startX + 30, sigLineY, { align: 'center' });
        
        doc.text('Manager Cabang Kotabaru', startX + 100, sigY, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.text('Endang Komara', startX + 100, sigLineY, { align: 'center' });
        
        const petugasTitleY = 182;
        const petugasLineY = 200;
        doc.setFont('helvetica', 'normal');
        doc.text('Tanda tangan Petugas', startX + 100, petugasTitleY, { align: 'center' });
        doc.text('(........................................)', startX + 100, petugasLineY, { align: 'center' });
      };
      
      doc.setLineWidth(0.1);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(pageWidth / 2, 5, pageWidth / 2, pageHeight - 5);
      doc.setLineDashPattern([], 0);
      
      drawSPKSection(0);
      drawSPKSection(pageWidth / 2);
      
      const pdfTitle = spk.type === 'penyegelan' 
        ? `SPK Penyegelan - ${spk.spk_number}` 
        : `SPK Pencabutan - ${spk.spk_number}`;
      doc.setProperties({
        title: pdfTitle,
        subject: spk.type === 'penyegelan' ? 'Surat Perintah Kerja Penyegelan' : 'Surat Perintah Kerja Pencabutan',
        author: 'Tirta Tarum',
        creator: 'SPK Management System'
      });
      
      const pdfUrl = doc.output('bloburl');
      const newWindow = window.open(pdfUrl, '_blank');

      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        setPdfError('Popup blocker menghalangi PDF. Mohon izinkan popup untuk situs ini.');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      setPdfError('Gagal membuat PDF. Silakan coba lagi.');
    } finally {
      setGeneratingPdfId(null);
    }
  };

  const exportAllToPDF = async () => {
    if (!generatedSPK || generatedSPK.length === 0) return;

    setPdfError(null);
    setGeneratingPdfId('bulk');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      const drawSPKSection = (spk: SPKItem, xOffset: number) => {
        const startX = xOffset + 14;
        const endX = xOffset + 134.5;
        const centerX = xOffset + 74.25;
        
        doc.addImage(logoImage, 'PNG', startX + 1, 8, 20, 20);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('PERUSAHAAN UMUM DAERAH AIR MINUM', centerX + 10, 15, { align: 'center' });
        doc.setFontSize(11);
        doc.text('TIRTA TARUM KABUPATEN KARAWANG', centerX + 10, 20, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('Jl. Surotokunto No.205 Karawang Timur', centerX + 10, 25, { align: 'center' });
        
        doc.setLineWidth(0.4);
        doc.line(startX, 30, endX, 30);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        const titleText = spk.type === 'penyegelan' 
          ? 'SURAT PERINTAH KERJA PENYEGELAN' 
          : 'SURAT PERINTAH KERJA PENCABUTAN';
        doc.text(titleText, centerX, 40, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text(`Nomor: ${spk.spk_number}`, centerX, 45, { align: 'center' });
        
        doc.setFontSize(9);
        const labelX = startX;
        const colonX = startX + 18;
        
        doc.text('Dari', labelX, 55);
        doc.text(': Manager Kotabaru', colonX, 55);
        doc.text('Untuk', labelX, 61);
        doc.text(': Distribusi', colonX, 61);
        
        const introText = spk.type === 'penyegelan'
          ? 'Untuk melaksanakan pekerjaan PENYEGELAN sambungan pelanggan'
          : 'Untuk melaksanakan pekerjaan PENCABUTAN sambungan pelanggan';
        doc.text(introText, labelX, 72);
        doc.text('sebagaimana data dibawah ini :', labelX, 77);
        
        const dataX = startX + 15;
        const dataColonX = startX + 45;
        const dataY = 88;
        const stepY = 6;
        
        doc.text('No pelanggan', dataX, dataY);
        if (spk.type === 'penyegelan') {
          const data = spk.data as Penyegelan;
          doc.text(`: ${data['NOMOR PELANGGAN']}`, dataColonX, dataY);
          doc.text('Nama', dataX, dataY + stepY);
          doc.setFont('helvetica', 'bold');
          doc.text(`: ${data['NAMA']}`, dataColonX, dataY + stepY);
          doc.setFont('helvetica', 'normal');
          doc.setFont('helvetica', 'italic');
          doc.text('Rincian tunggakan air / Non air', dataX, dataY + stepY * 2.5);
          doc.setFont('helvetica', 'normal');
          doc.text('Jumlah Bulan', dataX, dataY + stepY * 3.5);
          doc.text(`: ${data['JUMLAH BLN']} Bulan`, dataColonX, dataY + stepY * 3.5);
          doc.text('Jumlah Total', dataX, dataY + stepY * 4.5);
          doc.text(`: ${formatCurrency(data['JUMLAH'])}`, dataColonX, dataY + stepY * 4.5);
        } else {
          const data = spk.data as Pencabutan;
          doc.text(`: ${data['NO SAMB']}`, dataColonX, dataY);
          doc.text('Nama', dataX, dataY + stepY);
          doc.setFont('helvetica', 'bold');
          doc.text(`: ${data['NAMA']}`, dataColonX, dataY + stepY);
          doc.setFont('helvetica', 'normal');
          doc.setFont('helvetica', 'italic');
          doc.text('Rincian tunggakan air / Non air', dataX, dataY + stepY * 2.5);
          doc.setFont('helvetica', 'normal');
          doc.text('Total Tunggakan', dataX, dataY + stepY * 3.5);
          doc.text(`: ${data['TOTAL TUNGGAKAN']} Bulan`, dataColonX, dataY + stepY * 3.5);
          doc.text('Jumlah Tunggakan', dataX, dataY + stepY * 4.5);
          doc.text(`: ${formatCurrency(data['JUMLAH TUNGGAKAN (Rp)'])}`, dataColonX, dataY + stepY * 4.5);
        }
        
        doc.text('Demikian untuk dilaksanakan dengan penuh tanggung jawab', labelX, dataY + stepY * 8.5, { maxWidth: 120 });
        
        const techY = 182;
        const techStepY = 4.5;
        const techColonX = startX + 35;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('Merk Meter', startX, techY);
        doc.text(':', techColonX, techY);
        doc.text('No Meter', startX, techY + techStepY);
        doc.text(':', techColonX, techY + techStepY);
        doc.text('Stand Meter Segel', startX, techY + techStepY * 2);
        doc.text(':', techColonX, techY + techStepY * 2);
        doc.text('No Segel', startX, techY + techStepY * 3);
        doc.text(':', techColonX, techY + techStepY * 3);
        doc.text('Digit Meter', startX, techY + techStepY * 4);
        doc.text(':', techColonX, techY + techStepY * 4);
        
        const sigY = 150;
        const sigLineY = 172;
        doc.setFontSize(9);
        doc.text('Tanda tangan Pelanggan', startX + 30, sigY, { align: 'center' });
        doc.text('(........................................)', startX + 30, sigLineY, { align: 'center' });
        
        doc.text('Manager Cabang Kotabaru', startX + 100, sigY, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.text('Endang Komara', startX + 100, sigLineY, { align: 'center' });
        
        const petugasTitleY = 182;
        const petugasLineY = 200;
        doc.setFont('helvetica', 'normal');
        doc.text('Tanda tangan Petugas', startX + 100, petugasTitleY, { align: 'center' });
        doc.text('(........................................)', startX + 100, petugasLineY, { align: 'center' });
      };
      
      generatedSPK.forEach((spk, index) => {
        if (index > 0) {
          doc.addPage();
        }
        
        doc.setLineWidth(0.1);
        doc.setLineDashPattern([1, 1], 0);
        doc.line(pageWidth / 2, 5, pageWidth / 2, pageHeight - 5);
        doc.setLineDashPattern([], 0);
        
        drawSPKSection(spk, 0);
        drawSPKSection(spk, pageWidth / 2);
      });
      
      const firstSpkType = generatedSPK[0]?.type || 'penyegelan';
      const pdfTitle = firstSpkType === 'penyegelan' 
        ? `SPK Penyegelan - ${generatedSPK.length} item` 
        : `SPK Pencabutan - ${generatedSPK.length} item`;
      doc.setProperties({
        title: pdfTitle,
        subject: firstSpkType === 'penyegelan' ? 'Surat Perintah Kerja Penyegelan' : 'Surat Perintah Kerja Pencabutan',
        author: 'Tirta Tarum',
        creator: 'SPK Management System'
      });
      
      const pdfUrl = doc.output('bloburl');
      const newWindow = window.open(pdfUrl, '_blank');

      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        setPdfError('Popup blocker menghalangi PDF. Mohon izinkan popup untuk situs ini.');
      }
    } catch (error) {
      console.error('Error generating bulk PDF:', error);
      setPdfError('Gagal membuat PDF. Silakan coba lagi.');
    } finally {
      setGeneratingPdfId(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getKetBadgeStyle = (ket: string) => {
    const normalizedKet = ket?.toUpperCase() || '';
    
    if (normalizedKet.includes('LUNAS') || normalizedKet.includes('BYR')) {
      return { background: '#22c55e', color: 'white' };
    } else if (normalizedKet.includes('CABUT')) {
      return { background: '#ef4444', color: 'white' };
    } else if (normalizedKet.includes('PERMOHONAN')) {
      return { background: '#3b82f6', color: 'white' };
    } else if (normalizedKet.includes('BELUM') || normalizedKet.includes('PROSES')) {
      return { background: '#f59e0b', color: 'white' };
    }
    return { background: '#6b7280', color: 'white' };
  };

  const getSelectedItemsData = () => {
    return Array.from(selectedItems).map(index => {
      const item = activeTab === 'penyegelan' ? penyegelanData[index] : pencabutanData[index];
      return item;
    }).filter(Boolean);
  };

  const selectedItemsData = getSelectedItemsData();
  const selectedTotalAmount = selectedItemsData.reduce((sum, item) => {
    if (activeTab === 'penyegelan') {
      return sum + (item as Penyegelan)['JUMLAH'];
    } else {
      return sum + (item as Pencabutan)['JUMLAH TUNGGAKAN (Rp)'];
    }
  }, 0);

  return (
    <div>
      {/* Global Styles */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }
        .modal-content {
          background: var(--bg-primary);
          border-radius: 0.75rem;
          padding: 1.5rem;
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          animation: fadeIn 0.3s ease;
        }
      `}</style>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => { 
            setActiveTab('penyegelan'); 
            setSelectedItems(new Set()); 
            setGeneratedSPK(null);
            setCurrentPage(1);
          }}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            background: activeTab === 'penyegelan' ? 'var(--primary)' : 'var(--bg-secondary)',
            color: activeTab === 'penyegelan' ? 'white' : 'var(--text-primary)',
            cursor: 'pointer',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <AlertCircle size={18} />
          Penyegelan ({penyegelanData.length.toLocaleString()})
        </button>
        <button
          onClick={() => { 
            setActiveTab('pencabutan'); 
            setSelectedItems(new Set()); 
            setGeneratedSPK(null);
            setCurrentPage(1);
          }}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            background: activeTab === 'pencabutan' ? 'var(--danger)' : 'var(--bg-secondary)',
            color: activeTab === 'pencabutan' ? 'white' : 'var(--text-primary)',
            cursor: 'pointer',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <UserX size={18} />
          Pencabutan ({pencabutanData.length.toLocaleString()})
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Search Row */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Cari nomor pelanggan atau nama..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={18} />}
            </button>
          </div>
          
          {/* Filter Row */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* KET Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} style={{ color: 'var(--text-secondary)' }} />
              <select
                value={ketFilter}
                onChange={(e) => setKetFilter(e.target.value)}
                style={{
                  padding: '0.5rem 2rem 0.5rem 0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.375rem',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.5rem center'
                }}
              >
                {KET_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowUpDown size={16} style={{ color: 'var(--text-secondary)' }} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                style={{
                  padding: '0.5rem 2rem 0.5rem 0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.375rem',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.5rem center'
                }}
              >
                <option value="name-asc">Nama (A-Z)</option>
                <option value="name-desc">Nama (Z-A)</option>
                <option value="amount-high">Jumlah (Tinggi-Rendah)</option>
                <option value="amount-low">Jumlah (Rendah-Tinggi)</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div style={{ 
              display: 'flex', 
              border: '1px solid var(--border-color)', 
              borderRadius: '0.375rem',
              overflow: 'hidden'
            }}>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: viewMode === 'table' ? 'var(--primary)' : 'var(--bg-primary)',
                  color: viewMode === 'table' ? 'white' : 'var(--text-primary)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <TableIcon size={18} />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: viewMode === 'cards' ? 'var(--primary)' : 'var(--bg-primary)',
                  color: viewMode === 'cards' ? 'white' : 'var(--text-primary)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Grid3X3 size={18} />
              </button>
            </div>

            {/* Items Per Page */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Tampilkan:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                style={{
                  padding: '0.5rem 2rem 0.5rem 0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.375rem',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.5rem center'
                }}
              >
                {ITEMS_PER_PAGE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleGenerateSPK}
              disabled={selectedItems.size === 0 || loading}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: selectedItems.size > 0 ? 'var(--primary)' : 'var(--bg-secondary)',
                color: selectedItems.size > 0 ? 'white' : 'var(--text-secondary)',
                cursor: selectedItems.size > 0 && !loading ? 'pointer' : 'not-allowed',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: loading ? 0.6 : 1
              }}
            >
              <FilePlus size={18} />
              Generate SPK ({selectedItems.size.toLocaleString()})
            </button>
            
            {selectedItems.size > 0 && (
              <button
                onClick={clearSelection}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Trash2 size={18} />
                Hapus Pilihan
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Data Display */}
      <div className="card">
        <div className="card-header" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h2 className="card-title">
            Data {activeTab === 'penyegelan' ? 'Penyegelan' : 'Pencabutan'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Halaman {currentPage} dari {totalPages} ({sortedData.length.toLocaleString()} data)
            </span>
            <button
              onClick={handleSelectAll}
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--text-primary)',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: loading ? 0.6 : 1
              }}
            >
              {selectedItems.size > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
              {selectedItems.size > 0 ? 'Batal Pilih' : 'Pilih Semua'}
            </button>
          </div>
        </div>

        {loading ? (
          viewMode === 'table' ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}></th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>No</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>{activeTab === 'penyegelan' ? 'No. Pelanggan' : 'No Samb'}</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Nama</th>
                    {activeTab === 'penyegelan' ? (
                      <>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>Bulan</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total Rek</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Denda</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Jumlah</th>
                      </>
                    ) : (
                      <>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Alamat</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>Tunggakan</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Jumlah (Rp)</th>
                      </>
                    )}
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Ket</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRowSkeleton key={i} activeTab={activeTab} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: '1rem',
              padding: '1rem'
            }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          )
        ) : paginatedData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <p>Tidak ada data yang ditemukan</p>
          </div>
        ) : viewMode === 'table' ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}></th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>No</th>
                  {activeTab === 'penyegelan' ? (
                    <>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>No. Pelanggan</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Nama</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>Bulan</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total Rek</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Denda</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Jumlah</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>Ket</th>
                    </>
                  ) : (
                    <>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>No Samb</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Nama</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Alamat</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>Tunggakan</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Jumlah (Rp)</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>Ket</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item, index) => {
                  const actualIndex = (currentPage - 1) * itemsPerPage + index;
                  const ketStyle = getKetBadgeStyle(activeTab === 'penyegelan' 
                    ? (item as Penyegelan)['KET'] 
                    : (item as Pencabutan)['KET']
                  );
                  
                  return (
                    <tr 
                      key={actualIndex} 
                      style={{ 
                        borderBottom: '1px solid var(--border-color)',
                        background: selectedItems.has(actualIndex) ? 'rgba(59, 130, 246, 0.1)' : undefined
                      }}
                    >
                      <td style={{ padding: '0.75rem' }}>
                        <button
                          onClick={() => handleSelectItem(actualIndex)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: selectedItems.has(actualIndex) ? 'var(--primary)' : 'var(--text-secondary)'
                          }}
                        >
                          {selectedItems.has(actualIndex) ? <CheckSquare size={20} /> : <Square size={20} />}
                        </button>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {activeTab === 'penyegelan' ? (item as Penyegelan)['NO.'] : (item as Pencabutan)['NO']}
                      </td>
                      {activeTab === 'penyegelan' ? (
                        <>
                          <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>{(item as Penyegelan)['NOMOR PELANGGAN']}</td>
                          <td style={{ padding: '0.75rem', fontWeight: 500 }}>{(item as Penyegelan)['NAMA']}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>{(item as Penyegelan)['JUMLAH BLN']}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatCurrency((item as Penyegelan)['TOTAL REK'])}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatCurrency((item as Penyegelan)['DENDA'])}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>{formatCurrency((item as Penyegelan)['JUMLAH'])}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem',
                              background: ketStyle.background,
                              color: ketStyle.color,
                              fontSize: '0.75rem',
                              fontWeight: 500
                            }}>
                              {(item as Penyegelan)['KET']}
                            </span>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>{(item as Pencabutan)['NO SAMB']}</td>
                          <td style={{ padding: '0.75rem', fontWeight: 500 }}>{(item as Pencabutan)['NAMA']}</td>
                          <td style={{ padding: '0.75rem' }}>{(item as Pencabutan)['ALAMAT']}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>{(item as Pencabutan)['TOTAL TUNGGAKAN']}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>{formatCurrency((item as Pencabutan)['JUMLAH TUNGGAKAN (Rp)'])}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem',
                              background: ketStyle.background,
                              color: ketStyle.color,
                              fontSize: '0.75rem',
                              fontWeight: 500
                            }}>
                              {(item as Pencabutan)['KET']}
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: '1rem',
            padding: '1rem'
          }}>
            {paginatedData.map((item, index) => {
              const actualIndex = (currentPage - 1) * itemsPerPage + index;
              const ketStyle = getKetBadgeStyle(activeTab === 'penyegelan' 
                ? (item as Penyegelan)['KET'] 
                : (item as Pencabutan)['KET']
              );
              
              return (
                <div 
                  key={actualIndex}
                  onClick={() => handleSelectItem(actualIndex)}
                  style={{
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    border: `1px solid ${selectedItems.has(actualIndex) ? 'var(--primary)' : 'var(--border-color)'}`,
                    background: selectedItems.has(actualIndex) ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ 
                      fontFamily: 'monospace', 
                      fontSize: '0.875rem', 
                      color: 'var(--text-secondary)',
                      background: 'var(--bg-secondary)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem'
                    }}>
                      {activeTab === 'penyegelan' 
                        ? (item as Penyegelan)['NOMOR PELANGGAN'] 
                        : (item as Pencabutan)['NO SAMB']
                      }
                    </span>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      background: ketStyle.background,
                      color: ketStyle.color,
                      fontSize: '0.75rem',
                      fontWeight: 500
                    }}>
                      {activeTab === 'penyegelan' 
                        ? (item as Penyegelan)['KET'] 
                        : (item as Pencabutan)['KET']
                      }
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '1rem' }}>{item['NAMA']}</div>
                  {activeTab === 'penyegelan' ? (
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {(item as Penyegelan)['JUMLAH BLN']} bulan tunggakan
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {(item as Pencabutan)['ALAMAT']}
                    </div>
                  )}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginTop: 'auto',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border-color)'
                  }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {activeTab === 'penyegelan' 
                        ? `${(item as Penyegelan)['JUMLAH BLN']} bulan`
                        : `${(item as Pencabutan)['TOTAL TUNGGAKAN']} tunggakan`
                      }
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      {formatCurrency(activeTab === 'penyegelan' 
                        ? (item as Penyegelan)['JUMLAH'] 
                        : (item as Pencabutan)['JUMLAH TUNGGAKAN (Rp)']
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && paginatedData.length > 0 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '0.5rem',
            padding: '1rem',
            borderTop: '1px solid var(--border-color)'
          }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '0.5rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: currentPage === 1 ? 'var(--text-secondary)' : 'var(--text-primary)',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronLeft size={18} />
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color)',
                    background: currentPage === pageNum ? 'var(--primary)' : 'var(--bg-primary)',
                    color: currentPage === pageNum ? 'white' : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '0.5rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: currentPage === totalPages ? 'var(--text-secondary)' : 'var(--text-primary)',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {generatedSPK && generatedSPK.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <h2 className="card-title">SPK Tergenerate ({generatedSPK.length})</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={exportAllToPDF}
                disabled={generatingPdfId === 'bulk'}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  cursor: generatingPdfId === 'bulk' ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  opacity: generatingPdfId === 'bulk' ? 0.6 : 1
                }}
              >
                {generatingPdfId === 'bulk' ? (
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <FileDown size={16} />
                )}
                {generatingPdfId === 'bulk' ? 'Memproses...' : 'Export Semua'}
              </button>
              <button
                onClick={() => setGeneratedSPK(null)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
          
          {pdfError && (
            <div style={{ 
              padding: '0.75rem 1rem', 
              background: '#fef2f2', 
              border: '1px solid #fecaca',
              borderRadius: '0.5rem',
              margin: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#dc2626'
            }}>
              <AlertCircle size={18} />
              {pdfError}
              <button 
                onClick={() => setPdfError(null)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}
              >
                ×
              </button>
            </div>
          )}
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>No SPK</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Tipe</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>No Pelanggan</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Nama</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Tanggal Generate</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {generatedSPK.map((spk, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontWeight: 600 }}>{spk.spk_number}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        background: spk.type === 'penyegelan' ? '#f59e0b' : '#ef4444',
                        color: 'white',
                        fontSize: '0.75rem',
                        textTransform: 'capitalize',
                        fontWeight: 500
                      }}>
                        {spk.type}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>
                      {spk.type === 'penyegelan' 
                        ? (spk.data as Penyegelan)['NOMOR PELANGGAN'] 
                        : (spk.data as Pencabutan)['NO SAMB']}
                    </td>
                    <td style={{ padding: '0.75rem' }}>{spk.data['NAMA']}</td>
                    <td style={{ padding: '0.75rem' }}>{spk.generated_at}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <button
                        onClick={() => generateSPKPDF(spk)}
                        disabled={generatingPdfId === spk.spk_number}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          border: 'none',
                          background: generatingPdfId === spk.spk_number ? 'var(--bg-secondary)' : 'var(--primary)',
                          color: generatingPdfId === spk.spk_number ? 'var(--text-secondary)' : 'white',
                          cursor: generatingPdfId === spk.spk_number ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          margin: '0 auto'
                        }}
                      >
                        {generatingPdfId === spk.spk_number ? (
                          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <Printer size={16} />
                        )}
                        <span style={{ fontSize: '0.75rem' }}>
                          {generatingPdfId === spk.spk_number ? 'Memproses...' : 'Cetak'}
                        </span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-backdrop" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Konfirmasi Generate SPK</h3>
              <button 
                onClick={() => setShowConfirmModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={24} />
              </button>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Anda akan generate SPK untuk {selectedItems.size} item {activeTab === 'penyegelan' ? 'penyegelan' : 'pencabutan'}:
              </p>
              
              <div style={{ 
                background: 'var(--bg-secondary)', 
                padding: '1rem', 
                borderRadius: '0.5rem',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Jumlah Item:</span>
                  <strong>{selectedItems.size.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Tunggakan:</span>
                  <strong style={{ color: 'var(--primary)' }}>{formatCurrency(selectedTotalAmount)}</strong>
                </div>
              </div>
              
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '0.375rem' }}>
                {selectedItemsData.slice(0, 5).map((item, idx) => (
                  <div key={idx} style={{ 
                    padding: '0.5rem 0.75rem', 
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.875rem'
                  }}>
                    <span>{item['NAMA']}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {formatCurrency(activeTab === 'penyegelan' 
                        ? (item as Penyegelan)['JUMLAH'] 
                        : (item as Pencabutan)['JUMLAH TUNGGAKAN (Rp)']
                      )}
                    </span>
                  </div>
                ))}
                {selectedItemsData.length > 5 && (
                  <div style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    ... dan {selectedItemsData.length - 5} item lainnya
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isGenerating}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                onClick={confirmGenerateSPK}
                disabled={isGenerating}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: 'var(--primary)',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    Memproses...
                  </>
                ) : (
                  <>
                    <FilePlus size={18} />
                    Generate SPK
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
