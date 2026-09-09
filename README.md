# Field Connect

PROJECT TITLE

Field Student Attendance and Monitoring Management System

PROJECT OBJECTIVE

Develop a professional, responsive web-based system for managing university students who are attending field practical/field training at different organizations.

The main purpose of the system is to allow a field student (mwanafunzi wa field) to:

Register/login into the system.

Sign in when arriving at the workplace.

Sign out when leaving the workplace.

View their attendance history.

View their field placement information.

Track their daily attendance.

Submit daily field activity/report information.

Allow supervisors and administrators to monitor student attendance and activities.

The system should be designed for use by university students, field supervisors, organizations, and administrators.

1. USER ROLES

The system should have three main user roles:

A. Student

Students should be able to:

Create an account/login.

View their profile.

View university/registration information.

View field placement organization.

Sign in when they arrive at work.

Sign out when they leave.

View today's attendance status.

View previous attendance records.

Submit daily activities/field work.

View submitted reports.

See total days attended.

See late/absent days.

Update allowed profile information.

B. Field Supervisor

The supervisor should be able to:

Login securely.

View assigned students.

See which students have signed in today.

See which students have signed out.

See students who have not reported.

View student attendance history.

Review daily student activities.

Approve/reject submitted daily activities where appropriate.

Generate attendance reports.

C. Administrator

The administrator should have full control of the system.

Admin should be able to:

Add/edit/delete students.

Add/edit organizations.

Assign students to organizations.

Add/edit supervisors.

View all attendance records.

View all field students.

View reports.

Search and filter records.

Export attendance reports.

Manage system settings.

View dashboard statistics.

2. STUDENT LOGIN SYSTEM

Create a secure login page.

Fields:

Student ID

Password

Include:

Login button

Forgot password

Remember me

Error messages

Logout functionality

Passwords must NOT be stored as plain text.

Use secure password hashing such as PHP password_hash() and verify passwords using password_verify().

Use PHP sessions to maintain authenticated users.

3. STUDENT DASHBOARD

After login, the student should see a modern dashboard.

Display:

Welcome, [Student Name]

Cards:

Today's Status

Sign-in Time

Sign-out Time

Days Attended

Days Remaining

Current Organization

Example:

+------------------+------------------+
| Today's Status | Sign-in Time |
| PRESENT | 08:02 AM |
+------------------+------------------+

+------------------+------------------+
| Sign-out Time | Days Attended |
| 04:45 PM | 18 Days |
+------------------+------------------+

The dashboard should clearly show whether the student has:

🟢 Signed in
🟡 Signed in but not signed out
🔴 Not signed in

4. SIGN-IN / SIGN-OUT SYSTEM

Create a simple attendance interface.

When a student arrives at the organization:

SIGN IN

The system should automatically record:

Student ID

Student name

Organization

Date

Sign-in time

IP address

Optional location/GPS

Attendance status

When leaving:

SIGN OUT

The system should record:

Sign-out time

Date

Student ID

Attendance record ID

Important:

A student should NOT be able to sign in multiple times for the same working day.

A student should NOT be able to sign out before signing in.

After signing in, disable the Sign In button and display:

"You have successfully signed in at 08:05 AM."

After signing out:

"You have successfully signed out at 04:42 PM."

5. ATTENDANCE RULES

Create configurable attendance rules.

Example:

Normal working hours:

08:00 AM – 05:00 PM

If student signs in:

Before 08:00 → On Time

08:00–08:15 → Grace Period

After 08:15 → Late

The administrator should be able to change these times.

Attendance status can include:

Present

Late

Absent

Half Day

Leave

6. FIELD PLACEMENT INFORMATION

Create a page called:

My Field Placement

Display:

Student name

Student ID

University

Course/program

Organization name

Organization location

Department

Supervisor name

Supervisor contact

Field start date

Field end date

Example:

Student: Jiana Joseph
Student ID: UDOM/XXXX/XXXX
Program: Computer Networks and Information Security
Organization: XYZ Organization
Department: ICT
Supervisor: John Doe
Start Date: 01/08/2026
End Date: 30/09/2026

7. DAILY FIELD ACTIVITY

Create a page:

Daily Field Activities

The student should submit:

Date

Task/activity performed

Description

Skills learned

Challenges encountered

Solutions

Supervisor comments

Attachment/photo if required

Example:

Date: 09/09/2026

Activity:

Configured network devices and troubleshot connectivity problems.

Skills learned:

Network troubleshooting, IP configuration and device configuration.

The supervisor can review and approve the activity.

8. ATTENDANCE HISTORY

Create a table:

DateSign InSign OutStatusHours09/09/202608:0216:45Present8h 43m08/09/202608:2016:30Late8h 10m07/09/202608:0016:50Present8h 50m

Add:

Search

Date filter

Status filter

Pagination

Export PDF

Export Excel/CSV

9. ADMIN DASHBOARD

Create a professional administrator dashboard.

Show statistics:

Total Students: 150

Present Today: 120

Late Today: 15

Absent Today: 15

Organizations: 25

Use charts to visualize:

Daily attendance

Weekly attendance

Monthly attendance

Present vs absent

Student attendance percentage

10. DATABASE DESIGN

Use MySQL/MariaDB.

Create tables such as:

users

id

username

password

role

created_at

students

id

user_id

student_id

full_name

phone

email

program

university

