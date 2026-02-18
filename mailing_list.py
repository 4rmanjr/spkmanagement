#!/usr/bin/env python3
import csv
import os
import sys
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm
from reportlab.lib.utils import ImageReader
from PIL import Image

LOGO_PATH = os.path.join(os.path.dirname(os.path.realpath(__file__)), "logo", "images.png")
DEFAULT_CABANG = "Kotabaru"
DEFAULT_MANAGER = "Endang Komara"

_logo_cache = None

def get_logo_reader():
    global _logo_cache
    if _logo_cache is not None:
        return _logo_cache
    if os.path.exists(LOGO_PATH):
        try:
            img = Image.open(LOGO_PATH)
            if img.mode == 'P':
                img = img.convert('RGBA')
            _logo_cache = ImageReader(img)
            return _logo_cache
        except Exception:
            pass
    return None

# Try to import pandas for Excel support
try:
    import pandas as pd  # type: ignore
    # Fix for 'extLst' error in openpyxl
    from openpyxl.styles.fills import PatternFill  # type: ignore
    original_init = PatternFill.__init__
    def patched_init(self, *args, **kwargs):
        kwargs.pop('extLst', None)
        return original_init(self, *args, **kwargs)
    PatternFill.__init__ = patched_init
except ImportError:
    pd = None

def draw_spk(c, data, x_offset, width_half, height, spk_type="PENYEGELAN"):
    margin = 1.2 * cm
    line_y = height - 3.5 * cm
    
    # --- Header ---
    c.setFont("Helvetica", 10)
    c.drawCentredString(x_offset + width_half/2 + 1*cm, height - 1.5*cm, "PERUSAHAAN UMUM DAERAH AIR MINUM")
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(x_offset + width_half/2 + 1*cm, height - 2.0*cm, "TIRTA TARUM KABUPATEN KARAWANG")
    c.setFont("Helvetica", 9)
    c.drawCentredString(x_offset + width_half/2 + 1*cm, height - 2.5*cm, "Jl. Surotokunto No.205 Karawang Timur")
    
    # Logo
    logo = get_logo_reader()
    if logo:
        c.drawImage(logo, x_offset + margin, height - 3.2*cm, width=2*cm, height=2*cm, preserveAspectRatio=True)
    
    # Thick Line
    c.setLineWidth(1.5)
    c.line(x_offset + margin, line_y, x_offset + width_half - margin, line_y)

    # --- Title & Nomor ---
    c.setFont("Helvetica-Bold", 10)
    title_text = f"SURAT PERINTAH KERJA {spk_type.upper()}"
    c.drawCentredString(x_offset + width_half/2, line_y - 1*cm, title_text)
    c.setFont("Helvetica", 10)
    c.drawCentredString(x_offset + width_half/2, line_y - 1.5*cm, "Nomor : …../…../SPK/2026")

    # --- Sender/Recipient ---
    c.setFont("Helvetica", 10)
    curr_y = line_y - 2.5*cm
    c.drawString(x_offset + margin, curr_y, f"Dari           : Manager {data.get('cabang', '')}")
    curr_y -= 0.5*cm
    c.drawString(x_offset + margin, curr_y, "Untuk        : Distribusi")
    
    curr_y -= 1*cm
    c.drawString(x_offset + margin, curr_y, f"Untuk melaksanakan pekerjaan {spk_type.upper()} sambungan pelanggan")
    curr_y -= 0.45*cm
    c.drawString(x_offset + margin, curr_y, "sebagaimana data dibawah ini")

    # --- Data Pelanggan ---
    curr_y -= 1*cm
    c.drawString(x_offset + margin + 1*cm, curr_y, f"No pelanggan  : {data.get('no_pelanggan', '')}")
    curr_y -= 0.5*cm
    c.drawString(x_offset + margin + 1*cm, curr_y, f"Nama               : {data.get('nama', '')}")
    
    curr_y -= 1*cm
    c.drawString(x_offset + margin + 1*cm, curr_y, "Rincian tunggakan air / Non air")
    curr_y -= 0.8*cm
    c.drawString(x_offset + margin + 1*cm, curr_y, f"Total Tunggakan      : {data.get('total_tunggakan_bulan', '')} Bulan")
    curr_y -= 0.5*cm
    c.drawString(x_offset + margin + 1*cm, curr_y, f"Total tagihan             : Rp.{data.get('total_tagihan', '')}")

    curr_y -= 1.2*cm
    c.drawString(x_offset + margin, curr_y, "Demikian untuk dilaksanakan dengan penuh tanggung jawab dan dengan semestinya")

    # --- Signatures ---
    curr_y -= 1.5*cm
    c.drawCentredString(x_offset + margin + 3*cm, curr_y, "Tanda tangan Pelanggan")
    c.drawCentredString(x_offset + width_half - margin - 3*cm, curr_y, f"Manager Cabang {data.get('cabang', '')}")
    
    curr_y -= 2*cm
    c.drawCentredString(x_offset + margin + 3*cm, curr_y, "(…………………………..)")
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(x_offset + width_half - margin - 3*cm, curr_y, data.get('manager_name', ''))

    # --- Technical Data (Bottom) ---
    c.setFont("Helvetica", 9)
    tech_y = curr_y - 1.5*cm
    c.drawString(x_offset + margin, tech_y, "Merk Meter")
    c.drawString(x_offset + margin + 3.5*cm, tech_y, ":")
    c.drawRightString(x_offset + width_half - margin, tech_y, "Tanda tangan Petugas")
    
    tech_y -= 0.45*cm
    c.drawString(x_offset + margin, tech_y, "No Meter")
    c.drawString(x_offset + margin + 3.5*cm, tech_y, ":")
    
    tech_y -= 0.45*cm
    stand_label = "Stand Meter Segel" if "SEGEL" in spk_type.upper() else "Stand Meter Cabut"
    c.drawString(x_offset + margin, tech_y, stand_label)
    c.drawString(x_offset + margin + 3.5*cm, tech_y, ":")
    
    tech_y -= 0.45*cm
    segel_cabut_label = "No Segel" if "SEGEL" in spk_type.upper() else "No Body"
    c.drawString(x_offset + margin, tech_y, segel_cabut_label)
    c.drawString(x_offset + margin + 3.5*cm, tech_y, ":")
    
    tech_y -= 0.45*cm
    c.drawString(x_offset + margin, tech_y, "Digit Meter")
    c.drawString(x_offset + margin + 3.5*cm, tech_y, ":")
    c.drawRightString(x_offset + width_half - margin, tech_y - 0.5*cm, "(...................................)")

