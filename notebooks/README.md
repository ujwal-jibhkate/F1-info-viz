# Data Exploration and EDA Findings

This document summarizes the extensive exploratory checks and exploratory data analysis (EDA) performed on the unified 1950–2025 Formula 1 dataset. The corresponding python code and deeper dives can be executed natively via `data_explorations_and_checks.ipynb` and `data_EDA.ipynb`.

## 1. Data Integrity and Exploration Checks

- **Total Scale**: The master unified dataset handles **26,837 individual race results** (driver-by-race granularity spanning 75 years).
- **Missing Values Validation**:
  - The Driver and Constructor entities were effectively cleaned and matched with **0 missing mappings**.
  - `Grid Position` contained only **1 missing entry** across the entire 75-year ledger.
  - `Finish Position` contains **376 missing entries**, which accurately represents historical DNFs (Did Not Finish), NCs (Not Classified), and DQs (Disqualified) where numerical finishing order was unassigned.
- **Circuit Distribution mapping**: The classification successfully tagged **23,583 records under Permanent Circuits** and **3,254 records under Street Circuits**.

## 2. Exploratory Data Analysis (EDA) Insights

### RQ1: Constructor Dominance
Aggregating the historical records shows the undisputed historical titans of the sport. The top 3 dynasties by total wins are:
1. **Ferrari**: 243 Wins
2. **McLaren**: 203 Wins
3. **Red Bull**: 126 Wins (*impressive given their later entry compared to historic peers*)

### RQ2: Predictability (Grid vs. Finish Position)
A Pearson correlation was run calculating the linear relationship between Grid Position and Finish Position broken down by circuit type.
- **Street Circuit Correlation**: `0.4374`
- **Permanent Circuit Correlation**: `0.4544`

*Insight*: Surprisingly, the data suggests that **Permanent circuits** hold a marginally stronger predictability (grid position dictates finish position slightly more reliably) than Street circuits. The common intuition is that passing is harder on street tracks, but high unpredictability (many walls, frequent safety cars, higher DNF rates) ultimately disrupts grid-finish correlation heavily on street circuits resulting in the lower correlation score.

### RQ3: Driver Migration Network
Extracting unique Driver/Constructor pairings to form the edges of our network tracking revealed the most prolific "journeyman" drivers over the 75 years:
1. **Chris Amon**: Raced for 14 unique constructors.
2. **Maurice Trintignant**: Raced for 13 unique constructors.
3. **Stirling Moss**: Raced for 12 unique constructors.
