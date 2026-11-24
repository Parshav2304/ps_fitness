# Dynamic Energy Balance & Weight Trend Smoothing

## Evidence Source
- Hall, K. D., et al. (2011/2019). Quantification of the effect of energy imbalance on bodyweight. The Lancet.
- Helms, E. R., et al. (2014). Evidence-based recommendations for natural bodybuilding contest preparation: nutrition and supplementation. Journal of the International Society of Sports Nutrition.

## Core Recommendations
1. **Dynamic Energy Expenditure (TDEE)**:
   - Static calculators (Harris-Benedict / Mifflin-St Jeor) provide initial estimates but deviate by 10-25% over time due to metabolic adaptation (adaptive thermogenesis).
   - Dynamic TDEE equation:
     $$\text{TDEE} = \text{Average Daily Intake} - (\Delta \text{Smoothed Weight (kg)} \times 7700\text{ kcal/kg})$$
   - Daily scale fluctuations are dominated by glycogen, sodium, and water retention. Exponential Moving Average (EMA) smoothing ($\alpha = 0.10$) must be applied to isolate true tissue change from fluid shifts.

2. **Optimal Rates of Body Mass Change**:
   - Fat Loss: Target 0.5% to 1.0% of total bodyweight loss per week to maximize muscle preservation.
   - Muscle Gain (Surplus): Target 0.25% to 0.5% bodyweight gain per month for intermediate/advanced lifters (+150 to +300 kcal surplus above maintenance).
