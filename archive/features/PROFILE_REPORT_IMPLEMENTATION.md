# Profile Report Generation Feature

## Overview
Implemented a feature to generate a CSV report of the user's tasks (published and assigned) on the Profile page.

## Features
1.  **Generate Report Button**: A button in the "Statistics" section to trigger report generation.
2.  **CSV Generation**:
    *   Fetches all tasks related to the user.
    *   Filters for tasks where the user is the creator (Published) or the assignee (Assigned).
    *   Formats data including: Task ID, Title, Type, Status, Bounty, Created At, and Role.
    *   Sanitizes data to handle commas and special characters in CSV format.
3.  **Fallback Display**:
    *   Due to potential browser restrictions or silent failures with direct file downloads, a fallback mechanism was added.
    *   The generated CSV content is displayed in a read-only `TextArea` below the statistics.
    *   This allows users to manually copy the data if the automatic download fails.

## Technical Details
*   **File**: `packages/frontend/src/pages/ProfilePage.tsx`
*   **State**: `reportContent` (stores the CSV string).
*   **Logic**: `handleGenerateReport` function handles fetching, formatting, and attempting download.
*   **UI**: Added `FileTextOutlined` icon to the button and an `Input.TextArea` for the content preview.

## Status
*   Implementation complete.
*   Fallback UI added to ensure data accessibility.
