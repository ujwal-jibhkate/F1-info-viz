import pandas as pd
import numpy as np
import os
import glob

# Paths
BASE_DIR = ".."
HISTORICAL_DIR = os.path.join(BASE_DIR, "raw_datasets", "Formula_1_Race_Data")
MODERN_DIR = os.path.join(BASE_DIR, "raw_datasets", "formula1-datasets-master")
COMPREHENSIVE_DIR = os.path.join(BASE_DIR, "raw_datasets", "Formula_1_Comprehensive_Dataset")
OUTPUT_DIR = os.path.join(BASE_DIR, "final_datasets")

os.makedirs(OUTPUT_DIR, exist_ok=True)

print("Starting F1 data pipeline...")

# 1. LOAD HISTORICAL DATA (1950 - 2017)
print("Loading historical data...")
races = pd.read_csv(os.path.join(HISTORICAL_DIR, "races.csv"), encoding='latin1')
circuits = pd.read_csv(os.path.join(HISTORICAL_DIR, "circuits.csv"), encoding='latin1')
results = pd.read_csv(os.path.join(HISTORICAL_DIR, "results.csv"), encoding='latin1')
drivers = pd.read_csv(os.path.join(HISTORICAL_DIR, "drivers.csv"), encoding='latin1')
constructors = pd.read_csv(os.path.join(HISTORICAL_DIR, "constructors.csv"), encoding='latin1')

drivers['driver_name'] = drivers['forename'] + " " + drivers['surname']

hist_df = results.merge(races[['raceId', 'year', 'name', 'circuitId']], on='raceId', how='left')\
                 .merge(circuits[['circuitId', 'name', 'country']], on='circuitId', how='left', suffixes=('_race', '_circuit'))\
                 .merge(drivers[['driverId', 'driver_name']], on='driverId', how='left')\
                 .merge(constructors[['constructorId', 'name']], on='constructorId', how='left')
                 
hist_df = hist_df.rename(columns={
    'year': 'Year',
    'name_race': 'Race Name',
    'name_circuit': 'Circuit Name',
    'driver_name': 'Driver',
    'name': 'Constructor',
    'grid': 'Grid Position',
    'positionOrder': 'Finish Position',
    'points': 'Points'
})

hist_df['Dataset'] = 'Historical (1950-2017)'
hist_df = hist_df[['Year', 'Race Name', 'Circuit Name', 'Driver', 'Constructor', 'Grid Position', 'Finish Position', 'Points', 'Dataset']]

# 2. LOAD MODERN DATA (2018 - 2026)
print("Loading modern data...")
modern_dfs = []
for year in range(2018, 2027):
    # Try finding files
    pattern1 = os.path.join(MODERN_DIR, "**", f"*formula1_{year}season_raceResults.csv")
    pattern2 = os.path.join(MODERN_DIR, "**", f"*Formula1_{year}season_raceResults.csv")
    pattern3 = os.path.join(MODERN_DIR, "**", f"*Formula1_{year}Season_RaceResults.csv")
    
    files = glob.glob(pattern1, recursive=True) + glob.glob(pattern2, recursive=True) + glob.glob(pattern3, recursive=True)

    if not files:
        pattern = os.path.join(MODERN_DIR, "**", f"*{year}*ace*esults.csv")
        files = glob.glob(pattern, recursive=True)
        if not files:
            continue
    
    res_file = files[0]
    
    try:
        df = pd.read_csv(res_file)
        if 'Track' not in df.columns and 'Grand Prix' not in df.columns:
            continue
            
        df['Year'] = year
        
        # Calendar linking for modern circuits
        cal_pattern = os.path.join(MODERN_DIR, "**", f"*{year}*alendar.csv")
        cal_files = glob.glob(cal_pattern, recursive=True)
        
        track_col = 'Track' if 'Track' in df.columns else 'Grand Prix'
        
        if cal_files:
            cal_df = pd.read_csv(cal_files[0])
            track_mapping = {}
            if 'Country' in cal_df.columns and 'Circuit Name' in cal_df.columns:
                track_mapping = dict(zip(cal_df['Country'], cal_df['Circuit Name']))
            elif 'GP Name' in cal_df.columns and 'Circuit Name' in cal_df.columns:
                track_mapping = dict(zip(cal_df['GP Name'], cal_df['Circuit Name']))
            df['Circuit Name'] = df[track_col].map(track_mapping).fillna(df[track_col])
        else:
            df['Circuit Name'] = df[track_col]
            
        df['Dataset'] = f'Modern ({year})'
        
        rename_map = {
            track_col: 'Race Name',
            'Starting Grid': 'Grid Position',
            'Position': 'Finish Position',
            'Team': 'Constructor'
        }
        df = df.rename(columns=rename_map)
        
        cols = ['Year', 'Race Name', 'Circuit Name', 'Driver', 'Constructor', 'Grid Position', 'Finish Position', 'Points', 'Dataset']
        missing_cols = [c for c in cols if c not in df.columns]
        for c in missing_cols:
            df[c] = np.nan
            
        modern_dfs.append(df[cols])
    except Exception as e:
        print(f"Error processing {res_file}: {e}")

