# scheduler

The scheduler web application is made up of multiple components and was designed multiple sites, which contain multiple work centers or functional areas with employees working in each.: 
1. dataXFer application (GO) will be used to update the database with data from the old database using Excel files.
2. scheduler-api (GO) is the server interface for completing all CRUD operations for the application. 
3. authenication-api (GO) is my attempt to provide a central authentication mechanism for the RTX Osan's Scheduler and Metrics web applications.
4. scheduler-client (Transcript/Angular) is the front-end for the application for displaying schedule information, plus editing the database.

## Important Notes

### Encryption of Data at Rest
All data not necessary for immediate use will be encrypted while in storage, so
that only limited amounts of data would be available to a would be hacker.  Also,
no PII information is to be included in any database to preclude the possibility
of loss of this type of data.

### Work Hours Separation
Work hours based on manual input and/or timecard ingest will be separated from 
the employee record to allow for smaller employee records, containing only the
data necessary for transfer to web portal.  The work hours will be contained 
in annual work hour classes which will be encrypted and saved in the database
using a year/employee ID key.

## Database Structure

This program uses MongoDB to store all the information to be displayed.  This web application overall will access two of the three databases the RTX web applications use.  It will access Users database for authentication and scheduler database for data specific to scheduling the team.

## Data Modelling

The web application is written in GOLANG/GO for server-side portions of the application, namely the data transfer command line application, plus the two server APIs for data access.  Transcript/Angular data modelling will include interfaces for each class with a GOLANG structure to parallel the transcript class for ease of data transfer.

### User Class (Authentication)

The User class/structure/interface is used for authentication and passing the applications the logged in user's basic information and permissions.  It contains:

#### Properties
- ID - The key value for each user record using the UUID pattern (ObjectID)
- Email Address - A string value for querying the user database/collection while logging in.  The scheduler application will use this for forgotten password setting without administrator assistance.
- Password - Only provided within the GOLANG structure for authentication.
- BadAttempts - Only provided within the GOLANG structure for locking out the user for multiple misauthentications.
- PasswordExpires - Date/Time value for when the password will expire and requiring a change.
- First Name - A string value for the user's first or given name.
- Middle Name - A string value for the user's Middle name.
- Last Name - A string value for the user last or family name.
- Permissions - An array of string values for the permission groups the user belongs to.  Each permission group is proceeded by either scheduler or metrics to signify which application the permission is applicable to.

#### Methods
- login - (GOLANG structure only) This method will be used to find and authenticate the user, returning the user structure to be converted to JSON to be passed to the client.  Possible error codes are bad authentication, account locked, and account not found.
- SetPassword - (GOLANG structure only) This method will be used to reset the the password hash, bad attempts and password expiration.
- FullName - will provide a string value for the user's last, first and middle initial.

### Workcode Class (Initial data)

The workcode is the letter designator for an assigned time an employee will work or to use to designate a particular type of time off (leave).  This will be a golang structure and javascipt interface.  The workcodes listed in the initial data will be used to supply a new team with default workcode for assignment.

#### Properties

- ID - a string value for use to represent the work/leave code.
- Title - a string value used to provide a short description of the code for use.
- StartTime - the number value for the hour of the day the employee will start work.  This value will be zero (0) for leave related codes.
- IsLeave - a boolean value to indicate if the work code is for shift assignment or as a leave code.

### Team Class

The team class/structure/interface is used for providing the team's structure.  The team is defined as a number of sites for which employees are assigned/working.  This is where the contract leadership is located.  Multiple companies may have people assigned to a team and to its sites.

#### Properties
- ID - The key value for each team record using the UUID pattern (ObjectID)
- Name - a string value for the team's name.
- Sites - an array of sites where employees are assigned and work.  Site description will be provided further along in this description.
- Workcodes - An array of workcode objects which define the work hours for each person and the various codes used for leave purposes.
- Companies - An array of company objects which define the companies working on
the contract.

#### Methods

### Company Class

The company class/structure/interface defines one of the companies associated with
a team/contract.

