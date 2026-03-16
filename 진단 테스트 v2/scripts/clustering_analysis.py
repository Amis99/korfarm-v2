#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Idea 6: Thinking-path clustering analysis.

Reads simulated students, clusters by error-path frequency vectors,
and outputs a report with visualizations.
"""

import json
import os
import sys
from collections import Counter

sys.path.insert(0, os.path.dirname(__file__))
from core import COMPETENCIES, PROJECT_ROOT

import numpy as np
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from scipy.cluster.hierarchy import linkage, fcluster
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import plotly.express as px

INPUT_PATH = os.path.join(PROJECT_ROOT, 'output', 'simulated_students.json')
REPORT_PATH = os.path.join(PROJECT_ROOT, 'output', 'clustering_report.json')
PLOT_PATH = os.path.join(PROJECT_ROOT, 'output', 'clustering_plots.html')


def load_students():
    with open(INPUT_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def build_feature_vectors(students):
    """Build error-path frequency vectors for each student."""
    # Collect all unique error paths
    all_paths = set()
    for s in students:
        for ep in s['report'].get('error_paths', []):
            if ep and ep != '정답':
                all_paths.add(ep)

    path_list = sorted(all_paths)
    path_idx = {p: i for i, p in enumerate(path_list)}

    # Build feature matrix
    X = np.zeros((len(students), len(path_list)))
    for i, s in enumerate(students):
        counter = Counter(ep for ep in s['report'].get('error_paths', [])
                          if ep and ep != '정답')
        for path, count in counter.items():
            if path in path_idx:
                X[i, path_idx[path]] = count

    return X, path_list, path_idx


def build_competency_matrix(students):
    """Build competency score matrix."""
    X = np.zeros((len(students), len(COMPETENCIES)))
    for i, s in enumerate(students):
        scores = s['report'].get('scores', {})
        for j, comp in enumerate(COMPETENCIES):
            X[i, j] = scores.get(comp, 50.0)
    return X


def cluster_profile(students, labels, k, path_list, X_error, X_comp):
    """Generate profiles for each cluster."""
    profiles = []
    for c in range(k):
        mask = labels == c
        cluster_students = [s for s, m in zip(students, mask) if m]
        n = mask.sum()

        # Average competency scores
        avg_comp = X_comp[mask].mean(axis=0) if n > 0 else np.zeros(len(COMPETENCIES))

        # Top error paths
        avg_error = X_error[mask].mean(axis=0) if n > 0 else np.zeros(len(path_list))
        top_errors_idx = np.argsort(-avg_error)[:5]
        top_errors = [(path_list[i], round(float(avg_error[i]), 2)) for i in top_errors_idx
                      if avg_error[i] > 0]

        # Archetype distribution
        arch_dist = Counter(s.get('archetype', 'unknown') for s in cluster_students)

        # Average TCI
        avg_tci = np.mean([s['report']['adjusted_tci'] for s in cluster_students]) if cluster_students else 0

        # Auto-label
        if avg_tci >= 65:
            alias = "우수 그룹"
        elif top_errors:
            alias = f"{top_errors[0][0]} 취약 그룹"
        else:
            alias = f"클러스터 {c+1}"

        profiles.append({
            "cluster_id": c,
            "alias": alias,
            "size": int(n),
            "avg_tci": round(float(avg_tci), 2),
            "avg_competencies": {COMPETENCIES[i]: round(float(avg_comp[i]), 1)
                                 for i in range(len(COMPETENCIES))},
            "top_error_paths": top_errors,
            "archetype_distribution": dict(arch_dist),
        })

    return profiles


def create_visualizations(students, labels, X_error, X_comp, path_list, profiles, k):
    """Create Plotly visualizations."""
    figs = []

    # 1. PCA 2D scatter plot
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_error) if X_error.shape[1] > 0 else X_comp
    pca = PCA(n_components=2)
    X_2d = pca.fit_transform(X_scaled if X_scaled.shape[1] >= 2 else X_comp)

    cluster_names = [profiles[l]['alias'] for l in labels]
    fig_scatter = px.scatter(
        x=X_2d[:, 0], y=X_2d[:, 1], color=cluster_names,
        labels={'x': f'PC1 ({pca.explained_variance_ratio_[0]:.1%})',
                'y': f'PC2 ({pca.explained_variance_ratio_[1]:.1%})'},
        title="PCA 2D: 학생 클러스터링 결과",
    )
    fig_scatter.update_layout(height=600)
    figs.append(fig_scatter)

    # 2. Cluster radar charts
    fig_radar = make_subplots(
        rows=1, cols=k,
        subplot_titles=[p['alias'] for p in profiles],
        specs=[[{'type': 'polar'}] * k]
    )

    colors = px.colors.qualitative.Set2
    for i, profile in enumerate(profiles):
        vals = [profile['avg_competencies'].get(c, 50) for c in COMPETENCIES]
        vals.append(vals[0])
        cats = list(COMPETENCIES) + [COMPETENCIES[0]]

        fig_radar.add_trace(go.Scatterpolar(
            r=vals, theta=cats, fill='toself',
            name=profile['alias'],
            line=dict(color=colors[i % len(colors)]),
        ), row=1, col=i+1)

    fig_radar.update_layout(height=400, title="클러스터별 역량 레이더 차트", showlegend=False)
    figs.append(fig_radar)

    # 3. Error path heatmap
    if path_list:
        # Top 15 most common error paths
        total_freq = X_error.sum(axis=0)
        top_path_idx = np.argsort(-total_freq)[:15]
        top_paths = [path_list[i] for i in top_path_idx]

        heatmap_data = np.zeros((k, len(top_paths)))
        for c in range(k):
            mask = labels == c
            if mask.sum() > 0:
                heatmap_data[c] = X_error[mask][:, top_path_idx].mean(axis=0)

        fig_heatmap = go.Figure(go.Heatmap(
            z=heatmap_data,
            x=top_paths,
            y=[p['alias'] for p in profiles],
            colorscale='RdYlBu_r',
            text=np.round(heatmap_data, 1),
            texttemplate="%{text}",
        ))
        fig_heatmap.update_layout(
            title="클러스터별 Error Path 히트맵",
            height=400, xaxis_tickangle=-45,
        )
        figs.append(fig_heatmap)

    # Combine into single HTML
    html_parts = []
    html_parts.append("<html><head><title>Clustering Analysis</title></head><body>")
    html_parts.append("<h1>국어농장 v2 — 사고 경로 클러스터링 분석</h1>")

    for fig in figs:
        html_parts.append(fig.to_html(full_html=False, include_plotlyjs='cdn'))

    # Profile summaries
    html_parts.append("<h2>클러스터 프로파일 요약</h2>")
    for p in profiles:
        html_parts.append(f"<h3>{p['alias']} (n={p['size']}, 평균 TCI: {p['avg_tci']})</h3>")
        html_parts.append("<ul>")
        for ep, freq in p['top_error_paths'][:3]:
            html_parts.append(f"<li>{ep}: 평균 {freq}회</li>")
        html_parts.append("</ul>")
        html_parts.append(f"<p>원본 유형 분포: {p['archetype_distribution']}</p>")

    html_parts.append("</body></html>")
    return "\n".join(html_parts)


def main():
    print("Loading simulated students...")
    students = load_students()
    print(f"Loaded {len(students)} students")

    print("Building feature vectors...")
    X_error, path_list, path_idx = build_feature_vectors(students)
    X_comp = build_competency_matrix(students)
    print(f"Feature dimensions: error_paths={X_error.shape[1]}, competencies={X_comp.shape[1]}")

    # K-means clustering
    k = 5
    print(f"Running K-means (k={k})...")

    # Use combined features
    scaler = StandardScaler()
    X_combined = np.hstack([
        scaler.fit_transform(X_error) if X_error.shape[1] > 0 else np.zeros((len(students), 1)),
        scaler.fit_transform(X_comp),
    ])

    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X_combined)

    print("Generating cluster profiles...")
    profiles = cluster_profile(students, labels, k, path_list, X_error, X_comp)

    for p in profiles:
        print(f"  {p['alias']}: n={p['size']}, TCI={p['avg_tci']}")

    # Hierarchical clustering for comparison
    print("Running hierarchical clustering...")
    Z = linkage(X_combined, method='ward')
    hier_labels = fcluster(Z, k, criterion='maxclust')

    # Save report
    report = {
        "total_students": len(students),
        "k": k,
        "profiles": profiles,
        "feature_dimensions": {
            "error_paths": X_error.shape[1],
            "competencies": X_comp.shape[1],
        },
    }

    os.makedirs(os.path.dirname(REPORT_PATH), exist_ok=True)
    with open(REPORT_PATH, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f"Report saved to {REPORT_PATH}")

    # Visualizations
    print("Creating visualizations...")
    html = create_visualizations(students, labels, X_error, X_comp, path_list, profiles, k)
    with open(PLOT_PATH, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"Visualizations saved to {PLOT_PATH}")


if __name__ == '__main__':
    main()