organization_id

supervisor_id

organizations

id

organization_name

address

department

contact

supervisors

id

full_name

email

phone

organization_id

attendance

id

student_id

date

sign_in_time

sign_out_time

status

ip_address

location

created_at

daily_activities

id

student_id

date

activity

skills_learned

challenges

solutions

supervisor_comment

approval_status

created_at

11. SECURITY REQUIREMENTS

Security is very important because this system handles student information.

Implement:

Password hashing

PHP sessions

Role-based access control

Prepared SQL statements/PDO

Input validation

Output escaping

CSRF protection

Login rate limiting where possible

Secure logout

Session timeout

Protection against SQL injection

Protection against XSS

Access restrictions between student/supervisor/admin pages

A student must never be able to access another student's attendance by changing an ID in the URL.

12. UI/UX DESIGN

Create a modern professional interface.

Use:

HTML5

CSS3

Bootstrap 5

JavaScript

PHP

MySQL

Design requirements:

Responsive on desktop, tablet and mobile.

Clean navigation sidebar.

Modern dashboard cards.

Professional tables.

Icons.

Notifications/toast messages.

Confirmation dialogs.

Good spacing.

Accessible colors.

Mobile-friendly menus.

Suggested navigation:

Student

Dashboard
My Profile
My Placement
Attendance
Daily Activities
Reports
Logout

Supervisor

Dashboard
My Students
Attendance
Activities
Reports
Logout

Admin

Dashboard
Students
Organizations
Supervisors
Attendance
Activities
Reports
System Settings
Logout

13. IMPORTANT FEATURE: ATTENDANCE VERIFICATION

To make the system more realistic than a basic attendance form, consider adding workplace verification.

Possible methods:

Option 1 — IP-based verification

Only allow sign-in when the student's device is connected to the organization's network.

Option 2 — GPS verification

Require the student's device to be within a defined radius of the workplace.

Option 3 — QR Code

The organization generates a daily/temporary QR code.

The student scans the QR code to sign in.

Option 4 — Combined verification

Use:

Login + QR Code + Location

for stronger attendance verification.

The system should be designed so that the administrator can enable/disable these methods.

14. NOTIFICATIONS

Display useful notifications.

Examples:

Welcome back, Jiana!

You successfully signed in at 08:03 AM.

You have not signed out yet.

Your daily activity has been submitted successfully.

Your supervisor approved today's activity.

Administrators should also receive alerts for:

Students who have not signed in.

Late students.

Missing daily activities.

15. REPORTING

Create professional reports.

The administrator/supervisor should be able to generate:

Student Attendance Report

Student name

Student ID

Organization

Total working days

Days present

Days late

Days absent

Attendance percentage

Organization Report

Show attendance statistics for students assigned to each organization.

Monthly Report

Allow selection of:

Month

Student

Organization

Status

Then generate a printable/downloadable report.

16. PROJECT STRUCTURE

Use a clean structure such as:

field-attendance-system/
│
├── config/
│   └── database.php
│
├── auth/
│   ├── login.php
│   ├── logout.php
│   └── register.php
│
├── student/
│   ├── dashboard.php
│   ├── attendance.php
│   ├── activities.php
│   ├── profile.php
│   └── placement.php
│
├── supervisor/
│   ├── dashboard.php
│   ├── students.php
│   ├── attendance.php
│   └── activities.php
│
├── admin/
│   ├── dashboard.php
│   ├── students.php
│   ├── organizations.php
│   ├── supervisors.php
│   ├── attendance.php
│   └── reports.php
│
├── assets/
│   ├── css/
│   ├── js/
│   └── images/
│
└── index.php


17. DEVELOPMENT REQUIREMENT

Do not create everything as one large PHP file.

Use reusable components such as:

Database connection

Authentication

Navigation

Header

Footer

Authentication middleware

Validation functions

Attendance functions

Use PDO for database communication.

Keep HTML, CSS, JavaScript and PHP logically organized.

18. DEVELOPMENT PROCESS

Build the system incrementally.

Phase 1

Create database and connection.

Phase 2

Create authentication and roles.

Phase 3

Create student dashboard.

Phase 4

Create sign-in/sign-out attendance.

Phase 5

Create attendance history.

Phase 6

Create field placement.

Phase 7

Create daily activities.

Phase 8

Create supervisor dashboard.

Phase 9

Create admin dashboard.

Phase 10

Add reports and exports.

Phase 11

Add security improvements.

Phase 12

Perform testing and debugging.

19. TESTING REQUIREMENTS

Test scenarios such as:

Student logs in successfully.

Wrong password is rejected.

Student signs in.

Student tries to sign in twice.

Student signs out.

Student tries to sign out without signing in.

Student attempts to access another student's records.

Supervisor views assigned students.

Admin creates a student.

Admin assigns student to an organization.

Attendance report generates correctly.

System works on mobile devices.

20. FINAL GOAL

The final website should feel like a real university field-training management system, not just a simple PHP attendance form.

It should be:

Professional

Secure

Responsive

Easy to use

Scalable

Database-driven

Suitable for university field training

Suitable for multiple organizations

Easy for administrators to manage

Use realistic sample data for demonstration.

Before writing large amounts of code, first create the database schema, system architecture, page structure and user flow, then implement the system step-by-step.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7c9720af-881f-44c2-91e2-955c4cb8c5a7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
