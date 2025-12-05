# Standards: Agent Guidance

Purpose: help AI agents and contributors apply standards without noise. Pair this with `docs/standards/README.md` and the per-standard files.

## How to Use
- Start with the **right directory**: backend standards live here now; frontend standards will live under `docs/standards/frontend/` (per plan 021).
- Read only the standards that apply to your change; avoid citing unrelated docs.
- Do not copy standards into code or plans—reference by path.

## Quick Pointers
- **Structure:** Each standard follows Intent → Outcomes → Patterns → Anti-patterns → Reference.
- **Examples are illustrative:** Adapt to the current module; don’t paste blindly.
- **Cross-links:** If a standard points to templates, use the template path instead of re-creating content.
- **Frontend split:** Until the frontend directory exists, use backend standards for backend changes only; avoid mixing guidance.

## When Writing Implementation Plans
- Keep plans ≤500 lines (hard cap 1000). Split into sub-plans (e.g., `030A`, `030B`) for large initiatives.
- Use clear phases with file paths and outcomes; avoid wall-of-text narratives.
- Declare prerequisites/unknowns explicitly (spikes, decisions needed).

## References
- Index: `docs/standards/README.md`
- Backend standards: `docs/standards/*.md`
- Templates: `docs/templates/*.md` (backend now; frontend coming via plan 021)