#### Properties
- ID - a short string code designated for a company.  I.e. RTX = Raytheon 
Technologies.
- Name - The full string name for the company.
- IngestType - a string value for the method of ingesting actual work and leave
hours (possible values: manual = Manual Entry, sap = SAP Timekeeping system/excel
extraction.  Other types will be added later.)
- Holidays - An array of holidays allowed to be claimed by the company.

#### Methods

### CompanyHoliday Class

A designated holiday (time off) allowed by the company for its employee.  It will 
include a list of actual dates for the designated holiday.

#### Properties
- ID - a string code designator for the holiday
- Name - a string value descriptor for this holiday
- SortID - an integer value used in sorting the holidays for the company.
- ActualDates - an array of date for the actual dates per year.

#### Methods
- GetActual - Will retrieve the actual date for a given year.

### Site Class

The site is the single location in which the contract leadership provides a single leader to maintain contract compliance.

#### Properties
- ID - a character or two used by the team to easily identify the site.  **Examples:** DCGS-2 might have an identifier of 2.
- Name - A short string value for the actual name or title for the site.
- Workcenters - an array of workcenter objects used to designed the site
- ForecastReports - an array of ForecastReports Decription objects
- LaborCodes - an array of LaborCode objects
- Employees - an array employee object for those employees assigned to a site
during a specified period of time.

#### Methods

### Workcenter Class

This class will describe a work center for a site.  It will be used to separate 
the site's employees by the areas they will work within.

#### Properties
- ID - Short string identifier for the workcenter
- Name - the full string name for the work center.
- SortID - an integer value for ensuring the display order for the workcenters
within the site.
- Shifts - an array of shift objects
- Positions - an array of position objects

#### Methods

### Position Class

This class is used to define a position within a workcenter in which an employee,
or employees can be assigned.

#### Properties
- ID - a short string value to represent the position
- Name  - a longer string value for a position name
- SortID - an integer value used for sorting positions within the work center.
- Assigned - an array of object id values for those employees assigned to the position

#### Methods

### Shift Class

This class is used to define a work period within a work center along with any
associated work codes and premimum pay code.

#### Properties
- ID - a short string value to represent the shift
- Name  - a longer string value for a position name
- SortID - an integer value used for sorting positions within the work center.
- AssociatedCodes - an array of workcode identifiers associated with this 
shift.
- PayCode - an unsigned integer value for the premimum pay code associated with
this shift

#### Methods

### LaborCode Class

This class is used to define a contract labor code used for payroll accounting.

#### Properties
- ChargeNumber - a string value provided to the site by the contract administrator
to put into the time system.  A generic charge code will be used for other 
companies that don't use out charge system - it will consist of a company code 
dash year at start of contract.
- Extension - a string value to provide for particular functions to be separated
within the orgainization.  For companies using generic code, the workcenter will
be used instead.
- CLIN - string value provided by contract administrator for the contract line
number.
- SLIN - string value provided by contract administrator for the contract 
specialty line number
- Location - the location code used by the contract administrator
- WBS - string value provided by contract administrator
- MinimumEmployees - The numeric (uint) value for the number of employees
provided for under the contract.
- NotAssignedName - a string value to be used as a substitute name for an 
employee slot not currently occupied.  Normally only used at the begining of
a contract period.
- HoursPerEmployee - a float64 value for the number of hours provided to each
employee in the contract period.  If this labor code is an allocation for an
exercise, the total number of hours provided are entered with a minimum employee
count of 1.
- Exercise - a boolean value to signify if the labor code is to be used for 
exercise purposes only.
- StartDate - the date/time value for the start of the period the labor code 
can be used by employees.
- EndDate - the date/time value for the end of the period the labor code can be
used by employees.

#### Methods

### ForecastReport Class

This class is used to define a report for reporting and forecasting contract
hours during a specified period.

#### Properties
- ID - a integer value to identify the report for editing
- Name - The string value to be used within a composite report to identify the
contents of this portion of the overall report
- StartDate - A date/time value for the start of the contract period.
- EndDate - A date/time value for the end of the contract period.
- Periods - an array of ForecastPeriods to define the major portions of the 
forecast report.  These periods define the smaller periods that make up the 
overall period.
- LaborCodes - an array of LaborCode object to be used in the forecast report.