if modern_dfs:
    modern_df = pd.concat(modern_dfs, ignore_index=True)
else:
    modern_df = pd.DataFrame(columns=['Year', 'Race Name', 'Circuit Name', 'Driver', 'Constructor', 'Grid Position', 'Finish Position', 'Points', 'Dataset'])

# 3. UNIFY AND CLEAN DATA
print("Unifying datasets and cleaning...")
unified_df = pd.concat([hist_df, modern_df], ignore_index=True)

unified_df['Grid Position'] = pd.to_numeric(unified_df['Grid Position'], errors='coerce')
unified_df['Finish Position'] = pd.to_numeric(unified_df['Finish Position'], errors='coerce')

def clean_constructor(name):
    if not isinstance(name, str): return name
    name = name.replace(" Aramco Mercedes", "")
    name = name.replace(" Honda RBPT", "")
    name = name.replace(" Mercedes", "")
    name = name.replace(" Ferrari", "")
    name = name.replace(" Renault", "")
    name = name.replace(" Racing", "")
    if "Aston Martin" in name: return "Aston Martin"
    if "Red Bull" in name: return "Red Bull"
    if "McLaren" in name: return "McLaren"
    if "Alpine" in name: return "Alpine"
    if "Williams" in name: return "Williams"
    if "Haas" in name: return "Haas"
    if "AlphaTauri" in name or "RB" == name: return "RB"
    if "Sauber" in name: return "Sauber"
    return name.strip()

unified_df['Constructor'] = unified_df['Constructor'].apply(clean_constructor)
print("Constructor homogenization complete.")

# 4. CIRCUIT CLASSIFICATION
print("Applying circuit classification...")
circuit_metadata_path = os.path.join(COMPREHENSIVE_DIR, "f1_circuits_metadata.csv")
if os.path.exists(circuit_metadata_path):
    circuits_meta = pd.read_csv(circuit_metadata_path)
    circuit_type_dict = dict(zip(circuits_meta['circuit_name'], circuits_meta['circuit_type']))
    
    def get_circuit_type(name):
        if not isinstance(name, str): return "Unknown/Historical"
        for key, val in circuit_type_dict.items():
            if key in name or name in key: return val
        # fallback heuristics for famous ones
        if any(x in name for x in ["Monaco", "Marina Bay", "Baku", "Albert Park", "Las Vegas", "Street"]):
            return "Street Circuit"
        return "Permanent Circuit"
        
    unified_df['Circuit Type'] = unified_df['Circuit Name'].apply(get_circuit_type)
else:
    unified_df['Circuit Type'] = "Unknown/Historical"

