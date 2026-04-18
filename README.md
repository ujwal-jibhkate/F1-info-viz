<div align="center">
  <img src="f1-story/public/f1_car_bg.png" alt="Formula 1 Data Visualizer" width="100%" />
  
  <h1>🏎️ F1 Data Story: The Visual Legacy of Formula 1</h1>
  <p><em>Where 75 years of engineering, human ambition, and speed converge into interactive data.</em></p>
</div>

<br />

## 📖 Project Overview

Formula 1 generates an astonishing volume of data. Our project transforms over **26,000 historic race records** (from 1950 to the present) into an evocative, scrollytelling web experience. Bypassing traditional static formats, the visualizations are powered by an automated pipeline linked natively to the **Jolpica Ergast Public API**, ensuring 100% data integrity edge-to-edge.

We designed three distinct, fully interactive visualization chapters using **React + D3.js**, each targeting a different dimension of the sport: legacy, predictability, and driver connectivity.

---

## 🏗️ Folder Structure

*(Note: Raw historical Kaggle downloads are intentionally excluded as the project now relies purely on our live Python API extractor).*

- 📂 **`f1-story/`** — The core **React/Vite Frontend**.
  - `src/components/`: The heart of the UI. Contains the three visualization brains (`Dynasty.jsx`, `TheGrid.jsx`, `Network.jsx`) alongside layout structures like `Hero.jsx` and `Conclusion.jsx`.
  - `public/data/`: The destination folder where our data pipeline drops the pristine CSV shards. The frontend parses these synchronously to render the charts without bogging down the browser.
- 📂 **`src/`** *(Root)* — The **Data Engineering Pipeline**. 
  - Houses the critical `fetch_api_datasets.py` crawler that loops through the public API, standardizes all legacy team names, formats records precisely for D3, and injects them straight into the frontend.
- 📂 **`final_datasets/`** — Off-site storage for intermediate and sanitized data exports mirroring what goes into the UI.
- 📂 **`notebooks/` & `scratch_eda.py`** — The exploratory data analysis (EDA) sandboxes where we originally proved out statistical discrepancies (like Monaco 2024 overtakes) before building the React components.
- 📂 **`cache/`** — Caching layer to shield local API requests from being throttled.

---

## 🚀 How to Run Locally

You need both a working **Node.js** environment for the web app, and **Python 3** to run the API data ingestion scripts (if you wish to sync live results!).

### 1. Launching the Visualization Engine (React/Vite)
Navigate into the frontend directory, install dependencies, and spin up the developer server:
```bash
cd f1-story
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173/) in your browser to experience the dashboard.

### 2. Updating the Datasets (Optional)
If a new race weekend just finished and you want the interactive visualizations to update *instantly* with the real-world results:
```bash
# From the project root where your venv lives
venv/bin/python src/fetch_api_datasets.py
```
*This will iteratively pull the latest standings from the Ergast/Jolpica Public API, clean the constructor names to match legacy graphs, and refresh the `/public/data` CSVs consumed by the app.*

---

## 📊 The 3 Visualizations

### 1. Chapter 01: Constructor Dynasties 🛡️
**(`Dynasty.jsx`) — Interactive Stacked Area Chart**
F1 history is defined by eras of untouchable dominance. We built a sprawling D3 area chart mapping constructor championship points spanning from 1950 to 2024. 
* **Interaction:** Floating hover nodes attach to your cursor locally displaying dynamically updating arrays of the exact grid from that specific year. Legacy teams scale elegantly, showing when Ferrari struggled, and when Mercedes or Red Bull reigned supreme.

### 2. Chapter 02: The Grid 🏁
**(`TheGrid.jsx`) — Scatter/Density Regression Plane**
Does qualifying practically decide the race? We plotted **Start Position vs. Finish Position** for thousands of driver entries. 
* **Interaction:** Features toggle switches separating *Permanent Circuits* from narrow *Street Circuits* (like Monaco/Singapore). Advanced linear regression overlays calculate the correlation dynamically. 
* **Highlight:** You can clearly see anomalies like **Monaco 2024**, where the top 10 finished beautifully (or boringly) in the exact same format they qualified in.

### 3. Chapter 03: The Web of Ambition 🕸️
**(`Network.jsx`) — Force-Directed Graph**
Formula 1 is a surprisingly small, incestuous world of talent. This D3 Physics visualization links Drivers (Grey Nodes) to Constructors (Red Nodes) across 900+ connected seasons. 
* **Interaction:** Node radius is powered directly by the driver's career wins (e.g. Lewis Hamilton at 105, Michael Schumacher at 91). Edges display thickness corresponding to seasons driven together, while their brightness signals the amount of wins they shared. 
* **Search:** Features a targeted live-search utility allowing users to focus exclusively on legendary lineages, dropping opacity on non-relevant nodes.

---
<p align="center">
  <em>Data provided by F1 Ergast DB / Jolpica. <br>Built as a rigorous exploration of D3.js and automated REST API visualization.</em>
</p>