#### Methods

### ForecastPeriod Class

This class is used to define a period/fiscal month which contains the overall
date and an array of date values for the end of the weekly period.

#### Properties
- Month - a date value to define the fiscal month
- Periods - an array of date value to signify the end of the period.

#### Methods

### Employee Class

This object will contain all the data for a specific employee.

#### Properties
- ID - ObjectID Value used as a key for the employee.  This value will be the
same as the User Object, if the user has an account for log in.
- Assignments - an array of Assignment object for each assignment the employee
is assigned to.

#### Methods
- IsAssigned - A boolean answer for the user being at a site, workcenter during
a specified period of time.

### Assignment Class

This class will be used to assign an employee to a site and workcenter during
a specified time period.  The end of the time period can't be undefined and is
normally set to Dec 31 9999 for indefinite.

#### Properties
- Location - the string value for the site the employee is assigned to within
a team.
- Workcenter - the string value for the workcenter the employee is assigned 
within a site.
- StartDate - the date/time used to represent the first day of work in the 
location/workcenter.
- EndDate - the date/time used to represent the last day of work at the site/
workcenter.  Open ended assignments use an end date of Dec 31, 9999.
- Schedules - the schedule objects used in determining a specific dates work
schedule.
- RotationDate - the date/time used as the pivot point, used with the number of
days in the rotation period to determine which schedule to use.
- RotationDays - The number of days in the rotation period.

#### Methods
- UseAssignment - used to determine if the assignment should be used based on 
the site id and date provided.
- GetWorkday - used to get the workday within the assignment to get the employee's
which is based on the site and date requested.
- AddSchedule - used to add a new schedule to the assignment.  The routine is
provided a number of workdays for the schedule and the routine creates this 
number of empty workdays.
- UpdateWorkday - Provided Schedule ID, Workday ID, Work Center, Work Code, and
hours to be worked.  This routine will discover the pertainent schedule and 
update the workday with the information provided.
- RemoveSchedule - This will remove the schedule with the identifier provided.  
It will reset the schedule ids for the remaining schedules, but will never remove
the last schedule from the assignment, but will zeroize it if requested.

### Workday Class

This class will be used for a single day within the work schedule.  It may be 
empty with only the ID designated or for a normal work day it will also have the
work center, code to use and hours to work.

#### Properties
- ID - The sequential identifier within the schedule from zero to number of days
(multiple of 7) - 1.  Automatically set by schedule creation.
- Workcenter - the string value for the identifier for the work center the work
is accomplished in.
- Code - the Workcode ID used for work scheduling
- Hours - a float value for the number of hours to be worked on that day.

#### Methods

### Schedule Class

This class will be used within an assignment or variation to provide the 
rotational basis for work assignments.  It will contain a multiple of 7 number of
workdays for the scheduler to assign the person to work.

#### Properties
- ID - This value identifies the schedule and is used for sorting it
- Workdays - The workdays within the schedule in which the employee is to work.

#### Methods
- UpdateWorkday - This routine will update a designated workday with the 
information provided.
- SetScheduleDays  This routine will reset the workday with the provided number
of days, but will error out if the number of days isn't above zero and a muiltiple
of 7.

### Variation Class

This class will be used to record a temporary change in the employee's schedule
with a start and end date and a single schedule containing a multiple of seven
workdays within.

#### Properties
- ID - The unsigned integer value to designed the variation
- Site - The string value for the site associated with this variation
- StartDate - The start date/time for the variation.
- EndDate - The end date/time for this variation.
- Schedule - the schedule object used in determining a specific dates work
schedule.

#### Methods
- UseVariation - Used to determine if the variation should be used for the 
provided site identifier and date.
- GetWorkday - will provide the workday for the date provided.
- UpdateWorkday - Provided Workday ID, Work Center, Work Code, and
hours to be worked.  This routine will discover the pertainent schedule and 
update the workday with the information provided.

### AnnualLeave Class

