Feature: Year overview calendar
  As a calendar user
  I want a continuous year layout
  So that I can compare weeks across months

  Scenario: Weekday rows and week columns are present
    Given the calendar year is 2026 with Monday week start
    When the year overview model is created
    Then there are 7 weekday rows
    And there are at least 52 week columns

  Scenario: Month headers are generated for the year
    Given the calendar year is 2026 with Monday week start
    When the year overview is mounted
    Then month header cells are visible

  Scenario: Changing week start reorders weekday rows
    Given the calendar year is 2026 with Sunday week start
    When the year overview is mounted
    Then the first weekday label is "Sun"