# 4.5 NORMALIZE RACE NAMES AND FILTER BY CALENDAR AND HISTORY
print("Normalizing race names and applying filters...")
RACE_NAME_MAP = {
    "Australian Grand Prix": "Australian GP",
    "Australia": "Australian GP",
    "Austrian Grand Prix": "Austrian GP",
    "Austria": "Austrian GP",
    "Styria": "Austrian GP",
    "Azerbaijan Grand Prix": "Azerbaijan GP",
    "Azerbaijan": "Azerbaijan GP",
    "Bahrain Grand Prix": "Bahrain GP",
    "Bahrain": "Bahrain GP",
    "Sakhir": "Bahrain GP",
    "Belgian Grand Prix": "Belgian GP",
    "Belgium": "Belgian GP",
    "Brazilian Grand Prix": "Brazilian GP",
    "Brazil": "Brazilian GP",
    "British Grand Prix": "British GP",
    "Great Britain": "British GP",
    "70th Anniversary": "British GP",
    "Canadian Grand Prix": "Canadian GP",
    "Canada": "Canadian GP",
    "Chinese Grand Prix": "Chinese GP",
    "China": "Chinese GP",
    "Dutch Grand Prix": "Dutch GP",
    "Netherlands": "Dutch GP",
    "Emilia Romagna": "Emilia Romagna GP",
    "Emilia-Romagna": "Emilia Romagna GP",
    "San Marino Grand Prix": "Emilia Romagna GP",
    "French Grand Prix": "French GP",
    "France": "French GP",
    "German Grand Prix": "German GP",
    "Germany": "German GP",
    "Eifel": "German GP",
    "Hungarian Grand Prix": "Hungarian GP",
    "Hungary": "Hungarian GP",
    "Italian Grand Prix": "Italian GP",
    "Italy": "Italian GP",
    "Tuscany": "Italian GP",
    "Japanese Grand Prix": "Japanese GP",
    "Japan": "Japanese GP",
    "Mexican Grand Prix": "Mexican GP",
    "Mexico": "Mexican GP",
    "Monaco Grand Prix": "Monaco GP",
    "Monaco": "Monaco GP",
    "Abu Dhabi Grand Prix": "Abu Dhabi GP",
    "Abu Dhabi": "Abu Dhabi GP",
    "Portuguese Grand Prix": "Portuguese GP",
    "Portugal": "Portuguese GP",
    "Russian Grand Prix": "Russian GP",
    "Russia": "Russian GP",
    "Singapore Grand Prix": "Singapore GP",
    "Singapore": "Singapore GP",
    "South African Grand Prix": "South African GP",
    "Spanish Grand Prix": "Spanish GP",
    "Spain": "Spanish GP",
    "Turkish Grand Prix": "Turkish GP",
    "Turkey": "Turkish GP",
    "United States Grand Prix": "United States GP",
    "United States": "United States GP",
    "European Grand Prix": "European GP",
    "United States Grand Prix West": "US GP West",
    "Detroit Grand Prix": "Detroit GP",
    "Dallas Grand Prix": "Dallas GP",
    "Caesars Palace Grand Prix": "Caesars Palace GP",
    "Las Vegas": "Las Vegas GP",
    "Miami": "Miami GP",
    "Qatar": "Qatar GP",
    "Saudi Arabia": "Saudi Arabian GP",
    "Argentine Grand Prix": "Argentine GP",
    "Malaysian Grand Prix": "Malaysian GP",
    "Swedish Grand Prix": "Swedish GP",
    "Swiss Grand Prix": "Swiss GP",
    "Korean Grand Prix": "Korean GP",
    "Indian Grand Prix": "Indian GP",
    "Pacific Grand Prix": "Pacific GP",
    "Luxembourg Grand Prix": "Luxembourg GP",
    "Moroccan Grand Prix": "Moroccan GP",
    "Pescara Grand Prix": "Pescara GP",
    "Indianapolis 500": "Indianapolis 500",
}

unified_df['Race Name'] = unified_df['Race Name'].map(lambda x: RACE_NAME_MAP.get(x, x))

# 5. EXPORTS
print("Exporting datasets...")
unified_df.to_csv(os.path.join(OUTPUT_DIR, "f1_unified_dataset_1950_2025.csv"), index=False)

# RQ1: Constructor Dominance
rq1_df = unified_df.copy()
rq1_df['Points'] = pd.to_numeric(rq1_df['Points'], errors='coerce').fillna(0)
rq1_df['Win'] = (rq1_df['Finish Position'] == 1).astype(int)
rq1_df['Podium'] = (rq1_df['Finish Position'] <= 3).astype(int)

rq1_agg = rq1_df.groupby(['Year', 'Constructor']).agg({
    'Points': 'sum',
    'Win': 'sum',
    'Podium': 'sum'
}).reset_index()
rq1_agg = rq1_agg.sort_values(by=['Year', 'Points'], ascending=[True, False])
rq1_agg.to_csv(os.path.join(OUTPUT_DIR, "rq1_constructor_dominance.csv"), index=False)

# RQ2: Grid vs Finish by Circuit Type
rq2_df = unified_df.dropna(subset=['Grid Position', 'Finish Position']).copy()
rq2_df = rq2_df[rq2_df['Grid Position'] > 0]
rq2_df.to_csv(os.path.join(OUTPUT_DIR, "rq2_grid_finish_circuits.csv"), index=False)

# RQ3: Driver Transfers/Network
rq3_df = unified_df.dropna(subset=['Driver', 'Constructor']).copy()
rq3_df['Win'] = (rq3_df['Finish Position'] == 1).astype(int)
rq3_df = rq3_df[['Driver', 'Constructor', 'Year', 'Win']].groupby(['Driver', 'Constructor', 'Year']).agg({'Win':'sum'}).reset_index()
rq3_df.to_csv(os.path.join(OUTPUT_DIR, "rq3_driver_transfers.csv"), index=False)

print("Process completed successfully. All files generated in 'final_datasets/' directory.")