This class will provide the employee's annual leave and carry over for a year.

#### Properties
- Year - The numeric value for the four digit year the annual and carry over
leave applies to.
- Annual - The float64 value for the amount of leave the employee get for the
whole year.
- Carryover - The float64 value for the amount of leave the employee carries
forward from the previous year's.  If the pay period ends in the week after 1 
January and the employee is taking leave, then the employee may have over 40
hours.

#### Methods

### LeaveDay Class

This class is used to record approved and/or actual leave requested by the 
employee.  These days are what is shown on the employee's holiday/PTO leave
report/display.  Each day of leave could contain multiple codes/hours, but there
should never be more than one record for a leave date/code combination.

#### Properties
LeaveDate - The date/time object for the date associated with the leave.
Code - The work code/leave code identifier for the type of leave being taken.
Hours - the float64 value for the number of hours taken for this date/code.
Status - a string value for the approval status for the leave.  It must be one 
of four value "REQUESTED", "APPROVED", "ACTUAL", or "DELETED".
RequestID - the ObjectID for the LeaveRequest the leave is associated with.

#### Methods

### LeaveRequest Class

This class will be used to store leave requests, status requested or approved, 
to allow the supervisor to approve the leave, and as a archival record for the
request.

#### Properties
ID - an object ID value to identify the request within the employee's list.
RequestDate - The date/time value the request was initially made.
PrimaryCode - A string value for the leave code to be used primarily when the
request's leave days are created.  When the request is initially made, the 
system will use this code on each day the employee would normally be working
within the period.
StartDate - The date value for the first day of the leave.
EndDate - The date value for the last day of the leave
Status - This string value is to signify the request's current status.  It will
be one of three value "REQUESTED", "APPROVED", "DELETED".  "ACTUAL" status is 
not used because a request is not a record of leave for the employee, only his/her
requesting leave.
ApprovedBy - The object ID value to identify which individual approved the leave.
ApprovalDate - The date value signifying the date the leave request was approved.
RequestedDays - An array of LeaveDay objects for each day of the leave period
where leave will be taken.  The employee will be allowed to manipulate this 
list, before approval, to change leave codes or number of hours to be taken,
example - Change a vacation day using 10 hours, to a holiday using 8 hours.
**Note to Self** When a request is approved, I need to determine the employee's
normal work schedule hours (8, 10 or 12) and ensure all the hours are used, if 
the hours are at least 8.  Holidays can only be eight hours so the employee 
should also have a two hour PTO leave day, unless 5 holidays are used in a row.

#### Methods
SetLeaveDay(date, code, hours) - This will update a requested day within the 
array to the information provided.

### EmployeeLaborCode

This class will be used to record a primary labor code assigned to an employee.
An employee is normally assigned one primary labor code per contract, they may
work/use other labor codes at the discretion of the site leadership.  These
codes normally consist of two values, a charge number and an extension.

#### Properties
- ChargeNumber - the string value for the labor code.
- Extension - The string value for a subset of the charge number.

#### Methods

### Work

This class will be used to record hours worked within the employee's annual
work record.

#### Properties
- DateWorked - the date value for the date worked.
- ChargeNumber - A string value for the contract charge, used along with its
extension provides specific assignment of work accomplished.
- Extension - A string value for the contract charge extension.
- PayCode - The integer value for the shift code, used to determine the shift
worked.
- Hours - a float64 value for the number of horus worked.

#### Methods

### EmployeeWorkRecord

This class will be used to store an employees work objects by employee id and
year, so a record will eventually contain a year's worth of work.

#### Properties
- EmployeeID - an object id value which corresponds to the employee's object
id.
- Year - The unsigned integer value for the year all the work pertains to.
- EncryptedWork - the string value which contains the encrypted JSON data of the
work array for the year.
- Work - The array of work objects representing the employee's work for the 
period.

#### Methods
- Encrypt - This method will take the array of work objects and encrypt the
resultant json string and place it in the encrypted work property for saving it
to the database.
- Decrypt - This method will take the encrypted string and decrypt the string
and convert it back to a work array.

