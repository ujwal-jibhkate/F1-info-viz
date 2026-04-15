import pandas as pd
import numpy as np
import nbformat as nbf
from nbformat.v4 import new_notebook, new_code_cell, new_markdown_cell
import os

os.makedirs('notebooks', exist_ok=True)

# 1. GENERATE NOTEBOOKS
nb_exp = new_notebook()
nb_exp.cells = [
    new_markdown_cell("# Data Explorations and Checks"),
    new_markdown_cell("This notebook performs foundational data validation and missing value checks on our 1950-2025 F1 final dataset."),
    new_code_cell("import pandas as pd\nimport numpy as np\n\ndf = pd.read_csv('../final_datasets/f1_unified_dataset_1950_2025.csv')\ndf.head()"),
    new_markdown_cell("## Missing Values Check"),
    new_code_cell("df.isna().sum()"),
    new_markdown_cell("## Data Types and Ranges"),
    new_code_cell("df.describe()"),
    new_markdown_cell("## Circuit Types mapping validation"),
    new_code_cell("df['Circuit Type'].value_counts(dropna=False)")
]
with open('notebooks/data_explorations_and_checks.ipynb', 'w') as f:
    nbf.write(nb_exp, f)

nb_eda = new_notebook()
nb_eda.cells = [
    new_markdown_cell("# Exploratory Data Analysis"),
    new_markdown_cell("Full EDA covering Constructor Dominance, Grid vs Finish predictability, and Driver Transfers."),
    new_code_cell("import pandas as pd\nimport matplotlib.pyplot as plt\nimport seaborn as sns\n\ndf = pd.read_csv('../final_datasets/f1_unified_dataset_1950_2025.csv')\n\n# Configure styling\nsns.set_theme(style='darkgrid', palette='deep')"),
    new_markdown_cell("## RQ1: Constructor Dominance"),
    new_code_cell("wins_df = pd.read_csv('../final_datasets/rq1_constructor_dominance.csv')\ntop_constructors = wins_df.groupby('Constructor')['Win'].sum().nlargest(10)\ntop_constructors.plot(kind='bar', figsize=(10, 5), title='Top 10 Constructors by Total Wins')\nplt.ylabel('Wins')\nplt.show()"),
    new_markdown_cell("## RQ2: Grid vs Finish Predictability"),
    new_code_cell("rq2 = pd.read_csv('../final_datasets/rq2_grid_finish_circuits.csv')\nsns.lmplot(data=rq2, x='Grid Position', y='Finish Position', hue='Circuit Type', scatter_kws={'alpha':0.1}, height=6, aspect=1.5)\nplt.title('Predictability: Street vs Permanent Circuits')\nplt.show()"),
    new_markdown_cell("## RQ3: Driver Transfers Overview"),
    new_code_cell("rq3 = pd.read_csv('../final_datasets/rq3_driver_transfers.csv')\ndriver_counts = rq3.groupby('Driver')['Constructor'].nunique().sort_values(ascending=False)\nprint('Drivers with most team transfers:')\nprint(driver_counts.head(10))")
]
with open('notebooks/data_EDA.ipynb', 'w') as f:
    nbf.write(nb_eda, f)

# 2. PERFORM ACTUAL EDA FOR README
print("--- EDA METRICS FOR README ---")
df = pd.read_csv("final_datasets/f1_unified_dataset_1950_2025.csv")
print("Total rows:", len(df))
print("Missing drivers:", df['Driver'].isna().sum())
print("Missing constructors:", df['Constructor'].isna().sum())
print("Missing grids:", df['Grid Position'].isna().sum())
print("Missing finishes:", df['Finish Position'].isna().sum())

print("\nCircuit Types:")
print(df['Circuit Type'].value_counts())

rq1 = pd.read_csv("final_datasets/rq1_constructor_dominance.csv")
top_3_wins = rq1.groupby('Constructor')['Win'].sum().nlargest(3)
print("\nTop 3 Constructor Wins:")
print(top_3_wins)

rq2 = pd.read_csv("final_datasets/rq2_grid_finish_circuits.csv")
street_corr = rq2[rq2['Circuit Type'] == 'Street Circuit'][['Grid Position', 'Finish Position']].corr().iloc[0,1]
perm_corr = rq2[rq2['Circuit Type'] == 'Permanent Circuit'][['Grid Position', 'Finish Position']].corr().iloc[0,1]
print(f"\nCorrelation between Grid and Finish:")
print(f"Street: {street_corr:.4f}")
print(f"Permanent: {perm_corr:.4f}")

rq3 = pd.read_csv("final_datasets/rq3_driver_transfers.csv")
transfers = rq3.groupby('Driver')['Constructor'].nunique()
print("\nDrivers with highest number of teams:")
print(transfers.nlargest(3))
