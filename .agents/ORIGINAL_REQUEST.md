# Original User Request

## Initial Request — 2026-07-13T15:10:49Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

Scan the whole Flow-Studio React project for hard-coded data structures that should ideally require a data set (e.g., mock backend data), and generate a comprehensive line-by-line report of the findings.

Working directory: C:\Users\labib_n4\Documents\Project\Flow-Studio
Integrity mode: development

## Requirements

### R1. Scan target directories for Mock Data Sets
Thoroughly scan the `src/` directory to identify hardcoded data structures that simulate backend data sets (e.g., arrays of mock users, static lists of projects, hardcoded tasks, or client objects).

### R2. Exclusions
Ignore standard configuration files, third-party libraries (`node_modules`), simple UI string literals (like button labels), and standard state variables. Focus strictly on data that should eventually be fetched from an API or database.

### R3. Comprehensive Report Generation
Generate a detailed markdown artifact that provides a comprehensive line-by-line breakdown of every instance found, including file paths and exact line references.

## Acceptance Criteria

### Verification
- [ ] A markdown artifact report is successfully generated and formatted cleanly.
- [ ] The report includes a comprehensive line-by-line breakdown of the identified mock data structures.
- [ ] The report accurately identifies known mock data sets (such as the dummy `clientExperts` array in `ClientDetailsPage.tsx`).
- [ ] The report successfully excludes simple UI string literals and focuses purely on structural mock data sets.