def add_customer_page(c, data, spk_type="PENYEGELAN"):
    width, height = landscape(A4)
    width_half = width / 2
    draw_spk(c, data, 0, width_half, height, spk_type)
    c.setDash(3, 3)
    c.setLineWidth(0.5)
    c.line(width_half, 0.5*cm, width_half, height - 0.5*cm)
    c.setDash(1, 0)
    draw_spk(c, data, width_half, width_half, height, spk_type)
    c.showPage()

def generate_grouped_pdf(data_list, output_path, spk_type):
    if not data_list:
        return False
    c = canvas.Canvas(output_path, pagesize=landscape(A4))
    for row in data_list:
        if str(row.get('no_pelanggan', '')).strip():
            add_customer_page(c, row, spk_type)
    c.save()
    return True

def normalize_row(row, spk_type):
    normalized = {}
    cols = {k.upper().strip(): v for k, v in row.items()}
    
    def format_no_pelanggan(val):
        if pd and pd.isna(val):
            return ''
        if val is None or str(val).strip() == '':
            return ''
        s = str(val).strip()
        if s.isdigit() and not s.startswith('0'):
            return '0' + s
        return s
    
    if 'PENYEGELAN' in spk_type.upper():
        normalized['no_pelanggan'] = format_no_pelanggan(cols.get('NOMOR PELANGGAN', cols.get('NO PELANGGAN', '')))
        normalized['nama'] = cols.get('NAMA', '')
        normalized['total_tunggakan_bulan'] = cols.get('JUMLAH BLN', cols.get('JUMLAH BULAN', ''))
        normalized['total_tagihan'] = cols.get('TOTAL REK', cols.get('TOTAL TAGIHAN', ''))
    else:
        normalized['no_pelanggan'] = format_no_pelanggan(cols.get('NO SAMB', cols.get('NO PELANGGAN', '')))
        normalized['nama'] = cols.get('NAMA', '')
        normalized['total_tunggakan_bulan'] = cols.get('TOTAL TUNGGAKAN', '')
        normalized['total_tagihan'] = cols.get('JUMLAH TUNGGAKAN (RP)', cols.get('TOTAL TAGIHAN', ''))
    
    normalized['cabang'] = cols.get('CABANG', '') or DEFAULT_CABANG
    normalized['manager_name'] = cols.get('MANAGER', '') or DEFAULT_MANAGER
    
    for k, v in normalized.items():
        if k == 'no_pelanggan':
            continue
        if pd and pd.isna(v):
            normalized[k] = ''
        elif v is None:
            normalized[k] = ''
        else:
            normalized[k] = str(v)
    
    return normalized

