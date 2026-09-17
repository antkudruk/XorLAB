Feature: Monthly grid calendar
  As a calendar user
  I want a year split into month cards
  So that I can scan months in a 4x3 grid

  Scenario: Twelve month cards for a year
    Given the calendar year is 2026 with Monday week start
    When the monthly grid model is created
    Then there are 12 month cards

  Scenario: A known day is placed in March
    Given the calendar year is 2026 with Monday week start
    When the monthly grid model is created
    Then month 3 contains day 15
