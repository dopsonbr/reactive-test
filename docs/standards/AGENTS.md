# Standards: Agent Guidance

Purpose: help AI agents and contributors apply standards without noise. Pair this with `docs/standards/README.md` and the per-standard files.

## How to Use
- Start with the **right directory**: backend standards live under `docs/standards/backend/`; frontend standards live under `docs/standards/frontend/`.
- Read only the standards that apply to your change; avoid citing unrelated docs.
- Do not copy standards into code or plans—reference by path.

## Quick Pointers
- **Structure:** Each standard follows Intent → Outcomes → Patterns → Anti-patterns → Reference.
- **Examples are illustrative:** Adapt to the current module; don’t paste blindly.
- **Cross-links:** If a standard points to templates, use the template path instead of re-creating content.
- **Frontend vs backend:** Use backend standards for backend changes; frontend standards for frontend changes.

## When Writing Implementation Plans
- Keep plans ≤500 lines (hard cap 1000). Split into sub-plans (e.g., `030A`, `030B`) for large initiatives.
- Use clear phases with file paths and outcomes; avoid wall-of-text narratives.
- Declare prerequisites/unknowns explicitly (spikes, decisions needed).

## References
- Index: `docs/standards/README.md`
- Backend standards: `docs/standards/*.md`
- Templates: `docs/templates/*.md` (backend now; frontend coming via plan 021)
