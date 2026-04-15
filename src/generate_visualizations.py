import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import networkx as nx
import os

# Create results folder
RESULTS_DIR = "../results"
os.makedirs(RESULTS_DIR, exist_ok=True)

# Theme config
F1_RED = "#e10600"
BG_COLOR = "#15151e"
TEXT_COLOR = "#ffffff"

def update_f1_layout(fig):
    fig.update_layout(
        plot_bgcolor=BG_COLOR,
        paper_bgcolor=BG_COLOR,
        font=dict(color=TEXT_COLOR, family="Inter, Arial, sans-serif"),
        xaxis=dict(showgrid=False, zeroline=False),
        yaxis=dict(showgrid=True, gridcolor="#333333", zeroline=False),
        title_font=dict(size=24, color=TEXT_COLOR),
        legend=dict(font=dict(color=TEXT_COLOR)),
    )
    return fig

print("Loading datasets...")
rq1 = pd.read_csv("../final_datasets/rq1_constructor_dominance.csv")
rq2 = pd.read_csv("../final_datasets/rq2_grid_finish_circuits.csv")
rq3 = pd.read_csv("../final_datasets/rq3_driver_transfers.csv")

# -----------------
# RQ1: Constructor Dominance (Stacked Area Chart over time)
# -----------------
print("Generating RQ1 visualizations...")
top_10 = rq1.groupby('Constructor')['Points'].sum().nlargest(10).index
rq1_top = rq1[rq1['Constructor'].isin(top_10)]

fig_rq1 = px.area(
    rq1_top, x="Year", y="Points", color="Constructor",
    title="RQ1: Rise & Fall of Constructor Dynasties (1950 - 2025)",
    line_shape='spline',
    color_discrete_sequence=px.colors.qualitative.Bold
)
fig_rq1 = update_f1_layout(fig_rq1)
fig_rq1.write_html(os.path.join(RESULTS_DIR, "rq1_constructor_dominance.html"))
fig_rq1.write_image(os.path.join(RESULTS_DIR, "rq1_constructor_dominance.png"), width=1200, height=800)


# -----------------
# RQ2: Grid vs Finish
# -----------------
print("Generating RQ2 visualizations...")
rq2_clean = rq2[(rq2['Finish Position'] <= 24) & (rq2['Grid Position'] <= 24)].copy()

fig_rq2_contour = px.density_contour(
    rq2_clean, x="Grid Position", y="Finish Position", color="Circuit Type",
    title="RQ2: Qualifying Predictability (Grid vs Finish Contour Density)",
    marginal_x="histogram", marginal_y="histogram"
)
fig_rq2_contour = update_f1_layout(fig_rq2_contour)
fig_rq2_contour.update_yaxes(autorange="reversed")
fig_rq2_contour.write_html(os.path.join(RESULTS_DIR, "rq2_contour_density.html"))
fig_rq2_contour.write_image(os.path.join(RESULTS_DIR, "rq2_contour_density.png"), width=1200, height=800)

rq2_clean['Positions Gained'] = rq2_clean['Grid Position'] - rq2_clean['Finish Position']
fig_rq2_violin = px.violin(
    rq2_clean, y="Positions Gained", x="Circuit Type", color="Circuit Type",
    box=True, points="outliers", hover_data=["Driver", "Year", "Race Name"],
    title="RQ2: Positions Gained & Lost Density (Street vs Permanent)",
    color_discrete_map={"Permanent Circuit": "#00d2be", "Street Circuit": F1_RED}
)
fig_rq2_violin = update_f1_layout(fig_rq2_violin)
fig_rq2_violin.write_html(os.path.join(RESULTS_DIR, "rq2_violin_positions_gained.html"))
fig_rq2_violin.write_image(os.path.join(RESULTS_DIR, "rq2_violin_positions_gained.png"), width=1200, height=800)


# -----------------
# RQ3: Driver Transfers Network
# -----------------
print("Generating RQ3 visualizations...")
driver_wins = rq3.groupby('Driver')['Win'].sum()
top_drivers = driver_wins.sort_values(ascending=False).head(150).index
rq3_sub = rq3[rq3['Driver'].isin(top_drivers)]

G = nx.Graph()
for _, row in rq3_sub.iterrows():
    driver = row['Driver']
    team = row['Constructor']
    G.add_node(driver, type='Driver', wins=driver_wins.get(driver, 0))
    team_wins = rq1[rq1['Constructor'] == team]['Win'].sum()
    G.add_node(team, type='Team', wins=team_wins)
    if G.has_edge(driver, team):
        G[driver][team]['weight'] += 1
    else:
        G.add_edge(driver, team, weight=1)

pos = nx.spring_layout(G, k=0.5, seed=42)
edge_x, edge_y = [], []
for edge in G.edges():
    x0, y0 = pos[edge[0]]
    x1, y1 = pos[edge[1]]
    edge_x.extend([x0, x1, None])
    edge_y.extend([y0, y1, None])

edge_trace = go.Scatter(
    x=edge_x, y=edge_y, line=dict(width=0.5, color='#444444'), hoverinfo='none', mode='lines')

node_x, node_y, node_color, node_text, node_size = [], [], [], [], []
for node in G.nodes():
    x, y = pos[node]
    node_x.append(x)
    node_y.append(y)
    n_type = G.nodes[node]['type']
    wins = G.nodes[node]['wins']
    if n_type == 'Team':
        node_color.append(F1_RED)
        node_size.append(15 + min(wins * 0.2, 50))
    else:
        node_color.append('#aaaaaa')
        node_size.append(5 + min(wins * 0.5, 30))
    node_text.append(f"{n_type}: {node}<br>Wins: {wins}")

node_trace = go.Scatter(
    x=node_x, y=node_y, mode='markers', hoverinfo='text', text=node_text,
    marker=dict(color=node_color, size=node_size, line_width=2))

fig_rq3 = go.Figure(data=[edge_trace, node_trace],
             layout=go.Layout(
                title='RQ3: Driver Transfer Connectivity Topology (Red=Teams, Grey=Top 150 Drivers)',
                showlegend=False, hovermode='closest',
                plot_bgcolor=BG_COLOR, paper_bgcolor=BG_COLOR,
                font=dict(color=TEXT_COLOR)
             ))
fig_rq3.update_xaxes(showgrid=False, zeroline=False, showticklabels=False)
fig_rq3.update_yaxes(showgrid=False, zeroline=False, showticklabels=False)
fig_rq3.write_html(os.path.join(RESULTS_DIR, "rq3_driver_network.html"))
fig_rq3.write_image(os.path.join(RESULTS_DIR, "rq3_driver_network.png"), width=1600, height=1200)

print("All visualizations generated successfully in the '../results/' folder.")
