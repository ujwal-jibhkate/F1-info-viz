<div align="center">
  <img src="f1-story/public/f1_car_bg.png" alt="Formula 1 Data Visualizer" width="100%" />
  
  <h1>🏎️ Visualizing 75 Years of Formula 1</h1>
  <p><em>A Data-Driven Exploration of Racing History, 1950–2025</em></p>
</div>

<br />

**Submission Link:** [https://f1-info-viz.vercel.app/](https://f1-info-viz.vercel.app/)  
**GitHub Repo:** [https://github.com/ujwal-jibhkate/F1-info-viz](https://github.com/ujwal-jibhkate/F1-info-viz)

**Authors:** Ujwal Jibhkate, Mohit Mahajan, and Tushar Khatri  
**Institution:** Luddy School of Informatics, Computing, and Engineering, Indiana University  
**Course:** ILS-Z637: Information Visualization (SP26) | Dr. Rongqian Ma  
**Date:** April 17, 2026

---

## 📖 Abstract & Introduction

Formula 1 motor racing occupies a unique intersection of engineering, athleticism, strategy, and spectacle. Since its inaugural World Championship season at Silverstone in 1950, F1 has generated an extraordinarily rich statistical record. 

This project presents a data-driven visual narrative spanning 75 seasons from 1950 to 2025. Using a multi-source dataset comprising approximately 1,150 races, 868 drivers, 209 constructors, and over 27,250 unique race result records, we investigate three central research dimensions:
1. **Constructor Dominance Across Eras:** How has dominance shifted across different eras of Formula 1?
2. **Qualifying Position and Race Outcomes:** Does qualifying grid position predict race outcomes differently on street circuits compared to permanent tracks?
3. **Driver-Constructor Transfer Network:** What does the network of driver transfers reveal about team dynasties, driver loyalty, and talent mobility?

To address these, three core interactive visualizations were developed: a stacked area chart of championship points, a scatter plot with regression for predictability, and a bipartite talent-mobility force-directed network graph. 

---

## 🧭 Project Navigation: Where to Look

To understand the architecture and core logic behind this project, please explore the following key directories and files:

### 1. Interactive Visualizations (React & D3.js Frontend)
**Location:** `f1-story/src/components/`
- **`Dynasty.jsx` (Chapter 1)**: Powers the temporal Stacked Area Chart and Dominance Index Lollipop chart mapping constructor championship points over 75 years. Uses `d3.stack` and smooth transitions to highlight era dynasties.
- **`TheGrid.jsx` (Chapter 2)**: Renders the mathematical Scatter Plot measuring grid position vs. finish position, integrating Pearson correlation ($r$) calculations grouped dynamically by circuit types (Street vs. Permanent).
- **`Network.jsx` (Chapter 3)**: Contains the live, real-time D3 Force-Directed Graph (`d3.forceSimulation`) linking drivers and teams based on shared win history.

### 2. Data Engineering Pipeline (Python Backend)
**Location:** `src/` root directory
- **`build_f1_datasets.py`**: The unifying data ingestion pipeline. It joins relational tables from local Kaggle CSVs, normalizes constructor names, utilizes string-matching heuristics to classify tracks (Street vs. Permanent), and generates the final optimized analytic datasets `rq1_constructor_dominance.csv` and `rq2_grid_finish_circuits.csv`.
- **`fetch_api_datasets.py`**: Directly hits the Jolpica Ergast Public REST API to pull the complete historical record of race results, bypassing local data limits and ensuring seamless data representation for the driver network transfer graph (`rq3_driver_transfers.csv`).

### 3. Exploratory Data Analysis (EDA)
**Location:** `notebooks/`
- Contains the original Jupyter Notebooks (`rq1_constructor_dynasties.ipynb`, `rq2_the_grid.ipynb`, `rq3_driver_network.ipynb`) documenting the initial statistical validations and prototyping before the transition to proper interactive web D3 representations.

---

## 🚀 How to Run Locally

This project requires **Node.js** for the frontend interactive dashboard and **Python 3** for executing data ingestion pipelines.

### 1. Launching the Visualization Engine
Navigate into the frontend directory, install the required packages, and start the Vite developer server:
```bash
cd f1-story
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173/) in your browser to experience the interactive dashboard.

### 2. Regenerating the Datasets from Python (Optional)
If you wish to recalculate the datasets or strictly update them via the Jolpica API:
```bash
# Ensure you are natively in the project's root directory running our virtual environment
source venv/bin/activate
pip install pandas numpy requests

# Process all static CSV dependencies and map circuits (updates RQ1 and RQ2 datasets)
python src/build_f1_datasets.py

# Query the Jolpica API directly to regenerate the Network topology shards (updates RQ3 network dataset)
python src/fetch_api_datasets.py
```
*Note: The React frontend will automatically consume the updated datasets dumped into `f1-story/public/data/` or `f1-story/dist/data/`.*

---

## 📊 Detailed Results and Narrative Findings

The digital narrative organizes the data into three cohesive chapters. Below are the detailed findings driven by our D3 interactive components:

### Chapter 1: Dynasties - The Rise and Fall of Empires
*(Visualized via an Interactive Stacked Area Chart)*

**Finding:** F1 dominance is cyclical, characterized by "dynasties interrupted by revolution."
Our analysis mapped cumulative championship points across nine predefined eras. Ferrari’s longevity acts as the sport's structural backbone, being the only team unbroken from 1950. However, the data highlights clear, transient periods of concentrated power. The "Dominance Index" calculates extreme statistical peaks where a single constructor hoarded wins:
- **1988 McLaren Season**: A monumental **93.8% win rate**. 
- **2023 Red Bull Season**: An equally intense **95.5% win rate**, with Max Verstappen single-handedly driving the vast majority of those victories.

### Chapter 2: The Grid - Precision vs. Attrition
*(Visualized via a Grid vs. Finish Scatter Plot)*

**Finding:** While overall grid placement indicates final outcomes ($r = 0.456$), "Street" circuits change the meta entirely.
Across 25,238 mapped records, the "data cloud" varies extensively by track property. 
- **Permanent Circuits**: Display a more diffuse scatter ($r = 0.454$)—evidence that long straights and DRS zones provide genuine overtaking opportunities, permitting drivers to overcome poor qualifying.
- **Street Circuits**: Exhibit a tighter leptokurtic pattern ($r = 0.437$). Cars either finish almost exactly where they started due to extreme lack of overtaking space, or suffer monumental positional losses due to race attrition. The **2024 Monaco Grand Prix** functions as the perfect outlier; the top 10 cars finished in the exact order they qualified, proving that on these circuits, the race is fundamentally won on Saturday.

### Chapter 3: The Network - The Web of Ambition
*(Visualized via a Bipartite Force-directed Network Graph)*

**Finding:** Talent clustering shapes F1 outcomes more heavily than simple driver turnover.
With over 3,597 unique season stints analyzed and mapped natively, the bipartite graph reveals the hub-and-spoke models dictating the grid:
- **Centrality**: Ferrari acts as the undeniable center of talent gravity in the F1 paddock, mediating the careers of over 100 distinct drivers over 75 years without an underlying mathematical community algorithm needed to observe its structural isolation. 
- **Dyadic Power**: The layout visualizes the Hamilton-Mercedes connection as capturing 73 massive nodal wins, confirming it visually as the most productive paired node in F1 history. 
- **Internal Feeder Pipelines**: Structural mapping clarifies that teams like Red Bull succeeded not simply by wide-ranging external poaching but by building dense, internalized pipelines (visible through the distinct driver flow surrounding Toro Rosso / AlphaTauri).

---

## 💡 Dataset Sources & Quality Limitations

### Data Gathering
The centralized pipeline merges and unites raw datasets through three primary mechanisms:
1. **Kaggle's F1 Race Data (1950–2017)**: The foundational historical record linking drivers, constructors, and outcomes.
2. **Formula1-Datasets Repository (2018–2025)**: Supplements and closes the more contemporary temporal gap.
3. **Jolpica Ergast Public API**: Bypasses stagnant files entirely by iteratively querying the full 75-year timeline live to fetch natively formatted race outcomes, generating high-fidelity edges natively for the network application (`fetch_api_datasets.py`).

### Data Quality & Limitations
- **Data Scaling**: Raw datasets incorporated over 426,000 granular lap-times and 6,000 pit-stops. To maintain peak 60fps browser rendering and prioritize overarching competitive trends, these records were successfully aggregated down and filtered out of the interactive D3 application endpoints.
- **Normalization Algorithms**: A custom Python-based string-matching heuristic was utilized for circuit mapping—classifying structural modern venues seamlessly while explicitly grouping distinct identifiers natively containing "Monaco," "Marina Bay," "Las Vegas," and "Baku" strictly into "Street Circuits." As this avoids turn-by-turn simulation, the automated categorization stands as an effective, if high-level, procedural technique.
- **Qualifying Gaps**: F1 qualifying data is fully standardized and 100% complete for 2024–2025 explicitly parsed through the API. However, grid data preceding 1994 requires navigating more unreliable historical anomalies.
