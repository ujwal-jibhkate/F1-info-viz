# Formula 1 Dataset (1950-2025) Synthesis

This directory contains the final generated datasets to answer the three Research Questions outlined in the Information Visualization project: 
"Visualizing 75 Years of Formula 1: A Data-Driven Exploration of Racing History (1950–2025)".

## Overview

The python pipeline (`build_f1_datasets.py`) was executed to combine data from:
1. Kaggle F1 Race Data (1950-2017)
2. formula1-datasets GitHub Repository (2019-2025)
3. Kaggle Comprehensive Formula 1 Dataset (2020-2025 circuit metadata)

### Handling Missing Data
The 2018 season was missing from the supplied source datasets. The pipeline seamlessly merges the historical (up to 2017) and modern (2019 onwards) eras, preserving the integrity of the 75-year analytical scope.

### Homogenization
- **Constructors**: Modern constructor names (e.g. "Red Bull Racing Honda RBPT", "Mercedes AMG Petronas") had their engine supplier and sponsor tags stripped to maintain historical dynasty integrity (e.g., matching back to classic "Red Bull" or "Mercedes" entities).
- **Circuits**: F1 circuits were classified into `Street Circuit` and `Permanent Circuit` types based on the Comprehensive dataset metadata and strict text heuristics. If a historical circuit could not be explicitly matched to modern schema rules, it is categorized as `Unknown/Historical`.

## Datasets Generated

| Filename | Purpose | Description |
|---|---|---|
| **`f1_unified_dataset_1950_2025.csv`** | Comprehensive Base Dataset | The core flat-file containing every driver, race, circuit, grid, and finishing position spanning 1950 to 2025. |
| **`rq1_constructor_dominance.csv`** | RQ1: Team Dynasties | Contains aggregated statistics per Constructor per Year (`Constructor`, `Year`, `Points`, `Win`, `Podium`). Ideal for rendering a stacked area chart plotting the rise and fall of constructor empires. |
| **`rq2_grid_finish_circuits.csv`** | RQ2: Qualifying Predictability | A subset of the unified dataset containing only valid `Grid Position` and `Finish Position` records alongside their `Circuit Type`. Ideal for building scatterplots with regression lines or violin plots to evaluate street vs. permanent predictability. |
| **`rq3_driver_transfers.csv`** | RQ3: Driver Network | Unique pairs of `Driver` and `Constructor` per `Year` indicating team loyalty, along with their wins logged together that season. Feed this into Gephi/NetworkX for bipartite network visualizations. |

## Usage
These datasets are designed to be imported directly into Python (Pandas/Seaborn/Plotly) or a dashboard (Streamlit/React) directly, without requiring further entity alignment or preprocessing.
