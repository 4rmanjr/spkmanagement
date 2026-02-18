#!/usr/bin/env python3
import pandas as pd
import sqlite3

# Read Excel file
excel_file = '/home/armanjr/gitporject/mailinglistcli/web/PENYEGELAN & PENCABUTAN JAN 26.xlsx'

# Create SQLite database
db_path = '/home/armanjr/gitporject/mailinglistcli/web/penyegelan_pencabutan.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Drop existing tables
cursor.execute("DROP TABLE IF EXISTS penyegelan")
cursor.execute("DROP TABLE IF EXISTS pencabutan")
conn.commit()

# Process PENYEGELAN sheet
print("Processing PENYEGELAN...")
df_penyegelan = pd.read_excel(excel_file, sheet_name='PENYEGELAN')

# Drop completely empty columns
df_penyegelan = df_penyegelan.dropna(axis=1, how='all')

# Keep only relevant columns
penyegelan_cols = ['NO.', 'TANGGAL', 'NOMOR PELANGGAN', 'NAMA', 'JUMLAH BLN', 
                   'TOTAL REK', 'DENDA', 'JUMLAH', 'KET']
df_penyegelan = df_penyegelan[penyegelan_cols]

# Convert NOMOR PELANGGAN to 06xxxxx format (prepend 0)
df_penyegelan['NOMOR PELANGGAN'] = df_penyegelan['NOMOR PELANGGAN'].apply(lambda x: f"0{int(x)}" if pd.notna(x) else None)

# Save to SQLite
df_penyegelan.to_sql('penyegelan', conn, if_exists='replace', index=False)
print(f"✓ PENYEGELAN: {len(df_penyegelan)} rows")

# Process PENCABUTAN sheet  
print("Processing PENCABUTAN...")
df_pencabutan = pd.read_excel(excel_file, sheet_name='PENCABUTAN')

# Drop completely empty columns
df_pencabutan = df_pencabutan.dropna(axis=1, how='all')

# Convert NO SAMB to 06xxxxx format (prepend 0)
df_pencabutan['NO SAMB'] = df_pencabutan['NO SAMB'].apply(lambda x: f"0{int(x)}" if pd.notna(x) else None)

# Save to SQLite
df_pencabutan.to_sql('pencabutan', conn, if_exists='replace', index=False)
print(f"✓ PENCABUTAN: {len(df_pencabutan)} rows")

conn.close()

print(f"\n✓ Database created: {db_path}")
print(f"\nTables:")
print(f"  - penyegelan: {len(df_penyegelan)} records")
print(f"  - pencabutan: {len(df_pencabutan)} records")