def load_excel_data(excel_file):
    if pd is None:
        print("Error: pandas and openpyxl are required.")
        return None
    try:
        all_data = {}
        with pd.ExcelFile(excel_file, engine='openpyxl') as xls:
            for sheet_name in xls.sheet_names:
                df = pd.read_excel(xls, sheet_name=sheet_name)
                df.columns = [str(c).strip() for c in df.columns]
                df = df.fillna('')
                records = [normalize_row(row, sheet_name) for row in df.to_dict('records')]
                all_data[sheet_name] = records
        return all_data
    except Exception as e:
        print(f"Error loading Excel: {e}")
        print("\nTips: Jika error berlanjut, buka file Excel tersebut, lalu 'Save As' dengan nama baru.")
        return None

def interactive_mode():
    csv_file = "data_pelanggan.csv"
    output_dir = "output"
    
    # Load initial data from CSV if exists
    data = []
    if os.path.exists(csv_file):
        with open(csv_file, mode='r', encoding='utf-8') as f:
            data = list(csv.DictReader(f))

    while True:
        print("\n--- Mailing List Interactive Mode ---")
        print("1. Lihat Daftar Pelanggan (dari CSV)")
        print("2. Cetak Laporan dari Excel")
        print("3. Cetak Laporan dari CSV")
        print("q. Keluar")
        
        try:
            choice = input("\nPilih menu: ").strip().lower()
        except (KeyboardInterrupt, EOFError):
            print("\n\nKeluar...")
            break
        
        if choice == '1':
            for row in data:
                print(f"{row.get('no_pelanggan')} | {row.get('nama')}")
        elif choice == '2':
            prompt = "Masukkan atau seret (drag & drop) file Excel ke sini\n(Default: PENYEGELAN & PENCABUTAN JAN 26.xlsx): "
            try:
                excel_file = input(prompt).strip().strip("'\"") or "PENYEGELAN & PENCABUTAN JAN 26.xlsx"
            except (KeyboardInterrupt, EOFError):
                print("\n\nKeluar...")
                break
            
            if os.path.exists(excel_file):
                data_dict = load_excel_data(excel_file)
                if data_dict:
                    if not os.path.exists(output_dir): os.makedirs(output_dir)
                    for sheet, rows in data_dict.items():
                        path = os.path.join(output_dir, f"SPK_{sheet}.pdf")
                        generate_grouped_pdf(rows, path, sheet)
                        print(f"Berhasil: {path}")
            else:
                print("File tidak ditemukan.")
        elif choice == '3':
            if data:
                if not os.path.exists(output_dir): os.makedirs(output_dir)
                path = os.path.join(output_dir, "SPK_PENYEGELAN.pdf")
                generate_grouped_pdf(data, path, "PENYEGELAN")
                print(f"Berhasil: {path}")
            else:
                print("Data CSV kosong.")
        elif choice == 'q':
            break

def main():
    output_dir = "output"
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
        if input_file.endswith('.csv'):
            # ... process csv ...
            pass
        elif input_file.endswith(('.xlsx', '.xls')):
            data_dict = load_excel_data(input_file)
            if data_dict:
                if not os.path.exists(output_dir): os.makedirs(output_dir)
                for sheet, rows in data_dict.items():
                    path = os.path.join(output_dir, f"SPK_{sheet}.pdf")
                    generate_grouped_pdf(rows, path, sheet)
                    print(f"Generated: {path}")
    else:
        interactive_mode()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nKeluar...")
