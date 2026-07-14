# Manual Add Team Member

## As Is
- The Team page shows workspace members in directory grid and table views.
- Members can be edited, removed, assigned to projects, searched, and filtered.
- New people can only be added through an invite workflow exposed by `InviteMemberModal`.
- The Zustand team store already exposes `addMember`, but there is no Team page UI for manually creating a full member profile.

## To Be
- The Team page offers a separate manual add workflow for creating an active member directly in the directory.
- The add workflow uses a modal consistent with the existing invite/edit modal styling.
- The form captures the same useful profile fields users can edit later: name, email, role, department, phone, bio, and profile photo.
- Successful creation inserts the member into the existing directory data flow and returns the user to the directory view.

## Requirements
1. Add an "Add Member" action to the Team page header, separate from "Invite Member".
2. Add a manual member modal with accessible labels, required indicators, semantic input types, autofill, and inline validation for required fields.
3. Persist manually added members through the existing `useTeamStore.addMember` action.
4. Keep the existing invite, edit, search, filter, grid, table, and drawer behavior working.
5. Provide concise UI/UX enhancement recommendations for the Team page after implementation.

## Acceptance Criteria
1. Header exposes both "Add Member" and "Invite Member" actions, with "Add Member" opening the manual add modal.
2. Submitting without a valid name or email shows an inline error and does not create a member.
3. Submitting a valid profile creates a new active member with default empty assigned projects and selected role.
4. After creation, the modal closes, the directory tab is active, filters do not hide the newly added member, and the member can be found in grid/table views.
5. Existing TypeScript build/lint passes.

## Testing Plan
- Run `npm run lint` before implementation to capture current type status when practical.
- Add the modal and page wiring, then run `npm run lint`.
- Run `npm run build` as a broader Vite smoke test.
- If a dev server is needed for visual inspection, start it and verify the Team page opens without runtime errors.

## Implementation Plan
1. Create `AddMemberModal.tsx` using the existing modal visual language and `addMember` store action. Test with `npm run lint`.
2. Wire `TeamPage.tsx` state and header button to open the new modal. Reset tab/search/filter on successful creation so the new member is visible. Test with `npm run lint`.
3. Run `npm run build` and inspect for type or bundling issues.
4. Summarize implemented changes and recommended UI/UX enhancements.
