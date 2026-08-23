"""
Unit tests for Expenditure & Weight Trend calculations.
"""
import pytest
from app.services.expenditure_service import ExpenditureService

def test_weight_trend_smoothing():
    entries = [
        {"date": "2026-08-01", "weight": 80.0},
        {"date": "2026-08-02", "weight": 81.5}, # Spike due to water weight
        {"date": "2026-08-03", "weight": 79.8},
        {"date": "2026-08-04", "weight": 80.2},
    ]

    trends = ExpenditureService.calculate_weight_trend(entries, alpha=0.2)
    assert len(trends) == 4
    assert trends[0]['trend_weight'] == 80.0
    # Day 2 raw is 81.5, but trend smoothed: 0.2*81.5 + 0.8*80.0 = 80.3
    assert trends[1]['trend_weight'] == 80.3
    assert trends[2]['trend_weight'] < 80.3

def test_tdee_calculation():
    weight_entries = [
        {"date": f"2026-08-{i:02d}", "weight": 80.0 - (i * 0.1)}
        for i in range(1, 15)
    ]
    calorie_entries = [
        {"date": f"2026-08-{i:02d}", "calories": 2500}
        for i in range(1, 15)
    ]

    tdee_result = ExpenditureService.calculate_tdee(weight_entries, calorie_entries, days_window=14)
    assert tdee_result is not None
    assert "estimated_tdee" in tdee_result
    assert tdee_result["estimated_tdee"] > 2500 # Weight is dropping, so TDEE > intake

def test_macro_targets_calculation():
    macros_cut = ExpenditureService.calculate_macro_targets(tdee=2500, goal="fat loss", body_weight_kg=80.0)
    assert macros_cut["target_calories"] < 2500
    assert macros_cut["protein_g"] == round(80.0 * 2.2)

    macros_bulk = ExpenditureService.calculate_macro_targets(tdee=2500, goal="muscle gain", body_weight_kg=80.0)
    assert macros_bulk["target_calories"] > 2500
    assert macros_bulk["protein_g"] == round(80.0 * 2.0)
