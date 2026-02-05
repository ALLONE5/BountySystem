# Requirements Document

## Introduction

This document captures the requirements for a comprehensive set of frontend UI improvements implemented across a task management system. The improvements focus on simplifying navigation, standardizing UI controls, enhancing search and filtering capabilities, and streamlining workflows for task and position management.

## Glossary

- **Task_View**: A page component that displays tasks in a specific format (list, Gantt chart, Kanban board, or calendar)
- **Control_Bar**: The horizontal UI section containing interactive controls (search, filters, grouping switches, refresh button)
- **Task_Filter**: A mechanism to filter tasks by status or other criteria
- **Project_Grouping**: A feature that organizes tasks by their associated project groups
- **Position**: A role or responsibility within a project that users can apply for or hold
- **Position_Application**: A request from a user to join a position, which can be regular, replacement, or removal-only
- **Bounty**: A monetary reward associated with completing a task
- **Task_Status**: The current state of a task (pending, in_progress, completed, abandoned, etc.)

## Requirements

### Requirement 1: Task Filter Simplification

**User Story:** As a user, I want to view all my tasks (both published and assigned) together without selecting filters, so that I can see my complete workload in one place.

#### Acceptance Criteria

1. WHEN a user navigates to any task view (list, Gantt, Kanban, calendar), THE System SHALL display both published and assigned tasks together
2. THE System SHALL remove the task type dropdown filter ("所有任务/发布的任务/承接的任务") from all task views
3. WHEN tasks are loaded, THE System SHALL fetch both published and assigned tasks in a single operation
4. THE System SHALL maintain backward compatibility with existing task loading logic

### Requirement 2: Grouping Control Relocation

**User Story:** As a user, I want to control task grouping within each view type, so that I can customize the display format independently for different views.

#### Acceptance Criteria

1. THE System SHALL remove grouping dropdown controls from parent pages (AssignedTasksPage, PublishedTasksPage)
2. WHEN a user views tasks in any format, THE System SHALL provide a project grouping switch control within that view component
3. THE Grouping_Switch SHALL toggle between ungrouped and project-grouped display modes
4. WHEN grouping is toggled, THE System SHALL preserve the user's selection for that specific view type

### Requirement 3: Currency Symbol Standardization

**User Story:** As a user, I want to see bounty amounts displayed in dollars, so that the currency is consistent with the system's target market.

#### Acceptance Criteria

1. THE System SHALL display all bounty amounts using the dollar symbol ($)
2. WHEN bounty amounts are rendered, THE System SHALL replace Yuan (¥) symbols with dollar ($) symbols
3. THE System SHALL update currency symbols across all pages including task views, admin pages, ranking, profile, and dashboard
4. THE System SHALL maintain numeric bounty values unchanged (only symbol changes)

### Requirement 4: Search and Filter Enhancement

**User Story:** As a user, I want to search and filter tasks within Gantt, Kanban, and Calendar views, so that I can quickly find specific tasks in any view format.

#### Acceptance Criteria

1. WHEN a user views tasks in Gantt chart format, THE System SHALL provide a search bar that filters by task name and description
2. WHEN a user views tasks in Kanban format, THE System SHALL provide a search bar that filters by task name and description
3. WHEN a user views tasks in Calendar format, THE System SHALL provide a search bar that filters by task name and description
4. THE System SHALL provide a status filter dropdown in Gantt, Kanban, and Calendar views
5. THE Status_Filter SHALL include all task states (pending, in_progress, completed, abandoned, etc.)
6. WHEN search or filter criteria change, THE System SHALL update the displayed tasks in real-time

### Requirement 5: Control Bar Standardization

**User Story:** As a user, I want consistent control layouts across all task views, so that I can navigate and filter tasks predictably regardless of view type.

#### Acceptance Criteria

1. THE System SHALL implement a unified control bar layout across all task views (list, Gantt, Kanban, calendar)
2. THE Control_Bar SHALL display controls in this order: Project Grouping Switch → Search Bar → Status Filter → Refresh Button
3. THE Control_Bar SHALL use emoji titles for visual consistency
4. THE Control_Bar SHALL maintain consistent spacing between controls
5. WHEN the viewport size changes, THE Control_Bar SHALL adapt responsively to smaller screens
6. THE Control_Bar SHALL use Ant Design components consistently across all views

### Requirement 6: Position Management Workflow

**User Story:** As a user, I want to apply for multiple positions simultaneously and specify replacement intent, so that I can efficiently manage my role transitions.

#### Acceptance Criteria

1. WHEN a user applies for positions, THE System SHALL allow selection of up to 3 positions simultaneously
2. THE System SHALL support three application types: regular, replacement, and removal-only
3. WHEN a user submits a replacement application, THE System SHALL remove old positions and add new positions atomically
4. WHEN a user submits a removal-only application, THE System SHALL remove specified positions without adding new ones
5. THE System SHALL validate that replacement applications specify both positions to remove and positions to add
6. THE System SHALL handle position application transactions atomically to prevent partial updates

### Requirement 7: Admin UI Improvements

**User Story:** As an administrator, I want to review position applications with clear, human-readable information, so that I can make informed approval decisions quickly.

#### Acceptance Criteria

1. WHEN an administrator views position applications, THE System SHALL hide user IDs and position IDs
2. THE System SHALL display application reasons in human-readable format
3. WHEN displaying replacement applications, THE System SHALL clearly show which positions are being replaced
4. WHEN displaying removal-only applications, THE System SHALL clearly indicate no new positions are being added
5. THE System SHALL format application types (regular, replacement, removal-only) with clear labels

### Requirement 8: Task Completion Features

**User Story:** As a user, I want to complete or abandon tasks directly from the task detail view, so that I can update task status without navigating away.

#### Acceptance Criteria

1. WHEN a user views task details in any view, THE System SHALL display "完成任务" (Complete Task) and "放弃任务" (Abandon Task) buttons
2. WHEN a user clicks complete or abandon, THE System SHALL show a confirmation dialog
3. WHEN a user confirms task completion, THE System SHALL update the task status to completed
4. WHEN a user confirms task abandonment, THE System SHALL update the task status to abandoned
5. THE System SHALL display task completion buttons across all task views (list, Gantt, Kanban, calendar)
6. WHEN task status is updated, THE System SHALL refresh the task list to reflect changes

### Requirement 9: Auto-Progress Update

**User Story:** As a user, I want task progress to automatically update to 100% when I complete a task, so that progress tracking is accurate without manual updates.

#### Acceptance Criteria

1. WHEN a user completes a task, THE System SHALL automatically set the task progress to 100%
2. THE System SHALL update progress before updating task status to completed
3. WHEN progress is auto-updated, THE System SHALL persist the change to the database
4. THE System SHALL apply auto-progress updates regardless of the previous progress value
