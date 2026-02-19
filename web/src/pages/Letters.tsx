import { useEffect, useState } from 'react';
import { Plus, FileText, Printer, Search, Loader2, AlertCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { api } from '../api';
import type { Letter } from '../types';
import logoImage from '../../logo/images.png';

export function Letters() {
  const [searchTerm, setSearchTerm] = useState('');
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLetterIds, setSelectedLetterIds] = useState<string[]>([]);
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    loadLetters();
  }, []);

  const loadLetters = async () => {
    try {
      const data = await api.getLetters();
      console.log('API Letters Data:', data);
      if (Array.isArray(data)) {
        // Sort by date descending, handle missing created_at
        const sorted = [...data].sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });
        console.log('Sorted Letters:', sorted);
        setLetters(sorted);
      } else {
        console.error('Data is not an array:', data);
        setLetters([]);
      }
    } catch (error) {
      console.error('Error loading letters:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDFForSection = (doc: jsPDF, letter: Letter, xOffset: number) => {
    const startX = xOffset + 14;
    const endX = xOffset + 134.5;
    const centerX = xOffset + 74.25;

    // Logo
    doc.addImage(logoImage, 'PNG', startX + 1, 8, 20, 20);

    // Header text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('PERUSAHAAN UMUM DAERAH AIR MINUM', centerX + 10, 15, { align: 'center' });
    doc.setFontSize(11);
    doc.text('TIRTA TARUM KABUPATEN KARAWANG', centerX + 10, 20, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Jl. Surotokunto No.205 Karawang Timur', centerX + 10, 25, { align: 'center' });

    // Separator line
    doc.setLineWidth(0.4);
    doc.line(startX, 30, endX, 30);

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('SURAT PERINTAH KERJA PENYEGELAN', centerX, 40, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text('Nomor : ...../...../SPK/2026', centerX, 45, { align: 'center' });

    // Labels with aligned colons
    doc.setFontSize(9);
    const labelX = startX;
    const colonX = startX + 18;

    doc.text('Dari', labelX, 55);
    doc.text(': Manager Kotabaru', colonX, 55);
    doc.text('Untuk', labelX, 61);
    doc.text(': Distribusi', colonX, 61);

    // Intro
    doc.text('Untuk melaksanakan pekerjaan PENYEGELAN sambungan pelanggan', labelX, 72);
    doc.text('sebagaimana data dibawah ini :', labelX, 77);

    // Data Fields (aligned colons)
    const dataX = startX + 15;
    const dataColonX = startX + 45;
    const dataY = 88;
    const stepY = 6;

    doc.text('No pelanggan', dataX, dataY);
    doc.text(`: ${letter.nomor}`, dataColonX, dataY);

    doc.text('Nama', dataX, dataY + stepY);
    doc.setFont('helvetica', 'bold');
    doc.text(`: ${letter.customer_nama}`, dataColonX, dataY + stepY);
    doc.setFont('helvetica', 'normal');

    doc.setFont('helvetica', 'italic');
    doc.text('Rincian tunggakan air / Non air', dataX, dataY + stepY * 2.5);
    doc.setFont('helvetica', 'normal');

    doc.text('Total Tunggakan', dataX, dataY + stepY * 3.5);
    doc.text(`: ${letter.total_tunggakan}`, dataColonX, dataY + stepY * 3.5);

    doc.text('Total tagihan', dataX, dataY + stepY * 4.5);
    doc.text(`: Rp. ${letter.total_tagihan?.toLocaleString('id-ID')}`, dataColonX, dataY + stepY * 4.5);

    // Closing
    doc.text('Demikian untuk dilaksanakan dengan penuh tanggung jawab dan dengan semestinya', labelX, dataY + stepY * 7, { maxWidth: 120 });

    // Technical Details Footer (Left)
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

    // Signature blocks
    const sigY = 150;
    const sigLineY = 172;
    doc.setFontSize(9);
    doc.text('Tanda tangan Pelanggan', startX + 30, sigY, { align: 'center' });
    doc.text('(........................................)', startX + 30, sigLineY, { align: 'center' });

    doc.text('Manager Cabang Kotabaru', startX + 100, sigY, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text('Endang Komara', startX + 100, sigLineY, { align: 'center' });

    // Petugas Signature (Bottom Right)
    const petugasTitleY = 182;
    const petugasLineY = 200;
    doc.setFont('helvetica', 'normal');
    doc.text('Tanda tangan Petugas', startX + 100, petugasTitleY, { align: 'center' });
    doc.text('(........................................)', startX + 100, petugasLineY, { align: 'center' });
  };

  const generatePDF = async (letter: Letter) => {
    setPdfError(null);
    setGeneratingPdf(letter.id);

    try {
      await new Promise(resolve => setTimeout(resolve, 0));

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      doc.setDrawColor(0);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(148.5, 5, 148.5, 205);
      doc.setLineDashPattern([], 0);

      generatePDFForSection(doc, letter, 0);
      generatePDFForSection(doc, letter, 148.5);

      const pdfName = `Surat_Penyegelan_${letter.nomor}`;
      doc.setProperties({
        title: pdfName,
        subject: 'Surat Perintah Kerja Penyegelan',
        author: 'Tirta Tarum',
        creator: 'Mailing List Management System'
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
      setGeneratingPdf(null);
    }
  };

  const filteredLetters = letters.filter(letter =>
    letter.nomor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    letter.customer_nama.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelectAll = () => {
    if (selectedLetterIds.length === filteredLetters.length) {
      setSelectedLetterIds([]);
    } else {
      setSelectedLetterIds(filteredLetters.map(l => l.id));
    }
  };

  const toggleSelectLetter = (id: string) => {
    setSelectedLetterIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const generateBulkPDF = async () => {
    const selectedLetters = letters.filter(l => selectedLetterIds.includes(l.id));
    if (selectedLetters.length === 0) return;

    setPdfError(null);
    setGeneratingPdf('bulk');

    try {
      await new Promise(resolve => setTimeout(resolve, 0));

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      selectedLetters.forEach((letter, index) => {
        if (index > 0) doc.addPage();

        doc.setLineWidth(0.1);
        doc.setLineDashPattern([1, 1], 0);
        doc.line(148.5, 5, 148.5, 205);
        doc.setLineDashPattern([], 0);

        generatePDFForSection(doc, letter, 0);
        generatePDFForSection(doc, letter, 148.5);
      });

      const pdfName = `Bulk_Surat_Penyegelan_${new Date().getTime()}`;
      doc.setProperties({ title: pdfName });

      const pdfUrl = doc.output('bloburl');
      const newWindow = window.open(pdfUrl, '_blank');

      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        setPdfError('Popup blocker menghalangi PDF. Mohon izinkan popup untuk situs ini.');
      }
    } catch (error) {
      console.error('Error generating bulk PDF:', error);
      setPdfError('Gagal membuat PDF. Silakan coba lagi.');
    } finally {
      setGeneratingPdf(null);
    }
  };

  return (
    <div className="card">
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div className="card-header">
        <h2 className="card-title">Pengelolaan Surat</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {selectedLetterIds.length > 0 && (
            <button 
              className="btn btn-secondary" 
              onClick={generateBulkPDF}
              disabled={generatingPdf === 'bulk'}
            >
              {generatingPdf === 'bulk' ? <Loader2 size={18} className="spin" /> : <Printer size={18} />}
              {generatingPdf === 'bulk' ? 'Membuat PDF...' : `Cetak Massal (${selectedLetterIds.length})`}
            </button>
          )}
          <button className="btn btn-primary">
            <Plus size={18} />
            Buat Surat Baru
          </button>
        </div>
      </div>

      {pdfError && (
        <div style={{ 
          padding: '0.75rem 1rem', 
          background: '#fef2f2', 
          border: '1px solid #fecaca',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#dc2626'
        }}>
          <AlertCircle size={18} />
          {pdfError}
          <button 
            onClick={() => setPdfError(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ position: 'relative', maxWidth: '300px' }}>
          <Search
            size={20}
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)',
            }}
          />
          <input
            type="text"
            placeholder="Cari nomor atau pelanggan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat data surat...</div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedLetterIds.length === filteredLetters.length && filteredLetters.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Nomor</th>
                <th>Tanggal</th>
                <th>Pelanggan</th>
                <th>Tunggakan</th>
                <th>Tagihan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredLetters.map((letter) => (
                <tr key={letter.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedLetterIds.includes(letter.id)}
                      onChange={() => toggleSelectLetter(letter.id)}
                    />
                  </td>
                  <td>{letter.nomor}</td>
                  <td>{letter.tanggal}</td>
                  <td>{letter.customer_nama}</td>
                  <td>{letter.total_tunggakan}</td>
                  <td>Rp.{(typeof letter.total_tagihan === 'number' ? letter.total_tagihan : 0).toLocaleString('id-ID')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        title="Cetak PDF"
                        onClick={() => generatePDF(letter)}
                        disabled={generatingPdf === letter.id}
                      >
                        {generatingPdf === letter.id ? (
                          <Loader2 size={16} className="spin" />
                        ) : (
                          <Printer size={16} />
                        )}
                      </button>
                      <button className="btn btn-secondary btn-sm" title="Lihat Detail">
                        <FileText size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLetters.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Tidak ada data surat ditemukan.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
