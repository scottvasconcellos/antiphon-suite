## Key/Modulation Rule-Review Checklist

For every change to the key/modulation engine, answer these questions (see `key-mod-axes.md` for context and examples):

1. **Axis**  
   - Which axis does this rule touch: A (modulation vs tonicization), B (primary key choice), or C (cadence / multi-step recognition)?

2. **Categories / phenomena**  
   - Which categories are affected (e.g. `parallel_minor`, `modal`, `circle_of_fifths`, `tonicization_vs_modulation`, `multi_step_modulation`, `false_cadence`, `ambiguous_loop`)?  
   - Are we unintentionally crossing axes (A+B+C) in one change? If so, can it be split?

3. **Target cases**  
   - Which **K-cases** (from the regression suite) should improve because of this change?  
   - Which **E-cases** (edge cases) are intended as explicit design targets?

4. **Risk cases**  
   - Which existing K/E cases might regress if this rule over-fires?  
   - How will we detect that (which categories / IDs will we watch)?

5. **Concrete musical thresholds**  
   - What exact conditions trigger this rule (e.g. “≥2 chords in new key after V–I”, “return to original tonic within 2 chords cancels modulation”)?  
   - Are these thresholds documented in terms a human analyst would agree with?

6. **Validation plan**  
   - Which suites will be run to validate the change (invariants, category suites, full K-suite)?  
   - What per-category metrics (pass/soft/fail) must stay the same, and which are expected to move?

Keep the answers brief but specific, and link back to the relevant sections of `key-mod-axes.md` and the deep research docs when appropriate.

