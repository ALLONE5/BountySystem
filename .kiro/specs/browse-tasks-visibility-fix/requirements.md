# Requirements Document

## Introduction

The browse tasks page currently shows very few tasks due to overly restrictive filtering logic. The current implementation filters tasks based on `is_executable = true` AND `assignee_id IS NULL`, which hides legitimate available tasks and doesn't consider task status. This feature will improve the visibility logic to show all genuinely available tasks while optionally displaying completed tasks as references.

## Glossary

- **Task_Service**: The backend service responsible for task data operations and business logic
- **Browse_Tasks_Page**: The frontend page that displays available tasks for users to browse and accept
- **Available_Task**: A task with status = 'available' that users can accept and work on
- **Completed_Task**: A task with status = 'completed' that serves as a reference or example
- **Parent_Task**: A task that contains subtasks, may have is_executable = false
- **Executable_Task**: A task that can be directly worked on, typically has is_executable = true
- **Task_Status**: The current state of a task (available, in_progress, completed, etc.)
- **Assignee**: The user currently assigned to work on a task

## Requirements

### Requirement 1: Display Available Tasks

**User Story:** As a user browsing tasks, I want to see all available tasks that I can accept, so that I have a complete view of work opportunities.

#### Acceptance Criteria

1. WHEN querying available tasks, THE Task_Service SHALL return all tasks with status = 'available'
2. WHEN a task has status = 'available' AND assignee_id IS NULL, THE Task_Service SHALL include it in the results
3. WHEN a task has status = 'available' AND is a parent task, THE Task_Service SHALL include it in the results regardless of is_executable value
4. THE Browse_Tasks_Page SHALL display all tasks returned by the available tasks query
5. WHEN displaying available tasks, THE Browse_Tasks_Page SHALL show task title, description, bounty, and status

### Requirement 2: Optional Completed Tasks Display

**User Story:** As a user browsing tasks, I want to optionally view completed tasks as examples, so that I can learn from previous work and understand task expectations.

#### Acceptance Criteria

1. WHEN querying tasks with includeCompleted flag = true, THE Task_Service SHALL return both available and completed tasks
2. WHEN querying tasks with includeCompleted flag = false, THE Task_Service SHALL return only available tasks
3. WHEN displaying completed tasks, THE Browse_Tasks_Page SHALL visually distinguish them from available tasks
4. THE Browse_Tasks_Page SHALL provide a filter control to toggle completed tasks visibility
5. WHEN a completed task is displayed, THE Browse_Tasks_Page SHALL show it with a distinct visual indicator (e.g., badge, color, icon)

### Requirement 3: Remove Overly Restrictive Filters

**User Story:** As a system administrator, I want the task visibility logic to be based on task status rather than indirect indicators, so that the system accurately reflects task availability.

#### Acceptance Criteria

1. THE Task_Service SHALL NOT filter tasks solely based on is_executable when determining availability
2. THE Task_Service SHALL use task status as the primary filter for availability
3. WHEN a parent task has status = 'available' AND assignee_id IS NULL, THE Task_Service SHALL include it regardless of is_executable value
4. THE Task_Service SHALL NOT exclude tasks based solely on assignee_id without considering task status
5. WHEN a task has an assignee AND status = 'completed', THE Task_Service SHALL optionally include it when includeCompleted = true

### Requirement 4: Status-Based Filtering

**User Story:** As a developer, I want the task query to filter by status explicitly, so that the system behavior is predictable and maintainable.

#### Acceptance Criteria

1. THE Task_Service SHALL add a WHERE clause filtering by task status in the getAvailableTasks query
2. WHEN includeCompleted = false, THE Task_Service SHALL filter WHERE status = 'available'
3. WHEN includeCompleted = true, THE Task_Service SHALL filter WHERE status IN ('available', 'completed')
4. THE Task_Service SHALL NOT return tasks with status = 'in_progress' in the browse tasks query
5. THE Task_Service SHALL maintain backward compatibility with existing API consumers

### Requirement 5: Frontend API Integration

**User Story:** As a frontend developer, I want the task API to support optional completed task retrieval, so that I can implement the toggle feature in the UI.

#### Acceptance Criteria

1. THE Task_API SHALL accept an optional includeCompleted query parameter
2. WHEN includeCompleted parameter is provided, THE Task_API SHALL pass it to Task_Service
3. WHEN includeCompleted parameter is omitted, THE Task_API SHALL default to false
4. THE Browse_Tasks_Page SHALL call the task API with includeCompleted based on user filter selection
5. THE Browse_Tasks_Page SHALL update the displayed tasks when the filter toggle changes

### Requirement 6: Data Integrity and Performance

**User Story:** As a system administrator, I want the improved query to maintain performance and data integrity, so that the system remains responsive and reliable.

#### Acceptance Criteria

1. THE Task_Service SHALL use indexed columns (status, assignee_id) in WHERE clauses for query performance
2. WHEN executing the getAvailableTasks query, THE Task_Service SHALL complete within 500ms for datasets up to 1000 tasks
3. THE Task_Service SHALL return consistent results across multiple identical queries
4. THE Task_Service SHALL handle NULL assignee_id values correctly in all filter combinations
5. THE Task_Service SHALL log query execution time for monitoring and optimization
